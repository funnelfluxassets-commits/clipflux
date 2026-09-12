import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(res.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 dark:bg-zinc-900 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/30 mb-3">
            CF
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white dark:text-white light:text-zinc-900 tracking-tight">
            {isSignUp ? 'Create your ClipFlux Account' : 'Welcome back to ClipFlux'}
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">
            {isSignUp ? 'Get 85 bonus credits to scrape and download in Full HD' : 'Sign in to access your saved clips & Pro downloads'}
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Google One-Click Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-700 light:hover:bg-zinc-200 border border-zinc-700 dark:border-zinc-700 light:border-zinc-200 text-xs sm:text-sm font-bold text-white dark:text-white light:text-zinc-800 transition-all mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-zinc-800 dark:border-zinc-800 light:border-zinc-200" />
          <span className="px-3 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Or with email</span>
          <div className="flex-1 border-t border-zinc-800 dark:border-zinc-800 light:border-zinc-200" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleAuth} className="space-y-3">
          {isSignUp && (
            <div className="relative flex items-center">
              <UserIcon className="absolute left-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/70 dark:bg-zinc-950/70 light:bg-zinc-50 rounded-xl border border-zinc-800 dark:border-zinc-800 light:border-zinc-300 text-xs sm:text-sm text-zinc-200 dark:text-zinc-200 light:text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="relative flex items-center">
            <Mail className="absolute left-3 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/70 dark:bg-zinc-950/70 light:bg-zinc-50 rounded-xl border border-zinc-800 dark:border-zinc-800 light:border-zinc-300 text-xs sm:text-sm text-zinc-200 dark:text-zinc-200 light:text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/70 dark:bg-zinc-950/70 light:bg-zinc-50 rounded-xl border border-zinc-800 dark:border-zinc-800 light:border-zinc-300 text-xs sm:text-sm text-zinc-200 dark:text-zinc-200 light:text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Free Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-emerald-400 transition-colors font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up with 85 free credits"}
          </button>
        </div>

      </div>
    </div>
  );
};
