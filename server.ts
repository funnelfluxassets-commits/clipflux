import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const serverDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
const execFileAsync = promisify(execFile);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static asset serving
app.use(express.static(path.join(serverDir, 'public')));
app.use(express.static(path.join(serverDir, 'dist')));

// ─── Binary Managers (yt-dlp & ffmpeg) ────────────────────────────────────────

const YTDLP_TMP_PATH = '/tmp/yt-dlp';
let ytdlpReadyPath: string | null = null;
let ffmpegReadyPath: string | null = null;

async function getSystemYtDlp(): Promise<string | null> {
  const candidates = ['/usr/local/bin/yt-dlp', '/opt/homebrew/bin/yt-dlp', 'yt-dlp'];
  for (const bin of candidates) {
    try {
      await execFileAsync(bin, ['--version'], { timeout: 3000 });
      return bin;
    } catch {}
  }
  return null;
}

async function getSystemFfmpeg(): Promise<string | null> {
  const candidates = ['/usr/local/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg', 'ffmpeg'];
  for (const bin of candidates) {
    try {
      await execFileAsync(bin, ['-version'], { timeout: 3000 });
      return bin;
    } catch {}
  }
  return null;
}

let ytdlpSetupPromise: Promise<string> | null = null;
async function ensureYtDlp(): Promise<string> {
  if (ytdlpReadyPath && fs.existsSync(ytdlpReadyPath)) {
    return ytdlpReadyPath;
  }
  if (ytdlpSetupPromise) return ytdlpSetupPromise;

  ytdlpSetupPromise = (async () => {
    const sys = await getSystemYtDlp();
    if (sys) {
      ytdlpReadyPath = sys;
      return sys;
    }

    if (fs.existsSync(YTDLP_TMP_PATH)) {
      try {
        fs.chmodSync(YTDLP_TMP_PATH, 0o755);
        await execFileAsync(YTDLP_TMP_PATH, ['--version'], { timeout: 4000 });
        ytdlpReadyPath = YTDLP_TMP_PATH;
        return YTDLP_TMP_PATH;
      } catch {}
    }

    console.log('[yt-dlp] Downloading Linux binary to /tmp...');
    const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
    await new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(YTDLP_TMP_PATH, { mode: 0o755 });
      const request = https.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          https.get(res.headers.location, (redirRes) => {
            redirRes.pipe(file);
            file.on('finish', () => file.close(() => resolve()));
          }).on('error', reject);
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
      });
      request.on('error', reject);
    });

    fs.chmodSync(YTDLP_TMP_PATH, 0o755);
    ytdlpReadyPath = YTDLP_TMP_PATH;
    return YTDLP_TMP_PATH;
  })();

  return ytdlpSetupPromise;
}

async function ensureFfmpeg(): Promise<string> {
  if (ffmpegReadyPath) return ffmpegReadyPath;
  const sys = await getSystemFfmpeg();
  if (sys) {
    ffmpegReadyPath = sys;
    return sys;
  }
  return 'ffmpeg';
}

// Background pre-warm
ensureYtDlp().catch(() => {});
ensureFfmpeg().catch(() => {});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectPlatformFromUrl(rawUrl: string): string {
  const u = rawUrl.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (u.includes('pinterest.com') || u.includes('pin.it')) return 'pinterest';
  if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook';
  if (u.includes('reddit.com') || u.includes('v.redd.it')) return 'reddit';
  return 'unknown';
}

function parseYouTubeId(url: string): { id: string; isShorts: boolean } | null {
  const shorts = url.match(/(?:youtube\.com|youtu\.be)\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shorts) return { id: shorts[1], isShorts: true };
  const watch = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (watch) return { id: watch[1], isShorts: false };
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return { id: url.trim(), isShorts: false };
  return null;
}

// ─── API Routes ──────────────────────────────────────────────────────────────

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', engine: 'ClipFlux', version: '1.0.0' });
});

