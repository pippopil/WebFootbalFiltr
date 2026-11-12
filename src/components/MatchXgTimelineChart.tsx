import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Flame,
  Target,
  BarChart3,
  LineChart as LineChartIcon,
  Sparkles,
  Info,
  ShieldAlert,
  Award,
  Zap,
} from 'lucide-react';
import { Match } from '../types';

interface MatchXgTimelineChartProps {
  match: Match;
}

export type XgChartDisplayType = 'line' | 'bar';
export type TimelineMetricMode = 'cumulative' | 'danger' | 'shots';

export interface TimelinePoint {
  minute: number;
  minuteLabel: string;
  homeXgCum: number;
  awayXgCum: number;
  homeThreat: number;
  awayThreat: number;
  homeShotXg?: number;
  awayShotXg?: number;
  homeStepXg: number;
  awayStepXg: number;
  isGoal?: 'home' | 'away' | null;
  eventDescription?: string;
  isBigChance?: boolean;
}

/**
 * Deterministically generates minute-by-minute xG progression and attack danger timeline
 * for a match based on live statistics, momentum, shots, and score.
 */
export function buildXgTimeline(match: Match): TimelinePoint[] {
  const currentMinute = Math.min(Math.max(match.minute || 1, 1), 90);
  const targetHomeXg = match.stats?.xg ? Number(match.stats.xg[0]) : 1.25;
  const targetAwayXg = match.stats?.xg ? Number(match.stats.xg[1]) : 0.85;
  const homeGoals = match.score ? match.score[0] : 0;
  const awayGoals = match.score ? match.score[1] : 0;

  // Use match ID as a seed for stable point distribution across renders
  let seed = 0;
  for (let i = 0; i < match.id.length; i++) {
    seed = (seed << 5) - seed + match.id.charCodeAt(i);
    seed |= 0;
  }
  const pseudoRand = (offset: number) => {
    const x = Math.sin(Math.abs(seed) + offset * 133.7) * 10000;
    return x - Math.floor(x);
  };

  // Assign approximate goal minutes if goals were scored
  const homeGoalMinutes: number[] = [];
  for (let g = 0; g < homeGoals; g++) {
    const min = Math.floor(12 + pseudoRand(g * 7 + 1) * (currentMinute - 15));
    homeGoalMinutes.push(Math.max(5, Math.min(currentMinute, min)));
  }
  homeGoalMinutes.sort((a, b) => a - b);

  const awayGoalMinutes: number[] = [];
  for (let g = 0; g < awayGoals; g++) {
    const min = Math.floor(18 + pseudoRand(g * 9 + 5) * (currentMinute - 20));
    awayGoalMinutes.push(Math.max(5, Math.min(currentMinute, min)));
  }
  awayGoalMinutes.sort((a, b) => a - b);

  // Generate 5-minute time steps up to currentMinute (or 90' if FT)
  const stepMinutes: number[] = [];
  for (let m = 0; m <= currentMinute; m += (m < 85 ? 5 : 2)) {
    stepMinutes.push(m);
  }
  if (!stepMinutes.includes(currentMinute)) {
    stepMinutes.push(currentMinute);
    stepMinutes.sort((a, b) => a - b);
  }

  // Pre-calculate weight distribution per step to reach target xG
  const stepWeightsHome: number[] = [];
  const stepWeightsAway: number[] = [];
  let sumHomeWeight = 0;
  let sumAwayWeight = 0;

  stepMinutes.forEach((m, idx) => {
    if (m === 0) {
      stepWeightsHome.push(0);
      stepWeightsAway.push(0);
      return;
    }

    // Correlate with match momentum if available
    let momentumFactor = 1.0;
    if (match.momentum && match.momentum.length > 0) {
      const momIdx = Math.min(idx, match.momentum.length - 1);
      momentumFactor = Math.max(0.2, (match.momentum[momIdx] || 50) / 50);
    }

    // Check if a goal was scored near this minute
    const hasHomeGoal = homeGoalMinutes.some((gm) => Math.abs(gm - m) <= 3);
    const hasAwayGoal = awayGoalMinutes.some((gm) => Math.abs(gm - m) <= 3);

    const baseHome = (pseudoRand(m * 3 + 1) * 0.8 + 0.2) * momentumFactor;
    const baseAway = (pseudoRand(m * 3 + 2) * 0.8 + 0.2) / momentumFactor;

    const finalHomeW = hasHomeGoal ? baseHome + 2.5 : baseHome;
    const finalAwayW = hasAwayGoal ? baseAway + 2.5 : baseAway;

    stepWeightsHome.push(finalHomeW);
    stepWeightsAway.push(finalAwayW);
    sumHomeWeight += finalHomeW;
    sumAwayWeight += finalAwayW;
  });

  let runningHomeXg = 0;
  let runningAwayXg = 0;

  const points: TimelinePoint[] = stepMinutes.map((m, idx) => {
    if (m === 0) {
      return {
        minute: 0,
        minuteLabel: "0'",
        homeXgCum: 0,
        awayXgCum: 0,
        homeThreat: 0,
        awayThreat: 0,
        homeStepXg: 0,
        awayStepXg: 0,
      };
    }

    const homeShare = sumHomeWeight > 0 ? (stepWeightsHome[idx] / sumHomeWeight) * targetHomeXg : 0;
    const awayShare = sumAwayWeight > 0 ? (stepWeightsAway[idx] / sumAwayWeight) * targetAwayXg : 0;

    runningHomeXg += homeShare;
    runningAwayXg += awayShare;

    // Ensure we don't exceed target xG prematurely
    const homeClamped = Number(Math.min(targetHomeXg, runningHomeXg).toFixed(2));
    const awayClamped = Number(Math.min(targetAwayXg, runningAwayXg).toFixed(2));

    const isHomeGoal = homeGoalMinutes.includes(m);
    const isAwayGoal = awayGoalMinutes.includes(m);

    // Threat intensity (rolling 0-100 danger index)
    const homeThreat = Math.min(100, Math.round(homeShare * 140 + pseudoRand(m + 10) * 20));
    const awayThreat = Math.min(100, Math.round(awayShare * 140 + pseudoRand(m + 20) * 20));

    const isBig = homeShare >= 0.25 || awayShare >= 0.25;

    let eventDescription: string | undefined = undefined;
    if (isHomeGoal) {
      eventDescription = `⚽ ГОЛ! ${match.homeTeam} (${homeClamped} xG)`;
    } else if (isAwayGoal) {
      eventDescription = `⚽ ГОЛ! ${match.awayTeam} (${awayClamped} xG)`;
    } else if (homeShare >= 0.25) {
      eventDescription = `🔥 Опаснейший момент ${match.homeTeam} (+${homeShare.toFixed(2)} xG)`;
    } else if (awayShare >= 0.25) {
      eventDescription = `🔥 Опаснейший момент ${match.awayTeam} (+${awayShare.toFixed(2)} xG)`;
    } else if (homeShare > 0.12) {
      eventDescription = `Удар ${match.homeTeam} (+${homeShare.toFixed(2)} xG)`;
    } else if (awayShare > 0.12) {
      eventDescription = `Удар ${match.awayTeam} (+${awayShare.toFixed(2)} xG)`;
    }

    return {
      minute: m,
      minuteLabel: `${m}'`,
      homeXgCum: homeClamped,
      awayXgCum: awayClamped,
      homeThreat,
      awayThreat,
      homeStepXg: Number(homeShare.toFixed(2)),
      awayStepXg: Number(awayShare.toFixed(2)),
      homeShotXg: homeShare > 0.08 ? Number(homeShare.toFixed(2)) : undefined,
      awayShotXg: awayShare > 0.08 ? Number(awayShare.toFixed(2)) : undefined,
      isGoal: isHomeGoal ? 'home' : isAwayGoal ? 'away' : null,
      eventDescription,
      isBigChance: isBig,
    };
  });

  // Make sure final point matches actual current xG exactly
  if (points.length > 0) {
    const last = points[points.length - 1];
    last.homeXgCum = Number(targetHomeXg.toFixed(2));
    last.awayXgCum = Number(targetAwayXg.toFixed(2));
  }

  return points;
}

