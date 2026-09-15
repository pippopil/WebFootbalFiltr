import React, { useState, useEffect } from 'react';
import {
  FilterRule,
  ScannerMatrixConfig,
  ScannerStatRow,
  TelegramBotProfile,
  Match,
} from '../types';
import {
  Play,
  Square,
  RotateCcw,
  Plus,
  Save,
  Trash2,
  Send,
  ExternalLink,
  Bot,
  Activity,
  Check,
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
}) => {
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(
    filters.length > 0 ? filters[0].id : null
  );

  const [filterName, setFilterName] = useState<string>('Новый фильтр сканера');
  const [targetMarket, setTargetMarket] = useState<string>('ТБ 0.5 во 2-м тайме');
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [telegramEnabled, setTelegramEnabled] = useState<boolean>(true);
  const [matrix, setMatrix] = useState<ScannerMatrixConfig>(createDefaultMatrix());
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

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
        // synthesize initial values from basic FilterRule
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

  const handleReset = () => {
    setMatrix(createDefaultMatrix());
    setFilterName('Новый фильтр сканера');
    setTargetMarket('ТБ 0.5 во 2-м тайме');
    setSelectedFilterId(null);
    showNotice('Параметры фильтра сброшены к исходным');
  };

  const showNotice = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleAddNew = () => {
    const newId = `scanner-${Date.now()}`;
    const newRule: FilterRule = {
      id: newId,
      name: filterName.trim() || 'Фильтр сканера ' + new Date().toLocaleTimeString('ru-RU'),
      description: 'Алгоритм из классической матрицы сканера',
      category: 'custom',
      enabled: true, // newly created filter launched by user
      minMinute: matrix.minuteRange.checked ? matrix.minuteRange.min : 0,
      maxMinute: matrix.minuteRange.checked ? matrix.minuteRange.max : 90,
      scoreCondition: 'ANY',
      targetMarket: targetMarket.trim() || undefined,
      telegramEnabled,
      botId: selectedBotId || undefined,
      color: 'emerald',
      userId: currentUserId,
      scannerMatrix: matrix,
    };

    onSaveFilter(newRule);
    setSelectedFilterId(newId);
    showNotice(`Фильтр «${newRule.name}» успешно создан и сохранен!`);
  };

  const handleUpdate = () => {
    if (!selectedFilterId) {
      handleAddNew();
      return;
    }
    const existing = filters.find((f) => f.id === selectedFilterId);
    const updatedRule: FilterRule = {
      id: selectedFilterId,
      name: filterName.trim() || 'Фильтр сканера',
      description: existing?.description || 'Алгоритм из классической матрицы сканера',
      category: existing?.category || 'custom',
      color: existing?.color || 'emerald',
      enabled: existing?.enabled ?? true,
      minMinute: matrix.minuteRange.checked ? matrix.minuteRange.min : 0,
      maxMinute: matrix.minuteRange.checked ? matrix.minuteRange.max : 90,
      scoreCondition: existing?.scoreCondition || 'ANY',
      targetMarket: targetMarket.trim() || undefined,
      telegramEnabled,
      botId: selectedBotId || undefined,
      userId: currentUserId,
      scannerMatrix: matrix,
    };

    onSaveFilter(updatedRule);
    showNotice(`Фильтр «${updatedRule.name}» обновлен!`);
  };

  const handleDelete = () => {
    if (!selectedFilterId) return;
    const found = filters.find((f) => f.id === selectedFilterId);
    if (window.confirm(`Удалить фильтр «${found?.name || selectedFilterId}»?`)) {
      onDeleteFilter(selectedFilterId);
      setSelectedFilterId(null);
      handleReset();
      showNotice('Фильтр удален');
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

  const statRows: Array<{
    key: keyof ScannerMatrixConfig;
    label: string;
    unit?: string;
  }> = [
    { key: 'goals', label: 'Голы команд' },
    { key: 'attacks', label: 'Атаки' },
    { key: 'dangerousAttacks', label: 'Опасные атаки' },
    { key: 'possession', label: 'Владение мячом, %' },
    { key: 'shotsOnTarget', label: 'Удары в створ ворот' },
    { key: 'shotsOffTarget', label: 'Удары в сторону ворот' },
    { key: 'corners', label: 'Угловые' },
    { key: 'yellowCards', label: 'Жёлтые карточки' },
    { key: 'redCards', label: 'Красные карточки' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner & Title Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                Сканер "ОбО ВсЕм ПоНеМнОжКу" (Матрица параметров)
              </h2>
              <p className="text-xs text-slate-400">
                Полная классическая настройка фильтров: коэффициенты, периоды, индивидуальные и общие статистические показатели
              </p>
            </div>
          </div>
        </div>

        {/* Global Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onToggleMonitoring}
            className={`px-5 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 shadow-md ${
              isMonitoringActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isMonitoringActive ? (
              <>
                <Square className="h-4 w-4 fill-white" />
                <span>[ СТОП ]</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>[ СТАРТ ]</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
            <span>[ Сбросить фильтр ]</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md animate-fade-in">
          <Check className="h-4 w-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Upper Configuration Blocks & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (Odds, Period, Totals) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Block 1: Коэффициенты исходов */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Коэффициенты исходов (1X2 & Двойной шанс)</span>
              <span className="text-[10px] text-slate-500 font-normal">Отметьте нужный коридор котировок</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: 'П1', key: 'p1' as const },
                { label: 'X', key: 'draw' as const },
                { label: 'П2', key: 'p2' as const },
                { label: '1X', key: 'dc1X' as const },
                { label: '12', key: 'dc12' as const },
                { label: 'X2', key: 'dcX2' as const },
              ].map(({ label, key }) => (
                <div
                  key={key}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border transition ${
                    matrix[key].checked
                      ? 'bg-slate-950/80 border-emerald-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs min-w-[32px]">
                    <input
                      type="checkbox"
                      checked={matrix[key].checked}
                      onChange={(e) =>
                        setMatrix((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], checked: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                    />
                    <span>{label}</span>
                  </label>
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      step="0.05"
                      min="1.00"
                      value={matrix[key].min}
                      onChange={(e) =>
                        setMatrix((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], min: parseFloat(e.target.value) || 1.0 },
                        }))
                      }
                      disabled={!matrix[key].checked}
                      className="w-14 px-1.5 py-1 text-center bg-slate-900 border border-slate-800 disabled:opacity-40 rounded text-xs text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-slate-600 text-xs">-</span>
                    <input
                      type="number"
                      step="0.05"
                      min="1.00"
                      value={matrix[key].max}
                      onChange={(e) =>
                        setMatrix((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], max: parseFloat(e.target.value) || 1.0 },
                        }))
                      }
                      disabled={!matrix[key].checked}
                      className="w-14 px-1.5 py-1 text-center bg-slate-900 border border-slate-800 disabled:opacity-40 rounded text-xs text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Block 2: Период & Минут сыграно */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Период:</span>
              <div className="flex items-center gap-1.5 text-xs">
                {[
                  { id: 'ALL', label: 'Вся игра' },
                  { id: '1H', label: 'Первый' },
                  { id: '2H', label: 'Второй' },
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
                    className={`px-3 py-1 rounded-lg font-semibold transition text-xs border ${
                      matrix.period === item.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-200 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={matrix.minuteRange.checked}
                  onChange={(e) =>
                    setMatrix((prev) => ({
                      ...prev,
                      minuteRange: { ...prev.minuteRange, checked: e.target.checked },
                    }))
                  }
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                />
                <span>Минут сыграно:</span>
              </label>
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
                className="w-14 px-1.5 py-1 text-center bg-slate-950 border border-slate-800 disabled:opacity-40 rounded text-xs text-emerald-400 font-mono"
              />
              <span className="text-slate-600 text-xs">-</span>
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
                className="w-14 px-1.5 py-1 text-center bg-slate-950 border border-slate-800 disabled:opacity-40 rounded text-xs text-emerald-400 font-mono"
              />
            </div>
          </div>

          {/* Block 3: Котировки тоталов */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Котировки тоталов (ТБ / ТМ)</span>
              <span className="text-[10px] text-slate-500 font-normal">Диапазоны коэффициентов линии</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: 'ТБ 0.5', key: 'tb05' as const },
                { label: 'ТБ 1.5', key: 'tb15' as const },
                { label: 'ТБ 2.5', key: 'tb25' as const },
                { label: 'ТМ 0.5', key: 'tm05' as const },
                { label: 'ТМ 1.5', key: 'tm15' as const },
                { label: 'ТМ 2.5', key: 'tm25' as const },
              ].map(({ label, key }) => (
                <div
                  key={key}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border transition ${
                    matrix[key].checked
                      ? 'bg-slate-950/80 border-cyan-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs min-w-[50px]">
                    <input
                      type="checkbox"
                      checked={matrix[key].checked}
                      onChange={(e) =>
                        setMatrix((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], checked: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/30"
                    />
                    <span>{label}</span>
                  </label>
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      step="0.05"
                      min="1.00"
                      value={matrix[key].min}
                      onChange={(e) =>
                        setMatrix((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], min: parseFloat(e.target.value) || 1.0 },
                        }))
                      }
                      disabled={!matrix[key].checked}
                      className="w-14 px-1.5 py-1 text-center bg-slate-900 border border-slate-800 disabled:opacity-40 rounded text-xs text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="text-slate-600 text-xs">-</span>
                    <input
                      type="number"
                      step="0.05"
                      min="1.00"
                      value={matrix[key].max}
                      onChange={(e) =>
                        setMatrix((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], max: parseFloat(e.target.value) || 1.0 },
                        }))
                      }
                      disabled={!matrix[key].checked}
                      className="w-14 px-1.5 py-1 text-center bg-slate-900 border border-slate-800 disabled:opacity-40 rounded text-xs text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Info, Bot Assignment, Filter Management, Saved List) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm">
            {/* Telegram Channel Info Box (as in Screenshot 2) */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Стратегии на спорт</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">TG Live</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Актуальные версии полезных таблиц и готовых шаблонов публикуются в канале.
              </p>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition"
              >
                <span>https://t.me/football_scanner</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Filter Name & Market Input */}
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Название фильтра:
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Введите название фильтра..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Целевой исход (сигнал ставки):
                </label>
                <input
                  type="text"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="например: ТБ 0.5 во 2-м тайме / Победа 1"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-emerald-400 placeholder-slate-500 focus:outline-none font-medium"
                />
              </div>

              {/* Bot selection */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Bot className="h-3 w-3 text-cyan-400" />
                    Бот для уведомлений:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTelegramEnabled(!telegramEnabled)}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${
                      telegramEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {telegramEnabled ? 'TG ВКЛ' : 'TG ВЫКЛ'}
                  </button>
                </label>
                <select
                  value={selectedBotId}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 focus:outline-none"
                >
                  <option value="">🤖 По умолчанию (Основной бот)</option>
                  {userBots.map((b) => (
                    <option key={b.id} value={b.id}>
                      🤖 {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons: Add, Update, Delete */}
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
              >
                <Plus className="h-4 w-4" />
                <span>[ Добавить новый ]</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>[ Обновить ]</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!selectedFilterId}
                  className="py-2 bg-slate-800 hover:bg-rose-900 disabled:opacity-40 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>[ Удалить ]</span>
                </button>
              </div>
            </div>
          </div>

          {/* Saved Filters Selector Box (as on the right in Screenshot 2) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex-1 flex flex-col">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span>Сохраненные фильтры:</span>
              <span className="text-[10px] text-slate-500 font-mono">{filters.length} шт.</span>
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-[190px] pr-1 scrollbar-thin">
              {filters.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFilterId(f.id)}
                  className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition border ${
                    selectedFilterId === f.id
                      ? 'bg-slate-800 border-emerald-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
                      {f.enabled ? 'РАБОТАЕТ' : 'СТОП'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Bottom Matrix Table (Exact Match to Screenshot 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg overflow-x-auto">
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Статистическая матрица показателей (K1, K2, 12, И1, И2, ВСЕГО)</span>
          <span className="text-[11px] text-slate-400 font-normal">
            Заполняйте только нужные пороги — пустые ячейки не накладывают ограничений
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-950/60">
              <th className="py-2.5 px-3 font-bold">Показатель</th>
              <th className="py-2.5 px-3 text-center font-bold">K1 K2 12</th>
              <th className="py-2.5 px-3 text-center font-bold">Условие разницы</th>
              <th className="py-2.5 px-3 text-center font-bold">Порог</th>
              <th className="py-2.5 px-3 text-center font-bold">И1 (К1 min - max)</th>
              <th className="py-2.5 px-3 text-center font-bold">И2 (К2 min - max)</th>
              <th className="py-2.5 px-3 text-center font-bold">ВСЕГО (min - max)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {statRows.map(({ key, label }) => {
              const row = matrix[key] as ScannerStatRow;
              return (
                <tr key={key} className="hover:bg-slate-800/40 transition">
                  {/* Name */}
                  <td className="py-2 px-3 font-semibold text-white whitespace-nowrap">
                    {label}
                  </td>

                  {/* K1 K2 12 selector */}
                  <td className="py-2 px-3 text-center">
                    <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      {(['K1', 'K2', '12'] as const).map((side) => (
                        <button
                          key={side}
                          type="button"
                          onClick={() => updateStatRow(key, { side })}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                            row.side === side
                              ? 'bg-emerald-500 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {side}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Operator dropdown */}
                  <td className="py-2 px-3 text-center">
                    <select
                      value={row.operator}
                      onChange={(e) =>
                        updateStatRow(key, {
                          operator: e.target.value as ScannerStatRow['operator'],
                        })
                      }
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    >
                      <option value=">=">≥</option>
                      <option value="<=">≤</option>
                      <option value="==">=</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="DIFF">Разница</option>
                    </select>
                  </td>

                  {/* Diff threshold input */}
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      placeholder="-"
                      value={row.diffThreshold ?? ''}
                      onChange={(e) =>
                        updateStatRow(key, {
                          diffThreshold: e.target.value === '' ? undefined : parseFloat(e.target.value),
                        })
                      }
                      className="w-16 px-1.5 py-1 text-center bg-slate-950 border border-slate-800 rounded text-xs text-amber-300 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                    />
                  </td>

                  {/* И1 (Индивидуальный К1) min - max */}
                  <td className="py-2 px-3 text-center">
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
                        className="w-14 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded text-xs text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
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
                        className="w-14 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded text-xs text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                      />
                    </div>
                  </td>

                  {/* И2 (Индивидуальный К2) min - max */}
                  <td className="py-2 px-3 text-center">
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
                        className="w-14 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded text-xs text-blue-400 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
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
                        className="w-14 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded text-xs text-blue-400 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                      />
                    </div>
                  </td>

                  {/* ВСЕГО (Общий тотал) min - max */}
                  <td className="py-2 px-3 text-center">
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
                        className="w-14 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded text-xs text-cyan-300 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
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
                        className="w-14 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded text-xs text-cyan-300 font-mono focus:border-emerald-500 focus:outline-none placeholder-slate-700"
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
  );
};
