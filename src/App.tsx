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
  const [fetchError, setFetchError] = useState<string | null>(null);

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
    } else if (trimmed.includes('pinterest.com') || trimmed.includes('pin.it')) {
      setDetectedPlatform('pinterest');
    } else if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
      setDetectedPlatform('facebook');
    } else if (trimmed.includes('reddit.com') || trimmed.includes('v.redd.it')) {
      setDetectedPlatform('reddit');
    } else {
      setDetectedPlatform('unknown');
    }
  }, [url]);

  const handleFetchMedia = async (overrideUrl?: string) => {
    const target = (overrideUrl || url).trim();
    if (!target) return;

    setIsFetchingInfo(true);
    setFetchError(null);

    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(target)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract media information.');
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
    try {
      const filename = `${customFilename}.${option.extension}`;

      // Only direct client fetch IF it's a thumbnail/video OR if it's already a native MP3 url (like TikTok sound)
      const isNativeMp3 = option.type === 'audio' && option.directUrl?.toLowerCase().includes('.mp3');

      if (option.directUrl && (option.type !== 'audio' || isNativeMp3)) {
        try {
          const response = await fetch(option.directUrl);
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            setDownloadingId(null);
            return;
          }
        } catch {
          // Direct fetch fallback to server proxy
        }
      }

      // Stream download or MP3 conversion via server endpoint
      const streamParam = option.directUrl ? `&streamUrl=${encodeURIComponent(option.directUrl)}` : '';
      const downloadEndpoint = `/api/download?url=${encodeURIComponent(mediaResult?.originalUrl || '')}${streamParam}&format=${option.id}&filename=${encodeURIComponent(filename)}`;
      window.location.href = downloadEndpoint;
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDownloadingId(null), 2000);
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
    platforms: SupportedPlatform[]
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
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                mode === 'downloader'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>7-in-1 Downloader</span>
            </button>

            <button
              onClick={() => setMode('scraper')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                mode === 'scraper'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-300" />
              <span>Clean Scraper</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-mono font-bold">
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

            {/* In-Place Search Bar */}
            <UrlInputBar
              url={url}
              setUrl={setUrl}
              onSubmit={handleFetchMedia}
              isLoading={isFetchingInfo}
              detectedPlatform={detectedPlatform}
            />

            {/* Error Banner */}
            {fetchError && (
              <div className="w-full max-w-2xl mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm text-center font-medium animate-in fade-in">
                {fetchError}
              </div>
            )}

            {/* In-Place Result Card (Renders smoothly beneath search bar without page jump) */}
            {mediaResult && (
              <ResultCard
                media={mediaResult}
                onDownload={handleDownload}
                downloadingId={downloadingId}
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
