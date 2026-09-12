import React, { useState } from 'react';
import { 
  Download, 
  Film, 
  Music, 
  Image as ImageIcon, 
  CheckCircle2, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  Tag, 
  Edit3, 
  Loader2,
  Sparkles,
  Play
} from 'lucide-react';
import { MediaResult, DownloadOption } from '../types';

interface ResultCardProps {
  media: MediaResult;
  onDownload: (option: DownloadOption, customFilename: string) => void;
  downloadingId: string | null;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  media,
  onDownload,
  downloadingId,
}) => {
  // Filename Presets
  const cleanTitle = (media.title || 'video').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').substring(0, 45);
  const cleanAuthor = (media.authorName || 'creator').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').substring(0, 25);
  const cleanId = (media.id || 'clip').substring(0, 15);

  const presetAuthorTitle = `${cleanAuthor}_${cleanTitle}`;
  const presetTitleOnly = `${cleanTitle}`;
  const presetAuthorId = `${cleanAuthor}_${cleanId}`;

  const [activePreset, setActivePreset] = useState<'author_title' | 'title_only' | 'author_id' | 'custom'>('author_title');
  const [customFilename, setCustomFilename] = useState<string>(presetAuthorTitle);

  const handleSelectPreset = (type: 'author_title' | 'title_only' | 'author_id') => {
    setActivePreset(type);
    if (type === 'author_title') setCustomFilename(presetAuthorTitle);
    if (type === 'title_only') setCustomFilename(presetTitleOnly);
    if (type === 'author_id') setCustomFilename(presetAuthorId);
  };

  const isVertical = media.aspect_ratio === '9:16';
  const isLandscape = media.aspect_ratio === '16:9';

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className="relative rounded-3xl bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 shadow-2xl p-5 sm:p-7 overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Section: Media Info & Native Aspect Ratio */}
        <div className="flex flex-col md:flex-row gap-5 sm:gap-6 items-start">
          
          {/* Thumbnail Preview with duration & aspect ratio pill */}
          <div className="relative w-full md:w-72 shrink-0 aspect-video md:aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 shadow-lg group">
            <img
              src={media.coverUrl}
              alt={media.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // Fallback to placeholder
                e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            
            {/* Aspect Ratio Badge overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-md backdrop-blur-md bg-zinc-950/80 border border-zinc-700/50">
              {isVertical ? (
                <>
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">📱 Native 9:16 Vertical</span>
                </>
              ) : isLandscape ? (
                <>
                  <Monitor className="w-3 h-3 text-sky-400" />
                  <span className="text-sky-400">🖥️ Native 16:9 Landscape</span>
                </>
              ) : (
                <>
                  <Film className="w-3 h-3 text-teal-400" />
                  <span className="text-teal-400">Standard HD</span>
                </>
              )}
            </div>

            {/* Duration Badge */}
            {media.durationFormatted && (
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-black/80 text-zinc-200 backdrop-blur-md border border-zinc-700/50">
                {media.durationFormatted}
              </div>
            )}
          </div>

          {/* Details & Metadata */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
            <div>
              {/* Platform tag & Author */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 dark:text-emerald-400 light:text-emerald-700">
                  {media.platform.toUpperCase()}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500">
                  by <span className="font-semibold text-zinc-200 dark:text-zinc-200 light:text-zinc-800">{media.authorName}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-bold text-white dark:text-white light:text-zinc-900 leading-snug line-clamp-2 mb-3">
                {media.title}
              </h3>
            </div>

            {/* Filename Customization Section */}
            <div className="mt-2 pt-3 border-t border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-100">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Filename Preset:</span>
                </span>
                
                {/* Preset Chips */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSelectPreset('author_title')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activePreset === 'author_title'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-100 text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-white'
                    }`}
                  >
                    Author + Title
                  </button>
                  <button
                    onClick={() => handleSelectPreset('title_only')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activePreset === 'title_only'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-100 text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-white'
                    }`}
                  >
                    Title Only
                  </button>
                  <button
                    onClick={() => handleSelectPreset('author_id')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activePreset === 'author_id'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-100 text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-white'
                    }`}
                  >
                    Author + ID
                  </button>
                </div>
              </div>

              {/* Editable Filename Input */}
              <div className="relative flex items-center">
                <div className="absolute left-2.5 text-zinc-500">
                  <Edit3 className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => {
                    setCustomFilename(e.target.value);
                    setActivePreset('custom');
                  }}
                  placeholder="custom_filename"
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-zinc-50 rounded-xl border border-zinc-700/60 dark:border-zinc-700/60 light:border-zinc-300 text-zinc-200 dark:text-zinc-200 light:text-zinc-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Download Options Grid */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-100">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mb-3">
            Available Media Formats
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {media.downloads.map((opt) => {
              const isCurrentDownloading = downloadingId === opt.id;
              const isVideo = opt.type === 'video';
              const isAudio = opt.type === 'audio';

              return (
                <div
                  key={opt.id}
                  className="flex flex-col justify-between p-3.5 rounded-2xl bg-zinc-950/50 dark:bg-zinc-950/50 light:bg-zinc-50 border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 hover:border-emerald-500/50 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {isVideo && <Film className="w-3.5 h-3.5 text-emerald-400" />}
                        {isAudio && <Music className="w-3.5 h-3.5 text-teal-400" />}
                        {!isVideo && !isAudio && <ImageIcon className="w-3.5 h-3.5 text-amber-400" />}
                        <span className="text-xs font-bold text-white dark:text-white light:text-zinc-900">
                          {opt.label}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 line-clamp-1 mb-2">
                      {opt.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onDownload(opt, customFilename)}
                    disabled={isCurrentDownloading}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                      opt.isOriginal
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40'
                        : 'bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 light:bg-zinc-200 light:hover:bg-zinc-300 text-zinc-100 dark:text-zinc-100 light:text-zinc-800'
                    }`}
                  >
                    {isCurrentDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download {opt.extension.toUpperCase()}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
