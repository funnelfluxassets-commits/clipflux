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
  Check,
  Tag,
  Hash,
  RotateCcw
} from 'lucide-react';
import { SupportedPlatform } from '../types';

interface UrlInputBarProps {
  url: string;
  setUrl: (val: string) => void;
  onSubmit: (targetUrl?: string) => void;
  isLoading: boolean;
  detectedPlatform: SupportedPlatform;
  customPrefix: string;
  setCustomPrefix: (val: string) => void;
  isSequential: boolean;
  setIsSequential: (val: boolean) => void;
  sequenceIndex: number;
  onIncrementSequence: () => void;
  onDecrementSequence: () => void;
  onResetSequence: () => void;
  computedPreview: string;
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
  customPrefix,
  setCustomPrefix,
  isSequential,
  setIsSequential,
  sequenceIndex,
  onIncrementSequence,
  onDecrementSequence,
  onResetSequence,
  computedPreview,
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 hover:shadow-[0_0_14px_rgba(16,185,129,0.35)] hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              {pasteSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">Pasted!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Paste</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSubmit(url.trim())}
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-emerald-400/80 bg-emerald-500/50 hover:bg-emerald-500/70 hover:border-emerald-300 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
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

      {/* Sequential Custom Filename Bar */}
      <div className="w-full mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-zinc-900/95 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-2 sm:px-3.5 sm:py-2.5 shadow-xl transition-all">
        
        {/* Left: Input for Custom Name / Project Prefix */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="pl-1 text-emerald-500 flex items-center gap-1.5 shrink-0">
            <Tag className="w-4 h-4" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Custom File Name:
            </span>
          </div>
          
          <div className="relative flex-1 min-w-0 flex items-center">
            <input
              type="text"
              value={customPrefix}
              onChange={(e) => setCustomPrefix(e.target.value)}
              placeholder="e.g. PK-Climb (leave blank for creator name)"
              className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 border border-transparent focus:border-emerald-500/50 transition-all pr-7"
            />
            {customPrefix && (
              <button
                type="button"
                onClick={() => setCustomPrefix('')}
                title="Clear custom name"
                className="absolute right-2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Sequential Auto-Numbering Controls & Live Preview */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/80">
          
          {/* Sequential Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSequential(!isSequential)}
            title={isSequential ? "Sequential auto-numbering enabled (#01, #02...)" : "Click to enable sequential numbering"}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isSequential && customPrefix
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-emerald-500" />
            <span>#{String(sequenceIndex).padStart(2, '0')}</span>
          </button>

          {/* Stepper + / - & Reset */}
          {customPrefix && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onDecrementSequence}
                disabled={sequenceIndex <= 1}
                title="Previous sequential number"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                -
              </button>
              <button
                type="button"
                onClick={onIncrementSequence}
                title="Next sequential number"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-emerald-400 cursor-pointer"
              >
                +
              </button>
              <button
                type="button"
                onClick={onResetSequence}
                title="Reset sequence counter back to #01"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Live Preview Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800/70 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 truncate max-w-[200px]">
            <span className="text-zinc-400">Preview:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate">
              {computedPreview}
            </span>
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
