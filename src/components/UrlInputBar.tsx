import React, { useState } from 'react';
import { 
  Search, 
  Clipboard, 
  X, 
  ArrowRight, 
  Loader2, 
  Youtube, 
  Instagram, 
  Twitter, 
  Share2, 
  Sparkles,
  Check
} from 'lucide-react';
import { SupportedPlatform } from '../types';

interface UrlInputBarProps {
  url: string;
  setUrl: (val: string) => void;
  onSubmit: (targetUrl?: string) => void;
  isLoading: boolean;
  detectedPlatform: SupportedPlatform;
}

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube & Shorts', color: 'hover:text-red-500', active: 'border-red-500/40 text-red-400 bg-red-500/10' },
  { id: 'tiktok', name: 'TikTok (No Watermark)', color: 'hover:text-cyan-400', active: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' },
  { id: 'instagram', name: 'Instagram Reels', color: 'hover:text-pink-500', active: 'border-pink-500/40 text-pink-400 bg-pink-500/10' },
  { id: 'facebook', name: 'Facebook & Reels', color: 'hover:text-blue-500', active: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { id: 'twitter', name: 'Twitter / X', color: 'hover:text-sky-400', active: 'border-sky-500/40 text-sky-400 bg-sky-500/10' },
  { id: 'pinterest', name: 'Pinterest Pins', color: 'hover:text-rose-500', active: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
  { id: 'reddit', name: 'Reddit Video', color: 'hover:text-orange-500', active: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
];

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  url,
  setUrl,
  onSubmit,
  isLoading,
  detectedPlatform,
}) => {
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrl(text.trim());
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 1500);
        onSubmit(text.trim());
      }
    } catch {
      // Fallback
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Search Input Box */}
      <div className="relative w-full group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition duration-500 group-focus-within:opacity-75 group-focus-within:blur-lg" />
        
        <div className="relative flex items-center bg-white dark:bg-zinc-900/95 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-2 sm:p-2.5 transition-all">
          
          <div className="pl-3 pr-2 text-zinc-500 dark:text-zinc-400">
            <Search className="w-5 h-5 text-emerald-500" />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste any YouTube, TikTok, Instagram, Twitter/X, Pinterest, FB, or Reddit link..."
            disabled={isLoading}
            className="w-full bg-transparent px-2 py-2 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-1.5 sm:gap-2">
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                aria-label="Clear input"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              aria-label="Paste from clipboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200 dark:border-zinc-700/50 cursor-pointer"
            >
              {pasteSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Pasted!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Paste</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSubmit(url.trim())}
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 transition-all active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <span>Download</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Supported Platforms Pill Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 px-2">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
          Supports:
        </span>
        {PLATFORMS.map((p) => {
          const isActive = detectedPlatform === p.id;
          return (
            <span
              key={p.id}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 cursor-default ${
                isActive
                  ? p.active
                  : 'bg-zinc-100 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              } ${p.color}`}
            >
              {p.name}
            </span>
          );
        })}
      </div>
    </div>
  );
};
