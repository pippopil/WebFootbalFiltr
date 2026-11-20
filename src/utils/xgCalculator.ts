import { FilterRule, Match } from '../types';

export type RedCardStatus = 'none' | 'defending' | 'attacking';

export interface XgCalculatorInput {
  matchLabel?: string;
  minute: number;
  homeGoals: number;
  awayGoals: number;
  homeXg: number;
  awayXg: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  dangerousAttacks15m: number;
  redCardStatus: RedCardStatus;
  bookieOdds: number;
}

export interface XgRuleCheckItem {
  id: string;
  title: string;
  detail: string;
  actualValue: string;
  thresholdText: string;
  passed: boolean;
}

export type XgCalculatorVerdict = 'SIGNAL_VALUE' | 'WATCHLIST' | 'SKIP';

export interface XgCalculatorResult {
  totalGoals: number;
  totalXg: number;
  totalDeficit: number;
  homeDeficit: number;
  awayDeficit: number;
  maxTeamDeficit: number;
  scoreDiff: number;
  totalShotsOnTarget: number;
  remainingMinutes: number;
  pressureMultiplier: number;
  lambdaRem: number;
  goalProbabilityPct: number;
  fairOdds: number;
  bookieImpliedPct: number;
  valueEdgePct: number;
  verdict: XgCalculatorVerdict;
  verdictTitle: string;
  verdictReason: string;
  recommendedMarket: string;
  recommendedStakeText: string;
  passedRulesCount: number;
  rules: XgRuleCheckItem[];
  shareablePostText: string;
}

export interface XgCalculatorPreset {
  id: string;
  label: string;
  badge: string;
  input: XgCalculatorInput;
}

export const XG_CALCULATOR_PRESETS: XgCalculatorPreset[] = [
  {
    id: 'classic-trap',
    label: "Кейс #1: 71' · 0:1 Фаворит давит",
    badge: 'Value +22%',
    input: {
      matchLabel: 'Бавария — Лейпциг',
      minute: 71,
      homeGoals: 0,
      awayGoals: 1,
      homeXg: 1.80,
      awayXg: 0.55,
      homeShotsOnTarget: 6,
      awayShotsOnTarget: 2,
      dangerousAttacks15m: 18,
      redCardStatus: 'none',
      bookieOdds: 2.10,
    },
  },
  {
    id: 'goalless-storm',
    label: "Кейс #2: 73' · 0:0 Скрытый штурм",
    badge: 'Высокий xG-долг',
    input: {
      matchLabel: 'Арсенал — Брайтон',
      minute: 73,
      homeGoals: 0,
      awayGoals: 0,
      homeXg: 1.48,
      awayXg: 0.68,
      homeShotsOnTarget: 5,
      awayShotsOnTarget: 3,
      dangerousAttacks15m: 16,
      redCardStatus: 'none',
      bookieOdds: 2.18,
    },
  },
  {
    id: 'anti-case-skip',
    label: "Кейс #3: 74' · 2:0 Без мотивации",
    badge: 'Пропуск',
    input: {
      matchLabel: 'Ливерпуль — Эвертон',
      minute: 74,
      homeGoals: 2,
      awayGoals: 0,
      homeXg: 1.85,
      awayXg: 0.42,
      homeShotsOnTarget: 5,
      awayShotsOnTarget: 1,
      dangerousAttacks15m: 9,
      redCardStatus: 'none',
      bookieOdds: 1.82,
    },
  },
];