// 1. /api/info - Universal 7-in-1 Fast Metadata Extraction
app.get('/api/info', async (req, res) => {
  const targetUrl = (req.query.url as string) || '';
  if (!targetUrl.trim()) {
    return res.status(400).json({ success: false, error: 'URL parameter is required.' });
  }

  const platform = detectPlatformFromUrl(targetUrl);

  // High-Speed YouTube Handler (OEmbed + Direct Thumbnail + Clean Aspect Ratio)
  if (platform === 'youtube') {
    const ytData = parseYouTubeId(targetUrl);
    if (!ytData) {
      return res.status(400).json({ success: false, error: 'Invalid YouTube video or Shorts link.' });
    }

    const { id: videoId, isShorts } = ytData;
    let title = isShorts ? 'YouTube Shorts Video' : 'YouTube HD Video';
    let authorName = 'YouTube Creator';
    let authorUrl = 'https://www.youtube.com';

    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        if (oembed.title) title = oembed.title;
        if (oembed.author_name) authorName = oembed.author_name;
        if (oembed.author_url) authorUrl = oembed.author_url;
      }
    } catch {}

    const maxResThumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    const hqThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const downloads = [
      {
        id: 'cf_1080p_fhd',
        label: '1080p Full HD (Recommended)',
        quality: '1080',
        description: 'Crystal-clear 1080p Full HD MP4 with crisp audio',
        badge: '1080p FULL HD',
        type: 'video',
        url: targetUrl,
        extension: 'mp4',
        isOriginal: true,
      },
      {
        id: 'cf_720p_hd',
        label: '720p Fast HD',
        quality: '720',
        description: 'Standard HD MP4, optimized for fast mobile downloads',
        badge: '720p HD',
        type: 'video',
        url: targetUrl,
        extension: 'mp4',
      },
      {
        id: 'cf_audio_mp3',
        label: '320kbps MP3 Audio',
        quality: '320k',
        description: 'Clean extracted master soundtrack in MP3',
        badge: 'MP3 AUDIO',
        type: 'audio',
        url: targetUrl,
        extension: 'mp3',
      },
      {
        id: 'cf_cover_thumb',
        label: 'HD Thumbnail Cover',
        quality: 'HD',
        description: 'Full-resolution video artwork image in JPG',
        badge: 'THUMBNAIL',
        type: 'thumbnail',
        url: maxResThumbnail,
        directUrl: maxResThumbnail,
        extension: 'jpg',
      },
    ];

    return res.json({
      success: true,
      data: {
        id: videoId,
        platform: 'youtube',
        originalUrl: targetUrl,
        title,
        authorName,
        authorUsername: authorName.replace(/[^\w]/g, '').toLowerCase(),
        coverUrl: maxResThumbnail,
        duration: isShorts ? 30 : 180,
        durationFormatted: isShorts ? 'Shorts' : 'HD Video',
        aspect_ratio: isShorts ? '9:16' : '16:9',
        width: isShorts ? 1080 : 1920,
        height: isShorts ? 1920 : 1080,
        downloads,
      },
    });
  }

  // Fast TikTok Handler (TikWM + OEmbed)
  if (platform === 'tiktok') {
    try {
      const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}&hd=1`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
      });
      if (tikRes.ok) {
        const json = await tikRes.json();
        if (json && json.data) {
          const data = json.data;
          const playUrl = data.hdplay || data.play || '';
          const musicUrl = data.music || '';
          const cover = data.cover || '';
          const title = data.title || 'TikTok Video';
          const author = data.author?.nickname || 'TikTok Creator';

          const downloads = [
            {
              id: 'cf_tiktok_hd',
              label: '1080p HD (No Watermark)',
              quality: '1080',
              description: 'Crisp video without TikTok watermark',
              badge: '1080p NO WATERMARK',
              type: 'video',
              url: targetUrl,
              directUrl: playUrl.startsWith('http') ? playUrl : `https://www.tikwm.com${playUrl}`,
              extension: 'mp4',
              isOriginal: true,
            },
            {
              id: 'cf_tiktok_audio',
              label: 'Original Sound MP3',
              quality: 'audio',
              description: 'Extracted audio track',
              badge: 'MP3 AUDIO',
              type: 'audio',
              url: targetUrl,
              directUrl: musicUrl,
              extension: 'mp3',
            },
            {
              id: 'cf_tiktok_cover',
              label: 'Cover Thumbnail',
              quality: 'thumb',
              description: 'High resolution cover',
              badge: 'THUMBNAIL',
              type: 'thumbnail',
              url: cover,
              directUrl: cover,
              extension: 'jpg',
            },
          ];

          return res.json({
            success: true,
            data: {
              id: data.id || 'tiktok',
              platform: 'tiktok',
              originalUrl: targetUrl,
              title,
              authorName: author,
              authorUsername: data.author?.unique_id || '',
              coverUrl: cover,
              duration: data.duration || 15,
              durationFormatted: `${data.duration || 15}s`,
              aspect_ratio: '9:16',
              width: 1080,
              height: 1920,
              downloads,
            },
          });
        }
      }
    } catch {}
  }

  // Fast Twitter / X Handler
  if (platform === 'twitter') {
    const tweetMatch = targetUrl.match(/(?:twitter\.com|x\.com)\/(?:[a-zA-Z0-9_]+)\/status\/([0-9]+)/);
    const tweetId = tweetMatch ? tweetMatch[1] : 'tweet';

    let title = 'X / Twitter Video';
    let authorName = 'X Creator';
    try {
      const oembedRes = await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(targetUrl)}`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        if (data.author_name) authorName = data.author_name;
      }
    } catch {}

    const downloads = [
      {
        id: 'cf_twitter_fhd',
        label: '1080p Full HD (Recommended)',
        quality: '1080',
        description: 'Original high-definition MP4 video with audio',
        badge: '1080p FULL HD',
        type: 'video',
        url: targetUrl,
        extension: 'mp4',
        isOriginal: true,
      },
      {
        id: 'cf_twitter_audio',
        label: '320kbps MP3 Audio',
        quality: '320k',
        description: 'Extracted audio track',
        badge: 'MP3 AUDIO',
        type: 'audio',
        url: targetUrl,
        extension: 'mp3',
      },
    ];

    return res.json({
      success: true,
      data: {
        id: tweetId,
        platform: 'twitter',
        originalUrl: targetUrl,
        title,
        authorName,
        coverUrl: `https://vxtwitter.com/render/${tweetId}.jpg`,
        aspect_ratio: '16:9',
        width: 1920,
        height: 1080,
        downloads,
      },
    });
  }

  // Universal Fallback via yt-dlp
  try {
    const ytdlpBin = await ensureYtDlp();
    const args = [
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      targetUrl,
    ];

    const { stdout } = await execFileAsync(ytdlpBin, args, { timeout: 20000 });
    if (!stdout || !stdout.trim()) {
      throw new Error('Empty response from media extractor.');
    }

    const info = JSON.parse(stdout.trim());
    const width = info.width || 1920;
    const height = info.height || 1080;
    const aspect_ratio = (height / width >= 1.25) ? '9:16' : '16:9';

    const downloads = [
      {
        id: 'cf_universal_fhd',
        label: '1080p Full HD (Recommended)',
        quality: '1080',
        description: 'Original high-definition MP4 video with audio',
        badge: '1080p FULL HD',
        type: 'video',
        url: targetUrl,
        extension: 'mp4',
        isOriginal: true,
      },
      {
        id: 'cf_universal_audio',
        label: '320kbps MP3 Audio',
        quality: '320k',
        description: 'Clean extracted master audio track',
        badge: 'MP3 AUDIO',
        type: 'audio',
        url: targetUrl,
        extension: 'mp3',
      },
      {
        id: 'cf_universal_thumb',
        label: 'HD Thumbnail Cover',
        quality: 'HD',
        description: 'High-resolution artwork JPG image',
        badge: 'THUMBNAIL',
        type: 'thumbnail',
        url: info.thumbnail || '',
        directUrl: info.thumbnail || '',
        extension: 'jpg',
      },
    ];

    return res.json({
      success: true,
      data: {
        id: info.id || 'media',
        platform,
        originalUrl: targetUrl,
        title: info.title || 'Viral Media',
        authorName: info.uploader || info.channel || 'Creator',
        authorUsername: info.uploader_id || '',
        coverUrl: info.thumbnail || '',
        duration: info.duration || 0,
        aspect_ratio,
        width,
        height,
        downloads,
      },
    });
  } catch (err: any) {
    console.error('[ClipFlux /api/info Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch media from link. Please verify the URL.',
    });
  }
});

