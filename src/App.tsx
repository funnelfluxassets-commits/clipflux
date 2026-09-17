import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UrlInputBar } from './components/UrlInputBar';
import { ResultCard } from './components/ResultCard';
import { CleanTopicScraper } from './components/CleanTopicScraper';
import { FeatureHighlights } from './components/FeatureHighlights';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { 
  SupportedPlatform, 
  MediaResult, 
  DownloadOption, 
  UserProfile, 
  AspectRatioType, 
  FreshnessType,
  ScrapedClip 
} from './types';
import { Download, Sparkles } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export const App: React.FC = () => {
  // Theme state (Default: Dark Mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('clipflux_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('clipflux_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Mode state: 'downloader' | 'scraper'
  const [mode, setMode] = useState<'downloader' | 'scraper'>('downloader');

  // User & Modals
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          credits: 85,
          tier: 'free',
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  // ─── Downloader State ────────────────────────────────────────────────────────
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<SupportedPlatform>('unknown');
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [mediaResult, setMediaResult] = useState<MediaResult | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Custom Filename & Sequential Project Naming State (Persisted in localStorage)
  const [customPrefix, setCustomPrefix] = useState<string>(() => {
    return localStorage.getItem('clipflux_custom_prefix') || '';
  });
  const [isSequential, setIsSequential] = useState<boolean>(() => {
    const saved = localStorage.getItem('clipflux_is_sequential');
    return saved !== null ? saved === 'true' : true;
  });
  const [sequenceIndex, setSequenceIndex] = useState<number>(() => {
    const saved = localStorage.getItem('clipflux_seq_index');
    return saved ? parseInt(saved, 10) || 1 : 1;
  });
  const [lastDownloadedMediaId, setLastDownloadedMediaId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('clipflux_custom_prefix', customPrefix);
  }, [customPrefix]);

  useEffect(() => {
    localStorage.setItem('clipflux_is_sequential', String(isSequential));
  }, [isSequential]);

  useEffect(() => {
    localStorage.setItem('clipflux_seq_index', String(sequenceIndex));
  }, [sequenceIndex]);

  const handleIncrementSequence = () => {
    setSequenceIndex((prev) => prev + 1);
  };

  const handleDecrementSequence = () => {
    setSequenceIndex((prev) => Math.max(1, prev - 1));
  };

  const handleResetSequence = () => {
    setSequenceIndex(1);
  };

  const computedGlobalCustomName = React.useMemo(() => {
    if (!customPrefix.trim()) return '';
    const clean = customPrefix.trim().replace(/[^\w\s-]/gi, '').replace(/[\s_]+/g, '_');
    return isSequential ? `${clean}-${String(sequenceIndex).padStart(2, '0')}` : clean;
  }, [customPrefix, isSequential, sequenceIndex]);

  const computedPreview = React.useMemo(() => {
    if (computedGlobalCustomName) {
      return `${computedGlobalCustomName}.mp4`;
    }
    return '@creator_title.mp4';
  }, [computedGlobalCustomName]);

  // Auto-detect platform from URL
  useEffect(() => {
    const trimmed = url.trim().toLowerCase();
    if (!trimmed) {
      setDetectedPlatform('unknown');
      return;
    }

    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      setDetectedPlatform('youtube');
    } else if (trimmed.includes('tiktok.com')) {
      setDetectedPlatform('tiktok');
    } else if (trimmed.includes('instagram.com')) {
      setDetectedPlatform('instagram');
    } else if (trimmed.includes('twitter.com') || trimmed.includes('x.com')) {
      setDetectedPlatform('twitter');
    } else if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
      setDetectedPlatform('facebook');
    } else if (trimmed.includes('pinterest.com') || trimmed.includes('pin.it')) {
      setDetectedPlatform('pinterest');
    } else if (trimmed.includes('snapchat.com')) {
      setDetectedPlatform('snapchat');
    } else {
      setDetectedPlatform('unknown');
    }
  }, [url]);

  const handleFetchMedia = async (targetUrl?: string) => {
    const target = (typeof targetUrl === 'string' && targetUrl.trim()) ? targetUrl.trim() : url.trim();
    if (!target) return;

    setIsFetchingInfo(true);
    setFetchError(null);
    // Preserves existing mediaResult on screen while fetching next video (zero layout jump)

    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(target)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract media information.');
      }

      // If previous video was downloaded and user is loading a different video, advance sequence number
      if (
        mediaResult &&
        lastDownloadedMediaId &&
        lastDownloadedMediaId === mediaResult.id &&
        data.data.id !== lastDownloadedMediaId
      ) {
        if (customPrefix.trim() && isSequential) {
          setSequenceIndex((prev) => prev + 1);
        }
        setLastDownloadedMediaId(null);
      }

      setMediaResult(data.data);
    } catch (err: any) {
      console.error(err);
      setFetchError(err.message || 'Could not fetch video. Please check the URL.');
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleDownload = async (option: DownloadOption, customFilename: string) => {
    setDownloadingId(option.id);
    setDownloadProgress('Connecting...');
    setFetchError(null);
    try {
      const filename = `${customFilename}.${option.extension}`;
      const isYouTube =
        mediaResult?.platform === 'youtube' ||
        (mediaResult?.originalUrl &&
          (mediaResult.originalUrl.includes('youtube.com') || mediaResult.originalUrl.includes('youtu.be')));

      // 1. Direct in-browser download for non-YouTube media whenever directUrl is available (0 MB Vercel bandwidth)
      const isNativeMp3 = option.type === 'audio' && option.directUrl?.toLowerCase().includes('.mp3');
      const canDirectDownload =
        !!option.directUrl &&
        !isYouTube &&
        (option.type === 'thumbnail' || option.type === 'video' || isNativeMp3);

      if (canDirectDownload) {
        try {
          setDownloadProgress('Direct downloading...');
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4500);
          const directRes = await fetch(option.directUrl!, {
            signal: controller.signal,
            headers: { Accept: '*/*' },
          });
          clearTimeout(timer);

          if (directRes.ok) {
            const contentLength = directRes.headers.get('content-length');
            const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
            let loadedBytes = 0;

            const reader = directRes.body?.getReader();
            const chunks: Uint8Array[] = [];

            if (reader) {
              setDownloadProgress(totalBytes > 0 ? '0%' : 'Saving...');
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                  chunks.push(value);
                  loadedBytes += value.length;
                  if (totalBytes > 0) {
                    const percent = Math.min(99, Math.round((loadedBytes / totalBytes) * 100));
                    setDownloadProgress(`${percent}%`);
                  } else {
                    const mb = (loadedBytes / (1024 * 1024)).toFixed(1);
                    setDownloadProgress(`${mb} MB`);
                  }
                }
              }
            }

            setDownloadProgress('Saving...');
            const defaultType =
              option.type === 'audio'
                ? 'audio/mpeg'
                : option.type === 'thumbnail'
                ? 'image/jpeg'
                : 'video/mp4';
            const contentType = directRes.headers.get('content-type') || defaultType;
            const blob =
              chunks.length > 0 ? new Blob(chunks, { type: contentType }) : await directRes.blob();

            // Validate that the blob is an actual binary media file and not an HTML error or empty response
            const isValidMedia =
              option.type === 'thumbnail'
                ? blob.size > 1000
                : blob.type.includes('video') ||
                  blob.type.includes('audio') ||
                  blob.type.includes('octet-stream') ||
                  blob.size > 100000;

            if (isValidMedia) {
              const blobUrl = window.URL.createObjectURL(blob);
              const tempLink = document.createElement('a');
              tempLink.href = blobUrl;
              tempLink.download = filename;
              document.body.appendChild(tempLink);
              tempLink.click();
              document.body.removeChild(tempLink);
              setTimeout(() => window.URL.revokeObjectURL(blobUrl), 4000);

              setLastDownloadedMediaId(mediaResult?.id || 'downloaded');
              setDownloadingId(null);
              setDownloadProgress(null);
              return;
            }
          }
        } catch (directErr) {
          console.info('[ClipFlux] Direct browser download blocked/bypassed, switching to Vercel fallback:', directErr);
        }
      }

      // 2. Fallback for blocked CORS or YouTube: Stream download via server endpoint
      setDownloadProgress('Connecting...');
      const streamParam = option.directUrl ? `&streamUrl=${encodeURIComponent(option.directUrl)}` : '';
      const downloadEndpoint = `/api/download?url=${encodeURIComponent(mediaResult?.originalUrl || '')}${streamParam}&format=${option.id}&filename=${encodeURIComponent(filename)}`;

      const response = await fetch(downloadEndpoint);
      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        const msg = errorJson?.error || `Download failed (HTTP ${response.status})`;
        throw new Error(msg);
      }

      const contentLengthHeader = response.headers.get('content-length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      let loadedBytes = 0;

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (reader) {
        setDownloadProgress(totalBytes > 0 ? '0%' : 'Streaming...');
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loadedBytes += value.length;
            if (totalBytes > 0) {
              const percent = Math.min(99, Math.round((loadedBytes / totalBytes) * 100));
              setDownloadProgress(`${percent}%`);
            } else {
              const mb = (loadedBytes / (1024 * 1024)).toFixed(1);
              setDownloadProgress(`${mb} MB`);
            }
          }
        }
      }

      setDownloadProgress('Saving...');
      const contentType = response.headers.get('content-type') || (option.type === 'audio' ? 'audio/mpeg' : 'video/mp4');
      const blob = new Blob(chunks, { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 4000);
      setLastDownloadedMediaId(mediaResult?.id || 'downloaded');
    } catch (e: any) {
      console.error('Download error:', e);
      setFetchError(e?.message || 'Download could not complete. Please try another quality option.');
      throw e;
    } finally {
      setDownloadingId(null);
      setDownloadProgress(null);
    }
  };

  // ─── Scraper State ───────────────────────────────────────────────────────────
  const [isScraping, setIsScraping] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const handleScrapeTopic = async (
    topic: string,
    ratio: AspectRatioType,
    count: number,
    platforms: SupportedPlatform[],
    freshness: FreshnessType = 'all'
  ): Promise<ScrapedClip[]> => {
    setIsScraping(true);
    setProgressPercent(15);
    setStatusMessage(`Scanning ${platforms.join(', ')} feeds for "${topic}"...`);

    try {
      // Periodic progress ticker
      const timer1 = setTimeout(() => {
        setProgressPercent(40);
        setStatusMessage(`Filtering candidates by ${ratio === '9:16' ? '9:16 Vertical' : '16:9 Landscape'} aspect ratio...`);
      }, 1200);

      const timer2 = setTimeout(() => {
        setProgressPercent(75);
        setStatusMessage('AI Clean-Frame Gatekeeper inspecting video keyframes for text/subtitles...');
      }, 2500);

      const queryParams = new URLSearchParams({
        topic,
        target_ratio: ratio,
        count: String(count),
        platforms: platforms.join(','),
        freshness,
      });

      const res = await fetch(`/api/scrape?${queryParams.toString()}`);
      const data = await res.json();

      clearTimeout(timer1);
      clearTimeout(timer2);

      setProgressPercent(100);
      setStatusMessage('Clean viral clips verified!');

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete clean topic scrape.');
      }

      return data.data.videos || [];
    } finally {
      setTimeout(() => {
        setIsScraping(false);
        setProgressPercent(0);
        setStatusMessage('');
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] sm:w-[700px] h-[220px] sm:h-[350px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-emerald-400/10 blur-3xl pointer-events-none rounded-full" />
      
      {/* Top Navigation */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenPricing={() => setPricingOpen(true)}
        onSignOut={handleSignOut}
        onLogoClick={() => setMode('downloader')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10">
        
        {/* Mode Switcher Tabs (Moved above Title in Page Body) */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-900/90 p-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-200/50 dark:shadow-none">
            <button
              onClick={() => setMode('downloader')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer border ${
                mode === 'downloader'
                  ? 'border-emerald-400 dark:border-emerald-300 bg-emerald-500/50 dark:bg-emerald-500/50 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]'
                  : 'border-emerald-500/25 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 dark:hover:border-emerald-400 hover:shadow-[0_0_14px_rgba(16,185,129,0.35)] hover:bg-emerald-500/20'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>7-in-1 Downloader</span>
            </button>

            <button
              onClick={() => setMode('scraper')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer border ${
                mode === 'scraper'
                  ? 'border-emerald-400 dark:border-emerald-300 bg-emerald-500/50 dark:bg-emerald-500/50 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]'
                  : 'border-emerald-500/25 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 dark:hover:border-emerald-400 hover:shadow-[0_0_14px_rgba(16,185,129,0.35)] hover:bg-emerald-500/20'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-300" />
              <span>Clean Scraper</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold border transition-colors ${
                mode === 'scraper'
                  ? 'bg-emerald-600/60 border-emerald-300/40 text-emerald-100'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
              }`}>
                AI Filter
              </span>
            </button>
          </div>
        </div>

        {mode === 'downloader' ? (
          <div className="flex flex-col items-center">
            {/* Hero Heading */}
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
                <span>⚡ 7 Social Networks • 1 Unified Downloader</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
                Universal <span className="text-emerald-600 dark:text-emerald-400">7-in-1 Media</span> Downloader
              </h1>
              <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                Download Full HD videos, shorts, reels, audio & thumbnails with automatic aspect ratio detection and custom filename presets.
              </p>
            </div>

            {/* In-Place Search Bar with Custom Filename & Sequence Controls */}
            <UrlInputBar
              url={url}
              setUrl={setUrl}
              onSubmit={handleFetchMedia}
              isLoading={isFetchingInfo}
              detectedPlatform={detectedPlatform}
              customPrefix={customPrefix}
              setCustomPrefix={setCustomPrefix}
              isSequential={isSequential}
              setIsSequential={setIsSequential}
              sequenceIndex={sequenceIndex}
              onIncrementSequence={handleIncrementSequence}
              onDecrementSequence={handleDecrementSequence}
              onResetSequence={handleResetSequence}
              computedPreview={computedPreview}
            />

            {/* Error Banner */}
            {fetchError && (
              <div className="w-full max-w-2xl mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm text-center font-medium animate-in fade-in">
                {fetchError}
              </div>
            )}

            {/* In-Place Result Card (Stays visible across URL submissions without disappearing) */}
            {mediaResult && (
              <ResultCard
                media={mediaResult}
                onDownload={handleDownload}
                downloadingId={downloadingId}
                downloadProgress={downloadProgress}
                isRefreshing={isFetchingInfo}
                globalCustomName={computedGlobalCustomName}
              />
            )}
          </div>
        ) : (
          /* Mode: Clean Topic Scraper */
          <CleanTopicScraper
            onScrape={handleScrapeTopic}
            isScraping={isScraping}
            statusMessage={statusMessage}
            progressPercent={progressPercent}
          />
        )}

        {/* Feature Highlights Grid */}
        <FeatureHighlights />

        {/* FAQ Section */}
        <FaqSection />

      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <PricingModal
        isOpen={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onSelectPlan={(plan, gateway) => {
          alert(`Selected ${plan.toUpperCase()} plan with ${gateway.toUpperCase()} checkout. In production, this redirects directly to your verified South African Paystack account or Bahrain PayPal account.`);
          setPricingOpen(false);
        }}
      />

    </div>
  );
};

export default App;
