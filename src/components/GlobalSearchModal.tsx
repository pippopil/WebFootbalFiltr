import React, { useState, useEffect } from 'react';
import { Search, X, Zap, Activity, ArrowRight, Shield } from 'lucide-react';
import { Match, FilterRule } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  filters: FilterRule[];
  onSelectMatch: (matchId: string) => void;
  onSelectFilter: (filterId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  matches,
  filters,
  onSelectMatch,
  onSelectFilter,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchingMatches = trimmed
    ? matches.filter(
        (m) =>
          m.homeTeam.toLowerCase().includes(trimmed) ||
          m.awayTeam.toLowerCase().includes(trimmed) ||
          m.league.toLowerCase().includes(trimmed) ||
          m.country.toLowerCase().includes(trimmed)
      ).slice(0, 6)
    : matches.slice(0, 4);

  const matchingFilters = trimmed
    ? filters.filter(
        (f) =>
          f.name.toLowerCase().includes(trimmed) ||
          (f.description && f.description.toLowerCase().includes(trimmed)) ||
          (f.targetMarket && f.targetMarket.toLowerCase().includes(trimmed))
      ).slice(0, 6)
    : filters.filter((f) => f.enabled).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="h-5 w-5 text-emerald-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Глобальный поиск: команды, лиги, стратегии, рынки..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg mr-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-5">
          {/* Matches section */}
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Лайв-матчи ({matchingMatches.length})</span>
            </div>
            {matchingMatches.length === 0 ? (
              <div className="text-xs text-slate-500 italic px-2">Матчи не найдены</div>
            ) : (
              <div className="space-y-1.5">
                {matchingMatches.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMatch(m.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-emerald-500/10 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center gap-2">
                        <span>{m.countryCode}</span>
                        <span>{m.homeTeam} vs {m.awayTeam}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          {m.score[0]}:{m.score[1]} ({m.minute}')
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {m.league} • Оп. атаки: {m.stats?.dangerousAttacks?.[0] ?? 0}-{m.stats?.dangerousAttacks?.[1] ?? 0}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filters section */}
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Стратегии и фильтры ({matchingFilters.length})</span>
            </div>
            {matchingFilters.length === 0 ? (
              <div className="text-xs text-slate-500 italic px-2">Стратегии не найдены</div>
            ) : (
              <div className="space-y-1.5">
                {matchingFilters.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      onSelectFilter(f.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-amber-500/10 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center gap-2">
                        <span>{f.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${f.enabled ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                          {f.enabled ? 'АКТИВЕН' : 'ПАУЗА'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        Рынок: {f.targetMarket || 'ТБ'} • {f.description}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↑↓</kbd> Навигация</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↵</kbd> Выбрать</span>
          </div>
          <span>Нажмите <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">ESC</kbd> для закрытия</span>
        </div>
      </div>
    </div>
  );
};