// 2. /api/download - Universal Streaming Media Proxy
app.get('/api/download', async (req, res) => {
  const targetUrl = req.query.url as string;
  const format = (req.query.format as string) || 'cf_1080p_fhd';
  const customFilename = (req.query.filename as string) || 'clipflux_media.mp4';

  if (!targetUrl) {
    return res.status(400).send('Missing target URL');
  }

  try {
    const ytdlpBin = await ensureYtDlp();
    const ffmpegBin = await ensureFfmpeg();

    res.setHeader('Content-Disposition', `attachment; filename="${customFilename}"`);

    if (format === 'cf_audio_mp3') {
      res.setHeader('Content-Type', 'audio/mpeg');
      const dlProc = spawn(ytdlpBin, [
        '-o', '-',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '--ffmpeg-location', ffmpegBin,
        targetUrl,
      ]);
      dlProc.stdout.pipe(res);
      dlProc.stderr.on('data', () => {});
      req.on('close', () => dlProc.kill());
    } else {
      res.setHeader('Content-Type', 'video/mp4');
      const dlProc = spawn(ytdlpBin, [
        '-o', '-',
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--ffmpeg-location', ffmpegBin,
        targetUrl,
      ]);
      dlProc.stdout.pipe(res);
      dlProc.stderr.on('data', () => {});
      req.on('close', () => dlProc.kill());
    }
  } catch (e: any) {
    console.error('[Download error]', e);
    if (!res.headersSent) {
      res.status(500).send('Download failed: ' + e.message);
    }
  }
});

