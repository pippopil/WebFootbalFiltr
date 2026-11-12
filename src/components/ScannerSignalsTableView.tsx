import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignalAlert, Match, SignalOutcome, SportType, FilterRule, BacktestResult } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { resolveStrategyMetric } from '../algorithms';
import { runBacktest } from '../backtestEngine';
import { cleanPresetTitle } from '../utils/filterDefaults';
import { SignalsBankrollProgressChart } from './SignalsBankrollProgressChart';
import {
  Play,
  Square,
  Trash2,
  Search,
  Sparkles,
  Send,
  ExternalLink,
  Bot,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Target,
  ShieldCheck,
  Lock,
  BarChart3,
  BarChart2,
  TrendingDown,
  TrendingUp,
  Table,
  Zap,
  ArrowUpDown,
  Award,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Activity,
  Check,
} from 'lucide-react';

export interface ScannerSignalsTableViewProps {
  signals: SignalAlert[];
  matches?: Match[];
  filters?: FilterRule[];
  isMonitoringActive?: boolean;
  isPaidUser?: boolean;
  onToggleMonitoring?: () => void;
  onClearSignals: () => void;
  onOpenAIAnalyst?: (match: Match) => void;
  onSelectMatch?: (match: Match) => void;
  onNavigateToMatch?: (matchId: string, matchName: string, signal: SignalAlert) => void;
  onDeleteSignal?: (id: string) => void;
  onUpdateOutcome?: (signalId: string, outcome: SignalOutcome) => void;
  onExportCsv?: () => void;
  onOpenAuditLog?: () => void;
  onOpenFilterBacktest?: (filter: FilterRule) => void;
}

