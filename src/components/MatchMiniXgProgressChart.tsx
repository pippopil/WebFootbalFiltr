import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Activity } from 'lucide-react';
import { Match } from '../types';
import { buildXgTimeline } from './MatchXgTimelineChart';

interface MatchMiniXgProgressChartProps {
  match: Match;
}

export const MatchMiniXgProgressChart: React.FC<MatchMiniXgProgressChartProps> = ({ match }) => {
  const homeXg = Number(match.stats?.xg?.[0] ?? 0);
  const awayXg = Number(match.stats?.xg?.[1] ?? 0);
  const totalXg = homeXg + awayXg;
  const homeShare = totalXg > 0 ? Math.round((homeXg / totalXg) * 100) : 50;
  const awayShare = totalXg > 0 ? 100 - homeShare : 50;

  const progressPoints = useMemo(() => buildXgTimeline(match), [match]);

  const balanceRow = useMemo(
    () => [
      {
        name: 'xG',
        home: Number(homeXg.toFixed(2)),
        away: Number(awayXg.toFixed(2)),
      },
    ],
    [homeXg, awayXg]
  );

  return (
    <div
      id="match-inspector-mini-xg-chart"
      className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 space-y-2.5"
    >
      {/* Compact Header with Exact selectedMatch.stats.xg Values */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Мини-график xG (прогресс)</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
          <span className="text-emerald-400">{homeXg.toFixed(2)}</span>
          <span className="text-slate-600">:</span>
          <span className="text-blue-400">{awayXg.toFixed(2)}</span>
          <span className="text-[10px] text-slate-500 font-normal ml-0.5">
            (Σ {totalXg.toFixed(2)})
          </span>
        </div>
      </div>

      {/* Recharts Horizontal xG Progress Split Bar */}
      <div className="h-4 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={balanceRow}
            layout="vertical"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            barSize={8}
          >
            <XAxis type="number" domain={[0, totalXg > 0 ? totalXg : 1]} hide />
            <YAxis type="category" dataKey="name" hide />
            <Bar
              dataKey="home"
              stackId="xg"
              fill="#10b981"
              radius={[4, 0, 0, 4]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="away"
              stackId="xg"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recharts Mini xG Progression Area Sparkline */}
      <div className="h-20 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={progressPoints}
            margin={{ top: 4, right: 6, left: 6, bottom: 0 }}
          >
            <defs>
              <linearGradient id="miniHomeXgFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="miniAwayXgFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="minute"
              tickFormatter={(v) => `${v}'`}
              stroke="#475569"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as { homeXgCum: number; awayXgCum: number };
                return (
                  <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] shadow-xl space-y-0.5">
                    <div className="font-mono text-[10px] text-slate-400">{label}&apos; мин</div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-emerald-400 truncate max-w-[95px]">{match.homeTeam}:</span>
                      <span className="font-mono font-bold text-white">{pt.homeXgCum.toFixed(2)} xG</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-blue-400 truncate max-w-[95px]">{match.awayTeam}:</span>
                      <span className="font-mono font-bold text-white">{pt.awayXgCum.toFixed(2)} xG</span>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="homeXgCum"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#miniHomeXgFill)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="awayXgCum"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#miniAwayXgFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Team xG Share Summary */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
        <span className="flex items-center gap-1 truncate max-w-[44%]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate text-slate-300">{match.homeTeam}</span>
          <span className="font-mono text-emerald-400 font-semibold">{homeShare}%</span>
        </span>
        <span className="flex items-center gap-1 truncate max-w-[44%] justify-end">
          <span className="font-mono text-blue-400 font-semibold">{awayShare}%</span>
          <span className="truncate text-slate-300">{match.awayTeam}</span>
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
        </span>
      </div>
    </div>
  );
};
