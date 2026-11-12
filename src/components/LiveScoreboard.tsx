import React, { useState } from 'react';
import {
  Zap,
  Flame,
  Clock,
  Share2,
  Star,
  Hash,
  TrendingDown,
  Activity,
  Check,
  Radio,
  Copy,
} from 'lucide-react';
import { Match, SportType } from '../types';
import { getMatchTeamCodes } from '../utils/teamCodes';

interface LiveScoreboardProps {
  match: Match;
  onShareResult?: () => void;
  isSharing?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onSearchByCode?: (code: string) => void;
  onSearchById?: (id: string) => void;
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({
  match,
  onShareResult,
  isSharing = false,
  isFavorite = false,
  onToggleFavorite,
  onSearchByCode,
  onSearchById,
}) => {
  const [copiedField, setCopiedField] = useState<'id' | 'code' | 'score' | null>(null);

  const { homeCode, awayCode, matchCode } = getMatchTeamCodes(match);
  const matchSport: SportType = match.sport || 'football';

  const sportEmoji =
    matchSport === 'hockey'
      ? '🏒'
      : matchSport === 'basketball'
      ? '🏀'
      : matchSport === 'tennis'
      ? '🎾'
      : matchSport === 'volleyball'
      ? '🏐'
      : matchSport === 'table_tennis'
      ? '🏓'
      : '⚽';

  const sportLabel =
    matchSport === 'hockey'
      ? 'Хоккей'
      : matchSport === 'basketball'
      ? 'Баскетбол'
      : matchSport === 'tennis'
      ? 'Теннис'
      : matchSport === 'volleyball'
      ? 'Волейбол'
      : matchSport === 'table_tennis'
      ? 'Настольный теннис'
      : 'Футбол';

  const periodLabel = (() => {
    if (match.status === 'PREMATCH') {
      return match.startsInMinutes !== undefined && match.startsInMinutes <= 60
        ? `Начало через ${match.startsInMinutes} мин`
        : match.startTime
        ? `Сегодня в ${match.startTime}`
        : 'Прематч';
    }
    if (match.status === 'HT') return 'Перерыв (HT)';
    if (match.status === 'FT') return 'Матч завершён (FT)';

    if (matchSport === 'hockey') {
      if (match.minute <= 20) return '1-й период';
      if (match.minute <= 40) return '2-й период';
      return '3-й период';
    }
    if (matchSport === 'basketball') {
      if (match.minute <= 10) return '1-я четверть';
      if (match.minute <= 20) return '2-я четверть';
      if (match.minute <= 30) return '3-я четверть';
      return '4-я четверть';
    }
    if (matchSport === 'tennis') {
      return 'Текущий сет';
    }
    if (match.minute <= 45) return '1-й тайм';
    return '2-й тайм';
  })();

  const isLive = match.status === 'LIVE';
  const isHT = match.status === 'HT';
  const isPrematch = match.status === 'PREMATCH';

  const homeScore = isPrematch ? '-' : match.score[0];
  const awayScore = isPrematch ? '-' : match.score[1];

  const possession = match.stats?.possession || [50, 50];
  const dangerousAttacks = match.stats?.dangerousAttacks || [0, 0];
  const shotsOnTarget = match.stats?.shotsOnTarget || [0, 0];
  const corners = match.stats?.corners || [0, 0];
  const redCards = match.stats?.redCards || [0, 0];
  const yellowCards = match.stats?.yellowCards || [0, 0];

  const handleCopyText = (text: string, field: 'id' | 'code' | 'score') => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  return (
    <div
      id="live-scoreboard-display"
      className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 shadow-2xl shadow-emerald-950/40 text-slate-100 font-sans"
    >
      {/* Stadium ambient background elements */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-24 bg-emerald-500/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      {/* Top Bar: League, Sport Badge & Quick Utility Actions */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-base select-none">{match.countryCode}</span>
          <span className="font-semibold text-slate-300 truncate max-w-[140px]">
            {match.country}
          </span>
          <span className="text-slate-600">•</span>
          <span className="font-medium text-slate-400 truncate max-w-[180px]">
            {match.league}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-[10px] font-bold text-slate-300 border border-slate-700/70 inline-flex items-center gap-1">
            <span>{sportEmoji}</span>
            <span>{sportLabel}</span>
          </span>
        </div>

        {/* Quick Actions (Share, Star, Copy ID) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Match ID Pill with copy */}
          <button
            type="button"
            onClick={() => {
              handleCopyText(match.id, 'id');
              onSearchById?.(match.id);
            }}
            className="font-mono text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 transition flex items-center gap-1"
            title="Копировать ID матча"
          >
            {copiedField === 'id' ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Hash className="h-3 w-3 text-slate-400" />
            )}
            <span>ID: {match.id}</span>
          </button>

          {/* Match Ticker Code Pill */}
          <button
            type="button"
            onClick={() => {
              handleCopyText(matchCode, 'code');
              onSearchByCode?.(matchCode);
            }}
            className="font-mono text-[10px] font-bold px-2 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition flex items-center gap-1"
            title="Код матча (нажмите для копирования или поиска)"
          >
            {copiedField === 'code' ? (
              <Check className="h-3 w-3 text-cyan-400" />
            ) : (
              <Activity className="h-3 w-3 text-cyan-400" />
            )}
            <span>{homeCode} vs {awayCode}</span>
          </button>

          {/* Favorite Toggle */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-lg border transition ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border-slate-700'
              }`}
              title={isFavorite ? 'Удалить из избранных' : 'Добавить в избранное'}
            >
              <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          )}

          {/* Share Result Button */}
          {onShareResult && (
            <button
              type="button"
              onClick={onShareResult}
              disabled={isSharing}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              title="Поделиться счётом и карточкой"
            >
              <Share2 className="h-3 w-3 stroke-[2.5]" />
              <span className="hidden sm:inline">Поделиться</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Scoreboard Arena */}
      <div className="relative z-10 py-4 sm:py-6">
        <div className="grid grid-cols-12 items-center gap-3 sm:gap-4">
          {/* Home Team (Cols 1-4) */}
          <div className="col-span-5 text-right flex flex-col items-end justify-center min-w-0 pr-1 sm:pr-2">
            <div className="flex items-center gap-2 mb-1">
              {redCards[0] > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono font-black text-[10px] shadow-sm animate-pulse"
                  title={`Красная карточка (${redCards[0]})`}
                >
                  КК {redCards[0]}
                </span>
              )}
              {yellowCards[0] > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-mono font-black text-[10px]"
                  title={`Желтые карточки (${yellowCards[0]})`}
                >
                  ЖК {yellowCards[0]}
                </span>
              )}
              <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 border border-slate-700">
                {homeCode}
              </span>
            </div>
            <h3 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight line-clamp-2 text-right">
              {match.homeTeam}
            </h3>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Хозяева
            </span>
          </div>

          {/* Central Digital Scoreboard Board (Cols 5-8) */}
          <div className="col-span-2 flex flex-col items-center justify-center">
            {/* LED Digital Display Housing */}
            <div
              onClick={() => handleCopyText(`${match.homeTeam} ${match.score[0]}:${match.score[1]} ${match.awayTeam}`, 'score')}
              className="cursor-pointer group relative flex items-center justify-center px-3 sm:px-6 py-2 sm:py-3 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:border-emerald-400 transition"
              title="Нажмите для копирования счёта матча"
            >
              {/* Score digits */}
              <div className="flex items-center gap-1.5 sm:gap-3 text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight tabular-nums select-all">
                <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.65)]">
                  {homeScore}
                </span>
                <span
                  className={`text-slate-500 text-3xl sm:text-5xl ${
                    isLive ? 'animate-pulse text-emerald-300' : ''
                  }`}
                >
                  :
                </span>
                <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.65)]">
                  {awayScore}
                </span>
              </div>

              {/* Copied tooltip overlay */}
              {copiedField === 'score' && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] whitespace-nowrap shadow-md">
                  Счёт скопирован!
                </div>
              )}
            </div>

            {/* Match Minute / Status Timer Capsule */}
            <div className="mt-2.5 flex flex-col items-center gap-1">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition ${
                  isLive
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 ring-1 ring-rose-500/20'
                    : isHT
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : isPrematch
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
                {isPrematch && <Clock className="h-3 w-3 text-sky-400" />}
                {isHT && <Clock className="h-3 w-3 text-amber-400" />}
                <span>
                  {isPrematch
                    ? match.startTime || 'PRE'
                    : `${match.minute}'`}
                </span>
                <span className="text-[10px] opacity-75 font-sans font-medium">
                  • {periodLabel}
                </span>
              </div>

              {/* Halves or periods breakdown if available */}
              {match.history?.firstHalfScore && (
                <span className="text-[10px] font-mono text-slate-400">
                  1-й тайм: {match.history.firstHalfScore[0]} : {match.history.firstHalfScore[1]}
                </span>
              )}
            </div>
          </div>

          {/* Away Team (Cols 9-12) */}
          <div className="col-span-5 text-left flex flex-col items-start justify-center min-w-0 pl-1 sm:pr-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 border border-slate-700">
                {awayCode}
              </span>
              {yellowCards[1] > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-mono font-black text-[10px]"
                  title={`Желтые карточки (${yellowCards[1]})`}
                >
                  ЖК {yellowCards[1]}
                </span>
              )}
              {redCards[1] > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono font-black text-[10px] shadow-sm animate-pulse"
                  title={`Красная карточка (${redCards[1]})`}
                >
                  КК {redCards[1]}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight line-clamp-2 text-left">
              {match.awayTeam}
            </h3>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Гости
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry Bottom Bar: Possession Bar & Core Metrics */}
      <div className="relative z-10 pt-3 border-t border-slate-800/90 space-y-2.5">
        {/* Possession Ratio Visualizer */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{match.homeTeam}: {possession[0]}%</span>
            </span>
            <span className="text-slate-500 text-[10px] uppercase font-sans font-semibold">Владение мячом</span>
            <span className="flex items-center gap-1.5">
              <span>{possession[1]}% : {match.awayTeam}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${possession[0]}%` }}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            />
            <div
              style={{ width: `${possession[1]}%` }}
              className="bg-slate-700 transition-all duration-500"
            />
          </div>
        </div>

        {/* Live Counters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Опасные атаки:</span>
            <span className="font-mono font-bold text-slate-100">
              {dangerousAttacks[0]} - {dangerousAttacks[1]}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Удары в створ:</span>
            <span className="font-mono font-bold text-emerald-400">
              {shotsOnTarget[0]} - {shotsOnTarget[1]}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Угловые:</span>
            <span className="font-mono font-bold text-cyan-300">
              {corners[0]} - {corners[1]}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Источник:</span>
            <span className="font-semibold text-emerald-400 text-[11px] truncate max-w-[90px]">
              {match.source || 'Flashscore'}
            </span>
          </div>
        </div>

        {/* Smart Money / Odds Drop alert banner if present */}
        {match.oddsDrop && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
            <div className="flex items-center gap-1.5 font-bold truncate">
              <TrendingDown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Прогруз: {match.oddsDrop.marketName}</span>
            </div>
            <div className="flex items-center gap-2 font-mono font-bold shrink-0 text-[11px]">
              <span className="text-rose-400">-{match.oddsDrop.dropPercent}%</span>
              <span className="text-slate-400">|</span>
              <span className="text-amber-200">{match.oddsDrop.moneyVolumePercent}% объёма</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