export function calculateXgDeficitFairOdds(input: XgCalculatorInput): XgCalculatorResult {
  const minute = Math.max(1, Math.min(90, Math.round(Number(input.minute) || 1)));
  const homeGoals = Math.max(0, Math.round(Number(input.homeGoals) || 0));
  const awayGoals = Math.max(0, Math.round(Number(input.awayGoals) || 0));
  const homeXg = Math.max(0, Number(input.homeXg) || 0);
  const awayXg = Math.max(0, Number(input.awayXg) || 0);
  const homeShotsOnTarget = Math.max(0, Math.round(Number(input.homeShotsOnTarget) || 0));
  const awayShotsOnTarget = Math.max(0, Math.round(Number(input.awayShotsOnTarget) || 0));
  const dangerousAttacks15m = Math.max(0, Math.round(Number(input.dangerousAttacks15m) || 0));
  const bookieOdds = Math.max(1.01, Number(input.bookieOdds) || 1.01);

  const totalGoals = homeGoals + awayGoals;
  const totalXg = Number((homeXg + awayXg).toFixed(2));
  const totalDeficit = Number((totalXg - totalGoals).toFixed(2));
  const homeDeficit = Number((homeXg - homeGoals).toFixed(2));
  const awayDeficit = Number((awayXg - awayGoals).toFixed(2));
  const maxTeamDeficit = Number(Math.max(homeDeficit, awayDeficit).toFixed(2));
  const scoreDiff = Math.abs(homeGoals - awayGoals);
  const totalShotsOnTarget = homeShotsOnTarget + awayShotsOnTarget;

  // Remaining effective match duration including standard added time (~94')
  const remainingMinutes = Math.max(4, 94 - minute);

  // Pressure adjustment based on accumulated xG debt & red cards
  let pressureMultiplier = 1.0;
  if (totalDeficit >= 0.9 || maxTeamDeficit >= 0.9) {
    pressureMultiplier = 1.15;
  } else if (dangerousAttacks15m >= 14) {
    pressureMultiplier = 1.06;
  }
  if (input.redCardStatus === 'defending') {
    pressureMultiplier *= 1.12;
  } else if (input.redCardStatus === 'attacking') {
    pressureMultiplier *= 0.82;
  }
  pressureMultiplier = Number(pressureMultiplier.toFixed(2));

  // Residual Poisson lambda
  const baseXgPerMin = totalXg / minute;
  const rawLambda = baseXgPerMin * remainingMinutes * pressureMultiplier;
  const lambdaRem = Number(Math.max(0.05, rawLambda).toFixed(2));

  // Probability of >= 1 goal before final whistle: 1 - exp(-lambda)
  const rawProb = 1 - Math.exp(-lambdaRem);
  const clampedProb = Math.min(0.98, Math.max(0.05, rawProb));
  const goalProbabilityPct = Number((clampedProb * 100).toFixed(1));

  // Fair decimal odds vs bookmaker implied probability
  const fairOdds = Number((1 / clampedProb).toFixed(2));
  const bookieImpliedPct = Number(((1 / bookieOdds) * 100).toFixed(1));
  const valueEdgePct = Number((((bookieOdds / fairOdds) - 1) * 100).toFixed(1));

  // 5 Strategy Rules Validation
  const rule1Passed = minute >= 70 && minute <= 76;
  const rule2Passed = scoreDiff <= 1;
  const rule3Passed = totalDeficit >= 0.9 || maxTeamDeficit >= 0.9;
  const rule4Passed =
    totalShotsOnTarget >= 7 && dangerousAttacks15m >= 14 && input.redCardStatus !== 'attacking';
  const rule5Passed = valueEdgePct >= 12 && bookieOdds >= 1.75;

  const rules: XgRuleCheckItem[] = [
    {
      id: 'minute-window',
      title: '1. Временное окно концовки',
      detail: 'До 70\' кэф слишком низкий; после 76\' растёт дисперсия.',
      actualValue: `${minute}'`,
      thresholdText: "70' – 76'",
      passed: rule1Passed,
    },
    {
      id: 'score-corridor',
      title: '2. Мотивационный коридор счёта',
      detail: 'Ничья или минимальный отрыв в 1 гол удерживают темп атак.',
      actualValue: `${homeGoals}:${awayGoals} (Δ ${scoreDiff})`,
      thresholdText: 'Разница ≤ 1 гола',
      passed: rule2Passed,
    },
    {
      id: 'xg-deficit',
      title: '3. Накопленный xG-долг (недобор)',
      detail: 'Сумма xG минус голы ≥ 0.90 ИЛИ индивидуальный долг атакующей команды ≥ 0.90.',
      actualValue: `Общий ${totalDeficit >= 0 ? '+' : ''}${totalDeficit} / Макс ${maxTeamDeficit >= 0 ? '+' : ''}${maxTeamDeficit}`,
      thresholdText: '≥ 0.90',
      passed: rule3Passed,
    },
    {
      id: 'live-assault',
      title: '4. Живой штурм и отсутствие КК у атакующих',
      detail: 'Подтверждение, что xG актуален сейчас, а не набит до перерыва.',
      actualValue: `${totalShotsOnTarget} в створ · ${dangerousAttacks15m} ОА/15м`,
      thresholdText: '≥ 7 створ, ≥ 14 ОА, без КК',
      passed: rule4Passed,
    },
    {
      id: 'value-edge',
      title: '5. Перевес над линией БК (Value)',
      detail: 'Кэф букмекера должен быть выше справедливого минимум на +12%.',
      actualValue: `${bookieOdds.toFixed(2)} (${valueEdgePct >= 0 ? '+' : ''}${valueEdgePct}%)`,
      thresholdText: `≥ ${Math.max(1.75, Number((fairOdds * 1.12).toFixed(2))).toFixed(2)} (+12%)`,
      passed: rule5Passed,
    },
  ];

  const passedRulesCount = rules.filter((r) => r.passed).length;
  const nextGoalLine = totalGoals + 0.5;
  const recommendedMarket =
    homeDeficit >= 0.9 && awayDeficit < 0.5
      ? `ТБ ${nextGoalLine} в матче или ИТБ1 (${homeGoals + 0.5})`
      : awayDeficit >= 0.9 && homeDeficit < 0.5
      ? `ТБ ${nextGoalLine} в матче или ИТБ2 (${awayGoals + 0.5})`
      : `Тотал больше ${nextGoalLine} (следующий гол)`;

  let verdict: XgCalculatorVerdict = 'SKIP';
  let verdictTitle = 'Пропуск матча';
  let verdictReason =
    'Не выполнены базовые статистические условия стратегии или отсутствует математический перевес над линией.';
  let recommendedStakeText = 'Без ставки (0%)';

  if (rule1Passed && rule2Passed && rule3Passed && rule4Passed && rule5Passed) {
    verdict = 'SIGNAL_VALUE';
    verdictTitle = `Вход подтверждён · Value +${valueEdgePct}%`;
    verdictReason = `Вероятность гола до финального свистка (${goalProbabilityPct}%) существенно выше оценки букмекера (${bookieImpliedPct}%).`;
    recommendedStakeText = valueEdgePct >= 20 ? '2.0% от банка флэтом' : '1.5% от банка флэтом';
  } else if (rule2Passed && rule3Passed && rule4Passed && !rule5Passed && minute <= 76) {
    verdict = 'WATCHLIST';
    verdictTitle = 'Матч на карандаше · Ждать роста кэфа';
    verdictReason = `Статистика давления отличная, но текущий кэф ${bookieOdds.toFixed(2)} ещё не даёт +12% перевеса к справедливому ${fairOdds.toFixed(2)}.`;
    recommendedStakeText = `Ожидать кэф ≥ ${Math.max(1.75, Number((fairOdds * 1.12).toFixed(2))).toFixed(2)}`;
  } else if (!rule2Passed) {
    verdictReason = `Разница в счёте ${scoreDiff} гола — высокая вероятность доигрывания и сушки темпа.`;
  } else if (input.redCardStatus === 'attacking') {
    verdictReason = 'Красная карточка у атакующей стороны ломает структуру штурма.';
  } else if (!rule3Passed) {
    verdictReason = `Недостаточный xG-долг (${totalDeficit}): команды уже реализовали свои моменты.`;
  } else if (!rule4Passed) {
    verdictReason = 'Низкая текущая острота ударов или мало опасных атак за последние 15 минут.';
  } else if (!rule1Passed) {
    verdictReason =
      minute < 70
        ? `Минута ${minute}' — слишком рано, кэф ещё не дошёл до рабочей зоны 70'–76'.`
        : `Минута ${minute}' — позднее 76', слишком высокая дисперсия остатка времени.`;
  }

  const labelStr = input.matchLabel?.trim() || 'Live-матч';
  const shareablePostText =
    `📊 Разбор по стратегии «xG-Долг 70'–76'»: ${labelStr}\n` +
    `⏱ ${minute}' мин · Счёт ${homeGoals}:${awayGoals} · xG ${homeXg.toFixed(2)}:${awayXg.toFixed(2)} (долг +${totalDeficit})\n` +
    `🎯 Удары в створ: ${homeShotsOnTarget}:${awayShotsOnTarget} · ОА за 15м: ${dangerousAttacks15m}\n` +
    `📐 Справедливый кэф: ${fairOdds.toFixed(2)} (${goalProbabilityPct}%) vs Линия БК: ${bookieOdds.toFixed(2)} (${valueEdgePct >= 0 ? '+' : ''}${valueEdgePct}% Value)\n` +
    `⚡ Вердикт: ${verdict === 'SIGNAL_VALUE' ? `ВХОД (${recommendedMarket}, ${recommendedStakeText})` : verdictTitle}`;

  return {
    totalGoals,
    totalXg,
    totalDeficit,
    homeDeficit,
    awayDeficit,
    maxTeamDeficit,
    scoreDiff,
    totalShotsOnTarget,
    remainingMinutes,
    pressureMultiplier,
    lambdaRem,
    goalProbabilityPct,
    fairOdds,
    bookieImpliedPct,
    valueEdgePct,
    verdict,
    verdictTitle,
    verdictReason,
    recommendedMarket,
    recommendedStakeText,
    passedRulesCount,
    rules,
    shareablePostText,
  };
}