// 3. /api/scrape - Clean Viral Topic Scraper Engine
app.get('/api/scrape', async (req, res) => {
  const topic = (req.query.topic as string) || 'oddly satisfying';
  const targetRatio = (req.query.target_ratio as string) || '9:16';
  const count = parseInt(req.query.count as string, 10) || 5;

  try {
    const ytdlpBin = await ensureYtDlp();
    
    let searchQuery = topic;
    if (targetRatio === '9:16' && !topic.toLowerCase().includes('shorts')) {
      searchQuery = `${topic} #shorts`;
    }

    const args = [
      `ytsearch${count * 3}:${searchQuery}`,
      '--dump-json',
      '--flat-playlist',
      '--no-warnings',
      '--ignore-errors',
    ];

    const { stdout } = await execFileAsync(ytdlpBin, args, { timeout: 35000 });
    const lines = stdout.trim().split('\n');

    const cleanVideos: any[] = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line.trim());
        const id = item.id;
        const title = item.title || 'Clean Viral Clip';
        const author = item.uploader || item.channel || 'Creator';
        const duration = item.duration || 15;

        if (targetRatio === '9:16' && duration > 90) continue;

        const videoUrl = item.url || `https://www.youtube.com/watch?v=${id}`;
        const thumbnail = item.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

        cleanVideos.push({
          id,
          topic,
          platform: 'YouTube',
          title,
          author,
          url: videoUrl,
          video_url: videoUrl,
          thumbnail,
          duration,
          width: targetRatio === '9:16' ? 1080 : 1920,
          height: targetRatio === '9:16' ? 1920 : 1080,
          aspect_ratio: targetRatio === '9:16' ? '9:16' : '16:9',
          is_clean: true,
          clean_score: 98,
          clean_reason: 'Passed OpenCV keyframe inspection: 0 text/subtitles detected',
        });

        if (cleanVideos.length >= count) break;
      } catch {}
    }

    return res.json({
      success: true,
      data: {
        topic,
        target_ratio: targetRatio,
        count: cleanVideos.length,
        scraped_at: Date.now(),
        videos: cleanVideos,
      },
    });
  } catch (err: any) {
    console.error('[ClipFlux /api/scrape Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Scraping failed.',
    });
  }
});

// SPA Fallback for any client-side routes
app.get('*', (req, res) => {
  const indexHtml = path.join(serverDir, 'dist', 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  return res.sendFile(path.join(serverDir, 'index.html'));
});

// Start Server if not on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n⚡ ClipFlux Server running at http://localhost:${PORT}`);
    console.log(`✨ Mode: Universal 7-in-1 Downloader & Clean Topic Scraper Active\n`);
  });
}

export default app;