export const ScannerSignalsTableView: React.FC<ScannerSignalsTableViewProps> = ({
  signals,
  matches = [],
  filters = [],
  isMonitoringActive = true,
  isPaidUser = true,
  onToggleMonitoring,
  onClearSignals,
  onOpenAIAnalyst,
  onSelectMatch,
  onNavigateToMatch,
  onDeleteSignal,
  onUpdateOutcome,
  onExportCsv,
  onOpenAuditLog,
  onOpenFilterBacktest,
}) => {
  const { t } = useLanguage();
  const [activeTabMode, setActiveTabMode] = useState<'signals' | 'backtest_matrix' | 'bankroll_chart'>('signals');
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | '1H' | '2H' | 'HT'>('ALL');
  const [sportFilter, setSportFilter] = useState<SportType | 'ALL'>('ALL');
  const [filterNameChoice, setFilterNameChoice] = useState<string>('ALL');
  const [backtestSortBy, setBacktestSortBy] = useState<'winRate' | 'roi' | 'maxDrawdown' | 'totalSignals'>('winRate');
  const [backtestSearchQuery, setBacktestSearchQuery] = useState('');

  // Automated backtest calculations on historical dataset (1000+ matches)
  const backtestResultsMap = useMemo(() => {
    const map = new Map<string, BacktestResult>();
    if (!filters || filters.length === 0) return map;

    for (const f of filters) {
      try {
        const res = runBacktest(f);
        map.set(f.id, res);
        if (f.name) {
          map.set(f.name, res);
        }
      } catch (err) {
        console.warn('Error running automated backtest for filter', f.id, err);
      }
    }
    return map;
  }, [filters]);

  // Backtested filter items list sorted and filtered
  const backtestedFilterList = useMemo(() => {
    if (!filters || filters.length === 0) return [];

    const list = filters.map((f) => {
      const bt = backtestResultsMap.get(f.id) || backtestResultsMap.get(f.name);
      return {
        filter: f,
        bt: bt || {
          ruleId: f.id,
          ruleName: f.name,
          totalSignals: 0,
          wins: 0,
          losses: 0,
          refunds: 0,
          winRate: 0,
          totalProfit: 0,
          roi: 0,
          avgOdds: 1.85,
          maxDrawdown: 0,
          profitFactor: 0,
          equityCurve: [],
          signals: [],
        },
      };
    });

    let filtered = list;
    if (backtestSearchQuery.trim()) {
      const q = backtestSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.filter.name.toLowerCase().includes(q) ||
          (item.filter.targetMarket && item.filter.targetMarket.toLowerCase().includes(q)) ||
          (item.filter.category && item.filter.category.toLowerCase().includes(q))
      );
    }

    return filtered.sort((a, b) => {
      if (backtestSortBy === 'winRate') return b.bt.winRate - a.bt.winRate;
      if (backtestSortBy === 'roi') return b.bt.roi - a.bt.roi;
      if (backtestSortBy === 'maxDrawdown') return a.bt.maxDrawdown - b.bt.maxDrawdown; // lower drawdown is better
      if (backtestSortBy === 'totalSignals') return b.bt.totalSignals - a.bt.totalSignals;
      return 0;
    });
  }, [filters, backtestResultsMap, backtestSearchQuery, backtestSortBy]);

  // Summary statistics across all backtested filters
  const backtestStats = useMemo(() => {
    const valid = backtestedFilterList.map((x) => x.bt).filter((b) => b.totalSignals > 0);
    if (valid.length === 0) return null;

    const avgWinRate = Number((valid.reduce((acc, b) => acc + b.winRate, 0) / valid.length).toFixed(1));
    const avgRoi = Number((valid.reduce((acc, b) => acc + b.roi, 0) / valid.length).toFixed(1));
    const bestByWinRate = [...valid].sort((a, b) => b.winRate - a.winRate)[0];
    const bestByRoi = [...valid].sort((a, b) => b.roi - a.roi)[0];
    const lowestDrawdown = [...valid].sort((a, b) => a.maxDrawdown - b.maxDrawdown)[0];

    return {
      testedCount: valid.length,
      avgWinRate,
      avgRoi,
      bestByWinRate,
      bestByRoi,
      lowestDrawdown,
    };
  }, [backtestedFilterList]);

  // Distinct filter names for quick filtering
  const distinctFilterNames = Array.from(new Set(signals.map((s) => s.ruleName).filter(Boolean)));

  const filteredSignals = signals.filter((sig) => {
    // Sport match
    if (sportFilter !== 'ALL' && (sig.sport || 'football') !== sportFilter) {
      return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${sig.matchName} ${sig.league} ${sig.country} ${sig.ruleName} ${sig.marketSuggestion || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    // Period match
    if (periodFilter !== 'ALL') {
      if (periodFilter === '1H') {
        if (sig.period?.includes('2') || sig.minute > 45) return false;
      } else if (periodFilter === '2H') {
        if (!sig.period?.includes('2') && sig.minute <= 45) return false;
      } else if (periodFilter === 'HT') {
        if (sig.period !== 'Перерыв') return false;
      }
    }

    // Filter name match
    if (filterNameChoice !== 'ALL' && sig.ruleName !== filterNameChoice) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-3 font-sans">
      {/* Top View Mode Switcher: Signals Table vs Automated Backtest Matrix vs Bankroll Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTabMode('signals')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-2 ${
              activeTabMode === 'signals'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Таблица сигналов ({filteredSignals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('backtest_matrix')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-2 ${
              activeTabMode === 'backtest_matrix'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            <span>Авто-Бэктест фильтров ({filters.length})</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-200 border border-cyan-400/40 font-mono font-bold">
              WR • ROI • Просадка
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('bankroll_chart')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-2 ${
              activeTabMode === 'bankroll_chart'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>График доходности банкролла</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-200 border border-purple-400/40 font-mono font-bold">
              Recharts
            </span>
          </button>
        </div>

        {/* Quick Backtest Highlights in Top Bar */}
        {backtestStats && (
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Средний WR: <strong className="text-emerald-400">{backtestStats.avgWinRate}%</strong>
            </span>
            <span className="text-slate-400">
              Средний ROI: <strong className="text-cyan-400">+{backtestStats.avgRoi}%</strong>
            </span>
          </div>
        )}
      </div>

      {/* VIEW 1: RECHARTS REAL-TIME BANKROLL & DAILY PROFIT CHART */}
      {activeTabMode === 'bankroll_chart' && (
        <SignalsBankrollProgressChart signals={signals} initialBank={100000} flatStake={2000} />
      )}

      {/* VIEW 2: AUTOMATED BACKTEST MATRIX FOR ALL STRATEGIES/FILTERS */}
      {activeTabMode === 'backtest_matrix' && (
        <div className="space-y-3">
          {/* Backtest KPI Summary Cards */}
          {backtestStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Протестировано</div>
                <div className="text-lg font-black font-mono text-white mt-1">
                  {backtestStats.testedCount} <span className="text-xs text-slate-400 font-normal">стратегий</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">База 1000+ матчей</div>
              </div>

              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Средний WinRate</div>
                <div className="text-lg font-black font-mono text-emerald-300 mt-1">
                  {backtestStats.avgWinRate}%
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">По всем стратегиям</div>
              </div>

              <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Средний ROI</div>
                <div className="text-lg font-black font-mono text-cyan-300 mt-1">
                  +{backtestStats.avgRoi}%
                </div>
                <div className="text-[10px] text-cyan-400 mt-0.5">Прибыль с оборота</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Топ по WinRate</div>
                <div className="text-sm font-black text-amber-300 mt-1 truncate" title={backtestStats.bestByWinRate.ruleName}>
                  {cleanPresetTitle(backtestStats.bestByWinRate.ruleName)}
                </div>
                <div className="text-[10px] text-amber-400 font-mono font-bold mt-0.5">
                  WR: {backtestStats.bestByWinRate.winRate}% (ROI: +{backtestStats.bestByWinRate.roi}%)
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Топ по ROI</div>
                <div className="text-sm font-black text-purple-300 mt-1 truncate" title={backtestStats.bestByRoi.ruleName}>
                  {cleanPresetTitle(backtestStats.bestByRoi.ruleName)}
                </div>
                <div className="text-[10px] text-purple-400 font-mono font-bold mt-0.5">
                  ROI: +{backtestStats.bestByRoi.roi}% (WR: {backtestStats.bestByRoi.winRate}%)
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Мин. просадка</div>
                <div className="text-sm font-black text-emerald-300 mt-1 truncate" title={backtestStats.lowestDrawdown.ruleName}>
                  {cleanPresetTitle(backtestStats.lowestDrawdown.ruleName)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  -{backtestStats.lowestDrawdown.maxDrawdown.toFixed(1)} фл.
                </div>
              </div>
            </div>
          )}

          {/* Matrix Toolbar: Search & Sorting */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Сортировка:</span>
              <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setBacktestSortBy('winRate')}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    backtestSortBy === 'winRate' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WinRate (%)
                </button>
                <button
                  type="button"
                  onClick={() => setBacktestSortBy('roi')}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    backtestSortBy === 'roi' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ROI (%)
                </button>
                <button
                  type="button"
                  onClick={() => setBacktestSortBy('maxDrawdown')}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    backtestSortBy === 'maxDrawdown' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Мин. просадка
                </button>
                <button
                  type="button"
                  onClick={() => setBacktestSortBy('totalSignals')}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    backtestSortBy === 'totalSignals' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ставок в истории
                </button>
              </div>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск стратегии в бэктесте..."
                value={backtestSearchQuery}
                onChange={(e) => setBacktestSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Full Backtest Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto max-h-[700px] scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse min-w-[980px]">
                <thead className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
                    <th className="py-2.5 px-3 font-bold">Стратегия / Фильтр</th>
                    <th className="py-2.5 px-3 font-bold">Целевой рынок</th>
                    <th className="py-2.5 px-2.5 text-center font-bold">Сигналов</th>
                    <th className="py-2.5 px-3 text-center font-bold text-emerald-400">WinRate (%)</th>
                    <th className="py-2.5 px-3 text-center font-bold text-cyan-400">ROI (%)</th>
                    <th className="py-2.5 px-3 text-center font-bold text-amber-400">Макс. Просадка</th>
                    <th className="py-2.5 px-3 text-center font-bold">Профит (фл.)</th>
                    <th className="py-2.5 px-3 text-center font-bold">W / L / R</th>
                    <th className="py-2.5 px-3 text-center font-bold">Статус</th>
                    <th className="py-2.5 px-3 text-center font-bold">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {backtestedFilterList.map((item, idx) => {
                    const { filter, bt } = item;
                    const cleanName = cleanPresetTitle(filter.name);

                    return (
                      <tr key={filter.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white leading-tight">
                            {cleanName}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                              {filter.sport || 'football'}
                            </span>
                            <span>• {filter.category || 'LIVE'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 text-[11px] font-mono">
                          {filter.targetMarket || 'ТБ 0.5 во 2-м тайме'}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono font-bold text-white">
                          {bt.totalSignals}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] border ${
                                bt.winRate >= 75
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : bt.winRate >= 60
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : bt.winRate >= 50
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {bt.winRate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              bt.roi > 0
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : bt.roi < 0
                                ? 'text-rose-400 bg-rose-500/10'
                                : 'text-slate-400'
                            }`}
                          >
                            {bt.roi >= 0 ? `+${bt.roi}%` : `${bt.roi}%`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-[11px]">
                            -{bt.maxDrawdown.toFixed(1)} фл.
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          <span className={bt.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {bt.totalProfit >= 0 ? `+${bt.totalProfit}` : bt.totalProfit} фл.
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-300">
                          <span className="text-emerald-400 font-bold">{bt.wins}W</span> /{' '}
                          <span className="text-rose-400 font-bold">{bt.losses}L</span>
                          {bt.refunds > 0 && <span className="text-sky-400"> / {bt.refunds}R</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {bt.roi > 15 && bt.winRate >= 70 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              🔥 ТОП-доход
                            </span>
                          ) : bt.winRate >= 65 ? (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                              🛡️ Стабильная
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                              Умеренная
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenFilterBacktest) {
                                  onOpenFilterBacktest(filter);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                              title="Открыть детальный график кривой доходности и все 1000 матчей"
                            >
                              <BarChart3 className="h-3 w-3" />
                              <span>Бэктест</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFilterNameChoice(filter.name);
                                setActiveTabMode('signals');
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Показать только сигналы этой стратегии в таблице"
                            >
                              <Filter className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MAIN HIGH-DENSITY SIGNALS TABLE WITH AUTOMATED BACKTEST METRICS COLUMN */}
      {activeTabMode === 'signals' && (
        <>
          {/* Top Action & Status Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              {/* STOP / START Button */}
              <button
                onClick={() => onToggleMonitoring && onToggleMonitoring()}
                className={`px-5 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 shadow-md ${
                  isMonitoringActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40 animate-pulse-slow'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                }`}
              >
                {isMonitoringActive ? (
                  <>
                    <Square className="h-4 w-4 fill-white" />
                    <span>{t('scannerStopBtn')}</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>{t('scannerStartBtn')}</span>
                  </>
                )}
              </button>

              {/* CLEAR TABLE Button */}
              <button
                onClick={() => {
                  if (signals.length === 0) return;
                  onClearSignals();
                }}
                disabled={signals.length === 0}
                className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95"
                title="Clear all recorded signals"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>{t('scannerClearBtn')}</span>
              </button>

              {onExportCsv && (
                <button
                  onClick={onExportCsv}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 border border-slate-700"
                  title="CSV"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>CSV</span>
                </button>
              )}

              {onOpenAuditLog && (
                <button
                  onClick={onOpenAuditLog}
                  className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  title="Журнал аудита выполнения стратегий (голы, угловые, карты в момент сигнала и по завершению)"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>Аудит</span>
                </button>
              )}

              {/* Quick switch to Backtest Matrix */}
              <button
                type="button"
                onClick={() => setActiveTabMode('backtest_matrix')}
                className="px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                title="Открыть матрицу авто-бэктеста фильтров (WinRate, ROI, Просадка)"
              >
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                <span>Бэктест фильтров</span>
              </button>

              {/* Live signals counter with auto-cleanup indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-400 font-medium">{t('scannerSignalsCount')}:</span>
                <span className="font-bold font-mono text-emerald-400">{signals.length}</span>
                <span className="text-[10px] text-slate-500 font-mono">/ 200</span>
              </div>
            </div>

            {/* Search and Period Filter */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sport selector */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
                {[
                  { id: 'ALL', label: t('scannerAllSports') },
                  { id: 'football', label: '⚽' },
                  { id: 'hockey', label: '🏒' },
                  { id: 'basketball', label: '🏀' },
                  { id: 'tennis', label: '🎾' },
                  { id: 'volleyball', label: '🏐' },
                  { id: 'table_tennis', label: '🏓' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSportFilter(item.id as any)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      sportFilter === item.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title={item.id}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Period selector */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
                {[
                  { id: 'ALL', label: t('scannerPeriodAll') },
                  { id: '1H', label: t('scannerPeriod1H') },
                  { id: '2H', label: t('scannerPeriod2H') },
                  { id: 'HT', label: t('scannerPeriodHT') },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPeriodFilter(item.id as any)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      periodFilter === item.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Filter name dropdown */}
              {distinctFilterNames.length > 0 && (
                <select
                  value={filterNameChoice}
                  onChange={(e) => setFilterNameChoice(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 max-w-[150px] truncate"
                >
                  <option value="ALL">{t('catAll')}</option>
                  {distinctFilterNames.map((fn) => (
                    <option key={fn} value={fn}>
                      {fn}
                    </option>
                  ))}
                </select>
              )}

              {/* Search box */}
              <div className="relative min-w-[190px]">
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* High-density Signals Table with Automated Backtest Results */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto max-h-[720px] scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse min-w-[1240px]">
                <thead className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-2.5 text-center font-bold w-12">#</th>
                    <th className="py-2.5 px-3 font-bold">{t('colFilter')}</th>
                    <th className="py-2.5 px-3 font-bold text-center text-cyan-400 whitespace-nowrap">
                      Авто-Бэктест (WR / ROI / Просадка)
                    </th>
                    <th className="py-2.5 px-3 font-bold">{t('colCountry')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('colLeague')}</th>
                    <th className="py-2.5 px-2.5 text-center font-bold">{t('colPeriod')}</th>
                    <th className="py-2.5 px-2 text-center font-bold">{t('colTime')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('colHome')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('colAway')}</th>
                    <th className="py-2.5 px-2 text-center font-bold text-emerald-400">К1</th>
                    <th className="py-2.5 px-2 text-center font-bold text-blue-400">К2</th>
                    <th className="py-2.5 px-2 text-center font-bold">{t('colAttacks')}</th>
                    <th className="py-2.5 px-2 text-center font-bold">{t('colDangAttacks')}</th>
                    <th className="py-2.5 px-2 text-center font-bold">{t('colShots')}</th>
                    <th className="py-2.5 px-2 text-center font-bold">{t('colCorners')}</th>
                    <th className="py-2.5 px-2 text-center font-bold">{t('colCards')}</th>
                    <th className="py-2.5 px-3 font-bold text-amber-400">{t('colOutcome')}</th>
                    <th className="py-2.5 px-3 font-bold text-emerald-400 whitespace-nowrap">
                      {t('colStrategyMetricResult')}
                    </th>
                    <th className="py-2.5 px-3 font-bold text-center text-emerald-400">{t('colBetStatus')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('colTelegram')}</th>
                    <th className="py-2.5 px-2.5 text-center font-bold">{t('colLoggedAt')}</th>
                    <th className="py-2.5 px-2.5 text-center font-bold">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredSignals.length === 0 ? (
                    <tr>
                      <td colSpan={22} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Filter className="h-7 w-7 text-slate-600" />
                          <span>{t('noSignalsRecorded')}</span>
                          <span className="text-[11px] text-slate-600">
                            {isMonitoringActive ? t('scannerPromptActive') : t('scannerPromptStopped')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence initial={false}>
                      {filteredSignals.map((sig, idx) => {
                        const matchObj =
                          matches.find((m) => m.id === sig.matchId || sig.matchName.includes(m.homeTeam)) ||
                          matches[0];

                        const homeTeam = sig.matchName.split(' vs ')[0] || 'Хозяева';
                        const awayTeam = sig.matchName.split(' vs ')[1] || 'Гости';

                        const scores = sig.score.split(':');
                        const homeScore = sig.statsSnapshot?.homeScore ?? (scores[0] || '0');
                        const awayScore = sig.statsSnapshot?.awayScore ?? (scores[1] || '0');

                        const attacks = sig.statsSnapshot?.attacks ?? matchObj?.stats.attacks ?? [0, 0];
                        const dangAttacks =
                          sig.statsSnapshot?.dangerousAttacks ?? matchObj?.stats.dangerousAttacks ?? [0, 0];
                        const sot = sig.statsSnapshot?.shotsOnTarget ?? matchObj?.stats.shotsOnTarget ?? [0, 0];
                        const corners = sig.statsSnapshot?.corners ?? matchObj?.stats.corners ?? [0, 0];
                        const yc = sig.statsSnapshot?.yellowCards ?? matchObj?.stats.yellowCards ?? [0, 0];
                        const rc = sig.statsSnapshot?.redCards ?? matchObj?.stats.redCards ?? [0, 0];

                        const periodLabel =
                          sig.period ||
                          (sig.minute <= 45
                            ? '1-й тайм'
                            : sig.minute <= 48 && sig.minute >= 45
                            ? 'Перерыв'
                            : '2-й тайм');

                        const signalIndex = signals.length - idx;

                        const navigateToThisMatch = () => {
                          if (onNavigateToMatch) {
                            onNavigateToMatch(sig.matchId, sig.matchName, sig);
                          } else if (onSelectMatch && matchObj) {
                            onSelectMatch(matchObj);
                          }
                        };

                        const bt = (sig.ruleId ? backtestResultsMap.get(sig.ruleId) : undefined) || (sig.ruleName ? backtestResultsMap.get(sig.ruleName) : undefined);

                        return (
                          <motion.tr
                            key={sig.id}
                            layout="position"
                            initial={{ opacity: 0, y: -16, backgroundColor: 'rgba(16, 185, 129, 0.28)' }}
                            animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(16, 185, 129, 0)' }}
                            exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                            transition={{
                              type: 'spring',
                              stiffness: 420,
                              damping: 32,
                              mass: 0.8,
                              backgroundColor: { duration: 2.5, ease: 'easeOut' },
                            }}
                            className="hover:bg-slate-800/60 transition cursor-pointer group"
                            onClick={navigateToThisMatch}
                            title="Нажмите на строку для мгновенного перехода к данному матчу"
                          >
                            {/* # Number */}
                            <td className="py-2.5 px-2.5 text-center font-mono text-[11px] text-slate-400 group-hover:text-white">
                              <div className="flex items-center justify-center gap-1">
                                {idx === 0 && (
                                  <span className="relative flex h-2 w-2" title="Новейший сигнал">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                )}
                                <span>{signalIndex}</span>
                              </div>
                            </td>

                            {/* Filter Name */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-white group-hover:text-emerald-400 transition">
                                  {sig.ruleName || 'NoName'}
                                </span>
                                {sig.isCombo && (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-0.5"
                                    title="⚡ Супер-комбо: синхронное совпадение нескольких стратегий"
                                  >
                                    <span>⚡</span>
                                    <span>КОМБО x{sig.comboCount || 2}</span>
                                  </span>
                                )}
                                {sig.isComboLockedForPlan && (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-0.5"
                                    title="🔒 Супер-комбо синергия доступна в тарифе VIP"
                                  >
                                    <span>🔒 VIP</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Automated Backtest (WR / ROI / Drawdown) */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              {bt && bt.totalSignals > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matchedFilter = filters.find((f) => f.id === sig.ruleId || f.name === sig.ruleName);
                                    if (matchedFilter && onOpenFilterBacktest) {
                                      onOpenFilterBacktest(matchedFilter);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800/80 transition group/bt shadow-sm text-left"
                                  title={`Авто-Бэктест стратегии на 1000 матчах:\n• WinRate: ${bt.winRate}%\n• ROI: ${bt.roi >= 0 ? '+' : ''}${bt.roi}%\n• Просадка: -${bt.maxDrawdown.toFixed(1)} фл.\n• Ставок в истории: ${bt.totalSignals}\nКликните для глубокого анализа`}
                                >
                                  <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                                    WR {bt.winRate}%
                                  </span>
                                  <span
                                    className={`font-mono text-[10px] font-bold px-1 py-0.2 rounded border ${
                                      bt.roi >= 0
                                        ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20'
                                        : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                    }`}
                                  >
                                    ROI {bt.roi >= 0 ? `+${bt.roi}%` : `${bt.roi}%`}
                                  </span>
                                  <span className="font-mono text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                                    ДД -{bt.maxDrawdown.toFixed(1)}фл
                                  </span>
                                  <ExternalLink className="h-2.5 w-2.5 text-slate-500 group-hover/bt:text-cyan-400" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">—</span>
                              )}
                            </td>

                            {/* Country */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                              {sig.country}
                            </td>

                            {/* League */}
                            <td className="py-2.5 px-3 max-w-[170px] truncate text-slate-300" title={sig.league}>
                              {sig.league}
                            </td>

                            {/* Period */}
                            <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  periodLabel.includes('1')
                                    ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                                    : periodLabel.includes('2')
                                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                }`}
                              >
                                {periodLabel}
                              </span>
                            </td>

                            {/* Time / Minute */}
                            <td className="py-2.5 px-2 text-center whitespace-nowrap font-mono font-bold text-emerald-400">
                              {sig.minute}'
                            </td>

                            {/* Home team */}
                            <td className="py-2.5 px-3 max-w-[140px] truncate font-semibold text-white" title={homeTeam}>
                              {homeTeam}
                            </td>

                            {/* Away team */}
                            <td className="py-2.5 px-3 max-w-[140px] truncate font-semibold text-white" title={awayTeam}>
                              {awayTeam}
                            </td>

                            {/* Score K1 */}
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400 text-sm">
                              {homeScore}
                            </td>

                            {/* Score K2 */}
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-400 text-sm">
                              {awayScore}
                            </td>

                            {/* Attacks */}
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {attacks[0]}:{attacks[1]}
                            </td>

                            {/* Dangerous Attacks */}
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] text-amber-300 font-semibold whitespace-nowrap">
                              {dangAttacks[0]}:{dangAttacks[1]}
                            </td>

                            {/* Shots on Target */}
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] text-cyan-300 font-semibold whitespace-nowrap">
                              {sot[0]}:{sot[1]}
                            </td>

                            {/* Corners */}
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] text-purple-300 font-semibold whitespace-nowrap">
                              {corners[0]}:{corners[1]}
                            </td>

                            {/* Cards (Yellow / Red) */}
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] whitespace-nowrap">
                              <span className="text-yellow-400 font-bold">{yc[0] + yc[1]}</span>
                              {(rc[0] > 0 || rc[1] > 0) && (
                                <span className="text-rose-500 font-bold ml-1">[{rc[0] + rc[1]}]</span>
                              )}
                            </td>

                            {/* Outcome Selector */}
                            <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={sig.outcome || 'PENDING'}
                                onChange={(e) => {
                                  if (onUpdateOutcome) {
                                    onUpdateOutcome(sig.id, e.target.value as SignalOutcome);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold border focus:outline-none transition ${
                                  sig.outcome === 'WIN'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : sig.outcome === 'LOSS'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : sig.outcome === 'REFUND'
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}
                              >
                                <option value="PENDING">⏳ В игре</option>
                                <option value="WIN">✅ Проход (WIN)</option>
                                <option value="LOSS">❌ Минус (LOSS)</option>
                                <option value="REFUND">🔄 Возврат (REFUND)</option>
                              </select>
                            </td>

                            {/* Strategy Metric Dynamic Resolution (Goals, Corners, Yellow Cards) */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {(() => {
                                const currentScore: [number, number] = matchObj?.score || [0, 0];
                                const resolved = resolveStrategyMetric(sig, currentScore, matchObj?.stats);
                                return (
                                  <div className="flex items-center gap-1.5" title={resolved.label || 'Метрика исхода'}>
                                    <span className="text-xs">{resolved.icon}</span>
                                    <span className="font-mono font-bold text-white text-[11px]">
                                      {resolved.finalValueText || resolved.initialValueText}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      ({resolved.initialValueText} на {sig.minute}')
                                    </span>
                                    {typeof resolved.delta === 'number' && resolved.delta > 0 && (
                                      <span className="text-[10px] px-1 py-0.2 rounded font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        +{resolved.delta}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Bet Status Badge (WIN / LOSS / PENDING) */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {sig.outcome === 'WIN' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>WIN</span>
                                </span>
                              ) : sig.outcome === 'LOSS' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                  <XCircle className="h-3 w-3" />
                                  <span>LOSS</span>
                                </span>
                              ) : sig.outcome === 'REFUND' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold">
                                  <span>🔄 REFUND</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                  <span>⏳ В игре</span>
                                </span>
                              )}
                            </td>

                            {/* Telegram Status */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {sig.telegramMessageId ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-mono">
                                  <Bot className="h-3 w-3 text-cyan-400 shrink-0" />
                                  <span>#{sig.telegramMessageId}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                                  <Send className="h-3 w-3 text-slate-600 shrink-0" />
                                  <span>Локальный</span>
                                </span>
                              )}
                            </td>

                            {/* Timestamp */}
                            <td className="py-2.5 px-2.5 text-center font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {sig.timestamp}
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                {onOpenAIAnalyst && matchObj && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenAIAnalyst(matchObj)}
                                    className={`p-1 rounded border transition ${
                                      !isPaidUser
                                        ? 'bg-slate-900 text-amber-300 border-amber-500/40 hover:bg-slate-800'
                                        : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/30'
                                    }`}
                                    title={!isPaidUser ? '🔒 Ai-аналитика (Доступна в PRO / VIP)' : 'Открыть AI-анализ этого матча'}
                                  >
                                    {!isPaidUser ? (
                                      <Lock className="h-3 w-3 text-amber-400" />
                                    ) : (
                                      <Sparkles className="h-3 w-3 text-indigo-400" />
                                    )}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={navigateToThisMatch}
                                  className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                                  title="Перейти к данному матчу"
                                >
                                  <ExternalLink className="h-3 w-3 text-emerald-400" />
                                  <span className="hidden sm:inline">К матчу</span>
                                </button>
                                {onDeleteSignal && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteSignal(sig.id)}
                                    className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                                    title="Удалить запись сигнала"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