export interface RankedXgLiveMatch {
  match: Match;
  input: XgCalculatorInput;
  result: XgCalculatorResult;
}

/**
 * Automatically extracts all xG FairOdds Calculator parameters from a live Match object
 * without requiring any manual user input.
 */
export function extractXgCalculatorInputFromMatch(match: Match): XgCalculatorInput {
  const minute = Math.max(1, Math.min(90, Math.round(Number(match.minute) || 1)));
  const homeGoals = Math.max(0, Math.round(Number(match.score?.[0] ?? 0)));
  const awayGoals = Math.max(0, Math.round(Number(match.score?.[1] ?? 0)));
  const totalGoals = homeGoals + awayGoals;

  const hSot = Math.max(0, Math.round(Number(match.stats?.shotsOnTarget?.[0] ?? 0)));
  const aSot = Math.max(0, Math.round(Number(match.stats?.shotsOnTarget?.[1] ?? 0)));
  const hSoff = Math.max(0, Math.round(Number(match.stats?.shotsOffTarget?.[0] ?? 0)));
  const aSoff = Math.max(0, Math.round(Number(match.stats?.shotsOffTarget?.[1] ?? 0)));

  const rawHomeXg = Number(match.stats?.xg?.[0] ?? 0);
  const rawAwayXg = Number(match.stats?.xg?.[1] ?? 0);
  const hasRealXg = rawHomeXg > 0 || rawAwayXg > 0;

  const homeXg = hasRealXg
    ? Number(rawHomeXg.toFixed(2))
    : Number(Math.max(homeGoals * 0.65, hSot * 0.17 + hSoff * 0.05).toFixed(2));
  const awayXg = hasRealXg
    ? Number(rawAwayXg.toFixed(2))
    : Number(Math.max(awayGoals * 0.65, aSot * 0.17 + aSoff * 0.05).toFixed(2));

  // Estimate dangerous attacks in last 15 minutes (prefer 2nd-half delta when available)
  const totalDa =
    Math.max(0, Number(match.stats?.dangerousAttacks?.[0] ?? 0)) +
    Math.max(0, Number(match.stats?.dangerousAttacks?.[1] ?? 0));
  let dangerousAttacks15m: number;
  if (minute > 48 && match.halfTimeStats?.dangerousAttacks) {
    const htDa =
      Math.max(0, Number(match.halfTimeStats.dangerousAttacks[0] ?? 0)) +
      Math.max(0, Number(match.halfTimeStats.dangerousAttacks[1] ?? 0));
    const secondHalfDa = Math.max(0, totalDa - htDa);
    const secondHalfMins = Math.max(3, minute - 45);
    dangerousAttacks15m = Math.round((secondHalfDa / secondHalfMins) * 15);
  } else {
    dangerousAttacks15m = Math.round((totalDa / Math.max(minute, 1)) * 15);
  }
  dangerousAttacks15m = Math.max(0, Math.min(60, dangerousAttacks15m));

  // Detect red card impact relative to the dominant attacking team
  const hRc = Math.max(0, Number(match.stats?.redCards?.[0] ?? 0));
  const aRc = Math.max(0, Number(match.stats?.redCards?.[1] ?? 0));
  let redCardStatus: RedCardStatus = 'none';
  if (hRc > 0 && aRc === 0) {
    redCardStatus = homeXg >= awayXg ? 'attacking' : 'defending';
  } else if (aRc > 0 && hRc === 0) {
    redCardStatus = awayXg >= homeXg ? 'attacking' : 'defending';
  }

  // Pick exact bookmaker odds for next goal (Total Over currentGoals + 0.5) when available
  const oddsByNextLine: Record<number, number | undefined> = {
    0: match.odds?.over05,
    1: match.odds?.over15,
    2: match.odds?.over25,
    3: match.odds?.over35,
    4: match.odds?.over45,
    5: match.odds?.over55,
  };
  const directNextGoalOdds = oddsByNextLine[totalGoals];
  const calibratedFallbackOdds = Number(
    Math.max(1.22, Math.min(3.8, 1.28 + Math.max(0, minute - 35) * 0.02)).toFixed(2)
  );
  const bookieOdds =
    typeof directNextGoalOdds === 'number' && directNextGoalOdds >= 1.08 && directNextGoalOdds <= 12
      ? Number(directNextGoalOdds.toFixed(2))
      : calibratedFallbackOdds;

  return {
    matchLabel: `${match.homeTeam} — ${match.awayTeam}`,
    minute,
    homeGoals,
    awayGoals,
    homeXg,
    awayXg,
    homeShotsOnTarget: hSot,
    awayShotsOnTarget: aSot,
    dangerousAttacks15m,
    redCardStatus,
    bookieOdds,
  };
}

