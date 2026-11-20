import React, { useMemo, useState } from 'react';
import { Match } from '../types';
import {
  XgCalculatorInput,
  XgCalculatorResult,
  calculateXgDeficitFairOdds,
  computeXgDeficitReadiness,
  extractXgCalculatorInputFromMatch,
  rankLiveMatchesForXgCalculator,
} from '../utils/xgCalculator';

interface XgDeficitProgressIndicatorProps {
  /** Direct pre-computed input/result (e.g. inside XgFairOddsCalculatorView) */
  input?: XgCalculatorInput;
  result?: XgCalculatorResult;
  /** Currently inspected match in the main Live Scanner */
  selectedMatch?: Match | null;
  /** All available live matches to pick the closest candidate automatically */
  liveMatches?: Match[];
  /** Target xG-deficit threshold (default 0.90) */
  targetDeficit?: number;
  /** Compact variant for narrow sidebar strategy cards */
  compact?: boolean;
}

const RULE_SHORT_LABELS = ['Окно', 'Счёт', 'xG', 'Штурм', 'Value'];

function progressVar(pct: number): React.CSSProperties {
  const ratio = Math.min(1, Math.max(0, pct / 100));
  return { '--xg-progress': String(ratio) } as React.CSSProperties;
}

export const XgDeficitProgressIndicator: React.FC<XgDeficitProgressIndicatorProps> = ({
  input: directInput,
  result: directResult,
  selectedMatch,
  liveMatches = [],
  targetDeficit = 0.9,
  compact = false,
}) => {
  const [sourceChoice, setSourceChoice] = useState<'current' | 'top'>('current');

  const isSelectedFootballLive = Boolean(
    selectedMatch &&
      (selectedMatch.sport || 'football') === 'football' &&
      selectedMatch.status === 'LIVE' &&
      selectedMatch.minute >= 1
  );

  const topLiveCandidate = useMemo(() => {
    if (directInput && directResult) return null;
    const ranked = rankLiveMatchesForXgCalculator(liveMatches);
    return ranked.length > 0 ? ranked[0] : null;
  }, [directInput, directResult, liveMatches]);

  const selectedEvaluated = useMemo(() => {
    if (directInput && directResult) return null;
    if (!isSelectedFootballLive || !selectedMatch) return null;
    const extracted = extractXgCalculatorInputFromMatch(selectedMatch);
    return {
      match: selectedMatch,
      input: extracted,
      result: calculateXgDeficitFairOdds(extracted),
    };
  }, [directInput, directResult, isSelectedFootballLive, selectedMatch]);

  const canSwitchSource = Boolean(
    !directInput &&
      selectedEvaluated &&
      topLiveCandidate &&
      selectedEvaluated.match.id !== topLiveCandidate.match.id
  );

  const resolved = useMemo(() => {
    if (directInput && directResult) {
      return {
        input: directInput,
        result: directResult,
        label: directInput.matchLabel || 'Текущий матч',
        sourceTag: null as string | null,
      };
    }

    const useSelected =
      selectedEvaluated && (sourceChoice === 'current' || !topLiveCandidate);
    const active = useSelected ? selectedEvaluated : topLiveCandidate;
    if (!active) return null;

    return {
      input: active.input,
      result: active.result,
      label: `${active.match.homeTeam} — ${active.match.awayTeam}`,
      sourceTag: useSelected ? 'Текущий матч' : 'Лидер Live',
    };
  }, [directInput, directResult, selectedEvaluated, topLiveCandidate, sourceChoice]);

  if (!resolved) {
    if (compact) {
      return (
        <div className="pt-1.5 border-t border-slate-800/70 text-[10px] text-slate-500">
          Ожидание Live-матчей для расчёта xG-долга
        </div>
      );
    }
    return (
      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
        Нет активных футбольных Live-матчей для расчёта соответствия критериям «xG-Долг и Регрессия Давления».
      </div>
    );
  }

  const metrics = computeXgDeficitReadiness(resolved.input, resolved.result, targetDeficit);

  // Smooth progression from neutral -> warming -> approaching -> alert (threshold reached)
  const isThresholdReached = metrics.xgDeficitPct >= 100;
  const isNearThreshold = !isThresholdReached && metrics.xgDeficitPct >= 75;
  const isWarming = !isThresholdReached && !isNearThreshold && metrics.xgDeficitPct >= 45;

  const barColorClass = isThresholdReached
    ? 'bg-rose-500 xg-progress-fill--alert'
    : isNearThreshold
    ? 'bg-orange-500'
    : isWarming
    ? 'bg-amber-400'
    : 'bg-slate-500';

  const statusTextClass = isThresholdReached
    ? 'text-rose-400'
    : isNearThreshold
    ? 'text-orange-400'
    : isWarming
    ? 'text-amber-300'
    : 'text-slate-400';

  const deficitSign = metrics.currentDeficit >= 0 ? '+' : '';

  if (compact) {
    return (
      <div className="pt-2 border-t border-slate-800/70 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums">
          <span className="text-slate-400 truncate font-sans">
            xG-долг ({resolved.input.minute}&apos; · {resolved.input.homeGoals}:{resolved.input.awayGoals})
          </span>
          <span className={`font-bold shrink-0 transition-colors duration-500 ${statusTextClass}`}>
            {deficitSign}
            {metrics.currentDeficit.toFixed(2)} / +{metrics.targetDeficit.toFixed(2)} ({metrics.overallReadinessPct}%)
          </span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden"
          role="progressbar"
          aria-valuenow={metrics.xgDeficitPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Прогресс xG-долга относительно целевого порога"
        >
          <div
            className={`xg-progress-fill rounded-full ${barColorClass}`}
            style={progressVar(metrics.xgDeficitPct)}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`xg-indicator-card p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-left ${
        isThresholdReached ? 'xg-indicator-card--alert' : ''
      }`}
      data-testid="xg-deficit-progress-indicator"
      data-threshold-reached={isThresholdReached ? 'true' : 'false'}
    >
      {/* Top Header: Match Context + Overall Readiness */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-200 truncate">{resolved.label}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums shrink-0 text-slate-300">
              {resolved.input.minute}&apos; ({resolved.input.homeGoals}:{resolved.input.awayGoals})
            </span>
          </div>
          {canSwitchSource && (
            <div className="flex items-center gap-2 mt-1 text-[10px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSourceChoice('current');
                }}
                className={`transition cursor-pointer ${
                  sourceChoice === 'current'
                    ? 'text-emerald-400 font-semibold underline underline-offset-2'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Выбранный матч
              </button>
              <span className="text-slate-600" aria-hidden="true">
                /
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSourceChoice('top');
                }}
                className={`transition cursor-pointer ${
                  sourceChoice === 'top'
                    ? 'text-emerald-400 font-semibold underline underline-offset-2'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Лидер Live
              </button>
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className={`text-xs font-mono tabular-nums font-bold transition-colors duration-500 ${statusTextClass}`}>
            {metrics.overallReadinessPct}% · {metrics.statusLabel}
          </div>
          <div className="text-[10px] text-slate-500">
            {isThresholdReached ? 'Порог xG-долга пробит' : 'Соответствие критериям'}
          </div>
        </div>
      </div>

      {/* Primary Graphical Bar: xG-Debt vs Target Threshold */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">xG-долг относительно цели</span>
          <span className={`font-mono tabular-nums font-semibold transition-colors duration-500 ${isThresholdReached ? 'text-rose-300' : 'text-slate-200'}`}>
            {deficitSign}
            {metrics.currentDeficit.toFixed(2)}{' '}
            <span className="text-slate-500">/ +{metrics.targetDeficit.toFixed(2)} xG</span>
          </span>
        </div>

        <div className="relative">
          <div
            className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden"
            role="progressbar"
            aria-valuenow={metrics.xgDeficitPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Текущий xG-долг относительно целевого порога"
          >
            <div
              className={`xg-progress-fill rounded-full ${barColorClass}`}
              style={progressVar(metrics.xgDeficitPct)}
            />
          </div>
          {/* Target threshold tick */}
          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500 mt-1">
            <span>0.00</span>
            <span className={`transition-colors duration-500 ${isThresholdReached ? 'text-rose-400 font-semibold' : ''}`}>
              {resolved.result.maxTeamDeficit >= 0.9
                ? `Инд. долг +${resolved.result.maxTeamDeficit.toFixed(2)} (порог ≥ 0.90)`
                : isThresholdReached
                ? `Порог достигнут (${metrics.xgDeficitPct}%)`
                : `Выполнено ${metrics.xgDeficitPct}%`}
            </span>
            <span className="text-slate-400">Цель +{metrics.targetDeficit.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sub-Criteria Mini Graphical Progress Row */}
      <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
        {/* Shots on Target */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
            <span className="font-sans text-slate-400">В створ</span>
            <span
              className={`transition-colors duration-300 ${
                metrics.shotsOnTarget >= metrics.targetShotsOnTarget
                  ? 'text-rose-400 font-semibold'
                  : 'text-slate-300'
              }`}
            >
              {metrics.shotsOnTarget}/{metrics.targetShotsOnTarget}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`xg-progress-fill rounded-full ${
                metrics.shotsOnTarget >= metrics.targetShotsOnTarget
                  ? 'bg-rose-500'
                  : metrics.shotsOnTargetPct >= 65
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
              style={progressVar(metrics.shotsOnTargetPct)}
            />
          </div>
        </div>

        {/* Dangerous Attacks / 15m */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
            <span className="font-sans text-slate-400">ОА / 15м</span>
            <span
              className={`transition-colors duration-300 ${
                metrics.dangerousAttacks15m >= metrics.targetDangerousAttacks15m
                  ? 'text-rose-400 font-semibold'
                  : 'text-slate-300'
              }`}
            >
              {metrics.dangerousAttacks15m}/{metrics.targetDangerousAttacks15m}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`xg-progress-fill rounded-full ${
                metrics.dangerousAttacks15m >= metrics.targetDangerousAttacks15m
                  ? 'bg-rose-500'
                  : metrics.dangerousAttacksPct >= 65
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
              style={progressVar(metrics.dangerousAttacksPct)}
            />
          </div>
        </div>

        {/* 5-Rule Segmented Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
            <span className="font-sans text-slate-400">Фильтры</span>
            <span
              className={`transition-colors duration-300 ${
                resolved.result.passedRulesCount === 5
                  ? 'text-rose-400 font-semibold'
                  : 'text-slate-300'
              }`}
            >
              {resolved.result.passedRulesCount}/5
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 h-1.5">
            {resolved.result.rules.map((rule, idx) => (
              <div
                key={rule.id}
                title={`${RULE_SHORT_LABELS[idx] || rule.title}: ${rule.passed ? 'выполнено' : 'не выполнено'}`}
                className={`h-full rounded-sm transition-colors duration-500 ${
                  rule.passed
                    ? resolved.result.passedRulesCount === 5
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
