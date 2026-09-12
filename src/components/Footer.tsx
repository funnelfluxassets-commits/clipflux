import React from 'react';
import { Heart, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200 bg-zinc-950/90 dark:bg-zinc-950/90 light:bg-zinc-50 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-300 dark:text-zinc-300 light:text-zinc-800">ClipFlux</span>
          <span>•</span>
          <span>Universal 7-in-1 Downloader & Clean Topic Scraper</span>
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Contact Support</a>
        </div>

        <div className="flex items-center gap-1 text-[11px]">
          <span>Powered by</span>
          <span className="font-bold text-emerald-400">FunnelFlux Assets</span>
        </div>
      </div>
    </footer>
  );
};