const VERDICT_PRIORITY: Record<XgCalculatorVerdict, number> = {
  SIGNAL_VALUE: 3,
  WATCHLIST: 2,
  SKIP: 1,
};

/**
 * Automatically evaluates and ranks all live football matches for the xG Deficit 62'-76' strategy.
 */
export function rankLiveMatchesForXgCalculator(matches: Match[]): RankedXgLiveMatch[] {
  return matches
    .filter((m) => (m.sport || 'football') === 'football' && m.status === 'LIVE' && m.minute >= 1)
    .map((match) => {
      const input = extractXgCalculatorInputFromMatch(match);
      const result = calculateXgDeficitFairOdds(input);
      return { match, input, result };
    })
    .sort((a, b) => {
      const priorityDiff = VERDICT_PRIORITY[b.result.verdict] - VERDICT_PRIORITY[a.result.verdict];
      if (priorityDiff !== 0) return priorityDiff;

      if (a.result.verdict === 'SIGNAL_VALUE') {
        if (b.result.valueEdgePct !== a.result.valueEdgePct) {
          return b.result.valueEdgePct - a.result.valueEdgePct;
        }
      }

      if (b.result.passedRulesCount !== a.result.passedRulesCount) {
        return b.result.passedRulesCount - a.result.passedRulesCount;
      }

      if (b.result.totalDeficit !== a.result.totalDeficit) {
        return b.result.totalDeficit - a.result.totalDeficit;
      }

      // Prefer matches inside or closest to the 70'-76' window
      const distA = a.match.minute >= 70 && a.match.minute <= 76 ? 0 : Math.min(Math.abs(a.match.minute - 70), Math.abs(a.match.minute - 76));
      const distB = b.match.minute >= 70 && b.match.minute <= 76 ? 0 : Math.min(Math.abs(b.match.minute - 70), Math.abs(b.match.minute - 76));
      return distA - distB;
    });
}

