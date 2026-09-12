import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Sparkles, 
  Sun, 
  Moon, 
  User as UserIcon, 
  LogOut, 
  Zap, 
  CheckCircle2, 
  ChevronDown,
  Layers,
  Crown
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentMode: 'downloader' | 'scraper';
  onModeChange: (mode: 'downloader' | 'scraper') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenPricing: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onModeChange,
  theme,
  onToggleTheme,
  user,
  onOpenAuth,
  onOpenPricing,
  onSignOut,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => onModeChange('downloader')}>
          <div className="relative flex items-center justify-center">
            <img 
              src="/logo-icon.png" 
              alt="ClipFlux Logo" 
              className="w-10 h-10 object-contain rounded-xl drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              onError={(e) => {
                // Fallback icon if logo image not found
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20" style={{ display: 'none' }}>
              CF
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                Clip<span className="text-emerald-600 dark:text-emerald-400">Flux</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 hidden sm:inline -mt-0.5 font-medium">
              Universal Media Engine
            </span>
          </div>
        </div>

        {/* Center: Mode Switcher Tabs */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-full border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => onModeChange('downloader')}
            className={`flex items-center gap-2 px-3 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
              currentMode === 'downloader'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>7-in-1 Downloader</span>
          </button>

          <button
            onClick={() => onModeChange('scraper')}
            className={`flex items-center gap-2 px-3 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
              currentMode === 'scraper'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-300" />
            <span>Clean Scraper</span>
            <span className="hidden md:inline text-[10px] bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
              AI Filter
            </span>
          </button>
        </div>

        {/* Right: Theme Toggle, Credits Pill, User Login / Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle dark/light mode"
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border border-zinc-200 dark:border-zinc-800 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {/* Credits Counter Pill */}
          <button
            onClick={onOpenPricing}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-all font-medium text-xs group cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform fill-emerald-500" />
            <span className="font-bold">{user ? user.credits : 85}</span>
            <span className="text-zinc-500 dark:text-zinc-400">Credits</span>
            <span className="text-emerald-500 text-[10px] font-bold ml-0.5 group-hover:translate-x-0.5 transition-transform">+</span>
          </button>

          {/* User Auth Button / Dropdown */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all text-xs font-medium cursor-pointer"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-emerald-500/50" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline text-zinc-800 dark:text-zinc-200 font-semibold max-w-[90px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {user.displayName || 'Creator'}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Crown className="w-3 h-3" />
                      <span>{user.tier.toUpperCase()} PLAN • {user.credits} CREDITS</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenPricing();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Get More Credits</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors mt-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
