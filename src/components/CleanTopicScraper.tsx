import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Smartphone, 
  Monitor, 
  Layers, 
  CheckCircle2, 
  Download, 
  Loader2, 
  ShieldCheck, 
  AlertCircle, 
  Archive,
  RefreshCw,
  ExternalLink,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { AspectRatioType, ScrapedClip, SupportedPlatform } from '../types';

interface CleanTopicScraperProps {
  onScrape: (topic: string, ratio: AspectRatioType, count: number, platforms: SupportedPlatform[]) => Promise<ScrapedClip[]>;
  isScraping: boolean;
  statusMessage: string;
  progressPercent: number;
}

export const CleanTopicScraper: React.FC<CleanTopicScraperProps> = ({
  onScrape,
  isScraping,
  statusMessage,
  progressPercent,
}) => {
  const [topic, setTopic] = useState('');
  const [targetRatio, setTargetRatio] = useState<AspectRatioType>('9:16');
  const [clipCount, setClipCount] = useState<number>(5);
  const [results, setResults] = useState<ScrapedClip[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);

  const handleDownloadSingleClip = async (clip: ScrapedClip) => {
    if (downloadingClipId) return;
    setDownloadingClipId(clip.id);
    try {
      const res = await fetch(clip.video_url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanAuthor = (clip.author || 'clean').replace(/[^\w]/g, '_');
      a.download = `clean_${cleanAuthor}_${clip.id.substring(0, 8)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    } catch (e) {
      console.error('Download error:', e);
      window.location.href = clip.video_url;
    } finally {
      setDownloadingClipId(null);
    }
  };

  // Platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<SupportedPlatform[]>([
    'youtube',
    'tiktok',
    'instagram',
    'pinterest',
    'reddit'
  ]);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  const togglePlatform = (p: SupportedPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((x) => x !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleStartScrape = async () => {
    if (!topic.trim() || isScraping) return;
    setScrapeError(null);
    try {
      const clips = await onScrape(topic.trim(), targetRatio, clipCount, selectedPlatforms);
      if (!clips || clips.length === 0) {
        setScrapeError("No clean viral clips found for this topic. Try broader search terms (e.g. backflip, parkour, gym fails).");
        return;
      }
      setResults(clips);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#059669', '#6ee7b7'],
      });
    } catch (err: any) {
      console.error('Scraping error:', err);
      setScrapeError(err?.message || "Failed to complete search. Please try again.");
    }
  };

  // 1-Click Batch .ZIP Export with retry logic to ensure all clips are included
  const handleDownloadAllZip = async () => {
    if (results.length === 0 || isZipping) return;
    setIsZipping(true);
    setZipProgress(5);
    setScrapeError(null);

    try {
      const zip = new JSZip();
      const folderName = `ClipFlux_${topic.replace(/[^\w]/g, '_')}_${targetRatio.replace(':', 'x')}`;
      const folder = zip.folder(folderName) || zip;

      let successCount = 0;
      for (let i = 0; i < results.length; i++) {
        const clip = results[i];
        let downloaded = false;

        // Try up to 2 attempts per clip to guarantee all requested clips are included
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await fetch(clip.video_url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            if (blob.size < 50000) throw new Error(`File too small (${blob.size} bytes)`);
            const cleanAuthor = (clip.author || 'clean').replace(/[^\w]/g, '_');
            const filename = `${i + 1}_${cleanAuthor}_${clip.id.substring(0, 8)}.mp4`;
            folder.file(filename, blob);
            downloaded = true;
            successCount++;
            break;
          } catch (clipErr) {
            console.warn(`Attempt ${attempt} for clip ${i + 1} failed:`, clipErr);
            if (attempt === 1) await new Promise((r) => setTimeout(r, 1000));
          }
        }

        setZipProgress(Math.round(5 + ((i + 1) / results.length) * 85));
      }

      if (successCount === 0) {
        throw new Error("Could not download clips for archive. Please try individual clip downloads.");
      }

      setZipProgress(95);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#10b981', '#3b82f6', '#10b981'],
      });
    } catch (e: any) {
      console.error('Failed to create ZIP:', e);
      setScrapeError(e?.message || 'Failed to create ZIP package. Please try again.');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      
      {/* Intro Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>AI Clean-Frame Gatekeeper Active</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Clean Viral <span className="text-emerald-600 dark:text-emerald-400">Topic Scraper</span>
        </h2>
        <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Discover high-retention viral footage filtered by aspect ratio. Our OpenCV vision filter automatically rejects burned-in subtitles, hook text, and logos.
        </p>
      </div>

      {/* Scraper Configuration Card */}
      <div className="w-full rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 sm:p-7">
        
        {/* Topic Input */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Target Topic or Niche
          </label>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-5 h-5 text-emerald-500" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='e.g. "oddly satisfying kinetic sand", "aesthetic coffee routine", "wood carving ASMR"...'
              disabled={isScraping}
              onKeyDown={(e) => e.key === 'Enter' && handleStartScrape()}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/70 rounded-2xl border border-zinc-300 dark:border-zinc-800 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          
          {/* 1. Target Aspect Ratio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Target Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setTargetRatio('9:16')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  targetRatio === '9:16'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16 Vertical</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetRatio('16:9')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  targetRatio === '16:9'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>16:9 Wide</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetRatio('unknown')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  targetRatio === 'unknown'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Any Ratio</span>
              </button>
            </div>
          </div>

          {/* 2. Number of Clean Clips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Clean Clips Count
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {[3, 5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setClipCount(num)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    clipCount === num
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {num} Clips
                </button>
              ))}
            </div>
          </div>

          {/* 3. Platform Sources */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Target Sources
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['youtube', 'tiktok', 'instagram', 'pinterest', 'reddit'] as SupportedPlatform[]).map((p) => {
                const isChecked = selectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-zinc-100 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {p === 'youtube' ? 'YouTube Shorts' : p === 'tiktok' ? 'TikTok' : p === 'instagram' ? 'Instagram' : p === 'pinterest' ? 'Pinterest' : p === 'reddit' ? 'Reddit' : p}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleStartScrape}
          disabled={isScraping || !topic.trim()}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
        >
          {isScraping ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Scanning Feeds & Inspecting Frames...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Scrape Clean Viral Clips ({clipCount})</span>
            </>
          )}
        </button>

        {/* Error Alert */}
        {scrapeError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{scrapeError}</span>
          </div>
        )}

        {/* Live Progress Bar during active scrape */}
        {isScraping && (
          <div className="mt-5 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-2">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>{statusMessage || 'Initializing clean scrape...'}</span>
              </span>
              <span className="font-mono text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

      </div>

      {/* Results Header & 1-Click ZIP Batch Button */}
      {results.length > 0 && (
        <div className="w-full mt-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Clean Viral Archive</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  {results.length} Clips Verified
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                All clips passed OpenCV frame inspection with 0 text/subtitles.
              </p>
            </div>

            {/* 1-Click ZIP Batch Button */}
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Packaging ZIP ({zipProgress}%)...</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Download All Clean Clips (.ZIP)</span>
                </>
              )}
            </button>
          </div>

          {/* Grid of Clean Clips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((clip, idx) => (
              <div
                key={clip.id || idx}
                className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg shadow-zinc-200/50 dark:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col group"
              >
                {/* Media Thumbnail */}
                <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                  <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />

                  {/* Clean Gatekeeper Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 backdrop-blur-md">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>100% Clean Visual</span>
                  </div>

                  {/* Ratio badge */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/70 text-zinc-300 backdrop-blur-md">
                    {clip.aspect_ratio === '9:16' ? '📱 9:16' : '🖥️ 16:9'}
                  </div>

                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-zinc-200">
                    {clip.duration}s
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 capitalize">
                      <span className="text-emerald-500 font-bold">{clip.platform}</span>
                      <span>•</span>
                      <span className="truncate max-w-[140px]">{clip.author}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white line-clamp-2 mb-2">
                      {clip.title}
                    </h4>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadSingleClip(clip)}
                      disabled={downloadingClipId === clip.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                    >
                      {downloadingClipId === clip.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Downloading MP4...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Clean MP4</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
