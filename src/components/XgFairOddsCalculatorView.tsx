import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Calculator,
  Link2,
  Check,
  ArrowLeft,
  ArrowRight,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Sliders,
  Radio,
  RotateCcw,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Match } from '../types';
import {
  XgCalculatorInput,
  RedCardStatus,
  XG_CALCULATOR_PRESETS,
  calculateXgDeficitFairOdds,
  rankLiveMatchesForXgCalculator,
} from '../utils/xgCalculator';
import { XgDeficitProgressIndicator } from './XgDeficitProgressIndicator';

interface XgFairOddsCalculatorViewProps {
  matches: Match[];
  isAuthenticated: boolean;
  onNavigateToScanner: () => void;
  onActivateStrategyInScanner: () => void;
}

type InputMode = 'auto' | 'manual';
type LiveRadarFilter = 'all' | 'actionable' | 'window';

export const XgFairOddsCalculatorView: React.FC<XgFairOddsCalculatorViewProps> = ({
  matches,
  isAuthenticated,
  onNavigateToScanner,
  onActivateStrategyInScanner,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('auto');
  const [radarFilter, setRadarFilter] = useState<LiveRadarFilter>('all');
  const [radarSearch, setRadarSearch] = useState<string>('');
  const [pinnedMatchId, setPinnedMatchId] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<XgCalculatorInput>(XG_CALCULATOR_PRESETS[0].input);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(XG_CALCULATOR_PRESETS[0].id);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedPost, setCopiedPost] = useState<boolean>(false);

  // Automatically evaluate and rank all live football matches on every feed update
  const rankedLiveMatches = useMemo(() => rankLiveMatchesForXgCalculator(matches), [matches]);

  const actionableCount = useMemo(
    () =>
      rankedLiveMatches.filter(
        (item) => item.result.verdict === 'SIGNAL_VALUE' || item.result.verdict === 'WATCHLIST'
      ).length,
    [rankedLiveMatches]
  );

  const windowCount = useMemo(
    () =>
      rankedLiveMatches.filter((item) => item.match.minute >= 70 && item.match.minute <= 76).length,
    [rankedLiveMatches]
  );

  // Filter radar list for display
  const filteredRadarMatches = useMemo(() => {
    const query = radarSearch.trim().toLowerCase();
    return rankedLiveMatches.filter((item) => {
      if (radarFilter === 'actionable') {
        if (item.result.verdict !== 'SIGNAL_VALUE' && item.result.verdict !== 'WATCHLIST') {
          return false;
        }
      } else if (radarFilter === 'window') {
        if (item.match.minute < 70 || item.match.minute > 76) {
          return false;
        }
      }
      if (!query) return true;
      const haystack = `${item.match.homeTeam} ${item.match.awayTeam} ${item.match.league} ${item.match.country}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [rankedLiveMatches, radarFilter, radarSearch]);

  // If the pinned match finished or disappeared from live feed, automatically release pin back to #1
  useEffect(() => {
    if (pinnedMatchId && !rankedLiveMatches.some((item) => item.match.id === pinnedMatchId)) {
      setPinnedMatchId(null);
    }
  }, [pinnedMatchId, rankedLiveMatches]);

  // Active auto-selected live match (either user-clicked live match or automatic #1 top ranked)
  const activeAutoEntry = useMemo(() => {
    if (rankedLiveMatches.length === 0) return null;
    if (pinnedMatchId) {
      const found = rankedLiveMatches.find((item) => item.match.id === pinnedMatchId);
      if (found) return found;
    }
    return rankedLiveMatches[0];
  }, [rankedLiveMatches, pinnedMatchId]);

  const isAutoLiveActive = inputMode === 'auto' && activeAutoEntry !== null;

  const activeInput: XgCalculatorInput = isAutoLiveActive
    ? activeAutoEntry.input
    : manualInput;

  const result = useMemo(
    () =>
      isAutoLiveActive
        ? activeAutoEntry.result
        : calculateXgDeficitFairOdds(manualInput),
    [isAutoLiveActive, activeAutoEntry, manualInput]
  );

  const chartData = useMemo(
    () => [
      {
        name: 'Наша модель (xG + Пуассон)',
        probability: result.goalProbabilityPct,
        odds: result.fairOdds,
        color: '#10b981',
      },
      {
        name: 'Линия букмекера (БК)',
        probability: result.bookieImpliedPct,
        odds: Number(activeInput.bookieOdds.toFixed(2)),
        color: result.valueEdgePct >= 12 ? '#f59e0b' : '#64748b',
      },
    ],
    [result, activeInput.bookieOdds]
  );

  const updateManualField = <K extends keyof XgCalculatorInput>(
    key: K,
    value: XgCalculatorInput[K]
  ) => {
    setSelectedPresetId('');
    setInputMode('manual');
    setManualInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = XG_CALCULATOR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setInputMode('manual');
    setSelectedPresetId(preset.id);
    setManualInput({ ...preset.input });
  };

  const handleSelectLiveMatch = (matchId: string) => {
    setInputMode('auto');
    setPinnedMatchId(matchId);
  };

  const handleReturnToAutoTop = () => {
    setInputMode('auto');
    setPinnedMatchId(null);
  };

  const handleOpenManualWithCurrent = () => {
    setManualInput({ ...activeInput });
    setSelectedPresetId('');
    setInputMode('manual');
  };

  const handleCopyDirectLink = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/?tool=xg-calculator`
        : '/?tool=xg-calculator';
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    } catch {
      setCopiedLink(false);
    }
  };

  const handleCopyPostText = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/?tool=xg-calculator`
        : '';
    const fullText = shareUrl
      ? `${result.shareablePostText}\n\n🔗 Проверить матч в авто-калькуляторе xG: ${shareUrl}`
      : result.shareablePostText;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedPost(true);
      setTimeout(() => setCopiedPost(false), 2400);
    } catch {
      setCopiedPost(false);
    }
  };

  const redCardLabel =
    activeInput.redCardStatus === 'attacking'
      ? 'КК у атаки'
      : activeInput.redCardStatus === 'defending'
      ? 'КК у защиты'
      : 'Нет КК';

  return (
    <div id="xg-fair-odds-calculator" className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <Calculator className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Авто-калькулятор стратегии «xG-Долг и Регрессия Давления 70&apos;–76&apos;»</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium">
                {rankedLiveMatches.length > 0
                  ? `Авто-ввод из Live (${rankedLiveMatches.length} матчей)`
                  : 'Без регистрации'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Калькулятор xG-Перекоса и Справедливого Кэфа
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Все показатели текущих матчей подгружаются и пересчитываются автоматически по модели Пуассона. В приоритете выводятся игры с максимальным xG-долгом и перевесом над линией БК.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyDirectLink}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Ссылка скопирована</span>
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>Скопировать ссылку</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onNavigateToScanner}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{isAuthenticated ? 'Вернуться в Live-сканер' : 'Открыть Live-сканер'}</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setInputMode('auto')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                inputMode === 'auto'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Авто-Live ({rankedLiveMatches.length})</span>
            </button>
            <button
              type="button"
              onClick={handleOpenManualWithCurrent}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                inputMode === 'manual'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Ручная проверка и кейсы</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono tabular-nums">
            <span>Live-матчей: {rankedLiveMatches.length}</span>
            <span aria-hidden="true">·</span>
            <span className={actionableCount > 0 ? 'text-emerald-400 font-semibold' : ''}>
              Сигналы / радар: {actionableCount}
            </span>
            <span aria-hidden="true">·</span>
            <span>В окне 70&apos;–76&apos;: {windowCount}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Auto-Live Radar / Optional Manual Controls + Live FairOdds Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          {inputMode === 'auto' ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-400" />
                  <span>Авто-радар Live-матчей</span>
                </h2>
                {pinnedMatchId && (
                  <button
                    type="button"
                    onClick={handleReturnToAutoTop}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Автовыбор #1</span>
                  </button>
                )}
              </div>

              {/* Filter Tabs & Search */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-[11px]">
                  <button
                    type="button"
                    onClick={() => setRadarFilter('all')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer truncate ${
                      radarFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Все ({rankedLiveMatches.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRadarFilter('actionable')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer truncate ${
                      radarFilter === 'actionable'
                        ? 'bg-emerald-600/25 text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Value ({actionableCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRadarFilter('window')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer truncate ${
                      radarFilter === 'window'
                        ? 'bg-sky-600/25 text-sky-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    70&apos;–76&apos; ({windowCount})
                  </button>
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={radarSearch}
                    onChange={(e) => setRadarSearch(e.target.value)}
                    placeholder="Поиск команды или лиги..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Ranked Live Match List */}
              {filteredRadarMatches.length > 0 ? (
                <div className="divide-y divide-slate-800/80 max-h-[430px] overflow-y-auto pr-1">
                  {filteredRadarMatches.map((entry) => {
                    const isSelected = activeAutoEntry?.match.id === entry.match.id;
                    const verdictLabel =
                      entry.result.verdict === 'SIGNAL_VALUE'
                        ? `ВХОД +${entry.result.valueEdgePct}%`
                        : entry.result.verdict === 'WATCHLIST'
                        ? 'Ждать кэф'
                        : `${entry.result.passedRulesCount}/5`;

                    return (
                      <button
                        key={entry.match.id}
                        type="button"
                        onClick={() => handleSelectLiveMatch(entry.match.id)}
                        className={`w-full text-left py-2.5 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-500/12 text-white'
                            : 'hover:bg-slate-800/60 text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 text-xs font-semibold truncate">
                            <span className="font-mono tabular-nums text-emerald-400 shrink-0">
                              {entry.match.minute}&apos;
                            </span>
                            <span className="truncate">
                              {entry.match.homeTeam} — {entry.match.awayTeam}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate font-mono tabular-nums">
                            <span className="truncate font-sans">{entry.match.league}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              xG {entry.input.homeXg.toFixed(2)}:{entry.input.awayXg.toFixed(2)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              долг {entry.result.totalDeficit >= 0 ? '+' : ''}
                              {entry.result.totalDeficit}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-0.5 font-mono tabular-nums">
                          <div className="text-xs font-bold text-white">
                            {entry.input.homeGoals}:{entry.input.awayGoals}
                          </div>
                          <div
                            className={`text-[11px] font-semibold ${
                              entry.result.verdict === 'SIGNAL_VALUE'
                                ? 'text-emerald-400'
                                : entry.result.verdict === 'WATCHLIST'
                                ? 'text-amber-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {verdictLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center space-y-3 border-t border-slate-800">
                  <p className="text-xs text-slate-400">
                    {rankedLiveMatches.length === 0
                      ? 'Сейчас нет активных Live-матчей по футболу. Показан эталонный расчёт стратегии; как только появятся матчи, данные подтянутся автоматически.'
                      : 'По выбранному фильтру сейчас нет матчей.'}
                  </p>
                  {rankedLiveMatches.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRadarFilter('all');
                        setRadarSearch('');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
                    >
                      Показать все Live-матчи
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setInputMode('manual')}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
                    >
                      Открыть примеры и ручной ввод
                    </button>
                  )}
                </div>
              )}

              {/* Auto-Extracted Telemetry Summary for Selected Match */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-200 truncate">
                    {activeInput.matchLabel || 'Активный матч'}
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenManualWithCurrent}
                    className="text-sky-400 hover:text-sky-300 font-medium shrink-0 cursor-pointer"
                  >
                    Свой кэф БК →
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-x-3 gap-y-2.5 text-xs font-mono tabular-nums">
                  <div>
                    <div className="text-[11px] font-sans text-slate-500">Минута / Счёт</div>
                    <div className="text-slate-100 font-semibold">
                      {activeInput.minute}&apos; · {activeInput.homeGoals}:{activeInput.awayGoals}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans text-slate-500">Live xG</div>
                    <div className="text-emerald-400 font-semibold">
                      {activeInput.homeXg.toFixed(2)} : {activeInput.awayXg.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans text-slate-500">Кэф БК (авто)</div>
                    <div className="text-amber-300 font-semibold">
                      {activeInput.bookieOdds.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans text-slate-500">В створ</div>
                    <div className="text-slate-200">
                      {activeInput.homeShotsOnTarget} : {activeInput.awayShotsOnTarget}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans text-slate-500">Оп. атаки / 15м</div>
                    <div className="text-slate-200">{activeInput.dangerousAttacks15m}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans text-slate-500">Удаления</div>
                    <div className="text-slate-200 font-sans">{redCardLabel}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-emerald-400" />
                  <span>Ручная корректировка</span>
                </h2>
                <div className="flex items-center gap-3">
                  {rankedLiveMatches.length > 0 && (
                    <button
                      type="button"
                      onClick={handleReturnToAutoTop}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <Radio className="h-3 w-3" />
                      <span>Авто-Live</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(XG_CALCULATOR_PRESETS[0].id)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Сбросить</span>
                  </button>
                </div>
              </div>

              {/* Educational Presets */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-400">Эталонные кейсы стратегии:</div>
                <div className="flex flex-wrap gap-1.5">
                  {XG_CALCULATOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                        selectedPresetId === preset.id
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Name */}
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-400">Название матча (для отчёта)</label>
                <input
                  type="text"
                  value={manualInput.matchLabel || ''}
                  onChange={(e) => updateManualField('matchLabel', e.target.value)}
                  placeholder="Например: Бавария — Лейпциг"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Minute Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Минута матча</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-400 text-sm">
                    {manualInput.minute}&apos; мин
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={90}
                  value={manualInput.minute}
                  onChange={(e) => updateManualField('minute', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                  <span>1&apos;</span>
                  <span className="text-emerald-400/90">Рабочее окно: 70&apos;–76&apos;</span>
                  <span>90&apos;</span>
                </div>
              </div>

              {/* Score */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400">Голы Хозяев (К1)</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={manualInput.homeGoals}
                    onChange={(e) =>
                      updateManualField('homeGoals', Math.max(0, Number(e.target.value)))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono tabular-nums font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400">Голы Гостей (К2)</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={manualInput.awayGoals}
                    onChange={(e) =>
                      updateManualField('awayGoals', Math.max(0, Number(e.target.value)))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono tabular-nums font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Expected Goals (xG) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs text-emerald-300/90 font-medium">xG Хозяев</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.05}
                    value={manualInput.homeXg}
                    onChange={(e) =>
                      updateManualField('homeXg', Math.max(0, Number(e.target.value)))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono tabular-nums font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-sky-300/90 font-medium">xG Гостей</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.05}
                    value={manualInput.awayXg}
                    onChange={(e) =>
                      updateManualField('awayXg', Math.max(0, Number(e.target.value)))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono tabular-nums font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Shots on Target */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400">Удары в створ К1</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={manualInput.homeShotsOnTarget}
                    onChange={(e) =>
                      updateManualField('homeShotsOnTarget', Math.max(0, Number(e.target.value)))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400">Удары в створ К2</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={manualInput.awayShotsOnTarget}
                    onChange={(e) =>
                      updateManualField('awayShotsOnTarget', Math.max(0, Number(e.target.value)))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dangerous Attacks 15m + Bookie Odds */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400">Оп. атаки за 15 мин</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={manualInput.dangerousAttacks15m}
                    onChange={(e) =>
                      updateManualField('dangerousAttacks15m', Math.max(0, Number(e.target.value)))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-amber-300 font-medium">
                    Кэф БК на гол (ТБ +0.5)
                  </label>
                  <input
                    type="number"
                    min={1.05}
                    max={15}
                    step={0.05}
                    value={manualInput.bookieOdds}
                    onChange={(e) =>
                      updateManualField('bookieOdds', Math.max(1.01, Number(e.target.value)))
                    }
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-sm font-mono tabular-nums font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Red Card Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-400">Удаления (красные карточки)</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => updateManualField('redCardStatus', 'none')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer ${
                      manualInput.redCardStatus === 'none'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Нет КК
                  </button>
                  <button
                    type="button"
                    onClick={() => updateManualField('redCardStatus', 'defending')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer ${
                      manualInput.redCardStatus === 'defending'
                        ? 'bg-emerald-600/30 text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    У защиты
                  </button>
                  <button
                    type="button"
                    onClick={() => updateManualField('redCardStatus', 'attacking')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer ${
                      manualInput.redCardStatus === 'attacking'
                        ? 'bg-rose-600/30 text-rose-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    У атаки
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Calculation Results, Recharts Chart & Strategy Rules */}
        <div className="lg:col-span-7 space-y-5">
          {/* Verdict Banner */}
          <div
            className={`rounded-2xl border p-5 space-y-3 ${
              result.verdict === 'SIGNAL_VALUE'
                ? 'bg-emerald-950/35 border-emerald-500/45'
                : result.verdict === 'WATCHLIST'
                ? 'bg-amber-950/30 border-amber-500/40'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="truncate font-medium text-slate-300">
                {activeInput.matchLabel || 'Live-матч'}
                {isAutoLiveActive && activeAutoEntry ? ` · ${activeAutoEntry.match.league}` : ''}
              </span>
              <span className="font-mono tabular-nums text-slate-400">
                {isAutoLiveActive ? 'Авто-синхронизация Live' : 'Ручной режим'} · Пройдено{' '}
                {result.passedRulesCount}/5
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {result.verdict === 'SIGNAL_VALUE' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : result.verdict === 'WATCHLIST' ? (
                <Clock className="h-5 w-5 text-amber-400 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-slate-400 shrink-0" />
              )}
              <h3 className="text-base sm:text-lg font-bold text-white">{result.verdictTitle}</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">{result.verdictReason}</p>

            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400">Целевой рынок: </span>
                <span className="font-semibold text-white">{result.recommendedMarket}</span>
              </div>
              <div className="font-mono tabular-nums font-bold text-emerald-400">
                {result.recommendedStakeText}
              </div>
            </div>
          </div>

          {/* 4 KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] text-slate-400">Справедливый кэф</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">
                {result.fairOdds.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                λ ост. = {result.lambdaRem.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] text-slate-400">Вероятность гола</div>
              <div className="text-xl font-bold font-mono tabular-nums text-white">
                {result.goalProbabilityPct}%
              </div>
              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                У БК: {result.bookieImpliedPct}%
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] text-slate-400">Перевес (Value)</div>
              <div
                className={`text-xl font-bold font-mono tabular-nums ${
                  result.valueEdgePct >= 12
                    ? 'text-emerald-400'
                    : result.valueEdgePct > 0
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {result.valueEdgePct >= 0 ? `+${result.valueEdgePct}%` : `${result.valueEdgePct}%`}
              </div>
              <div className="text-[11px] text-slate-500">Порог: от +12%</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] text-slate-400">xG-Долг матча</div>
              <div
                className={`text-xl font-bold font-mono tabular-nums ${
                  result.totalDeficit >= 0.9 || result.maxTeamDeficit >= 0.9
                    ? 'text-sky-400'
                    : 'text-slate-300'
                }`}
              >
                {result.totalDeficit >= 0 ? `+${result.totalDeficit}` : result.totalDeficit}
              </div>
              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                Σ {result.totalXg.toFixed(2)} vs {result.totalGoals} г.
              </div>
            </div>
          </div>

          {/* Recharts Comparison Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                Сравнение вероятности гола: Модель xG vs Линия букмекера
              </span>
              <span className="text-slate-400 font-mono tabular-nums">
                Осталось ~{result.remainingMinutes}&apos; мин
              </span>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 10, bottom: 4 }}
                  barSize={22}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={170}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload as {
                        name: string;
                        probability: number;
                        odds: number;
                      };
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl space-y-1">
                          <div className="font-semibold text-white">{item.name}</div>
                          <div className="font-mono tabular-nums text-emerald-400">
                            Вероятность: {item.probability}%
                          </div>
                          <div className="font-mono tabular-nums text-slate-300">
                            Коэффициент: {item.odds.toFixed(2)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="probability" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5 Strategy Filters Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400">
              Чек-лист стратегии «xG-Долг и Регрессия Давления (70&apos;–76&apos;)»
            </h3>

            <XgDeficitProgressIndicator
              input={activeInput}
              result={result}
              targetDeficit={0.9}
            />

            <div className="divide-y divide-slate-800/80">
              {result.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    {rule.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-200">{rule.title}</div>
                      <div className="text-[11px] text-slate-400">{rule.detail}</div>
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0 pl-6 sm:pl-0">
                    <div
                      className={`font-mono tabular-nums font-bold ${
                        rule.passed ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {rule.actualValue}
                    </div>
                    <div className="text-[10px] text-slate-500">Норма: {rule.thresholdText}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shareable Post & Native Conversion Bridge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shareable Case Post */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white">Готовый разбор для канала / чата</div>
                <p className="text-[11px] text-slate-400">
                  Скопируйте расчёт со ссылкой на калькулятор, чтобы поделиться наблюдением в сообществе.
                </p>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                {result.shareablePostText}
              </pre>
              <button
                type="button"
                onClick={handleCopyPostText}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedPost ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Текст разбора скопирован</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-sky-400" />
                    <span>Скопировать разбор для поста</span>
                  </>
                )}
              </button>
            </div>

            {/* Native Bridge to Main Live Scanner */}
            <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/35 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-emerald-300">
                  Автоматизация в Live-сканере
                </div>
                <div className="text-sm font-bold text-white">
                  Получайте такие xG-сигналы в Telegram автоматически
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  В основном сервисе стратегия «xG-Долг 70&apos;–76&apos;» уже встроена в живой сканер с мгновенными алертами. На бесплатном тарифе доступен 1 активный фильтр и 1 бот.
                </p>
              </div>
              <button
                type="button"
                onClick={onActivateStrategyInScanner}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <span>Включить стратегию в Live-сканере</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
