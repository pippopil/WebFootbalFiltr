import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Gift, Sparkles, X, ShieldAlert, Zap } from 'lucide-react';
import { AdBannerItem } from '../types';

interface AdBannerProps {
  ad: AdBannerItem;
  variant?: 'top_ribbon' | 'in_feed' | 'sidebar';
  onDismiss?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ ad, variant = 'top_ribbon', onDismiss }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ad.promoCode) return;
    navigator.clipboard.writeText(ad.promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === 'top_ribbon') {
    return (
      <div
        id={`ad-ribbon-${ad.id}`}
        className="w-full bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/30 border-b border-amber-500/25 px-4 py-2 text-xs relative z-40"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider uppercase border border-amber-500/30 flex items-center gap-1 shrink-0">
              <Sparkles className="h-2.5 w-2.5" />
              {ad.badge}
            </span>
            <span className="font-semibold text-slate-100 truncate">
              {ad.title}
            </span>
            <span className="text-slate-400 hidden md:inline truncate">
              — {ad.description}
            </span>

            {ad.bonusText && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 shrink-0">
                {ad.bonusText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
            {ad.promoCode && (
              <button
                onClick={handleCopyCode}
                title="Нажмите, чтобы скопировать промокод"
                className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-mono font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-300">Скопирован!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-slate-400" />
                    <span>{ad.promoCode}</span>
                  </>
                )}
              </button>
            )}

            <a
              href={ad.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95"
            >
              <span>{ad.ctaText}</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded transition"
                title="Скрыть рекламу"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'in_feed') {
    return (
      <div
        id={`ad-feed-${ad.id}`}
        className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 p-4 relative overflow-hidden shadow-lg shadow-blue-950/30 transition hover:border-blue-500/50 group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] tracking-wide uppercase border border-blue-500/30 flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 text-blue-400" />
                {ad.badge}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {ad.partnerName} • Реклама 18+
              </span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-blue-200 transition">
              {ad.title}
            </h4>
            <p className="text-xs text-slate-400 line-clamp-2">
              {ad.description}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            {ad.bonusText && (
              <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                {ad.bonusText}
              </span>
            )}
            <div className="flex items-center gap-2">
              {ad.promoCode && (
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 flex items-center gap-1 transition active:scale-95"
                  title="Скопировать промокод"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-400" />}
                  <span>{ad.promoCode}</span>
                </button>
              )}
              <a
                href={ad.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-900/40 transition active:scale-95"
              >
                <span>{ad.ctaText}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar variant
  return (
    <div
      id={`ad-sidebar-${ad.id}`}
      className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 p-3.5 space-y-2 relative"
    >
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
          {ad.badge}
        </span>
        <span>{ad.partnerName}</span>
      </div>

      <div className="text-xs font-bold text-slate-100">
        {ad.title}
      </div>
      <p className="text-[11px] text-slate-400">
        {ad.description}
      </p>

      <div className="flex items-center justify-between pt-1">
        {ad.promoCode ? (
          <button
            onClick={handleCopyCode}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 hover:text-white"
          >
            {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
            <span>{ad.promoCode}</span>
          </button>
        ) : (
          <span className="text-[11px] text-emerald-400 font-bold">{ad.bonusText}</span>
        )}

        <a
          href={ad.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          <span>{ad.ctaText}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
