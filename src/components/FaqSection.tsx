import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What makes ClipFlux different from standard video downloaders?",
      a: "Standard downloaders only fetch single links. ClipFlux is a two-in-one suite: it unites 7 major platforms with native aspect ratio detection (9:16 vs 16:9), and adds an automated Clean Topic Scraper that uses computer vision to discard clips with burned-in text, hook banners, or subtitles."
    },
    {
      q: "How does the AI Clean-Frame Gatekeeper work?",
      a: "When you search a topic, our vision engine samples keyframes from candidate clips (beginning, middle, end) and inspects them using OpenCV morphological edge filters. If high-density text or subtitle bars are detected, the clip is rejected so you only get 100% clean visual footage."
    },
    {
      q: "Which platforms are supported for 7-in-1 downloads?",
      a: "YouTube & Shorts, TikTok (watermark-free), Instagram Reels, Facebook Videos & Reels, Twitter / X, Pinterest Pins, and Reddit Videos."
    },
    {
      q: "Does ClipFlux charge recurring API fees per video?",
      a: "No! ClipFlux uses optimized direct CDN extraction and open-source vision filtering. That means 100% clean footage without any expensive third-party generation tokens or recurring API bills."
    },
    {
      q: "Can I download clips directly on mobile devices?",
      a: "Yes. ClipFlux is fully responsive and supports direct video and audio downloads to iOS (Safari Files / Photos) and Android devices."
    }
  ];

  return (
    <section className="py-14 sm:py-18 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white dark:text-white light:text-zinc-900">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
          Got questions about ClipFlux? We have answers.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-white dark:text-white light:text-zinc-900"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-600 leading-relaxed border-t border-zinc-800/40 dark:border-zinc-800/40 light:border-zinc-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
