import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Zap, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  CreditCard,
  Layers
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: 'pro' | 'suite', gateway: 'paystack' | 'paypal') => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
}) => {
  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'paypal'>('paystack');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl rounded-3xl bg-zinc-900 dark:bg-zinc-900 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 shadow-2xl p-6 sm:p-9 overflow-y-auto max-h-[90vh]">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>INSTANT VIRAL CREATOR PLANS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-zinc-900">
            Supercharge Your Workflow with <span className="text-emerald-400">ClipFlux</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mt-1 max-w-lg mx-auto">
            Unlimited 7-in-1 Full HD downloads, automated clean viral topic scraping, and 1-click batch ZIP exports.
          </p>

          {/* Payment gateway switch */}
          <div className="mt-4 inline-flex items-center p-1 bg-zinc-950 dark:bg-zinc-950 light:bg-zinc-100 rounded-xl border border-zinc-800 dark:border-zinc-800 light:border-zinc-200">
            <button
              onClick={() => setSelectedGateway('paystack')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedGateway === 'paystack'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cards & Apple Pay (Paystack)</span>
            </button>
            <button
              onClick={() => setSelectedGateway('paypal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedGateway === 'paypal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>PayPal 1-Click</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Plan 1: ClipFlux Pro */}
          <div className="relative rounded-2xl bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-zinc-50 border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-lg font-bold text-white dark:text-white light:text-zinc-900">ClipFlux Pro</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  POPULAR
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-3xl sm:text-4xl font-black text-white dark:text-white light:text-zinc-900">$29</span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>
              <p className="text-xs text-zinc-400 mb-5">
                Ideal for content creators, video editors, and agency builders scaling their short-form pipeline.
              </p>

              <ul className="space-y-2.5 text-xs text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>100 Clean Scrapes</strong> per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Unlimited</strong> 7-in-1 Full HD 1080p downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AI Clean-Frame Gatekeeper (No text / subtitles)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom Filename Presets & MP3 extraction</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard community support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('pro', selectedGateway)}
              className="mt-6 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Get ClipFlux Pro
            </button>
          </div>

          {/* Plan 2: ClipFlux Suite */}
          <div className="relative rounded-2xl bg-zinc-950/80 dark:bg-zinc-950/80 light:bg-zinc-50 border-2 border-emerald-500/60 p-6 flex flex-col justify-between shadow-xl shadow-emerald-500/10">
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
              BEST VALUE • UNLIMITED
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-lg font-bold text-white dark:text-white light:text-zinc-900 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>ClipFlux Suite</span>
                </h3>
              </div>
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-3xl sm:text-4xl font-black text-white dark:text-white light:text-zinc-900">$79</span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>
              <p className="text-xs text-zinc-400 mb-5">
                Maximum power for production agencies, media teams, and power scrapers requiring unlimited throughput.
              </p>

              <ul className="space-y-2.5 text-xs text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Unlimited Clean Scrapes</strong> (zero cap)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>1-Click Batch .ZIP Export</strong> (all clips in 1 file)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ultra-fast Dedicated VIP processing queue</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited 7-in-1 Full HD downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority 24/7 VIP creator support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('suite', selectedGateway)}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
            >
              Get ClipFlux Suite
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
