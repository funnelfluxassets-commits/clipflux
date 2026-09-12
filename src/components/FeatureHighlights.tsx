import React from 'react';
import { 
  Zap, 
  Smartphone, 
  ShieldCheck, 
  FolderArchive, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';

export const FeatureHighlights: React.FC = () => {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      title: "Universal 7-in-1 Downloader",
      description: "One unified interface that instantly handles YouTube, TikTok, Instagram Reels, Facebook, Twitter/X, Pinterest, and Reddit without switching tools."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-emerald-400" />,
      title: "Native Aspect Ratio Detection",
      description: "Automatically analyzes dimensions to badge clips as 9:16 Vertical (Shorts/Reels) or 16:9 Landscape with zero distortion or stretched frames."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: "AI Clean-Frame Gatekeeper",
      description: "Our OpenCV computer vision filter scans keyframes to automatically reject burned-in subtitles, hook text banners, and watermarks."
    },
    {
      icon: <FolderArchive className="w-6 h-6 text-emerald-400" />,
      title: "1-Click Batch .ZIP Export",
      description: "Scrape entire viral niches and package all high-retention clean clips into a single .zip download with pristine folder organization."
    },
    {
      icon: <FileText className="w-6 h-6 text-emerald-400" />,
      title: "Filename Preset Manager",
      description: "Save hours of file renaming with one-click presets: [Author + Title], [Title Only], [Author + ID], or your own custom prefix."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      title: "Direct Zero-Bandwidth CDN Speed",
      description: "Downloads stream directly from social network CDNs straight into your browser with zero middleman throttling and crisp 1080p fidelity."
    }
  ];

  return (
    <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>ENGINEERED FOR MODERN CREATORS</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white dark:text-white light:text-zinc-900 tracking-tight">
          Everything You Need to Recreate Viral Trends
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
          Built for video editors, faceless channel owners, and media agencies who need clean, watermark-free B-roll at scale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 hover:border-emerald-500/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              {f.icon}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white dark:text-white light:text-zinc-900 mb-2">
              {f.title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-600 leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
