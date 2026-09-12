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
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-zinc-950/80 dark:bg-zinc-950/80 light:bg-white/80 border-b border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200 transition-colors duration-200">
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
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white dark:text-white light:text-zinc-900">
                Clip<span className="text-emerald-400 dark:text-emerald-400 light:text-emerald-600">Flux</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 dark:text-emerald-400 light:text-emerald-700">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 hidden sm:inline -mt-0.5 font-medium">
              Universal Media Engine
            </span>
          </div>
        </div>

        {/* Center: Mode Switcher Tabs */}
        <div className="flex items-center bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 p-1 rounded-full border border-zinc-800 dark:border-zinc-800 light:border-zinc-200">
          <button
            onClick={() => onModeChange('downloader')}
            className={`flex items-center gap-2 px-3 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
              currentMode === 'downloader'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-white dark:hover:text-white light:hover:text-zinc-900'
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
                : 'text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-white dark:hover:text-white light:hover:text-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            <span>Clean Scraper</span>
            <span className="hidden md:inline text-[10px] bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
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
            className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-emerald-400 dark:hover:text-emerald-400 light:hover:text-emerald-600 transition-colors border border-zinc-800 dark:border-zinc-800 light:border-zinc-200"
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
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 transition-all font-medium text-xs group"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform fill-emerald-400" />
            <span className="font-bold">{user ? user.credits : 85}</span>
            <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-500">Credits</span>
            <span className="text-emerald-400 text-[10px] font-bold ml-0.5 group-hover:translate-x-0.5 transition-transform">+</span>
          </button>

          {/* User Auth Button / Dropdown */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 transition-all text-xs font-medium"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-emerald-500/50" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-semibold max-w-[90px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-900 dark:bg-zinc-900 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-zinc-800 dark:border-zinc-800 light:border-zinc-100 mb-1">
                    <p className="text-xs font-semibold text-white dark:text-white light:text-zinc-900 truncate">
                      {user.displayName || 'Creator'}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Crown className="w-3 h-3" />
                      <span>{user.tier.toUpperCase()} PLAN • {user.credits} CREDITS</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenPricing();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-zinc-100 rounded-xl transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Get More Credits</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors mt-1"
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
