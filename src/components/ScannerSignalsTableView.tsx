import React, { useState } from 'react';
import { SignalAlert, Match, SignalOutcome } from '../types';
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
} from 'lucide-react';

export interface ScannerSignalsTableViewProps {
  signals: SignalAlert[];
  matches?: Match[];
  isMonitoringActive?: boolean;
  onToggleMonitoring?: () => void;
  onClearSignals: () => void;
  onOpenAIAnalyst?: (match: Match) => void;
  onSelectMatch?: (match: Match) => void;
  onNavigateToMatch?: (matchId: string, matchName: string, signal: SignalAlert) => void;
  onDeleteSignal?: (id: string) => void;
  onUpdateOutcome?: (signalId: string, outcome: SignalOutcome) => void;
  onExportCsv?: () => void;
}

export const ScannerSignalsTableView: React.FC<ScannerSignalsTableViewProps> = ({
  signals,
  matches = [],
  isMonitoringActive = true,
  onToggleMonitoring,
  onClearSignals,
  onOpenAIAnalyst,
  onSelectMatch,
  onNavigateToMatch,
  onDeleteSignal,
  onUpdateOutcome,
  onExportCsv,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | '1H' | '2H' | 'HT'>('ALL');
  const [filterNameChoice, setFilterNameChoice] = useState<string>('ALL');

  // Distinct filter names for quick filtering
  const distinctFilterNames = Array.from(new Set(signals.map((s) => s.ruleName).filter(Boolean)));

  const filteredSignals = signals.filter((sig) => {
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
    <div className="space-y-3">
      {/* Top Action & Status Bar (Exact controls from Screenshot 1) */}
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
                <span>[ СТОП ]</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>[ СТАРТ ]</span>
              </>
            )}
          </button>

          {/* CLEAR TABLE Button */}
          <button
            onClick={() => {
              if (signals.length === 0) return;
              if (window.confirm('Очистить всю таблицу зафиксированных сигналов?')) {
                onClearSignals();
              }
            }}
            disabled={signals.length === 0}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span>[ ОЧИСТИТЬ ТАБЛИЦУ ]</span>
          </button>

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 border border-slate-700"
              title="Экспортировать сигналы в файл CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
          )}

          {/* Live signals counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400 font-medium">Сигналов в базе:</span>
            <span className="font-bold font-mono text-emerald-400">{signals.length}</span>
          </div>
        </div>

        {/* Search and Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            {[
              { id: 'ALL', label: 'Все' },
              { id: '1H', label: '1Т' },
              { id: '2H', label: '2Т' },
              { id: 'HT', label: 'HT' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriodFilter(item.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  periodFilter === item.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
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
              <option value="ALL">Все фильтры</option>
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
              placeholder="Поиск по сигналам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* High-density Signals Table (Matches Screenshot 1) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[720px] scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-2.5 text-center font-bold w-12">#</th>
                <th className="py-2.5 px-3 font-bold">Фильтр</th>
                <th className="py-2.5 px-3 font-bold">Страна</th>
                <th className="py-2.5 px-3 font-bold">Лига</th>
                <th className="py-2.5 px-2.5 text-center font-bold">Период</th>
                <th className="py-2.5 px-2 text-center font-bold">Время</th>
                <th className="py-2.5 px-3 font-bold">Хозяева</th>
                <th className="py-2.5 px-3 font-bold">Гости</th>
                <th className="py-2.5 px-2 text-center font-bold text-emerald-400">К1</th>
                <th className="py-2.5 px-2 text-center font-bold text-blue-400">К2</th>
                <th className="py-2.5 px-2 text-center font-bold">Атаки</th>
                <th className="py-2.5 px-2 text-center font-bold">Оп. ат.</th>
                <th className="py-2.5 px-2 text-center font-bold">Удары (ств)</th>
                <th className="py-2.5 px-2 text-center font-bold">Углы</th>
                <th className="py-2.5 px-2 text-center font-bold">ЖК/КК</th>
                <th className="py-2.5 px-3 font-bold text-amber-400">Исход</th>
                <th className="py-2.5 px-3 font-bold text-center text-emerald-400">Статус ставки</th>
                <th className="py-2.5 px-3 font-bold">Telegram / Бот</th>
                <th className="py-2.5 px-2.5 text-center font-bold">Фиксация</th>
                <th className="py-2.5 px-2.5 text-center font-bold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredSignals.length === 0 ? (
                <tr>
                  <td colSpan={20} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="h-7 w-7 text-slate-600" />
                      <span>Нет зафиксированных сигналов в текущей сессии</span>
                      <span className="text-[11px] text-slate-600">
                        {isMonitoringActive
                          ? 'Сканер запущен: при срабатывании фильтра новая строка сразу появится здесь'
                          : 'Нажмите [ СТАРТ ] для запуска сканирования live-матчей'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSignals.map((sig, idx) => {
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
                  const sot =
                    sig.statsSnapshot?.shotsOnTarget ?? matchObj?.stats.shotsOnTarget ?? [0, 0];
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

                  // Reverse sequential index (e.g. 52, 53, 54 like in Screenshot 1)
                  const signalIndex = signals.length - idx;

                  const navigateToThisMatch = () => {
                    if (onNavigateToMatch) {
                      onNavigateToMatch(sig.matchId, sig.matchName, sig);
                    } else if (onSelectMatch && matchObj) {
                      onSelectMatch(matchObj);
                    }
                  };

                  return (
                    <tr
                      key={sig.id}
                      className="hover:bg-slate-800/60 transition cursor-pointer group"
                      onClick={navigateToThisMatch}
                      title="Нажмите на строку для мгновенного перехода к данному матчу"
                    >
                      {/* # Number */}
                      <td className="py-2.5 px-2.5 text-center font-mono text-[11px] text-slate-400 group-hover:text-white">
                        {signalIndex}
                      </td>

                      {/* Filter Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-white group-hover:text-emerald-400 transition">
                          {sig.ruleName || 'NoName'}
                        </span>
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

                      {/* Minute */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-400 whitespace-nowrap">
                        {sig.minute}'
                      </td>

                      {/* Home Team */}
                      <td className="py-2.5 px-3 font-semibold text-white max-w-[150px] truncate" title={homeTeam}>
                        {homeTeam}
                      </td>

                      {/* Away Team */}
                      <td className="py-2.5 px-3 font-semibold text-white max-w-[150px] truncate" title={awayTeam}>
                        {awayTeam}
                      </td>

                      {/* Home Score */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400 text-sm">
                        {homeScore}
                      </td>

                      {/* Away Score */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-400 text-sm">
                        {awayScore}
                      </td>

                      {/* Attacks */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-300 whitespace-nowrap">
                        {attacks[0]}:{attacks[1]}
                      </td>

                      {/* Dangerous Attacks */}
                      <td className="py-2.5 px-2 text-center font-mono text-amber-300 whitespace-nowrap font-bold">
                        {dangAttacks[0]}:{dangAttacks[1]}
                      </td>

                      {/* Shots on Target */}
                      <td className="py-2.5 px-2 text-center font-mono text-rose-300 whitespace-nowrap font-bold">
                        {sot[0]}:{sot[1]}
                      </td>

                      {/* Corners */}
                      <td className="py-2.5 px-2 text-center font-mono text-cyan-300 whitespace-nowrap">
                        {corners[0]}:{corners[1]}
                      </td>

                      {/* Yellow / Red Cards */}
                      <td className="py-2.5 px-2 text-center font-mono text-[11px] whitespace-nowrap">
                        <span className="text-yellow-400">{yc[0] + yc[1]}</span>
                        {rc[0] + rc[1] > 0 && (
                          <span className="text-rose-400 font-bold ml-1">/ {rc[0] + rc[1]}🟥</span>
                        )}
                      </td>

                      {/* Market Suggestion */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black text-xs shadow-sm">
                          <Target className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="tracking-wide">{sig.marketSuggestion || 'ТБ 0.5'}</span>
                        </div>
                      </td>

                      {/* Bet Outcome (Зашел / Минус / Возврат / В игре) */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateOutcome?.(sig.id, 'WIN')}
                            title="Отметить ставку как выигранную"
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                              sig.outcome === 'WIN'
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-emerald-300'
                            }`}
                          >
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>Зашел</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateOutcome?.(sig.id, 'LOSS')}
                            title="Отметить ставку как проигранную"
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                              sig.outcome === 'LOSS'
                                ? 'bg-rose-500 text-white font-black shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-rose-300'
                            }`}
                          >
                            <XCircle className="h-2.5 w-2.5" />
                            <span>Минус</span>
                          </button>
                          {sig.outcome === 'REFUND' ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-bold">
                              Возврат
                            </span>
                          ) : sig.outcome === 'PENDING' ? (
                            <span className="text-[10px] text-amber-400 font-mono">
                              ⏳ В игре
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Telegram / Bot Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border ${
                              sig.sentToTelegram
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <Send className="h-2.5 w-2.5" />
                            <span>{sig.sentToTelegram ? 'Отправлен' : 'Локально'}</span>
                          </span>
                          {sig.botName && (
                            <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-0.5" title={sig.botName}>
                              <Bot className="h-3 w-3 text-cyan-400" />
                              <span className="max-w-[75px] truncate">{sig.botName}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Captured Time */}
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
                              className="p-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition"
                              title="Открыть AI-анализ этого матча"
                            >
                              <Sparkles className="h-3 w-3 text-indigo-400" />
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
