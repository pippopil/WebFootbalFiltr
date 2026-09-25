import React, { useState, useEffect, useMemo } from 'react';
import {
  FilterRule,
  ScannerMatrixConfig,
  ScannerStatRow,
  TelegramBotProfile,
  Match,
} from '../types';
import { evaluateFilterRule } from '../algorithms';
import {
  Play,
  Square,
  RotateCcw,
  Plus,
  Save,
  Trash2,
  ExternalLink,
  Bot,
  Activity,
  Check,
  SlidersHorizontal,
  Flame,
  Clock,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface ScannerMatrixFilterViewProps {
  filters: FilterRule[];
  onSaveFilter: (rule: FilterRule) => void;
  onDeleteFilter: (id: string) => void;
  isMonitoringActive: boolean;
  onToggleMonitoring: () => void;
  userBots?: TelegramBotProfile[];
  currentUserId?: string;
  liveMatches?: Match[];
}

const createDefaultMatrix = (): ScannerMatrixConfig => ({
  p1: { checked: false, min: 1.0, max: 2.0 },
  draw: { checked: false, min: 1.0, max: 1.0 },
  p2: { checked: false, min: 1.0, max: 1.0 },
  dc1X: { checked: false, min: 1.0, max: 1.0 },
  dc12: { checked: false, min: 1.0, max: 1.0 },
  dcX2: { checked: false, min: 1.0, max: 1.0 },

  period: 'ALL',
  minuteRange: { checked: false, min: 0, max: 90 },

  tb05: { checked: false, min: 1.0, max: 2.5 },
  tb15: { checked: false, min: 1.0, max: 2.5 },
  tb25: { checked: false, min: 1.0, max: 2.5 },
  tm05: { checked: false, min: 1.0, max: 2.5 },
  tm15: { checked: false, min: 1.0, max: 2.5 },
  tm25: { checked: false, min: 1.0, max: 2.5 },

  goals: { side: '12', operator: '>=', diffThreshold: undefined, ind1Min: undefined, ind1Max: undefined, ind2Min: undefined, ind2Max: undefined, totalMin: undefined, totalMax: undefined },
  attacks: { side: '12', operator: '>=', diffThreshold: undefined, ind1Min: undefined, ind1Max: undefined, ind2Min: undefined, ind2Max: undefined, totalMin: undefined, totalMax: undefined },
  dangerousAttacks: { side: '12', operator: '>=', diffThreshold: undefined, ind1Min: undefined, ind1Max: undefined, ind2Min: undefined, ind2Max: undefined, totalMin: undefined, totalMax: undefined },
  possession: { side: '12', operator: '>=', diffThreshold: undefined, ind1Min: undefined, ind1Max: undefined, ind2Min: undefined, ind2Max: undefined, totalMin: undefined, totalMax: undefined },
  shotsOnTarget: { side: '12', operator: '>=', diffThreshold: undefined, ind1Min: undefined, ind1Max: undefined, ind2Min: undefined, ind2Max: undefined, totalMin: undefined, totalMax: undefined },
  shotsOffTarget: { side: '12', operator: '>=', diffThreshold: undefined, ind1Min: undefined, ind1Max: undefined, ind2Min: undefined, ind2Max: undefined, totalMin: undefined, totalMax: undefined },
  corners: { side: '12', operator: '>=', diffThreshold: undefined, ind1Min: undefined, ind1Max: undefined, ind2Min: undefined, ind2Max: undefined, totalMin: undefined, totalMax: undefined },
  yellowCards: { side: '12', operator: '>=', diffThreshold: undefined, ind1Min: undefined, ind1Max: undefined, ind2Min: undefined, ind2Max: undefined, totalMin: undefined, totalMax: undefined },
  redCards: { side: '12', operator: '>=', diffThreshold: undefined, ind1Min: undefined, ind1Max: undefined, ind2Min: undefined, ind2Max: undefined, totalMin: undefined, totalMax: undefined },
});

export const ScannerMatrixFilterView: React.FC<ScannerMatrixFilterViewProps> = ({
  filters,
  onSaveFilter,
  onDeleteFilter,
  isMonitoringActive,
  onToggleMonitoring,
  userBots = [],
  currentUserId,
  liveMatches = [],
}) => {
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(
    filters.length > 0 ? filters[0].id : null
  );

  const [filterName, setFilterName] = useState<string>('Тактическая стратегия');
  const [targetMarket, setTargetMarket] = useState<string>('ТБ 0.5 во 2-м тайме');
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [telegramEnabled, setTelegramEnabled] = useState<boolean>(true);
  const [matrix, setMatrix] = useState<ScannerMatrixConfig>(createDefaultMatrix());
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [statViewCategory, setStatViewCategory] = useState<'all' | 'attacks' | 'shots' | 'discipline'>('all');

  // When selected filter changes, load its values into matrix
  useEffect(() => {
    if (!selectedFilterId) return;
    const found = filters.find((f) => f.id === selectedFilterId);
    if (found) {
      setFilterName(found.name);
      setTargetMarket(found.targetMarket || 'ТБ 0.5 во 2-м тайме');
      setSelectedBotId(found.botId || '');
      setTelegramEnabled(found.telegramEnabled ?? true);
      if (found.scannerMatrix) {
        setMatrix(JSON.parse(JSON.stringify(found.scannerMatrix)));
      } else {
        const m = createDefaultMatrix();
        if (found.minMinute !== undefined || found.maxMinute !== undefined) {
          m.minuteRange = {
            checked: true,
            min: found.minMinute ?? 0,
            max: found.maxMinute ?? 90,
          };
        }
        if (found.minDangerousAttacksDiff) {
          m.dangerousAttacks.diffThreshold = found.minDangerousAttacksDiff;
          m.dangerousAttacks.operator = '>=';
        }
        if (found.minDangerousAttacksTotal) {
          m.dangerousAttacks.totalMin = found.minDangerousAttacksTotal;
        }
        if (found.minTotalShots) {
          m.shotsOnTarget.totalMin = Math.round(found.minTotalShots / 2);
        }
        if (found.minTotalCorners) {
          m.corners.totalMin = found.minTotalCorners;
        }
        if (found.maxOddsFavorite) {
          m.p1 = { checked: true, min: 1.01, max: found.maxOddsFavorite };
        }
        if (found.maxOddsOver25) {
          m.tb25 = { checked: true, min: 1.01, max: found.maxOddsOver25 };
        }
        setMatrix(m);
      }
    }
  }, [selectedFilterId, filters]);

  const showNotice = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleReset = () => {
    setMatrix(createDefaultMatrix());
    setFilterName('Тактическая стратегия');
    setTargetMarket('ТБ 0.5 во 2-м тайме');
    setSelectedFilterId(null);
    showNotice('Параметры тактической матрицы сброшены');
  };

  const handleAddNew = () => {
    const newId = `matrix-${Date.now()}`;
    const newRule: FilterRule = {
      id: newId,
      name: filterName.trim() || 'Тактическая стратегия ' + new Date().toLocaleTimeString('ru-RU'),
      description: 'Мультипараметрический фильтр тактической матрицы',
      category: 'custom',
      enabled: true,
      minMinute: matrix.minuteRange.checked ? matrix.minuteRange.min : 0,
      maxMinute: matrix.minuteRange.checked ? matrix.minuteRange.max : 90,
      scoreCondition: 'ANY',
      targetMarket: targetMarket.trim() || 'ТБ 0.5 во 2-м тайме',
      telegramEnabled,
      botId: selectedBotId || undefined,
      userId: currentUserId,
      color: 'emerald',
      scannerMatrix: matrix,
      minDangerousAttacksDiff: matrix.dangerousAttacks.diffThreshold,
      minDangerousAttacksTotal: matrix.dangerousAttacks.totalMin,
      minTotalCorners: matrix.corners.totalMin,
      maxOddsFavorite: matrix.p1.checked ? matrix.p1.max : undefined,
      maxOddsOver25: matrix.tb25.checked ? matrix.tb25.max : undefined,
    };

    onSaveFilter(newRule);
    setSelectedFilterId(newId);
    showNotice(`Стратегия «${newRule.name}» успешно создана`);
  };

  const handleUpdate = () => {
    if (!selectedFilterId) {
      handleAddNew();
      return;
    }
    const existing = filters.find((f) => f.id === selectedFilterId);
    const updatedRule: FilterRule = {
      ...(existing || {}),
      id: selectedFilterId,
      name: filterName.trim() || 'Тактическая стратегия',
      description: existing?.description || 'Мультипараметрический фильтр тактической матрицы',
      category: existing?.category || 'custom',
      enabled: existing?.enabled ?? true,
      minMinute: matrix.minuteRange.checked ? matrix.minuteRange.min : (existing?.minMinute ?? 0),
      maxMinute: matrix.minuteRange.checked ? matrix.minuteRange.max : (existing?.maxMinute ?? 90),
      scoreCondition: existing?.scoreCondition || 'ANY',
      targetMarket: targetMarket.trim() || 'ТБ 0.5 во 2-м тайме',
      telegramEnabled,
      botId: selectedBotId || undefined,
      userId: currentUserId || existing?.userId,
      color: existing?.color || 'emerald',
      scannerMatrix: matrix,
      minDangerousAttacksDiff: matrix.dangerousAttacks.diffThreshold,
      minDangerousAttacksTotal: matrix.dangerousAttacks.totalMin,
      minTotalCorners: matrix.corners.totalMin,
      maxOddsFavorite: matrix.p1.checked ? matrix.p1.max : undefined,
      maxOddsOver25: matrix.tb25.checked ? matrix.tb25.max : undefined,
    };

    onSaveFilter(updatedRule);
    showNotice(`Стратегия «${updatedRule.name}» успешно обновлена`);
  };

  const handleDelete = () => {
    if (!selectedFilterId) return;
    const target = filters.find((f) => f.id === selectedFilterId);
    if (window.confirm(`Удалить стратегию «${target?.name || selectedFilterId}»?`)) {
      onDeleteFilter(selectedFilterId);
      const remaining = filters.filter((f) => f.id !== selectedFilterId);
      setSelectedFilterId(remaining.length > 0 ? remaining[0].id : null);
      showNotice('Стратегия удалена');
    }
  };

  const updateStatRow = (key: keyof ScannerMatrixConfig, patch: Partial<ScannerStatRow>) => {
    setMatrix((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] as ScannerStatRow),
        ...patch,
      },
    }));
  };

  // Live match simulator/preview against active matrix configuration
  const currentSyntheticRule = useMemo<FilterRule>(() => ({
    id: 'current-matrix-preview',
    name: filterName,
    description: 'Превью матрицы',
    category: 'custom',
    enabled: true,
    minMinute: matrix.minuteRange.checked ? matrix.minuteRange.min : 0,
    maxMinute: matrix.minuteRange.checked ? matrix.minuteRange.max : 90,
    scoreCondition: 'ANY',
    telegramEnabled: false,
    color: 'emerald',
    scannerMatrix: matrix,
  }), [filterName, matrix]);

  const liveMatchesMatchingCount = useMemo(() => {
    if (!liveMatches || liveMatches.length === 0) return 0;
    return liveMatches.filter((m) => {
      const res = evaluateFilterRule(m, currentSyntheticRule);
      return res.matches;
    }).length;
  }, [liveMatches, currentSyntheticRule]);

  const statRows: Array<{
    key: keyof ScannerMatrixConfig;
    label: string;
    category: 'attacks' | 'shots' | 'discipline';
    icon: string;
    unit?: string;
  }> = [
    { key: 'goals', label: 'Голы команд', category: 'shots', icon: '⚽' },
    { key: 'attacks', label: 'Всего атак', category: 'attacks', icon: '⚡' },
    { key: 'dangerousAttacks', label: 'Опасные атаки', category: 'attacks', icon: '🔥' },
    { key: 'possession', label: 'Владение мячом (%)', category: 'attacks', icon: '📊', unit: '%' },
    { key: 'shotsOnTarget', label: 'Удары в створ', category: 'shots', icon: '🎯' },
    { key: 'shotsOffTarget', label: 'Удары мимо', category: 'shots', icon: '🏹' },
    { key: 'corners', label: 'Угловые (Корнеры)', category: 'shots', icon: '🚩' },
    { key: 'yellowCards', label: 'Жёлтые карточки (ЖК)', category: 'discipline', icon: '🟨' },
    { key: 'redCards', label: 'Красные карточки (КК)', category: 'discipline', icon: '🟥' },
  ];

  const filteredStatRows = statRows.filter((r) => {
    if (statViewCategory === 'all') return true;
    return r.category === statViewCategory;
  });

  return (
    <div className="space-y-5">
      {/* Top Header & Tactical Terminal Command Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/20 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-wide text-white">
                    Тактическая мульти-матрица
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    PRO Grid
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-0.5">
                  Многомерный конфигуратор параметров: котировки исходов 1X2 и двойного шанса, тайминги, коридоры тоталов и детальные статистические фильтры обеих команд
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isMonitoringActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[11px] font-medium">
                {isMonitoringActive ? 'Мониторинг активен' : 'Мониторинг на паузе'}
              </span>
            </div>

            <button
              onClick={onToggleMonitoring}
              type="button"
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-md ${
                isMonitoringActive
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
              }`}
            >
              {isMonitoringActive ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Остановить сканер</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Запустить сканер</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              type="button"
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Сбросить все параметры матрицы к стандартным"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              <span>Сбросить</span>
            </button>
          </div>
        </div>

        {/* Live Filter Matching Ribbon */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Активная стратегия:</span>
            <span className="text-emerald-400 font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono">
              {filterName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Activity className="h-3.5 w-3.5 text-sky-400" />
              <span>Совпадений в лайве прямо сейчас:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                liveMatchesMatchingCount > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {liveMatchesMatchingCount} из {liveMatches.length} матчей
              </span>
            </div>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg animate-fade-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Grid: Main Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Odds, Periods, Totals, and Statistics */}
        <div className="lg:col-span-8 space-y-5">
          {/* Block 1: Котировки 1X2 и Двойной шанс */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Коэффициенты исходов (1X2 & Двойной шанс)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Включите нужный исход галочкой и задайте коридор [min - max]
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'П1 (Победа 1)', shortLabel: 'П1', key: 'p1' as const, color: 'emerald' },
                { label: 'X (Ничья)', shortLabel: 'X', key: 'draw' as const, color: 'cyan' },
                { label: 'П2 (Победа 2)', shortLabel: 'П2', key: 'p2' as const, color: 'blue' },
                { label: '1X (1 или Ничья)', shortLabel: '1X', key: 'dc1X' as const, color: 'teal' },
                { label: '12 (Победа 1 или 2)', shortLabel: '12', key: 'dc12' as const, color: 'indigo' },
                { label: 'X2 (Ничья или 2)', shortLabel: 'X2', key: 'dcX2' as const, color: 'violet' },
              ].map(({ label, shortLabel, key }) => {
                const item = matrix[key];
                return (
                  <div
                    key={key}
                    className={`p-3 rounded-xl border transition-all duration-200 ${
                      item.checked
                        ? 'bg-slate-950 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) =>
                            setMatrix((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], checked: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                        />
                        <span className={`text-xs font-bold ${item.checked ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {shortLabel}
                        </span>
                      </label>
                      <span className="text-[10px] text-slate-500 truncate max-w-[85px]" title={label}>
                        {label.split(' ')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <span className="text-[9px] text-slate-500 block text-center mb-0.5">Мин</span>
                        <input
                          type="number"
                          step="0.05"
                          min="1.00"
                          value={item.min}
                          onChange={(e) =>
                            setMatrix((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], min: parseFloat(e.target.value) || 1.0 },
                            }))
                          }
                          disabled={!item.checked}
                          className="w-full py-1 text-center bg-slate-900 border border-slate-800 disabled:opacity-30 rounded-lg text-xs text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <span className="text-slate-600 text-xs mt-3">-</span>
                      <div className="flex-1">
                        <span className="text-[9px] text-slate-500 block text-center mb-0.5">Макс</span>
                        <input
                          type="number"
                          step="0.05"
                          min="1.00"
                          value={item.max}
                          onChange={(e) =>
                            setMatrix((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], max: parseFloat(e.target.value) || 1.0 },
                            }))
                          }
                          disabled={!item.checked}
                          className="w-full py-1 text-center bg-slate-900 border border-slate-800 disabled:opacity-30 rounded-lg text-xs text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block 2: Игровой период & Минутное окно */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                Игровой период матча:
              </span>
              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { id: 'ALL', label: 'Вся игра (0-90\')' },
                  { id: '1H', label: '1-й тайм (1-45\')' },
                  { id: '2H', label: '2-й тайм (46-90\')' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setMatrix((prev) => ({
                        ...prev,
                        period: item.id as 'ALL' | '1H' | '2H',
                      }))
                    }
                    className={`px-3 py-1.5 rounded-xl font-bold transition text-xs border ${
                      matrix.period === item.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 w-full sm:w-auto">
              <label className="flex items-center gap-2 text-xs text-white font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={matrix.minuteRange.checked}
                  onChange={(e) =>
                    setMatrix((prev) => ({
                      ...prev,
                      minuteRange: { ...prev.minuteRange, checked: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                />
                <span>Фильтр по минутам:</span>
              </label>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={matrix.minuteRange.min}
                  onChange={(e) =>
                    setMatrix((prev) => ({
                      ...prev,
                      minuteRange: { ...prev.minuteRange, min: parseInt(e.target.value) || 0 },
                    }))
                  }
                  disabled={!matrix.minuteRange.checked}
                  className="w-16 px-2 py-1.5 text-center bg-slate-950 border border-slate-800 disabled:opacity-40 rounded-xl text-xs text-emerald-400 font-mono font-bold"
                  placeholder="От мин"
                />
                <span className="text-slate-600 text-xs font-bold">—</span>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={matrix.minuteRange.max}
                  onChange={(e) =>
                    setMatrix((prev) => ({
                      ...prev,
                      minuteRange: { ...prev.minuteRange, max: parseInt(e.target.value) || 90 },
                    }))
                  }
                  disabled={!matrix.minuteRange.checked}
                  className="w-16 px-2 py-1.5 text-center bg-slate-950 border border-slate-800 disabled:opacity-40 rounded-xl text-xs text-emerald-400 font-mono font-bold"
                  placeholder="До мин"
                />
                <span className="text-slate-400 text-xs font-mono">мин</span>
              </div>
            </div>
          </div>

          {/* Block 3: Коридоры тоталов ТБ / ТМ */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                Коридоры тоталов матча (ТБ / ТМ)
              </span>
              <span className="text-[11px] text-slate-400">
                Задайте допустимый диапазон коэффициента на тоталы
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'ТБ 0.5', key: 'tb05' as const, isOver: true },
                { label: 'ТБ 1.5', key: 'tb15' as const, isOver: true },
                { label: 'ТБ 2.5', key: 'tb25' as const, isOver: true },
                { label: 'ТМ 0.5', key: 'tm05' as const, isOver: false },
                { label: 'ТМ 1.5', key: 'tm15' as const, isOver: false },
                { label: 'ТМ 2.5', key: 'tm25' as const, isOver: false },
              ].map(({ label, key, isOver }) => {
                const item = matrix[key];
                return (
                  <div
                    key={key}
                    className={`p-3 rounded-xl border transition-all ${
                      item.checked
                        ? isOver
                          ? 'bg-slate-950 border-emerald-500/40'
                          : 'bg-slate-950 border-amber-500/40'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) =>
                            setMatrix((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], checked: e.target.checked },
                            }))
                          }
                          className={`w-4 h-4 rounded border-slate-700 ${
                            isOver ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        />
                        <span className={`text-xs font-bold ${
                          item.checked
                            ? isOver ? 'text-emerald-400' : 'text-amber-400'
                            : 'text-slate-300'
                        }`}>
                          {label}
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <span className="text-[9px] text-slate-500 block text-center mb-0.5">Кэф от</span>
                        <input
                          type="number"
                          step="0.05"
                          min="1.00"
                          value={item.min}
                          onChange={(e) =>
                            setMatrix((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], min: parseFloat(e.target.value) || 1.0 },
                            }))
                          }
                          disabled={!item.checked}
                          className="w-full py-1 text-center bg-slate-900 border border-slate-800 disabled:opacity-30 rounded-lg text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <span className="text-slate-600 text-xs mt-3">-</span>
                      <div className="flex-1">
                        <span className="text-[9px] text-slate-500 block text-center mb-0.5">до</span>
                        <input
                          type="number"
                          step="0.05"
                          min="1.00"
                          value={item.max}
                          onChange={(e) =>
                            setMatrix((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], max: parseFloat(e.target.value) || 1.0 },
                            }))
                          }
                          disabled={!item.checked}
                          className="w-full py-1 text-center bg-slate-900 border border-slate-800 disabled:opacity-30 rounded-lg text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block 4: Сетка 9 статистических показателей */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Тактические метрики давления и матча (9 параметров)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Заполняйте только необходимые ограничения — пустые поля игнорируются фильтром
                </p>
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {[
                  { id: 'all', label: 'Все (9)' },
                  { id: 'attacks', label: 'Атака' },
                  { id: 'shots', label: 'Удары и голы' },
                  { id: 'discipline', label: 'Карточки' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStatViewCategory(t.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      statViewCategory === t.id
                        ? 'bg-slate-800 text-emerald-400 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Metrics Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider bg-slate-950/70">
                    <th className="py-2.5 px-3 rounded-l-xl">Метрика</th>
                    <th className="py-2.5 px-2 text-center">Сторона</th>
                    <th className="py-2.5 px-2 text-center">Условие</th>
                    <th className="py-2.5 px-2 text-center">Порог (Δ)</th>
                    <th className="py-2.5 px-2 text-center">Индив. К1 (min - max)</th>
                    <th className="py-2.5 px-2 text-center">Индив. К2 (min - max)</th>
                    <th className="py-2.5 px-3 text-center rounded-r-xl">Суммарно (min - max)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredStatRows.map(({ key, label, icon }) => {
                    const row = matrix[key] as ScannerStatRow;
                    return (
                      <tr key={key} className="hover:bg-slate-800/30 transition-colors">
                        {/* Name & Icon */}
                        <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                          <span className="mr-1.5">{icon}</span>
                          <span>{label}</span>
                        </td>

                        {/* Side selector */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                            {(['K1', 'K2', '12'] as const).map((side) => (
                              <button
                                key={side}
                                type="button"
                                onClick={() => updateStatRow(key, { side })}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                                  row.side === side
                                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                                title={side === 'K1' ? 'Команда 1 (Хозяева)' : side === 'K2' ? 'Команда 2 (Гости)' : 'Обе команды'}
                              >
                                {side}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Operator */}
                        <td className="py-2.5 px-2 text-center">
                          <select
                            value={row.operator}
                            onChange={(e) =>
                              updateStatRow(key, {
                                operator: e.target.value as ScannerStatRow['operator'],
                              })
                            }
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                          >
                            <option value=">=">≥</option>
                            <option value="<=">≤</option>
                            <option value="==">=</option>
                            <option value=">">&gt;</option>
                            <option value="<">&lt;</option>
                            <option value="DIFF">Разница</option>
                          </select>
                        </td>

                        {/* Diff Threshold */}
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            placeholder="—"
                            value={row.diffThreshold ?? ''}
                            onChange={(e) =>
                              updateStatRow(key, {
                                diffThreshold: e.target.value === '' ? undefined : parseFloat(e.target.value),
                              })
                            }
                            className="w-14 px-1.5 py-1 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs text-amber-300 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                          />
                        </td>

                        {/* Indiv K1 [min - max] */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="min"
                              value={row.ind1Min ?? ''}
                              onChange={(e) =>
                                updateStatRow(key, {
                                  ind1Min: e.target.value === '' ? undefined : parseFloat(e.target.value),
                                })
                              }
                              className="w-12 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                            />
                            <span className="text-slate-600">-</span>
                            <input
                              type="number"
                              placeholder="max"
                              value={row.ind1Max ?? ''}
                              onChange={(e) =>
                                updateStatRow(key, {
                                  ind1Max: e.target.value === '' ? undefined : parseFloat(e.target.value),
                                })
                              }
                              className="w-12 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                            />
                          </div>
                        </td>

                        {/* Indiv K2 [min - max] */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="min"
                              value={row.ind2Min ?? ''}
                              onChange={(e) =>
                                updateStatRow(key, {
                                  ind2Min: e.target.value === '' ? undefined : parseFloat(e.target.value),
                                })
                              }
                              className="w-12 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs text-blue-400 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                            />
                            <span className="text-slate-600">-</span>
                            <input
                              type="number"
                              placeholder="max"
                              value={row.ind2Max ?? ''}
                              onChange={(e) =>
                                updateStatRow(key, {
                                  ind2Max: e.target.value === '' ? undefined : parseFloat(e.target.value),
                                })
                              }
                              className="w-12 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs text-blue-400 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                            />
                          </div>
                        </td>

                        {/* Total [min - max] */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="min"
                              value={row.totalMin ?? ''}
                              onChange={(e) =>
                                updateStatRow(key, {
                                  totalMin: e.target.value === '' ? undefined : parseFloat(e.target.value),
                                })
                              }
                              className="w-12 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                            />
                            <span className="text-slate-600">-</span>
                            <input
                              type="number"
                              placeholder="max"
                              value={row.totalMax ?? ''}
                              onChange={(e) =>
                                updateStatRow(key, {
                                  totalMax: e.target.value === '' ? undefined : parseFloat(e.target.value),
                                })
                              }
                              className="w-12 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                            />
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

        {/* Right Column: Strategy Configuration & Saved Presets */}
        <div className="lg:col-span-4 space-y-5">
          {/* Strategy Meta Card */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Параметры стратегии
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Live Trigger
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Название стратегии:
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Введите понятное название стратегии..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Целевой исход (рекомендация для ставки):
                </label>
                <input
                  type="text"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="например: ТБ 0.5 во 2-м тайме / Победа 1"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-400 placeholder-slate-500 focus:outline-none font-medium transition shadow-inner"
                />
              </div>

              {/* Bot selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Bot className="h-3.5 w-3.5 text-cyan-400" />
                    Telegram бот:
                  </label>
                  <button
                    type="button"
                    onClick={() => setTelegramEnabled(!telegramEnabled)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition border ${
                      telegramEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {telegramEnabled ? 'Уведомления: ВКЛ' : 'Уведомления: ВЫКЛ'}
                  </button>
                </div>
                <select
                  value={selectedBotId}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-cyan-300 focus:outline-none"
                >
                  <option value="">🤖 Основной Telegram бот по умолчанию</option>
                  {userBots.map((b) => (
                    <option key={b.id} value={b.id}>
                      🤖 {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <button
                type="button"
                onClick={handleUpdate}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-emerald-950/40"
              >
                <Save className="h-4 w-4" />
                <span>Сохранить изменения</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Как новый</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!selectedFilterId}
                  className="py-2 bg-slate-900 hover:bg-rose-950/40 disabled:opacity-30 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-800 hover:border-rose-800/50"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          </div>

          {/* Saved Filters Selector */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                Сохраненные фильтры
              </span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                {filters.length} шт.
              </span>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[260px] pr-1 scrollbar-thin">
              {filters.map((f) => {
                const isSelected = selectedFilterId === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFilterId(f.id)}
                    className={`p-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-between transition-all border ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500/50 text-white shadow-sm'
                        : 'bg-slate-950/50 border-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="truncate pr-2 font-medium">
                      <span>{f.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          f.enabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {f.enabled ? 'АКТИВЕН' : 'ПАУЗА'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