export function isXgDeficitStrategyRule(rule: Pick<FilterRule, 'id' | 'name'>): boolean {
  if (
    rule.id === 'strat-xg-deficit-trap-62-76' ||
    rule.id === 'custom-xg-deficit-trap-62-76'
  ) {
    return true;
  }
  const lowerName = (rule.name || '').toLowerCase();
  return lowerName.includes('xg-долг') || lowerName.includes('регрессия давления');
}

export interface XgDeficitReadinessMetrics {
  targetDeficit: number;
  currentDeficit: number;
  effectiveDeficit: number;
  xgDeficitPct: number;
  shotsOnTarget: number;
  targetShotsOnTarget: number;
  shotsOnTargetPct: number;
  dangerousAttacks15m: number;
  targetDangerousAttacks15m: number;
  dangerousAttacksPct: number;
  minuteWindowPct: number;
  overallReadinessPct: number;
  statusLabel: string;
}

/**
 * Computes visual readiness percentages (0–100%) for the 'xG-Долг и Регрессия Давления' criteria
 * comparing live match telemetry against target thresholds.
 */
export function computeXgDeficitReadiness(
  input: XgCalculatorInput,
  result: XgCalculatorResult,
  targetDeficit = 0.9
): XgDeficitReadinessMetrics {
  const safeTarget = Math.max(0.25, targetDeficit);
  const targetShotsOnTarget = 7;
  const targetDangerousAttacks15m = 14;

  // Individual team deficit >= 0.90 satisfies Rule 3 alongside total deficit >= target
  const scaledIndividualDeficit = result.maxTeamDeficit * (safeTarget / 0.9);
  const effectiveDeficit = Number(Math.max(result.totalDeficit, scaledIndividualDeficit).toFixed(2));
  const xgDeficitPct = Math.min(
    100,
    Math.max(0, Math.round((Math.max(0, effectiveDeficit) / safeTarget) * 100))
  );

  const shotsOnTargetPct = Math.min(
    100,
    Math.max(0, Math.round((result.totalShotsOnTarget / targetShotsOnTarget) * 100))
  );
  const dangerousAttacksPct = Math.min(
    100,
    Math.max(0, Math.round((input.dangerousAttacks15m / targetDangerousAttacks15m) * 100))
  );

  let minuteWindowPct = 0;
  if (input.minute >= 70 && input.minute <= 76) {
    minuteWindowPct = 100;
  } else if (input.minute < 70) {
    minuteWindowPct = Math.max(5, Math.round((input.minute / 70) * 90));
  } else {
    minuteWindowPct = Math.max(10, Math.round(100 - (input.minute - 76) * 7));
  }

  const scoreCorridorPct = result.scoreDiff <= 1 ? 100 : result.scoreDiff === 2 ? 35 : 0;
  const assaultPct =
    input.redCardStatus === 'attacking'
      ? 15
      : Math.round(shotsOnTargetPct * 0.5 + dangerousAttacksPct * 0.5);
  const valuePct =
    result.valueEdgePct >= 12 && input.bookieOdds >= 1.75
      ? 100
      : Math.min(95, Math.max(0, Math.round(((result.valueEdgePct + 10) / 22) * 100)));

  const weighted = Math.round(
    xgDeficitPct * 0.35 +
      minuteWindowPct * 0.2 +
      scoreCorridorPct * 0.15 +
      assaultPct * 0.15 +
      valuePct * 0.15
  );

  const overallReadinessPct =
    result.verdict === 'SIGNAL_VALUE' ? 100 : Math.min(96, Math.max(0, weighted));

  const statusLabel =
    result.verdict === 'SIGNAL_VALUE'
      ? 'Вход подтверждён'
      : result.verdict === 'WATCHLIST' || overallReadinessPct >= 75
      ? 'Почти готово'
      : overallReadinessPct >= 45
      ? 'Накопление xG'
      : 'Вне условий';

  return {
    targetDeficit: safeTarget,
    currentDeficit: result.totalDeficit,
    effectiveDeficit,
    xgDeficitPct,
    shotsOnTarget: result.totalShotsOnTarget,
    targetShotsOnTarget,
    shotsOnTargetPct,
    dangerousAttacks15m: input.dangerousAttacks15m,
    targetDangerousAttacks15m,
    dangerousAttacksPct,
    minuteWindowPct,
    overallReadinessPct,
    statusLabel,
  };
}


