import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Play, 
  Copy, 
  Check, 
  Sparkles, 
  Film, 
  FileVideo, 
  FileAudio, 
  RotateCcw, 
  Tag, 
  CheckCircle2, 
  Loader2, 
  ImageIcon, 
  Smartphone, 
  Monitor,
  ExternalLink
} from 'lucide-react';
import { MediaResult, DownloadOption } from '../types';

interface ResultCardProps {
  media: MediaResult;
  onDownload: (option: DownloadOption, customFilename: string) => Promise<void> | void;
  downloadingId: string | null;
  downloadProgress?: string | null;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  media,
  onDownload,
  downloadingId,
  downloadProgress,
}) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [selectedDownloadId, setSelectedDownloadId] = useState<string | null>(
    () => media.downloads.find((d) => d.isOriginal)?.id || media.downloads[0]?.id || null
  );

  // Filename Presets
  const cleanForFilename = (str: string): string => {
    return str
      .replace(/[^\w\s-]/gi, '')
      .replace(/[\s_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80);
  };

  const titleSlug = useMemo(() => {
    const raw = media.title || 'video';
    return cleanForFilename(raw) || 'video';
  }, [media.title]);

  const authorSlug = useMemo(() => {
    const raw = media.authorUsername || media.authorName || 'creator';
    return cleanForFilename(raw) || 'creator';
  }, [media.authorUsername, media.authorName]);

  const presetCreatorCaption = useMemo(() => `${authorSlug}_${titleSlug}`, [authorSlug, titleSlug]);
  const presetCaptionOnly = useMemo(() => titleSlug, [titleSlug]);
  const presetCreatorId = useMemo(() => `${authorSlug}_${media.id}`, [authorSlug, media.id]);

  const [activePreset, setActivePreset] = useState<'author_title' | 'title_only' | 'author_id' | 'custom'>('author_title');
  const [customFilename, setCustomFilename] = useState<string>(presetCreatorCaption);

  const handleSelectPreset = (type: 'author_title' | 'title_only' | 'author_id') => {
    setActivePreset(type);
    if (type === 'author_title') setCustomFilename(presetCreatorCaption);
    if (type === 'title_only') setCustomFilename(presetCaptionOnly);
    if (type === 'author_id') setCustomFilename(presetCreatorId);
  };

  const handleCopyCaption = () => {
    if (media.title) {
      navigator.clipboard.writeText(media.title);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  };

  const isVertical =
    media.aspect_ratio === '9:16' ||
    media.originalUrl.includes('/reel') ||
    media.originalUrl.includes('/shorts') ||
    ((media.height || 0) > (media.width || 0) && (media.height || 0) > 0);

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 bg-white dark:bg-zinc-900/95 rounded-3xl p-4 sm:p-7 shadow-2xl border border-zinc-200 dark:border-zinc-800 transition-all space-y-6 animate-in fade-in slide-in-from-top-3">
      
      {/* ── 1. Top Header Info (Platform, Resolution Badge, Title, Caption Copy) ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {isVertical ? <Smartphone className="w-3 h-3 text-emerald-500" /> : <Monitor className="w-3 h-3 text-emerald-500" />}
              {media.platform === 'twitter' ? 'X / TWITTER' : media.platform.toUpperCase()} {isVertical ? 'REEL (9:16)' : 'VIDEO (16:9)'}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Full HD Ready
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug">
            {media.title}
          </h2>

          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              @{media.authorUsername || media.authorName}
            </span>
            <span>•</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Direct File Download (Zero Ads)
            </span>
          </div>
        </div>

        <button
          onClick={handleCopyCaption}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 px-3 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer self-start"
          title="Copy Caption"
        >
          {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedCaption ? 'Copied' : 'Copy Caption'}</span>
        </button>
      </div>

      {/* ── 2. Media Preview & Download Controls Grid ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Portrait (9:16) or Landscape (16:9) Video Player Preview */}
        <div className={`md:col-span-5 relative rounded-2xl overflow-hidden bg-black shadow-lg border border-zinc-200 dark:border-zinc-800 mx-auto w-full ${
          isVertical ? 'aspect-[9/16] max-h-[460px] max-w-[280px]' : 'aspect-video max-h-[300px]'
        }`}>
          {isPlayingVideo ? (
            media.platform === 'instagram' ? (
              <iframe
                src={`https://www.instagram.com/p/${media.id}/embed/`}
                title={media.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : media.platform === 'youtube' ? (
              <iframe
                src={`https://www.youtube.com/embed/${media.id}?autoplay=1`}
                title={media.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <video
                src={
                  media.videoUrl ||
                  media.downloads.find((d) => d.type === 'video')?.directUrl ||
                  media.downloads.find((d) => d.type === 'video')?.url
                }
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = media.downloads.find((d) => d.directUrl)?.directUrl;
                  if (fallback && target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            )
          ) : (
            <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlayingVideo(true)}>
              <img
                src={media.coverUrl}
                alt={media.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';
                }}
              />
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <button
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Click to Play Video"
                >
                  <Play className="w-6 h-6 fill-white translate-x-0.5" />
                </button>
              </div>

              <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg">
                <Play className="w-3 h-3 fill-white" />
                <span>{isVertical ? 'Click to Play Reel' : 'Click to Play Video'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Quality Selector & Direct Download Options Stack */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-emerald-500" />
              <span>Select Download Quality:</span>
            </h3>
            <span className="text-xs text-zinc-400">Direct to Downloads</span>
          </div>

          {/* Stacked Format Cards (Identical Height & Clean Layout) */}
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {media.downloads.map((option) => {
              const isSelected = selectedDownloadId === option.id;
              const isDownloading = downloadingId === option.id;
              const isSuccess = downloadSuccessId === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedDownloadId(option.id)}
                  className={`px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 h-[72px] sm:h-[76px] ${
                    isSelected
                      ? 'border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/25 ring-2 ring-emerald-500/25 shadow-sm'
                      : 'border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        option.type === 'audio'
                          ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                          : option.type === 'thumbnail'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {option.type === 'audio' ? (
                        <FileAudio className="w-4.5 h-4.5" />
                      ) : option.type === 'thumbnail' ? (
                        <ImageIcon className="w-4.5 h-4.5" />
                      ) : (
                        <FileVideo className="w-4.5 h-4.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                          {option.quality === '1080' ? '1080p Full HD' : option.quality === '720' ? '720p HD' : option.label}
                        </span>
                        {option.badge && (
                          <span
                            className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                              option.isOriginal
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {option.isOriginal ? 'RECOMMENDED' : option.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await onDownload(option, customFilename);
                        setDownloadSuccessId(option.id);
                        setTimeout(() => setDownloadSuccessId(null), 3000);
                      } catch {}
                    }}
                    disabled={isDownloading}
                    className={`min-w-[96px] sm:min-w-[104px] h-9 sm:h-10 px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait border ${
                      isDownloading || isSuccess
                        ? 'border-emerald-400 bg-emerald-500/50 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] hover:bg-emerald-500/20 active:scale-95'
                    }`}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{downloadProgress || 'Saving...'}</span>
                      </>
                    ) : isSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── 3. Filename Customization & Presets ─────────────────────────── */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Custom Filename:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomFilename(presetCreatorCaption);
                  setActivePreset('author_title');
                }}
                className="text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <input
              type="text"
              value={customFilename}
              onChange={(e) => {
                setCustomFilename(e.target.value);
                setActivePreset('custom');
              }}
              placeholder="custom_filename"
              className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-zinc-400">Presets:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('author_title')}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${
                    activePreset === 'author_title'
                      ? 'border-emerald-400 dark:border-emerald-300 bg-emerald-500/50 dark:bg-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  }`}
                >
                  Author + Title
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('title_only')}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${
                    activePreset === 'title_only'
                      ? 'border-emerald-400 dark:border-emerald-300 bg-emerald-500/50 dark:bg-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  }`}
                >
                  Title Only
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('author_id')}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${
                    activePreset === 'author_id'
                      ? 'border-emerald-400 dark:border-emerald-300 bg-emerald-500/50 dark:bg-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  }`}
                >
                  Author + ID
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