export const MatchXgTimelineChart: React.FC<MatchXgTimelineChartProps> = ({ match }) => {
  const [displayType, setDisplayType] = useState<XgChartDisplayType>('line');
  const [metricMode, setMetricMode] = useState<TimelineMetricMode>('cumulative');

  const timelineData = useMemo(() => buildXgTimeline(match), [match]);

  const homeXg = match.stats?.xg ? Number(match.stats.xg[0]) : 0;
  const awayXg = match.stats?.xg ? Number(match.stats.xg[1]) : 0;
  const homeGoals = match.score ? match.score[0] : 0;
  const awayGoals = match.score ? match.score[1] : 0;

  const totalShotsHome = (match.stats.shotsOnTarget?.[0] || 0) + (match.stats.shotsOffTarget?.[0] || 0);
  const totalShotsAway = (match.stats.shotsOnTarget?.[1] || 0) + (match.stats.shotsOffTarget?.[1] || 0);

  const homeXgPerShot = totalShotsHome > 0 ? (homeXg / totalShotsHome).toFixed(2) : '0.00';
  const awayXgPerShot = totalShotsAway > 0 ? (awayXg / totalShotsAway).toFixed(2) : '0.00';

  const xgDiff = Number((homeXg - awayXg).toFixed(2));
  const goalDiff = homeGoals - awayGoals;

  // Efficiency delta (Actual goals vs expected goals)
  const homeOverperformance = Number((homeGoals - homeXg).toFixed(2));
  const awayOverperformance = Number((awayGoals - awayXg).toFixed(2));

  // Count high-threat / big chances (>0.25 xG)
  const homeBigChances = timelineData.filter((p) => p.homeStepXg >= 0.22).length;
  const awayBigChances = timelineData.filter((p) => p.awayStepXg >= 0.22).length;

  // Danger leader detection
  const dangerLeader: 'home' | 'away' | 'equal' =
    xgDiff > 0.35 ? 'home' : xgDiff < -0.35 ? 'away' : 'equal';

  const leaderTeamName = dangerLeader === 'home' ? match.homeTeam : match.awayTeam;

  return (
    <div
      id="match-inspector-xg-section"
      className="bg-slate-950/85 border border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-4 shadow-lg backdrop-blur-sm"
    >
      {/* Header with Title & View Switchers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>Сравнение накопленного xG</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {match.minute}' LIVE
              </span>
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Динамика создания голевых моментов и накопления ожидаемых голов (Expected Goals)
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Linear vs Bar Toggle Button */}
          <div className="inline-flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5 text-xs">
            <button
              id="match-xg-toggle-line-btn"
              type="button"
              onClick={() => setDisplayType('line')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 font-bold ${
                displayType === 'line'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Переключить на линейный график (Area/Line)"
            >
              <LineChartIcon className="h-3.5 w-3.5" />
              <span>Линейный</span>
            </button>
            <button
              id="match-xg-toggle-bar-btn"
              type="button"
              onClick={() => setDisplayType('bar')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 font-bold ${
                displayType === 'bar'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Переключить на столбчатый график (Bar/Columns)"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Столбчатый</span>
            </button>
          </div>

          {/* Metric Selector (Cumulative xG vs Danger Threat vs Shot xG) */}
          <div className="inline-flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMetricMode('cumulative')}
              className={`px-2 py-1 rounded-lg transition ${
                metricMode === 'cumulative'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Накопленная сумма xG по ходу матча"
            >
              Накопленный xG
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('danger')}
              className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${
                metricMode === 'danger'
                  ? 'bg-slate-800 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Уровень опасности и давления атак"
            >
              <Flame className="h-3 w-3 text-amber-400" />
              <span>Опасность</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('shots')}
              className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${
                metricMode === 'shots'
                  ? 'bg-slate-800 text-sky-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Вес каждого удара/момента"
            >
              <Target className="h-3 w-3 text-sky-400" />
              <span>Удары</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Verdict Banner: Кто создавал более опасные моменты */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
          dangerLeader === 'home'
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            : dangerLeader === 'away'
            ? 'bg-sky-950/30 border-sky-500/40 text-sky-200'
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              dangerLeader === 'home'
                ? 'bg-emerald-500/20 text-emerald-400'
                : dangerLeader === 'away'
                ? 'bg-sky-500/20 text-sky-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {dangerLeader !== 'equal' ? <Zap className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Кто создавал более опасные моменты:
            </div>
            <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 flex-wrap">
              {dangerLeader === 'home' ? (
                <>
                  <span className="text-emerald-400 font-bold">{match.homeTeam}</span>
                  <span className="text-slate-300 font-normal">доминирует по остроте</span>
                  <span className="font-mono text-emerald-300 font-extrabold">(+{Math.abs(xgDiff)} xG)</span>
                </>
              ) : dangerLeader === 'away' ? (
                <>
                  <span className="text-sky-400 font-bold">{match.awayTeam}</span>
                  <span className="text-slate-300 font-normal">доминирует по остроте</span>
                  <span className="font-mono text-sky-300 font-extrabold">(+{Math.abs(xgDiff)} xG)</span>
                </>
              ) : (
                <>
                  <span className="text-slate-200 font-bold">Паритет по моментам:</span>
                  <span className="text-slate-400 font-normal">сопоставимая острота атак у ворот</span>
                  <span className="font-mono text-slate-300 font-bold">(разница {Math.abs(xgDiff)} xG)</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-sans">Острые шансы (&gt;0.22 xG)</span>
            <span className="font-bold">
              <span className="text-emerald-400">{homeBigChances}</span> : <span className="text-sky-400">{awayBigChances}</span>
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-sans">Счёт vs xG</span>
            <span className="font-bold text-white">
              {homeGoals}:{awayGoals} <span className="text-slate-400 text-[10px]">({homeXg.toFixed(1)}:{awayXg.toFixed(1)})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main KPI Badges Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Home Team xG Card */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-2.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="truncate font-semibold text-emerald-300">{match.homeTeam}</span>
            <span className="font-mono text-emerald-400 text-[10px]">Хозяева</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-white">
              {homeXg.toFixed(2)} <span className="text-xs font-normal text-slate-400">xG</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-400">
              {homeGoals} гол(а)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800">
            <span>Качество удара:</span>
            <span className="font-mono text-slate-200 font-semibold">{homeXgPerShot} xG/уд</span>
          </div>
        </div>

        {/* Away Team xG Card */}
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-xl p-2.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="truncate font-semibold text-sky-300">{match.awayTeam}</span>
            <span className="font-mono text-sky-400 text-[10px]">Гости</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-white">
              {awayXg.toFixed(2)} <span className="text-xs font-normal text-slate-400">xG</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-sky-400">
              {awayGoals} гол(а)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800">
            <span>Качество удара:</span>
            <span className="font-mono text-slate-200 font-semibold">{awayXgPerShot} xG/уд</span>
          </div>
        </div>

        {/* xG Advantage Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-1">
          <div className="text-[11px] text-slate-400">Перевес по xG</div>
          <div className="text-xl font-bold font-mono">
            <span
              className={
                xgDiff > 0.3
                  ? 'text-emerald-400'
                  : xgDiff < -0.3
                  ? 'text-sky-400'
                  : 'text-slate-300'
              }
            >
              {xgDiff > 0 ? `+${xgDiff}` : xgDiff}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate pt-0.5 border-t border-slate-800">
            {xgDiff > 0.4
              ? `🔥 Превосходство ${match.homeTeam}`
              : xgDiff < -0.4
              ? `🔥 Превосходство ${match.awayTeam}`
              : 'Равный накал борьбы'}
          </div>
        </div>

        {/* Efficiency Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-1">
          <div className="text-[11px] text-slate-400">Реализация моментов</div>
          <div className="text-sm font-bold font-mono space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 truncate">{match.homeTeam}:</span>
              <span className={homeOverperformance >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                {homeOverperformance >= 0 ? `+${homeOverperformance}` : homeOverperformance}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-sky-400 truncate">{match.awayTeam}:</span>
              <span className={awayOverperformance >= 0 ? 'text-sky-300' : 'text-rose-400'}>
                {awayOverperformance >= 0 ? `+${awayOverperformance}` : awayOverperformance}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-800 truncate">
            {homeOverperformance > 0.5 || awayOverperformance > 0.5
              ? 'Высокая конверсия'
              : 'Норма реализации'}
          </div>
        </div>
      </div>

      {/* Recharts Visualization Area */}
      <div className="h-60 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {metricMode === 'cumulative' ? (
            displayType === 'line' ? (
              // 1. CUMULATIVE LINE / AREA CHART
              <ComposedChart
                data={timelineData}
                margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="homeXgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="awayXgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

                <XAxis
                  dataKey="minute"
                  tickFormatter={(val) => `${val}'`}
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  domain={[0, 'auto']}
                  tickLine={false}
                  tickFormatter={(val) => Number(val).toFixed(1)}
                />

                <Tooltip
                  content={
                    <CustomCumulativeTooltip
                      homeTeam={match.homeTeam}
                      awayTeam={match.awayTeam}
                      isBar={false}
                    />
                  }
                />

                {/* Halftime 45' separator */}
                <ReferenceLine
                  x={45}
                  stroke="#475569"
                  strokeDasharray="2 2"
                  label={{ value: 'HT', fill: '#94a3b8', fontSize: 10, position: 'top' }}
                />

                {/* Home Team Cumulative xG Area */}
                <Area
                  type="monotone"
                  dataKey="homeXgCum"
                  name={match.homeTeam}
                  stroke="#10b981"
                  strokeWidth={2.8}
                  fill="url(#homeXgGrad)"
                  activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#022c22' }}
                />

                {/* Away Team Cumulative xG Area */}
                <Area
                  type="monotone"
                  dataKey="awayXgCum"
                  name={match.awayTeam}
                  stroke="#38bdf8"
                  strokeWidth={2.8}
                  fill="url(#awayXgGrad)"
                  activeDot={{ r: 5, stroke: '#38bdf8', strokeWidth: 2, fill: '#082f49' }}
                />
              </ComposedChart>
            ) : (
              // 2. CUMULATIVE BAR / COLUMN CHART (Side-by-Side per Minute Interval)
              <ComposedChart
                data={timelineData}
                margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

                <XAxis
                  dataKey="minute"
                  tickFormatter={(val) => `${val}'`}
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  domain={[0, 'auto']}
                  tickLine={false}
                  tickFormatter={(val) => Number(val).toFixed(1)}
                />

                <Tooltip
                  content={
                    <CustomCumulativeTooltip
                      homeTeam={match.homeTeam}
                      awayTeam={match.awayTeam}
                      isBar={true}
                    />
                  }
                />

                <ReferenceLine
                  x={45}
                  stroke="#475569"
                  strokeDasharray="2 2"
                  label={{ value: 'HT', fill: '#94a3b8', fontSize: 10, position: 'top' }}
                />

                {/* Home Team Cumulative Bar */}
                <Bar
                  dataKey="homeXgCum"
                  name={match.homeTeam}
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={16}
                />

                {/* Away Team Cumulative Bar */}
                <Bar
                  dataKey="awayXgCum"
                  name={match.awayTeam}
                  fill="#38bdf8"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={16}
                />

                {/* Stepped line comparison overlay */}
                <Line
                  type="monotone"
                  dataKey="homeXgCum"
                  stroke="#059669"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="awayXgCum"
                  stroke="#0284c7"
                  strokeWidth={1.5}
                  dot={false}
                />
              </ComposedChart>
            )
          ) : metricMode === 'danger' ? (
            // DANGER THREAT VIEW
            <ComposedChart
              data={timelineData}
              margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="minute"
                tickFormatter={(val) => `${val}'`}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                domain={[0, 100]}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
              />

              <Tooltip
                content={<CustomDangerTooltip homeTeam={match.homeTeam} awayTeam={match.awayTeam} />}
              />

              <ReferenceLine
                y={70}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{
                  value: 'Штурм (Критическая опасность)',
                  fill: '#f87171',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />
              <ReferenceLine x={45} stroke="#475569" strokeDasharray="2 2" />

              {displayType === 'line' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="homeThreat"
                    name={`${match.homeTeam} (Опасность)`}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="awayThreat"
                    name={`${match.awayTeam} (Опасность)`}
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </>
              ) : (
                <>
                  <Bar
                    dataKey="homeThreat"
                    name={`${match.homeTeam} (Опасность)`}
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={14}
                  />
                  <Bar
                    dataKey="awayThreat"
                    name={`${match.awayTeam} (Опасность)`}
                    fill="#38bdf8"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={14}
                  />
                </>
              )}
            </ComposedChart>
          ) : (
            // SHOT & CHANCE XG PER MOMENT
            <ComposedChart
              data={timelineData}
              margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="minute"
                tickFormatter={(val) => `${val}'`}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                domain={[0, 'auto']}
                tickLine={false}
                tickFormatter={(val) => Number(val).toFixed(2)}
              />

              <Tooltip
                content={<CustomShotTooltip homeTeam={match.homeTeam} awayTeam={match.awayTeam} />}
              />

              <ReferenceLine x={45} stroke="#475569" strokeDasharray="2 2" />

              {displayType === 'line' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="homeStepXg"
                    name={`${match.homeTeam} (Острота шанса)`}
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#10b981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="awayStepXg"
                    name={`${match.awayTeam} (Острота шанса)`}
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#38bdf8' }}
                  />
                </>
              ) : (
                <>
                  <Bar
                    dataKey="homeStepXg"
                    name={`${match.homeTeam} (Острота шанса)`}
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                  />
                  <Bar
                    dataKey="awayStepXg"
                    name={`${match.awayTeam} (Острота шанса)`}
                    fill="#38bdf8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                  />
                </>
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Legend & Explanations */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-200 font-semibold">{match.homeTeam}</span>
            <span className="font-mono text-emerald-400 text-[10px]">({homeXg.toFixed(2)} xG)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-slate-200 font-semibold">{match.awayTeam}</span>
            <span className="font-mono text-sky-400 text-[10px]">({awayXg.toFixed(2)} xG)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Info className="h-3 w-3 text-emerald-400 shrink-0" />
          <span>
            {goalDiff !== 0 && Math.abs(xgDiff) > 0.5 && Math.sign(goalDiff) === Math.sign(xgDiff)
              ? 'Счёт матча закономерно отражает преимущество по xG'
              : goalDiff === 0 && Math.abs(xgDiff) > 0.6
              ? `Ничья вопреки моментам: ${xgDiff > 0 ? match.homeTeam : match.awayTeam} наиграл на гол`
              : 'Обе команды создают сопоставимую опасность у ворот'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Custom Dark Tooltips
// ==========================================

const CustomCumulativeTooltip: React.FC<any> = ({
  active,
  payload,
  label,
  homeTeam,
  awayTeam,
  isBar,
}) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload as TimelinePoint;

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800 font-mono text-[11px] text-slate-400">
        <span>Минута: {label}' {isBar ? '(Столбцы)' : '(Кривая)'}</span>
        {data.eventDescription && (
          <span className="text-amber-400 font-bold truncate max-w-[120px]">{data.eventDescription}</span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-200 font-medium truncate max-w-[110px]">{homeTeam}:</span>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-emerald-400">{data.homeXgCum.toFixed(2)} xG</span>
            {data.homeStepXg > 0 && (
              <span className="text-[10px] font-mono text-emerald-300 ml-1">(+{data.homeStepXg})</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-slate-200 font-medium truncate max-w-[110px]">{awayTeam}:</span>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-sky-400">{data.awayXgCum.toFixed(2)} xG</span>
            {data.awayStepXg > 0 && (
              <span className="text-[10px] font-mono text-sky-300 ml-1">(+{data.awayStepXg})</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>Разница xG:</span>
        <span className="font-mono font-bold text-white">
          {(data.homeXgCum - data.awayXgCum).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

const CustomDangerTooltip: React.FC<any> = ({ active, payload, label, homeTeam, awayTeam }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload as TimelinePoint;

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[180px]">
      <div className="text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-800">
        Опасность атак на {label}' минуте
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-emerald-400 font-medium truncate max-w-[110px]">{homeTeam}:</span>
          <span className="font-mono font-bold text-white">{data.homeThreat}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sky-400 font-medium truncate max-w-[110px]">{awayTeam}:</span>
          <span className="font-mono font-bold text-white">{data.awayThreat}%</span>
        </div>
      </div>
    </div>
  );
};

const CustomShotTooltip: React.FC<any> = ({ active, payload, label, homeTeam, awayTeam }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload as TimelinePoint;

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[180px]">
      <div className="text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-800">
        Острота созданных шансов ({label}')
      </div>
      <div className="space-y-1 font-mono">
        {data.homeStepXg > 0 && (
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-slate-300 font-sans truncate max-w-[100px]">{homeTeam}:</span>
            <span className="font-bold">+{data.homeStepXg.toFixed(2)} xG</span>
          </div>
        )}
        {data.awayStepXg > 0 && (
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-slate-300 font-sans truncate max-w-[100px]">{awayTeam}:</span>
            <span className="font-bold">+{data.awayStepXg.toFixed(2)} xG</span>
          </div>
        )}
        {data.homeStepXg === 0 && data.awayStepXg === 0 && (
          <div className="text-[10px] text-slate-500">Позиционная борьба без ударов</div>
        )}
      </div>
    </div>
  );
};
