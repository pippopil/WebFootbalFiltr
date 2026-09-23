import { Match, FilterRule, PressureAnalysis, SignalAlert, SignalOutcome, BetType, OddsDropData } from './types';

/**
 * Calculates real-time odds movements (Odds Flow) and smart money volume distribution.
 * Compares opening/initial odds with current live odds across key markets (1, X, 2, Over/Under 2.5, BTTS).
 */
export function calculateMatchOddsFlows(
  match: {
    homeTeam: string;
    awayTeam: string;
    odds: { home: number; draw: number; away: number; over25: number; under25?: number; btts?: number };
    initialOdds?: { home?: number; draw?: number; away?: number; over25?: number; under25?: number; btts?: number };
    minute?: number;
    league?: string;
  }
): OddsDropData[] {
  const flows: OddsDropData[] = [];
  const init = match.initialOdds;
  const curr = match.odds;
  if (!curr) return flows;

  const marketsToCheck: Array<{
    market: 'HOME' | 'DRAW' | 'AWAY' | 'OVER' | 'UNDER' | 'BTTS';
    name: string;
    cur: number | undefined;
    baseInit: number | undefined;
    defaultBookie: string;
  }> = [
    {
      market: 'HOME',
      name: `П1 (${match.homeTeam})`,
      cur: curr.home,
      baseInit: init?.home,
      defaultBookie: 'Betfair Exchange / Pinnacle',
    },
    {
      market: 'DRAW',
      name: 'Ничья (X)',
      cur: curr.draw,
      baseInit: init?.draw,
      defaultBookie: 'Pinnacle Sports',
    },
    {
      market: 'AWAY',
      name: `П2 (${match.awayTeam})`,
      cur: curr.away,
      baseInit: init?.away,
      defaultBookie: 'Betfair Exchange / Bet365',
    },
    {
      market: 'OVER',
      name: 'ТБ 2.5',
      cur: curr.over25,
      baseInit: init?.over25,
      defaultBookie: 'Pinnacle / Asian Handicap',
    },
    {
      market: 'UNDER',
      name: 'ТМ 2.5',
      cur: curr.under25,
      baseInit: init?.under25,
      defaultBookie: 'Betfair Exchange',
    },
    {
      market: 'BTTS',
      name: 'Обе забьют (Да)',
      cur: curr.btts,
      baseInit: init?.btts,
      defaultBookie: 'Pinnacle / 1xBet',
    },
  ];

  for (const m of marketsToCheck) {
    if (m.cur === undefined || m.cur <= 1.01) continue;
    if (m.baseInit && m.baseInit > m.cur) {
      const dropPct = Number((((m.baseInit - m.cur) / m.baseInit) * 100).toFixed(1));
      if (dropPct >= 2.0) {
        // Exchange/Sharp bookmaker liquidity model
        const moneyVolPct = Math.min(95, Math.max(52, Math.round(50 + dropPct * 1.45)));
        const moneyAmtEur = Math.round((50000 + dropPct * 7500) / 1000) * 1000;

        flows.push({
          market: m.market,
          marketName: m.name,
          initialOdds: m.baseInit,
          currentOdds: m.cur,
          dropPercent: dropPct,
          moneyVolumePercent: moneyVolPct,
          moneyVolumeAmountEur: moneyAmtEur,
          bookmaker: m.defaultBookie,
          detectedAtMinute: match.minute || 1,
        });
      }
    }
  }

  flows.sort((a, b) => b.dropPercent - a.dropPercent);
  return flows;
}

/**
 * Enriches a match with persistent odds tracker logic, calculating market flows and primary odds drop.
 */
export function enrichMatchWithOddsTracker(match: Match, prevMatch?: Match): Match {
  // 1. Inherit or preserve initial opening odds
  const initialOdds =
    match.initialOdds ||
    prevMatch?.initialOdds ||
    (prevMatch?.odds ? { ...prevMatch.odds } : { ...match.odds });

  // 2. If the match already has rich market flows and designated odds drop, preserve them
  if (match.marketFlows && match.marketFlows.length > 0 && match.oddsDrop) {
    return {
      ...match,
      initialOdds,
    };
  }

  // 3. Compute live market flows from odds differences
  const calculatedFlows = calculateMatchOddsFlows({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    odds: match.odds,
    initialOdds,
    minute: match.minute,
    league: match.league,
  });

  const allFlows = [
    ...(match.marketFlows || []),
    ...(match.oddsDrop ? [match.oddsDrop] : []),
    ...calculatedFlows,
  ];

  const uniqueFlowsMap = new Map<string, OddsDropData>();
  for (const f of allFlows) {
    if (!uniqueFlowsMap.has(f.market) || (uniqueFlowsMap.get(f.market)!.dropPercent < f.dropPercent)) {
      uniqueFlowsMap.set(f.market, f);
    }
  }
  const flows = Array.from(uniqueFlowsMap.values()).sort((a, b) => b.dropPercent - a.dropPercent);
  const bestDrop = flows[0] || match.oddsDrop;

  return {
    ...match,
    initialOdds,
    marketFlows: flows.length > 0 ? flows : match.marketFlows,
    oddsDrop: bestDrop || match.oddsDrop,
  };
}

/**
 * Calculates in-depth match pressure, momentum index, and goal probability.
 */
export function calculatePressureAnalysis(match: Match): PressureAnalysis {
  const { stats, minute, homeTeam, awayTeam } = match;
  const currentMinute = Math.max(1, minute);

  // Total volume
  const totalDang = stats.dangerousAttacks[0] + stats.dangerousAttacks[1];
  const dangDiff = stats.dangerousAttacks[0] - stats.dangerousAttacks[1];
  const absDangDiff = Math.abs(dangDiff);

  const totalShots =
    stats.shotsOnTarget[0] +
    stats.shotsOnTarget[1] +
    stats.shotsOffTarget[0] +
    stats.shotsOffTarget[1];
  const totalShotsOnTarget = stats.shotsOnTarget[0] + stats.shotsOnTarget[1];
  const totalCorners = stats.corners[0] + stats.corners[1];
  const totalXg = stats.xg[0] + stats.xg[1];

  // Dangerous attacks per minute
  const apm = Number((totalDang / currentMinute).toFixed(2));

  // Pressure Index calculation (0 to 100)
  // Factors: APM, shots on target rate, xG per minute, corners, and one-sided skew
  let rawScore = 0;

  // 1. Attack tempo (up to 30 pts)
  if (apm >= 1.4) rawScore += 30;
  else if (apm >= 1.0) rawScore += 24;
  else if (apm >= 0.7) rawScore += 16;
  else rawScore += Math.min(10, apm * 15);

  // 2. Shots on target threat (up to 25 pts)
  const sotPer10Min = (totalShotsOnTarget / currentMinute) * 10;
  if (sotPer10Min >= 1.5) rawScore += 25;
  else if (sotPer10Min >= 1.0) rawScore += 18;
  else rawScore += Math.min(15, sotPer10Min * 15);

  // 3. xG creation (up to 25 pts)
  if (totalXg >= 2.5) rawScore += 25;
  else if (totalXg >= 1.8) rawScore += 20;
  else if (totalXg >= 1.2) rawScore += 14;
  else rawScore += Math.min(10, totalXg * 8);

  // 4. Domination asymmetry / one-sided pressure bonus (up to 20 pts)
  if (absDangDiff >= 40) rawScore += 20;
  else if (absDangDiff >= 25) rawScore += 15;
  else if (absDangDiff >= 15) rawScore += 10;
  else rawScore += Math.min(8, (absDangDiff / 15) * 8);

  const pressureIndex = Math.min(100, Math.max(10, Math.round(rawScore)));

  // Determine dominant side
  let dominantSide: 'home' | 'away' | 'balanced' = 'balanced';
  let dominantTeamName = 'Равная игра';
  if (dangDiff >= 15 || stats.xg[0] - stats.xg[1] >= 0.6) {
    dominantSide = 'home';
    dominantTeamName = homeTeam;
  } else if (dangDiff <= -15 || stats.xg[1] - stats.xg[0] >= 0.6) {
    dominantSide = 'away';
    dominantTeamName = awayTeam;
  }

  // Goal Probability estimation (0 to 100%)
  // Later in match + high pressure + high SOT = higher probability
  const timeFactor = minute >= 75 ? 1.25 : minute >= 60 ? 1.15 : minute >= 30 ? 1.0 : 0.85;
  const goalProbScore = Math.min(
    96,
    Math.max(12, Math.round((pressureIndex * 0.75 + (totalShotsOnTarget * 3) + (totalCorners * 1.5)) * (timeFactor / 1.1)))
  );

  let goalProbability: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
  if (goalProbScore >= 80) goalProbability = 'EXTREME';
  else if (goalProbScore >= 65) goalProbability = 'HIGH';
  else if (goalProbScore >= 45) goalProbability = 'MEDIUM';

  const reasons: string[] = [];
  if (apm >= 1.1) reasons.push(`Высокий темп: ${apm} оп. атак/мин`);
  if (absDangDiff >= 25) reasons.push(`Шквал атак: +${absDangDiff} (${dominantTeamName})`);
  if (totalShotsOnTarget >= 8) reasons.push(`Угроза в створе: ${totalShotsOnTarget} ударов`);
  if (totalCorners >= 8) reasons.push(`Осада с угловых: ${totalCorners} подач`);
  if (totalXg >= 1.5) reasons.push(`Накопленный xG: ${totalXg.toFixed(2)}`);
  if (match.stats.redCards[0] > 0 || match.stats.redCards[1] > 0) reasons.push(`Фактор удаления (КК)`);

  return {
    pressureIndex,
    dominantSide,
    dominantTeamName,
    dominantDiff: absDangDiff,
    goalProbability,
    goalProbabilityScore: goalProbScore,
    attacksPerMinute: apm,
    reasons,
  };
}

/**
 * Verifies whether the rule's target market has ALREADY occurred / resolved in the match.
 * Prevents sending signals like 'ТБ 2.5' when 3+ goals are already scored,
 * or 'Обе забьют' when both teams have already scored, or 1st-half goals when 1st-half is over or goal was scored.
 */
export function checkMarketAlreadyPassed(
  targetMarket: string | undefined,
  match: Match,
  rule?: FilterRule
): { isPassed: boolean; reason?: string } {
  const h = match.score[0];
  const a = match.score[1];
  const totalGoals = h + a;
  const rawMarket = (targetMarket || rule?.targetMarket || '').toLowerCase();

  // 1. Explicit max total goals check
  if (rule?.maxTotalGoals !== undefined && totalGoals > rule.maxTotalGoals) {
    return {
      isPassed: true,
      reason: `Событие уже наступило: тотал голов (${totalGoals}) превышает ${rule.maxTotalGoals} (счёт ${h}:${a}). Ставка не актуальна!`,
    };
  }

  // 2. Score condition constraints: TOTAL_UNDER_25, TOTAL_UNDER_15, TOTAL_UNDER_2, BTTS_NO
  if (rule?.scoreCondition === 'TOTAL_UNDER_25' && totalGoals > 2) {
    return {
      isPassed: true,
      reason: `Событие уже наступило: ТБ 2.5 уже пробит (счёт ${h}:${a}, забито ${totalGoals} голов).`,
    };
  }
  if ((rule?.scoreCondition === 'TOTAL_UNDER_15' || rule?.scoreCondition === 'TOTAL_UNDER_2') && totalGoals > 1) {
    return {
      isPassed: true,
      reason: `Событие уже наступило: ТБ 1.5 уже пробит (счёт ${h}:${a}, забито ${totalGoals} голов).`,
    };
  }
  if (rule?.scoreCondition === 'BTTS_NO' && (h > 0 && a > 0)) {
    return {
      isPassed: true,
      reason: `Событие уже наступило: Обе команды уже забили (счёт ${h}:${a}). Исход «Обе забьют» уже состоялся!`,
    };
  }

  // 3. Both Teams To Score (Обе забьют / ОЗ / BTTS)
  const isBttsMarket =
    Boolean(rule?.requireBttsNotHit) ||
    rule?.oddsDropMarket === 'BTTS' ||
    /(?:обе\s*команды\s*забьют|обе\s*забьют|оз\s*[:(]?\s*да|btts\s*[:(]?\s*yes|btts\s*[:(]?\s*да|\bоз\b|\bbtts\b)/i.test(rawMarket);

  const isBttsNoMarket = /(?:обе\s*забьют\s*:\s*нет|оз\s*:\s*нет|btts\s*:\s*no)/i.test(rawMarket);

  if (isBttsMarket && !isBttsNoMarket) {
    if (h > 0 && a > 0) {
      return {
        isPassed: true,
        reason: `Событие уже наступило: Обе команды уже забили (счёт ${h}:${a}). Исход «Обе забьют: Да» уже состоялся!`,
      };
    }
  }

  // 4. Over 2.5 Goals (ТБ 2.5 / Тотал больше 2.5)
  const isOver25Market =
    (rule?.oddsDropMarket === 'OVER' && !rawMarket.includes('3.5') && !rawMarket.includes('1.5') && !rawMarket.includes('0.5')) ||
    /(?:тб\s*2\.?5|тотал\s*больше\s*2\.?5|over\s*2\.?5)/i.test(rawMarket);

  if (isOver25Market) {
    if (totalGoals >= 3) {
      return {
        isPassed: true,
        reason: `Событие уже наступило: ТБ 2.5 уже пробит (забито ${totalGoals} голов, текущий счёт ${h}:${a}).`,
      };
    }
  }

  // 5. Over 1.5 Goals (ТБ 1.5 / Тотал больше 1.5)
  const isOver15Market =
    /(?:тб\s*1\.?5|тотал\s*больше\s*1\.?5|over\s*1\.?5)/i.test(rawMarket) &&
    !rawMarket.includes('3.5');

  if (isOver15Market) {
    if (totalGoals >= 2) {
      return {
        isPassed: true,
        reason: `Событие уже наступило: ТБ 1.5 уже пробит (забито ${totalGoals} голов, счёт ${h}:${a}).`,
      };
    }
  }

  // 6. 1st-Half Goals (ТБ 0.5 в 1-м тайме / HT Over / Гол в 1Т)
  const isFirstHalfMarket =
    /(?:1-?м\s*тайме|1т\b|первом\s*тайме|ht\s*over)/i.test(rawMarket);

  if (isFirstHalfMarket) {
    if (match.minute > 45 || match.status === 'HT' || match.status === 'FT') {
      return {
        isPassed: true,
        reason: `1-й тайм уже завершился (минута ${match.minute}'). Ставка на 1-й тайм недоступна!`,
      };
    }
    if (/(?:0\.?5|гол)/i.test(rawMarket) && !rawMarket.includes('1.5') && !rawMarket.includes('угл')) {
      if (totalGoals >= 1) {
        return {
          isPassed: true,
          reason: `Гол в 1-м тайме уже забит (счёт ${h}:${a}). ТБ 0.5 1Т уже сыграл!`,
        };
      }
    }
    if (/(?:1\.?5|1\.0)/i.test(rawMarket)) {
      if (totalGoals >= 2) {
        return {
          isPassed: true,
          reason: `В 1-м тайме уже забито ${totalGoals} голов (счёт ${h}:${a}). ТБ 1.5 1Т уже пробит!`,
        };
      }
    }
  }

  // 7. Over 0.5 in match (ТБ 0.5 в матче) - when score is no longer 0:0
  const isOver05InMatch =
    /(?:тб\s*0\.?5\s*(в\s*матче)?|гол\s*в\s*матче|тотал\s*больше\s*0\.?5\s*(в\s*матче)?)/i.test(rawMarket) &&
    !rawMarket.includes('2-м') &&
    !rawMarket.includes('втором') &&
    !rawMarket.includes('концовке');

  if (isOver05InMatch) {
    if (totalGoals >= 1) {
      return {
        isPassed: true,
        reason: `В матче уже забит гол (счёт ${h}:${a}). ТБ 0.5 в матче уже сыграл!`,
      };
    }
  }

  // 8. Over 3.5 Goals (ТБ 3.5)
  const isOver35Market = /(?:тб\s*3\.?5|тотал\s*больше\s*3\.?5|over\s*3\.?5)/i.test(rawMarket);
  if (isOver35Market) {
    if (totalGoals >= 4) {
      return {
        isPassed: true,
        reason: `Событие уже наступило: ТБ 3.5 уже пробит (забито ${totalGoals} голов, счёт ${h}:${a}).`,
      };
    }
  }

  // 9. Over 4.5 Goals (ТБ 4.5)
  const isOver45Market = /(?:тб\s*4\.?5|тотал\s*больше\s*4\.?5|over\s*4\.?5)/i.test(rawMarket);
  if (isOver45Market) {
    if (totalGoals >= 5) {
      return {
        isPassed: true,
        reason: `Событие уже наступило: ТБ 4.5 уже пробит (забито ${totalGoals} голов, счёт ${h}:${a}).`,
      };
    }
  }

  // 10. Individual Total 1 > 0.5 / Home Goal
  if (/(?:итб1\s*>\s*0\.?5|гол\s*хозяев)/i.test(rawMarket) && !rawMarket.includes('следующий')) {
    if (h >= 1) {
      return {
        isPassed: true,
        reason: `Хозяева уже забили гол (счёт ${h}:${a}). Исход «Гол Хозяев» уже сыграл!`,
      };
    }
  }

  // 11. Individual Total 2 > 0.5 / Away Goal
  if (/(?:итб2\s*>\s*0\.?5|гол\s*гостей)/i.test(rawMarket) && !rawMarket.includes('следующий')) {
    if (a >= 1) {
      return {
        isPassed: true,
        reason: `Гости уже забили гол (счёт ${h}:${a}). Исход «Гол Гостей» уже сыграл!`,
      };
    }
  }

  // 12. Under 2.5 Goals (ТМ 2.5)
  if (/(?:тм\s*2\.?5|under\s*2\.?5|тотал\s*меньше\s*2\.?5)/i.test(rawMarket)) {
    if (totalGoals >= 3) {
      return {
        isPassed: true,
        reason: `ТМ 2.5 уже проигран (забито ${totalGoals} голов, счёт ${h}:${a}). Ставка не актуальна!`,
      };
    }
  }

  // 13. Under 1.5 Goals (ТМ 1.5)
  if (/(?:тм\s*1\.?5|under\s*1\.?5|тотал\s*меньше\s*1\.?5)/i.test(rawMarket)) {
    if (totalGoals >= 2) {
      return {
        isPassed: true,
        reason: `ТМ 1.5 уже проигран (забито ${totalGoals} голов, счёт ${h}:${a}). Ставка не актуальна!`,
      };
    }
  }

  return { isPassed: false };
}

/**
 * Checks whether a match matches a filter rule.
 * Also returns progress percentage and list of missing criteria for UI hints.
 */
export function evaluateFilterRule(
  match: Match,
  rule: FilterRule
): { matches: boolean; progressPercent: number; unmetCriteria: string[] } {
  let passedCount = 0;
  let totalCriteria = 0;
  const unmetCriteria: string[] = [];

  // 1. Minute Range / Prematch Timing Window
  totalCriteria++;
  const isPrematchRule = rule.ruleType === 'PREMATCH' || getBetTypeForSignal(rule, match.minute, match) === 'PREMATCH';

  if (isPrematchRule) {
    // В стратегиях матчей, когда анализ матча идет до матча, анализ проводится за 1 час (60 мин) до начала матча
    if (match.status === 'PREMATCH' || match.startsInMinutes !== undefined) {
      const targetTiming = rule.prematchTimingMinutes ?? 60;
      const minutesToStart = match.startsInMinutes ?? 60;
      if (minutesToStart <= targetTiming && minutesToStart >= 0) {
        passedCount++;
      } else if (minutesToStart > targetTiming) {
        unmetCriteria.push(`До матча ${minutesToStart} мин. Анализ стратегии проводится строго за 1 час (60 мин) до начала`);
      } else {
        passedCount++;
      }
    } else if (match.minute === 0) {
      passedCount++;
    } else if (match.status === 'LIVE') {
      if (rule.maxMinute > 0 && match.minute <= rule.maxMinute) {
        passedCount++;
      } else {
        unmetCriteria.push(`Матч уже идёт (${match.minute}'). Предматчевый отбор проводится за 1 час до начала матча`);
      }
    } else {
      unmetCriteria.push(`Матч завершён (FT). Анализ проводился за 1 час до начала`);
    }
  } else {
    // Лайв-стратегия
    if (match.status === 'PREMATCH') {
      unmetCriteria.push(`Матч ещё не начался (лайв-стратегия активна с ${rule.minMinute}' по ${rule.maxMinute}')`);
    } else if (match.minute >= rule.minMinute && match.minute <= rule.maxMinute) {
      passedCount++;
    } else {
      unmetCriteria.push(`Минута ${match.minute}' вне диапазона (${rule.minMinute}'-${rule.maxMinute}')`);
    }
  }

  // 2. Score Condition
  totalCriteria++;
  let scoreOk = false;
  const h = match.score[0];
  const a = match.score[1];
  const totalGoals = h + a;
  const diffGoals = Math.abs(h - a);

  switch (rule.scoreCondition) {
    case 'ANY':
      scoreOk = true;
      break;
    case '0-0':
      scoreOk = h === 0 && a === 0;
      if (!scoreOk) unmetCriteria.push(`Счет не 0:0 (сейчас ${h}:${a})`);
      break;
    case 'DRAW':
      scoreOk = h === a;
      if (!scoreOk) unmetCriteria.push(`Счет не ничейный (сейчас ${h}:${a})`);
      break;
    case 'HOME_LEAD':
      scoreOk = h > a;
      if (!scoreOk) unmetCriteria.push(`Хозяева не ведут в счете`);
      break;
    case 'AWAY_LEAD':
      scoreOk = a > h;
      if (!scoreOk) unmetCriteria.push(`Гости не ведут в счете`);
      break;
    case 'ONE_GOAL_DIFF':
      scoreOk = diffGoals === 1;
      if (!scoreOk) unmetCriteria.push(`Разница не в 1 мяч (сейчас ${h}:${a})`);
      break;
    case 'TOTAL_UNDER_25':
      scoreOk = totalGoals <= 2;
      if (!scoreOk) unmetCriteria.push(`ТБ 2.5 уже пробит (счёт ${h}:${a}, забито ${totalGoals} голов)`);
      break;
    case 'TOTAL_UNDER_15':
      scoreOk = totalGoals <= 1;
      if (!scoreOk) unmetCriteria.push(`ТБ 1.5 уже пробит (счёт ${h}:${a}, забито ${totalGoals} голов)`);
      break;
    case 'TOTAL_UNDER_2':
      scoreOk = totalGoals <= 1;
      if (!scoreOk) unmetCriteria.push(`Тотал голов ≥ 2 (сейчас ${totalGoals}, счёт ${h}:${a})`);
      break;
    case 'TOTAL_OVER_2':
      scoreOk = totalGoals >= 2;
      if (!scoreOk) unmetCriteria.push(`Тотал голов < 2 (сейчас ${totalGoals})`);
      break;
    case 'BTTS_NO':
      scoreOk = h === 0 || a === 0;
      if (!scoreOk) unmetCriteria.push(`Обе команды уже забили (счёт ${h}:${a}). Исход «Обе забьют» уже состоялся!`);
      break;
    default:
      scoreOk = true;
  }
  if (scoreOk) passedCount++;

  // 2b. Max Total Goals limit (e.g. maxTotalGoals: 2 means ТБ 2.5 не пробит)
  if (rule.maxTotalGoals !== undefined) {
    totalCriteria++;
    if (totalGoals <= rule.maxTotalGoals) {
      passedCount++;
    } else {
      unmetCriteria.push(`Тотал голов (${totalGoals}) превышает ${rule.maxTotalGoals} (ТБ ${rule.maxTotalGoals}.5 уже пробит, счёт ${h}:${a})`);
    }
  }

  // 2c. Require BTTS not hit yet (Обе команды ещё не забили)
  if (rule.requireBttsNotHit) {
    totalCriteria++;
    if (h === 0 || a === 0) {
      passedCount++;
    } else {
      unmetCriteria.push(`Обе команды уже забили (счёт ${h}:${a}). Исход «Обе забьют: Да» уже состоялся!`);
    }
  }

  // 2d. Strict Event Validation: Block signals for outcomes that have already happened / resolved
  const marketPassedCheck = checkMarketAlreadyPassed(rule.targetMarket, match, rule);
  if (marketPassedCheck.isPassed) {
    totalCriteria++;
    unmetCriteria.push(marketPassedCheck.reason || 'Событие по рекомендуемому исходу уже наступило в матче');
  }

  // 3. Dangerous Attacks Difference
  if (rule.minDangerousAttacksDiff !== undefined) {
    totalCriteria++;
    const dangDiff = Math.abs(match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1]);
    if (dangDiff >= rule.minDangerousAttacksDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница оп. атак ${dangDiff} < требуемых ${rule.minDangerousAttacksDiff}`);
    }
  }

  // 4. Dangerous Attacks Total
  if (rule.minDangerousAttacksTotal !== undefined) {
    totalCriteria++;
    const totalDang = match.stats.dangerousAttacks[0] + match.stats.dangerousAttacks[1];
    if (totalDang >= rule.minDangerousAttacksTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Сумма оп. атак ${totalDang} < ${rule.minDangerousAttacksTotal}`);
    }
  }

  // 5. Total Shots
  if (rule.minTotalShots !== undefined) {
    totalCriteria++;
    const totalShots =
      match.stats.shotsOnTarget[0] +
      match.stats.shotsOnTarget[1] +
      match.stats.shotsOffTarget[0] +
      match.stats.shotsOffTarget[1];
    if (totalShots >= rule.minTotalShots) {
      passedCount++;
    } else {
      unmetCriteria.push(`Всего ударов ${totalShots} < ${rule.minTotalShots}`);
    }
  }

  // 6. Shots on Target Total
  if (rule.minShotsOnTargetTotal !== undefined) {
    totalCriteria++;
    const sot = match.stats.shotsOnTarget[0] + match.stats.shotsOnTarget[1];
    if (sot >= rule.minShotsOnTargetTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Ударов в створ ${sot} < ${rule.minShotsOnTargetTotal}`);
    }
  }

  // 7. Shots on Target Diff
  if (rule.minShotsOnTargetDiff !== undefined) {
    totalCriteria++;
    const sotDiff = Math.abs(match.stats.shotsOnTarget[0] - match.stats.shotsOnTarget[1]);
    if (sotDiff >= rule.minShotsOnTargetDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница ударов в створ ${sotDiff} < ${rule.minShotsOnTargetDiff}`);
    }
  }

  // 8. Corners Total
  if (rule.minTotalCorners !== undefined) {
    totalCriteria++;
    const corners = match.stats.corners[0] + match.stats.corners[1];
    if (corners >= rule.minTotalCorners) {
      passedCount++;
    } else {
      unmetCriteria.push(`Всего угловых ${corners} < ${rule.minTotalCorners}`);
    }
  }

  // 9. Corners Diff
  if (rule.minCornersDiff !== undefined) {
    totalCriteria++;
    const cornersDiff = Math.abs(match.stats.corners[0] - match.stats.corners[1]);
    if (cornersDiff >= rule.minCornersDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница угловых ${cornersDiff} < ${rule.minCornersDiff}`);
    }
  }

  // 10. Possession Diff
  if (rule.minPossessionDiff !== undefined) {
    totalCriteria++;
    const possDiff = Math.abs(match.stats.possession[0] - match.stats.possession[1]);
    if (possDiff >= rule.minPossessionDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Перевес по владению ${possDiff}% < ${rule.minPossessionDiff}%`);
    }
  }

  // 11. xG Total
  if (rule.minXgTotal !== undefined) {
    totalCriteria++;
    const totalXg = match.stats.xg[0] + match.stats.xg[1];
    if (totalXg >= rule.minXgTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Суммарный xG ${totalXg.toFixed(2)} < ${rule.minXgTotal}`);
    }
  }

  // 11b. xG Deficit / xG Over Score Difference (Стратегия «Дефицит голов по xG к 75'»)
  if (rule.minXgOverScoreDiff !== undefined) {
    totalCriteria++;
    const totalXg = match.stats.xg[0] + match.stats.xg[1];
    const totalGoals = match.score[0] + match.score[1];
    const xgOverScore = totalXg - totalGoals;
    if (xgOverScore >= rule.minXgOverScoreDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(
        `Перевес xG над счётом ${xgOverScore.toFixed(2)} (xG ${totalXg.toFixed(2)} vs ${totalGoals} голов) < требуемых +${rule.minXgOverScoreDiff.toFixed(2)}`
      );
    }
  }

  // 12. Pressure Index
  if (rule.minPressureIndex !== undefined) {
    totalCriteria++;
    const analysis = calculatePressureAnalysis(match);
    if (analysis.pressureIndex >= rule.minPressureIndex) {
      passedCount++;
    } else {
      unmetCriteria.push(`Индекс давления ${analysis.pressureIndex}% < ${rule.minPressureIndex}%`);
    }
  }

  // 13. Red Card Condition
  if (rule.redCardCondition && rule.redCardCondition !== 'ANY') {
    totalCriteria++;
    const hasRed = match.stats.redCards[0] > 0 || match.stats.redCards[1] > 0;
    if (rule.redCardCondition === 'HAS_RED_CARD') {
      if (hasRed) passedCount++;
      else unmetCriteria.push(`Нет красных карточек в матче`);
    } else if (rule.redCardCondition === 'NO_RED_CARDS') {
      if (!hasRed) passedCount++;
      else unmetCriteria.push(`В матче есть удаление`);
    }
  }

  // 14. Total Attacks Difference (Стратегия 4 «А ГДЕ ЖЕ ГОЛ!!! v2.0»)
  if (rule.minAttacksDiff !== undefined) {
    totalCriteria++;
    const attacksDiff = Math.abs(match.stats.attacks[0] - match.stats.attacks[1]);
    if (attacksDiff >= rule.minAttacksDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница атак ${attacksDiff} < требуемых ${rule.minAttacksDiff}`);
    }
  }

  // 15. Total Shots Difference (Стратегии 4, 5)
  if (rule.minShotsDiff !== undefined) {
    totalCriteria++;
    const hShots = match.stats.shotsOnTarget[0] + match.stats.shotsOffTarget[0];
    const aShots = match.stats.shotsOnTarget[1] + match.stats.shotsOffTarget[1];
    const shotsDiff = Math.abs(hShots - aShots);
    if (shotsDiff >= rule.minShotsDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница ударов ${shotsDiff} < требуемых ${rule.minShotsDiff}`);
    }
  }

  // 16. Pre-Match Odds: Favorite Max Odds (Стратегии 2, 8)
  if (rule.maxOddsFavorite !== undefined) {
    totalCriteria++;
    const favOdds = Math.min(match.odds.home, match.odds.away);
    if (favOdds <= rule.maxOddsFavorite) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на фаворита ${favOdds.toFixed(2)} > ${rule.maxOddsFavorite}`);
    }
  }

  // 17. Pre-Match Odds: Equal Teams / Min Odds on Winner (Стратегия 11 «Печеньки бесконечности»)
  if (rule.minOddsFavorite !== undefined) {
    totalCriteria++;
    const lowestOdds = Math.min(match.odds.home, match.odds.away);
    if (lowestOdds >= rule.minOddsFavorite) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на фаворита ${lowestOdds.toFixed(2)} < ${rule.minOddsFavorite} (команды не равны)`);
    }
  }

  // 18. Pre-Match Odds: Over 2.5 Corridor / Range (Стратегии 2, 8, 16)
  if (rule.maxOddsOver25 !== undefined) {
    totalCriteria++;
    if (match.odds.over25 <= rule.maxOddsOver25) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТБ 2.5 (${match.odds.over25.toFixed(2)}) > ${rule.maxOddsOver25}`);
    }
  }
  if (rule.minOddsOver25 !== undefined) {
    totalCriteria++;
    if (match.odds.over25 >= rule.minOddsOver25) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТБ 2.5 (${match.odds.over25.toFixed(2)}) < ${rule.minOddsOver25}`);
    }
  }

  // 19. Pre-Match Odds: BTTS (Both Teams To Score) Range (Стратегии 10, 14, 16)
  if (rule.maxOddsBtts !== undefined) {
    totalCriteria++;
    const bttsOdds = match.odds.btts ?? (match.odds.over25 < 1.75 ? 1.62 : 1.95);
    if (bttsOdds <= rule.maxOddsBtts) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ОЗ (${bttsOdds.toFixed(2)}) > ${rule.maxOddsBtts}`);
    }
  }
  if (rule.minOddsBtts !== undefined) {
    totalCriteria++;
    const bttsOdds = match.odds.btts ?? (match.odds.over25 < 1.75 ? 1.62 : 1.95);
    if (bttsOdds >= rule.minOddsBtts) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ОЗ (${bttsOdds.toFixed(2)}) < ${rule.minOddsBtts}`);
    }
  }

  // 20. Exclude Youth, Women & Lower Leagues (Стратегии 4, 5, 12)
  if (rule.excludeYouthAndWomen) {
    totalCriteria++;
    const textToCheck = `${match.league} ${match.homeTeam} ${match.awayTeam}`.toLowerCase();
    const isYouthOrWomen =
      /women|жен|wom|ladies|femen|u17|u18|u19|u20|u21|u23|юнош|молод|youth|reserve|дубл|tercera|3\. liga/i.test(
        textToCheck
      );
    if (!isYouthOrWomen) {
      passedCount++;
    } else {
      unmetCriteria.push(`Лига исключена фильтром (молодёжная/женская/низшая)`);
    }
  }

  // 21. Mathematical Model IPT (Стратегия 7 «Алгоритм на ТБ 2,5»)
  if (rule.minModelIpt !== undefined) {
    totalCriteria++;
    const ipt = calculateMatchIPT(match);
    if (ipt >= rule.minModelIpt) {
      passedCount++;
    } else {
      unmetCriteria.push(`Расчетный тотал IPT (${ipt.toFixed(2)}) < ${rule.minModelIpt}`);
    }
  }

  // 22. Historical Streaks & Criteria (Стратегии 1, 4, 12, 13)
  if (rule.requireNoZeroZeroLast5) {
    totalCriteria++;
    const no00 =
      match.history?.homeLast5NoZeroZero !== false &&
      match.history?.awayLast5NoZeroZero !== false;
    if (no00) {
      passedCount++;
    } else {
      unmetCriteria.push(`У одной из команд был счет 0:0 в последних 5 играх`);
    }
  }

  if (rule.requireLastMatchConceded2Plus) {
    totalCriteria++;
    const homeOk = (match.history?.homeConcededLastMatch ?? 2) >= 2;
    const awayOk = (match.history?.awayConcededLastMatch ?? 2) >= 2;
    if (homeOk && awayOk) {
      passedCount++;
    } else {
      unmetCriteria.push(`Обе команды не пропускали ≥2 в прошлых играх`);
    }
  }

  if (rule.minOver25Streak !== undefined) {
    totalCriteria++;
    const streak = Math.max(
      match.history?.homeOver25Streak ?? (match.odds.over25 <= 1.6 ? 5 : 3),
      match.history?.awayOver25Streak ?? (match.odds.over25 <= 1.6 ? 5 : 3)
    );
    if (streak >= rule.minOver25Streak) {
      passedCount++;
    } else {
      unmetCriteria.push(`Серия ТБ 2.5 (${streak} игр) < ${rule.minOver25Streak}`);
    }
  }

  // 23. Over 3.5 Odds (Стратегия «ТБ 3.5 ≤ 2.00»)
  if (rule.maxOddsOver35 !== undefined) {
    totalCriteria++;
    const over35Odds = match.odds.over35 ?? (match.odds.over25 < 1.45 ? 1.76 : match.odds.over25 < 1.65 ? 1.95 : 2.50);
    if (over35Odds <= rule.maxOddsOver35) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТБ 3.5 (${over35Odds.toFixed(2)}) > ${rule.maxOddsOver35}`);
    }
  }

  // 24. Under 2.5 Odds (Стратегия на ничьи при ТМ 2.5)
  if (rule.maxOddsUnder25 !== undefined) {
    totalCriteria++;
    const under25Odds = match.odds.under25 ?? (match.odds.over25 > 2.0 ? 1.55 : 2.15);
    if (under25Odds <= rule.maxOddsUnder25) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТМ 2.5 (${under25Odds.toFixed(2)}) > ${rule.maxOddsUnder25}`);
    }
  }

  // 25. Draw Odds Range (Ничья > 5.0 или Ничья <= 3.0)
  if (rule.minOddsDraw !== undefined) {
    totalCriteria++;
    if (match.odds.draw >= rule.minOddsDraw) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ничью (${match.odds.draw.toFixed(2)}) < ${rule.minOddsDraw}`);
    }
  }
  if (rule.maxOddsDraw !== undefined) {
    totalCriteria++;
    if (match.odds.draw <= rule.maxOddsDraw) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ничью (${match.odds.draw.toFixed(2)}) > ${rule.maxOddsDraw}`);
    }
  }

  // 26. Underdog Odds Range
  if (rule.minOddsUnderdog !== undefined) {
    totalCriteria++;
    const underdogOdds = Math.max(match.odds.home, match.odds.away);
    if (underdogOdds >= rule.minOddsUnderdog) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на аутсайдера (${underdogOdds.toFixed(2)}) < ${rule.minOddsUnderdog}`);
    }
  }
  if (rule.maxOddsUnderdog !== undefined) {
    totalCriteria++;
    const underdogOdds = Math.max(match.odds.home, match.odds.away);
    if (underdogOdds <= rule.maxOddsUnderdog) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на аутсайдера (${underdogOdds.toFixed(2)}) > ${rule.maxOddsUnderdog}`);
    }
  }

  // 27. Score Diff Exactly 1 Goal (Стратегия «Корнер после 80 минуты»)
  if (rule.scoreDiffExactly1) {
    totalCriteria++;
    if (Math.abs(h - a) === 1) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница в счете не ровно в 1 мяч (${h}:${a})`);
    }
  }

  // 28. Losing Team Has More Corners (Стратегия «Корнер после 80 минуты»)
  if (rule.losingTeamMoreCorners) {
    totalCriteria++;
    let ok = false;
    if (h > a) {
      // Гости проигрывают, должны подать больше угловых
      ok = match.stats.corners[1] > match.stats.corners[0];
    } else if (a > h) {
      // Хозяева проигрывают, должны подать больше угловых
      ok = match.stats.corners[0] > match.stats.corners[1];
    }
    if (ok) {
      passedCount++;
    } else {
      unmetCriteria.push(`Проигрывающая команда не лидирует по угловым`);
    }
  }

  // 29. Favorite is Losing (Стратегия на углы фаворита в перерыве)
  if (rule.favoriteLosing) {
    totalCriteria++;
    const homeIsFav = match.odds.home < match.odds.away;
    const isFavLosing = homeIsFav ? h < a : a < h;
    if (isFavLosing) {
      passedCount++;
    } else {
      unmetCriteria.push(`Фаворит не проигрывает в счёте`);
    }
  }

  // 30. Two Quick Goals in 1st Half + No goals since (Стратегия «2 быстрых гола в 1Т — сигнал на 72-85' без голов»)
  if (rule.requireGuestTwoQuickGoals1H || rule.requireTwoQuickGoals1H || rule.requireNoGoalsSinceQuickGoals) {
    totalCriteria++;
    const had2Quick = Boolean(
      match.history?.guestScoredTwoQuickFirstHalf ||
      match.history?.twoQuickGoalsFirstHalf ||
      (match.history?.goalsAtFirstHalfQuick && match.history.goalsAtFirstHalfQuick >= 2) ||
      (match.history?.twoQuickGoalsMinute && match.history.twoQuickGoalsMinute <= 45) ||
      // Авто-распознавание по тексту последнего события матча
      /(?:быстр.*гол|2 быстрых|двух быстрых|quick goals|с \d+.*мин без голов)/i.test(match.lastEvent || '') ||
      // Авто-распознавание по счёту в лайве: гости забили 2 гола (0:2 или 1:2)
      (rule.requireGuestTwoQuickGoals1H && a >= 2 && h <= 1 && match.minute >= 45) ||
      // Либо любая команда забила 2 гола в 1Т
      (!rule.requireGuestTwoQuickGoals1H && (h >= 2 || a >= 2) && match.minute >= 45)
    );

    // Initial total goals when the two quick goals occurred (typically 2, e.g. 0:2, 2:0, or 1:1)
    const initialQuickGoals = match.history?.goalsAtFirstHalfQuick ?? (a >= 2 ? a : h >= 2 ? h : 2);
    const currentTotalGoals = h + a;

    // Condition: no goals since those 2 goals!
    const noGoalsAfter =
      match.history?.noGoalsSinceQuickGoals === true ||
      (match.history?.noGoalsSinceQuickGoals !== false && currentTotalGoals <= initialQuickGoals);

    if (had2Quick && noGoalsAfter) {
      passedCount++;
    } else if (!had2Quick) {
      unmetCriteria.push(`В 1-м тайме не зафиксировано 2 быстрых голов подряд (счёт ${h}:${a})`);
    } else {
      unmetCriteria.push(`После 2 быстрых голов в 1Т уже был забит гол (текущий счёт ${h}:${a}, всего голов: ${currentTotalGoals} > ${initialQuickGoals})`);
    }
  }

  // 31. Red Card in Previous Match (Стратегия мести за удаление)
  if (rule.requireRedCardLastMatch) {
    totalCriteria++;
    if (match.history?.hadRedCardLastMatch && (match.history?.teamWithRedCardOdds ?? 2.5) <= 3.20) {
      passedCount++;
    } else {
      unmetCriteria.push(`Нет КК в прошлом матче с кэфом ≤ 3.20`);
    }
  }

  // 32. Late Goals in Recent Matches (Гол на 65-90' в 3 из 4 матчей)
  if (rule.requireLateGoalsLastMatches) {
    totalCriteria++;
    if ((match.history?.last4LateGoalCount ?? 3) >= 3) {
      passedCount++;
    } else {
      unmetCriteria.push(`Менее 3 из 4 крайних матчей имели гол после 65'`);
    }
  }

  // 33. H2H Over 1.5 >= 80% (Стратегия на ТБ 1.5)
  if (rule.requireH2hOver15High) {
    totalCriteria++;
    if ((match.history?.h2hOver15Pct ?? 80) >= 80) {
      passedCount++;
    } else {
      unmetCriteria.push(`В личных встречах менее 80% игр на ТБ 1.5`);
    }
  }

  // 34. Deadly Combination (Смертельные комбинации кэфов на ТБ 3.5 / ТБ 4.5)
  if (rule.isDeadlyCombination) {
    totalCriteria++;
    const favOdds = Math.min(match.odds.home, match.odds.away);
    const o25 = match.odds.over25;
    const btts = match.odds.btts ?? 1.60;
    const h1 = match.odds.handicap1 ?? (favOdds < 1.3 ? 1.45 : 1.9);
    const itb1 = match.odds.itb1_25 ?? (favOdds < 1.3 ? 1.55 : 2.1);
    const o15_ht = match.odds.over15_ht ?? 1.80;

    const combo1 = favOdds <= 1.25 && o25 <= 1.45 && h1 <= 1.55;
    const combo2 = o25 <= 1.45 && itb1 <= 1.65 && btts <= 1.58;
    const combo3 = btts <= 1.48 && o25 <= 1.55 && o15_ht <= 1.88;

    if (combo1 || combo2 || combo3) {
      passedCount++;
    } else {
      unmetCriteria.push(`Котировки не образуют сверхрезультативную комбинацию`);
    }
  }

  // 34b. Dropping Odds & Money Volume Load (Smart Money & Steam Moves)
  if (
    rule.minOddsDropPercent !== undefined ||
    rule.minMoneyVolumePercent !== undefined ||
    rule.minMoneyLoadAmount !== undefined
  ) {
    totalCriteria++;

    // 1. Gather all active market flows
    let flows =
      match.marketFlows && match.marketFlows.length > 0
        ? [...match.marketFlows]
        : match.oddsDrop
        ? [match.oddsDrop]
        : [];

    // 2. Dynamic fallback: if flows are not pre-cached, compute them on-the-fly from initial vs current odds
    if (flows.length === 0 && (match.initialOdds || match.odds)) {
      flows = calculateMatchOddsFlows({
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        odds: match.odds,
        initialOdds: match.initialOdds,
        minute: match.minute,
        league: match.league,
      });
    }

    // 3. Filter by target market if specified (HOME, AWAY, OVER, etc.)
    const targetMarketFilter =
      rule.oddsDropMarket && rule.oddsDropMarket !== 'ANY'
        ? rule.oddsDropMarket
        : null;

    const relevantFlows = targetMarketFilter
      ? flows.filter((f) => f.market === targetMarketFilter)
      : flows;

    // 4. Check for at least ONE single market flow that satisfies ALL active smart money criteria COHESIVELY
    const qualifying = relevantFlows.find((f) => {
      const dropOk =
        rule.minOddsDropPercent === undefined ||
        f.dropPercent >= rule.minOddsDropPercent;
      const volOk =
        rule.minMoneyVolumePercent === undefined ||
        f.moneyVolumePercent >= rule.minMoneyVolumePercent;
      const amtOk =
        rule.minMoneyLoadAmount === undefined ||
        (f.moneyVolumeAmountEur ?? 0) >= rule.minMoneyLoadAmount;
      return dropOk && volOk && amtOk;
    });

    if (qualifying) {
      passedCount++;
    } else {
      const targetLabel = targetMarketFilter ? ` на исход ${targetMarketFilter}` : '';
      if (relevantFlows.length === 0) {
        unmetCriteria.push(
          `Отсутствует зафиксированный прогруз линии${targetLabel} (нет падения кэфа)`
        );
      } else {
        const bestFlow = relevantFlows[0];
        const failReasons: string[] = [];
        if (
          rule.minOddsDropPercent !== undefined &&
          bestFlow.dropPercent < rule.minOddsDropPercent
        ) {
          failReasons.push(
            `падение -${bestFlow.dropPercent.toFixed(1)}% < -${rule.minOddsDropPercent}%`
          );
        }
        if (
          rule.minMoneyVolumePercent !== undefined &&
          bestFlow.moneyVolumePercent < rule.minMoneyVolumePercent
        ) {
          failReasons.push(
            `деньги ${bestFlow.moneyVolumePercent}% < ${rule.minMoneyVolumePercent}%`
          );
        }
        if (
          rule.minMoneyLoadAmount !== undefined &&
          (bestFlow.moneyVolumeAmountEur ?? 0) < rule.minMoneyLoadAmount
        ) {
          failReasons.push(
            `сумма €${(bestFlow.moneyVolumeAmountEur ?? 0).toLocaleString('ru-RU')} < €${rule.minMoneyLoadAmount.toLocaleString('ru-RU')}`
          );
        }
        unmetCriteria.push(
          `Прогруз (${bestFlow.marketName}): ${failReasons.join(', ')}`
        );
      }
    }
  }

  // 35. Classic Scanner Matrix Configuration (Сканер "Обо всем понемножку")
  if (rule.scannerMatrix) {
    const m = rule.scannerMatrix;

    // Период
    if (m.period === '1H') {
      totalCriteria++;
      if (match.minute <= 45 && match.status !== 'FT') passedCount++;
      else unmetCriteria.push('Матч не в 1-м тайме');
    } else if (m.period === '2H') {
      totalCriteria++;
      if (match.minute > 45 && match.status !== 'FT') passedCount++;
      else unmetCriteria.push('Матч не во 2-м тайме');
    }

    // Минуты матча
    if (m.minuteRange?.checked) {
      totalCriteria++;
      if (match.minute >= m.minuteRange.min && match.minute <= m.minuteRange.max) passedCount++;
      else unmetCriteria.push(`Минута ${match.minute}' вне диапазона (${m.minuteRange.min}'-${m.minuteRange.max}')`);
    }

    // Котировки исходов
    const checkOdd = (label: string, item?: { checked: boolean; min: number; max: number }, value?: number) => {
      if (!item?.checked || value === undefined) return;
      totalCriteria++;
      if (value >= item.min && value <= item.max) passedCount++;
      else unmetCriteria.push(`Кэф ${label} (${value.toFixed(2)}) вне коридора [${item.min} - ${item.max}]`);
    };

    checkOdd('П1', m.p1, match.odds.home);
    checkOdd('X', m.draw, match.odds.draw);
    checkOdd('П2', m.p2, match.odds.away);

    const dc1X = match.odds.draw ? (1 / (1 / match.odds.home + 1 / match.odds.draw)) : undefined;
    const dc12 = match.odds.away ? (1 / (1 / match.odds.home + 1 / match.odds.away)) : undefined;
    const dcX2 = (match.odds.draw && match.odds.away) ? (1 / (1 / match.odds.draw + 1 / match.odds.away)) : undefined;
    checkOdd('1X', m.dc1X, dc1X);
    checkOdd('12', m.dc12, dc12);
    checkOdd('X2', m.dcX2, dcX2);

    // Тоталы
    checkOdd('ТБ 0.5', m.tb05, match.odds.over15 ? Math.max(1.05, match.odds.over15 * 0.68) : 1.12);
    checkOdd('ТБ 1.5', m.tb15, match.odds.over15 ?? 1.35);
    checkOdd('ТБ 2.5', m.tb25, match.odds.over25);
    checkOdd('ТМ 0.5', m.tm05, match.odds.under25 ? match.odds.under25 * 3.2 : 7.5);
    checkOdd('ТМ 1.5', m.tm15, match.odds.under25 ? match.odds.under25 * 1.7 : 3.2);
    checkOdd('ТМ 2.5', m.tm25, match.odds.under25 ?? (match.odds.over25 ? 1 / (1 - 1 / match.odds.over25 + 0.1) : 2.10));

    // Проверка статистической строки матрицы
    const checkRow = (name: string, row?: import('./types').ScannerStatRow, values?: [number, number]) => {
      if (!row || !values) return;
      const [v1, v2] = values;
      const total = v1 + v2;

      // Индивидуальные пороги
      if (row.ind1Min !== undefined && row.ind1Min !== null && !isNaN(row.ind1Min)) {
        totalCriteria++;
        if (v1 >= row.ind1Min) passedCount++;
        else unmetCriteria.push(`${name} К1 (${v1}) < ${row.ind1Min}`);
      }
      if (row.ind1Max !== undefined && row.ind1Max !== null && !isNaN(row.ind1Max)) {
        totalCriteria++;
        if (v1 <= row.ind1Max) passedCount++;
        else unmetCriteria.push(`${name} К1 (${v1}) > ${row.ind1Max}`);
      }
      if (row.ind2Min !== undefined && row.ind2Min !== null && !isNaN(row.ind2Min)) {
        totalCriteria++;
        if (v2 >= row.ind2Min) passedCount++;
        else unmetCriteria.push(`${name} К2 (${v2}) < ${row.ind2Min}`);
      }
      if (row.ind2Max !== undefined && row.ind2Max !== null && !isNaN(row.ind2Max)) {
        totalCriteria++;
        if (v2 <= row.ind2Max) passedCount++;
        else unmetCriteria.push(`${name} К2 (${v2}) > ${row.ind2Max}`);
      }

      // Общий тотал
      if (row.totalMin !== undefined && row.totalMin !== null && !isNaN(row.totalMin)) {
        totalCriteria++;
        if (total >= row.totalMin) passedCount++;
        else unmetCriteria.push(`Всего ${name} (${total}) < ${row.totalMin}`);
      }
      if (row.totalMax !== undefined && row.totalMax !== null && !isNaN(row.totalMax)) {
        totalCriteria++;
        if (total <= row.totalMax) passedCount++;
        else unmetCriteria.push(`Всего ${name} (${total}) > ${row.totalMax}`);
      }

      // Разница / сторона
      if (row.diffThreshold !== undefined && row.diffThreshold !== null && !isNaN(row.diffThreshold)) {
        totalCriteria++;
        let actualDiff = 0;
        if (row.side === 'K1') actualDiff = v1 - v2;
        else if (row.side === 'K2') actualDiff = v2 - v1;
        else actualDiff = Math.abs(v1 - v2);

        let ok = false;
        switch (row.operator) {
          case '>=':
          case 'DIFF':
            ok = actualDiff >= row.diffThreshold;
            break;
          case '<=':
            ok = actualDiff <= row.diffThreshold;
            break;
          case '==':
            ok = actualDiff === row.diffThreshold;
            break;
          case '>':
            ok = actualDiff > row.diffThreshold;
            break;
          case '<':
            ok = actualDiff < row.diffThreshold;
            break;
          default:
            ok = actualDiff >= row.diffThreshold;
        }

        if (ok) passedCount++;
        else unmetCriteria.push(`Разница ${name} (${actualDiff}) не удовлетворяет ${row.operator} ${row.diffThreshold}`);
      }
    };

    checkRow('Голы', m.goals, [match.score[0], match.score[1]]);
    checkRow('Атаки', m.attacks, match.stats.attacks);
    checkRow('Опасные атаки', m.dangerousAttacks, match.stats.dangerousAttacks);
    checkRow('Владение', m.possession, match.stats.possession);
    checkRow('Удары в створ', m.shotsOnTarget, match.stats.shotsOnTarget);
    checkRow('Удары мимо', m.shotsOffTarget, match.stats.shotsOffTarget);
    checkRow('Угловые', m.corners, match.stats.corners);
    checkRow('ЖК', m.yellowCards, match.stats.yellowCards);
    checkRow('КК', m.redCards, match.stats.redCards);
  }

  const progressPercent = totalCriteria > 0 ? Math.round((passedCount / totalCriteria) * 100) : 100;
  const matches = unmetCriteria.length === 0;

  return { matches, progressPercent, unmetCriteria };
}

/**
 * Calculates the Weighted Mathematical Total (IPT) according to Strategy 7.
 * Formula:
 * Season_H = (home goals + home conceded) / matches
 * Season_A = (away goals + away conceded) / matches
 * Form_H = last 5 goals / 5
 * Form_A = last 5 goals / 5
 * BP = (Season_H + Season_A) / 2
 * FP = (Form_H + Form_A) / 2
 * IPT = BP * 0.6 + FP * 0.4
 */
export function calculateMatchIPT(match: Match): number {
  if (match.history?.predictedIpt !== undefined) {
    return match.history.predictedIpt;
  }
  // If pre-match odds are low on Over 2.5, the market implies a high IPT
  const oddsFactor = match.odds.over25 <= 1.55 ? 3.1 : match.odds.over25 <= 1.75 ? 2.85 : match.odds.over25 <= 2.0 ? 2.6 : 2.25;
  const liveXgPace = match.minute > 0 ? ((match.stats.xg[0] + match.stats.xg[1]) / match.minute) * 90 : 0;
  const combined = liveXgPace > 0 ? oddsFactor * 0.7 + liveXgPace * 0.3 : oddsFactor;
  return Number(combined.toFixed(2));
}

/**
 * Classifies a rule or signal into 'LIVE' (ставки в лайве) or 'PREMATCH' (отобраны по предматчевым показателям).
 */
export function getBetTypeForSignal(
  rule?: FilterRule,
  minute?: number,
  match?: Match
): BetType {
  if (rule?.ruleType === 'PREMATCH') return 'PREMATCH';
  if (rule?.ruleType === 'LIVE') return 'LIVE';
  if (match?.status === 'PREMATCH') return 'PREMATCH';
  if (match?.startsInMinutes !== undefined && match.minute === 0) return 'PREMATCH';

  if (rule) {
    const isPrematchRule =
      (rule.minMinute === 0 && rule.minModelIpt !== undefined) ||
      rule.isDeadlyCombination === true ||
      rule.requireH2hOver15High === true ||
      rule.requireNoZeroZeroLast5 === true ||
      rule.requireRedCardLastMatch === true ||
      rule.maxOddsUnder25 !== undefined ||
      rule.id === 'strat-14' ||
      rule.id === 'strat-16' ||
      rule.id === 'strat-deadly-combo' ||
      rule.id === 'strat-draw-over5' ||
      rule.id === 'strat-tb15-value' ||
      rule.id === 'strat-draw-under25' ||
      rule.id === 'strat-red-card-revenge' ||
      rule.id === 'strat-over35-odds20';

    if (isPrematchRule) {
      return 'PREMATCH';
    }

    if (
      (rule.minMinute === 0 || minute === 0) &&
      !rule.minDangerousAttacksDiff &&
      !rule.minDangerousAttacksTotal &&
      !rule.minTotalCorners &&
      !rule.minShotsOnTargetTotal
    ) {
      return 'PREMATCH';
    }
  }

  if (minute === 0) {
    return 'PREMATCH';
  }

  return 'LIVE';
}

/**
 * Extracts human-readable factor chips for display in cards, reports and Telegram.
 */
export function extractSignalFactors(
  match: Match,
  rule?: FilterRule,
  analysis?: PressureAnalysis
): { prematchFactors: string[]; liveFactors: string[] } {
  const prematchFactors: string[] = [];
  const liveFactors: string[] = [];

  // Pre-match indicators
  if (match.status === 'PREMATCH' || match.startsInMinutes !== undefined) {
    const minLeft = match.startsInMinutes ?? 60;
    prematchFactors.push(`Анализ за 1 час до матча (${minLeft} мин до старта${match.startTime ? `, начало в ${match.startTime}` : ''})`);
  }

  if (match.odds) {
    prematchFactors.push(`Линия БК: П1 ${match.odds.home.toFixed(2)} | X ${match.odds.draw.toFixed(2)} | П2 ${match.odds.away.toFixed(2)}`);
    prematchFactors.push(`ТБ 2.5: ${match.odds.over25.toFixed(2)}${match.odds.btts ? ` • ОЗ: ${match.odds.btts.toFixed(2)}` : ''}`);
  }

  const ipt = calculateMatchIPT(match);
  if (rule?.minModelIpt !== undefined || ipt >= 2.6) {
    prematchFactors.push(`IPT модель: ${ipt.toFixed(2)} (расчетный верховой тотал)`);
  }

  if (match.history?.h2hOver15Pct) {
    prematchFactors.push(`H2H очные: ${match.history.h2hOver15Pct}% ТБ 1.5`);
  }

  if (match.history?.homeOver25Streak && match.history.homeOver25Streak >= 3) {
    prematchFactors.push(`Серия ТБ 2.5: ${match.history.homeOver25Streak} матчей подряд`);
  }

  if (rule?.isDeadlyCombination) {
    prematchFactors.push('Смертельная комбинация котировок фаворита');
  }

  // Live indicators
  if (match.minute > 0) {
    liveFactors.push(`${match.minute}' минута (${match.score[0]}:${match.score[1]})`);
  }

  if (analysis) {
    liveFactors.push(`Давление: ${analysis.pressureIndex}/100 (${analysis.goalProbability === 'EXTREME' ? 'Гол назревает' : analysis.goalProbability === 'HIGH' ? 'Высокое' : 'Среднее'})`);
  }

  const diffDang = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
  liveFactors.push(`Оп. атаки: ${match.stats.dangerousAttacks[0]}-${match.stats.dangerousAttacks[1]} (${diffDang >= 0 ? '+' : ''}${diffDang})`);
  liveFactors.push(`Удары: ${match.stats.shotsOnTarget[0]}-${match.stats.shotsOnTarget[1]} створ`);
  liveFactors.push(`Угловые: ${match.stats.corners[0]}-${match.stats.corners[1]}`);

  return { prematchFactors, liveFactors };
}

/**
 * Safely escape characters that break Telegram HTML parse_mode: &, <, >
 */
export function escapeTelegramHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Enhanced Telegram Alert formatter with separation for Live vs Pre-match bets.
 */
export function formatExtendedTelegramAlert(
  match: Match,
  rule: FilterRule,
  analysis: PressureAnalysis,
  forcedBetType?: BetType
): string {
  const betType = forcedBetType || getBetTypeForSignal(rule, match.minute, match);
  const isPrematch = betType === 'PREMATCH';

  const homeTeam = escapeTelegramHtml(match.homeTeam);
  const awayTeam = escapeTelegramHtml(match.awayTeam);
  const league = escapeTelegramHtml(match.league);
  const country = escapeTelegramHtml(match.country);
  const ruleName = escapeTelegramHtml(rule.name);
  const targetMarket = escapeTelegramHtml(rule.targetMarket || '');

  const diffDang = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
  const dangSign =
    diffDang > 0
      ? `+${diffDang} (${homeTeam})`
      : diffDang < 0
      ? `+${Math.abs(diffDang)} (${awayTeam})`
      : 'Равенство';

  const totalShots =
    match.stats.shotsOnTarget[0] +
    match.stats.shotsOnTarget[1] +
    match.stats.shotsOffTarget[0] +
    match.stats.shotsOffTarget[1];
  const totalCorners = match.stats.corners[0] + match.stats.corners[1];

  // High-visibility, prominent recommended outcome block
  const rawMarket = targetMarket || rule.targetMarket || 'ТБ 0.5 (Тотал Больше)';
  const marketDisplay = rawMarket.toUpperCase();
  const oddsEstimate = match.odds ? (match.odds.over25 ? match.odds.over25.toFixed(2) : '1.80 - 1.95') : '1.85';

  const marketLine = (
    `\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🎯 <b>РЕКОМЕНДОВАННЫЙ ИСХОД:</b>\n` +
    `👉 <b><u>🔥  ${escapeTelegramHtml(marketDisplay)}  🔥</u></b>\n` +
    `💰 <b>Рынок:</b> ${escapeTelegramHtml(rawMarket)}   |   📈 <b>Кэф: ~${oddsEstimate}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  );

  const quickGoalsPatternLine = (rule.requireGuestTwoQuickGoals1H || rule.requireNoGoalsSinceQuickGoals)
    ? `⚡ <b>Паттерн:</b> 2 быстрых гола в 1-м тайме (≤15 мин между голами) + без голов до 75'\n⏱ <b>Точка входа:</b> 75-я минута матча — ожидание гола (ТБ) по повышенному кэфу\n\n`
    : '';

  const strat7PatternLine = (rule.id === 'strat-7' || rule.name.includes('Стратегия 7') || rule.scoreCondition === 'TOTAL_UNDER_25')
    ? `📐 <b>Стратегия 7 (ТБ 2.5 на 70'):</b> 70-я минута матча при тотале ≤ 2 (счёт: <code>${match.score[0]}:${match.score[1]}</code>)\n⏱ <b>Точка входа:</b> 70-я минута — ставка на ТБ 2.5 / гол в концовке по повышенному кэфу!\n\n`
    : '';

  const activeDrop = match.oddsDrop || (match.marketFlows && match.marketFlows[0]);
  const oddsDropPatternLine =
    rule.category === 'odds_drop' || rule.minOddsDropPercent !== undefined || activeDrop
      ? activeDrop
        ? `📉 <b>Прогруз линии (Smart Money):</b> <u>${escapeTelegramHtml(activeDrop.marketName)}</u>\n` +
          `   • Движение кэфа: <b>-${activeDrop.dropPercent.toFixed(1)}%</b> (<code>${activeDrop.initialOdds.toFixed(2)}</code> ➔ <code>${activeDrop.currentOdds.toFixed(2)}</code>)\n` +
          `   • Доля денег: <b>${activeDrop.moneyVolumePercent}% пула рынка</b>${activeDrop.moneyVolumeAmountEur ? ` (≈ €${activeDrop.moneyVolumeAmountEur.toLocaleString('ru-RU')})` : ''}\n` +
          `   • Биржа/Букмекер: <i>${escapeTelegramHtml(activeDrop.bookmaker || 'Betfair Exchange / Pinnacle')}</i>\n\n`
        : ''
      : '';

  const headerTag = isPrematch
    ? `📋 <b>[ПРЕДМАТЧЕВЫЙ ОТБОР]</b>\n💡 <b>Стратегия: ${ruleName}</b>\n⏱ <i>До начала: ${match.startsInMinutes ?? 60} мин${match.startTime ? ` (${escapeTelegramHtml(match.startTime)})` : ''}</i>`
    : `🔴 <b>[ЛАЙВ СИГНАЛ]</b> (Мин: <b>${match.minute}'</b> | Счёт: <b>${match.score[0]}:${match.score[1]}</b>)\n⚡ <b>Стратегия: ${ruleName}</b>`;

  const prematchSection = (
    `📊 <b>Показатели:</b>\n` +
    `💰 <b>Линия БК:</b> П1 <code>${match.odds.home.toFixed(2)}</code> | X <code>${match.odds.draw.toFixed(2)}</code> | П2 <code>${match.odds.away.toFixed(2)}</code>\n` +
    `📈 <b>Тотал 2.5:</b> <code>${match.odds.over25.toFixed(2)}</code>` +
    (match.odds.btts ? ` | <b>ОЗ:</b> <code>${match.odds.btts.toFixed(2)}</code>` : '') +
    `\n` +
    (rule.minModelIpt || calculateMatchIPT(match) >= 2.5 ? `📐 <b>Модель IPT:</b> <code>${calculateMatchIPT(match).toFixed(2)}</code>\n` : '') +
    (match.history?.h2hOver15Pct ? `👥 <b>H2H:</b> ${match.history.h2hOver15Pct}% ТБ 1.5\n` : '') +
    (match.history?.homeOver25Streak ? `🔥 <b>Серия ТБ 2.5:</b> ${match.history.homeOver25Streak} матчей подряд\n` : '')
  );

  const liveSection = (
    `🔥 <b>Индекс давления:</b> ${analysis.pressureIndex}/100 (${analysis.goalProbability})\n\n` +
    `📊 <b>Опасные атаки:</b> ${match.stats.dangerousAttacks[0]} - ${match.stats.dangerousAttacks[1]} [${dangSign}]\n` +
    `🎯 <b>Удары в створ:</b> ${match.stats.shotsOnTarget[0]} - ${match.stats.shotsOnTarget[1]} (Всего: ${totalShots})\n` +
    `🚩 <b>Угловые:</b> ${match.stats.corners[0]} - ${match.stats.corners[1]} (Всего: ${totalCorners})\n` +
    `📈 <b>xG:</b> ${match.stats.xg[0].toFixed(2)} vs ${match.stats.xg[1].toFixed(2)}\n` +
    `⚡ <b>Владение мячом:</b> ${match.stats.possession[0]}% - ${match.stats.possession[1]}%\n\n`
  );

  const matchTimeDisplay = isPrematch
    ? `(⏳ До начала: ${match.startsInMinutes ?? 60} мин${match.startTime ? ` [${escapeTelegramHtml(match.startTime)}]` : ''})`
    : `(<b>${match.minute}'</b> | <b>${match.score[0]}:${match.score[1]}</b>)`;

  const escapedReasons = analysis.reasons.map((r) => escapeTelegramHtml(r));

  return (
    `${headerTag}\n` +
    `🏆 <b>${match.countryCode} ${country} | ${league}</b>\n` +
    `⚔️ <b>${homeTeam} vs ${awayTeam}</b> ${matchTimeDisplay}\n` +
    `${marketLine}` +
    `${quickGoalsPatternLine}` +
    `${strat7PatternLine}` +
    `${oddsDropPatternLine}` +
    (isPrematch ? prematchSection + '\n' : liveSection) +
    (!isPrematch && (rule.minOddsOver25 || rule.maxOddsFavorite || rule.minModelIpt) ? prematchSection + '\n' : '') +
    (escapedReasons.length > 0 ? `💡 <i>Факторы: ${escapedReasons.join(' • ')}</i>\n` : '') +
    `⏱ <i>Время: ${new Date().toLocaleTimeString('ru-RU')} | Источник: ${escapeTelegramHtml(match.source)}</i>`
  );
}

/**
 * Formats Telegram message when match completes or signal resolves with outcome (WIN / LOSS / REFUND).
 * Rewrites/updates the original Telegram alert with official match result.
 */
export function formatResolvedTelegramAlert(
  signal: SignalAlert,
  finalScore: string,
  outcome: SignalOutcome,
  matchDetails?: { homeTeam?: string; awayTeam?: string; league?: string; country?: string }
): string {
  const isWin = outcome === 'WIN';
  const isLoss = outcome === 'LOSS';

  const statusHeader = isWin
    ? '✅ <b>СИГНАЛ ЗАШЁЛ (WIN)</b> 🎯'
    : isLoss
    ? '❌ <b>СИГНАЛ НЕ ЗАШЁЛ (LOSS)</b> ⚠️'
    : '🔄 <b>ВОЗВРАТ СТАВКИ (REFUND)</b> ↩️';

  const profitText =
    signal.profit !== undefined
      ? signal.profit > 0
        ? `+${signal.profit} ₽ (ROI +${((signal.profit / (signal.stake || 1000)) * 100).toFixed(0)}%)`
        : `${signal.profit} ₽`
      : isWin
      ? `+${((signal.odds - 1) * (signal.stake || 1000)).toFixed(0)} ₽`
      : isLoss
      ? `-${signal.stake || 1000} ₽`
      : '0 ₽';

  const home = escapeTelegramHtml(matchDetails?.homeTeam || signal.matchName.split(' vs ')[0] || 'Хозяева');
  const away = escapeTelegramHtml(matchDetails?.awayTeam || signal.matchName.split(' vs ')[1] || 'Гости');
  const league = escapeTelegramHtml(matchDetails?.league || signal.league);
  const country = escapeTelegramHtml(matchDetails?.country || signal.country);
  const ruleName = escapeTelegramHtml(signal.ruleName);
  const marketSuggestion = escapeTelegramHtml(signal.marketSuggestion || '');

  const scoreChangeNote =
    signal.score !== finalScore
      ? `<i>(на момент сигнала: ${signal.score} на ${signal.minute}')</i>`
      : `<i>(сигнал выдан на ${signal.minute}')</i>`;

  const betTypeLabel = signal.betType === 'PREMATCH' ? '📋 Предматчевый отбор' : '🔴 Лайв ставка';

  return (
    `${statusHeader}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏷 <b>Категория:</b> ${betTypeLabel}\n` +
    `📋 <b>Стратегия:</b> ${ruleName}\n` +
    `🏆 <b>${country} | ${league}</b>\n` +
    `⚽ <b>${home} ${finalScore} ${away}</b> [Матч завершён]\n` +
    `${scoreChangeNote}\n` +
    (marketSuggestion
      ? `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🎯 <b>РЕКОМЕНДАЦИЯ БЫЛА:</b>\n` +
        `👉 <b><u>🔥  ${escapeTelegramHtml(marketSuggestion.toUpperCase())}  🔥</u></b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      : '') +
    `📈 <b>Коэффициент:</b> <b>${signal.odds.toFixed(2)}</b>\n` +
    `💰 <b>Итог:</b> <b>${isWin ? '✅ ПРОШЛО' : isLoss ? '❌ НЕ ПРОШЛО' : '🔄 ВОЗВРАТ'}</b> [${profitText}]\n\n` +
    `⏱ <i>Результат зафиксирован: ${new Date().toLocaleTimeString('ru-RU')}</i>`
  );
}

/**
 * Automatically evaluates whether a signal outcome was successful (WIN) or not (LOSS).
 * Supports early wins (e.g. goal scored for Over market) or final whistle evaluations.
 */
export function evaluateSignalOutcome(
  signal: SignalAlert,
  currentScore: [number, number],
  isMatchFinished: boolean
): { outcome: SignalOutcome; note?: string; shouldResolve: boolean } {
  const initialParts = signal.score.split(':').map((s: string) => parseInt(s.trim(), 10));
  const initHome = isNaN(initialParts[0]) ? 0 : initialParts[0];
  const initAway = isNaN(initialParts[1]) ? 0 : initialParts[1];
  const initialTotalGoals = initHome + initAway;

  const curHome = currentScore[0];
  const curAway = currentScore[1];
  const currentTotalGoals = curHome + curAway;
  const goalsSinceSignal = currentTotalGoals - initialTotalGoals;

  const market = (signal.marketSuggestion || signal.ruleName).toLowerCase();

  // 1. Goal markets (Over, Goal in match, Goal in 2nd half)
  if (
    market.includes('гол') ||
    market.includes('тб') ||
    market.includes('тотал больше') ||
    market.includes('over')
  ) {
    if (market.includes('тб 1.5')) {
      if (currentTotalGoals >= 2) {
        return { outcome: 'WIN', note: `Тотал матча ${currentTotalGoals} >= 1.5`, shouldResolve: true };
      }
      if (isMatchFinished) {
        return { outcome: 'LOSS', note: `Итоговый тотал ${currentTotalGoals} < 1.5`, shouldResolve: true };
      }
    } else if (market.includes('тб 2.5')) {
      if (currentTotalGoals >= 3) {
        return { outcome: 'WIN', note: `Тотал матча ${currentTotalGoals} >= 2.5`, shouldResolve: true };
      }
      if (isMatchFinished) {
        return { outcome: 'LOSS', note: `Итоговый тотал ${currentTotalGoals} < 2.5`, shouldResolve: true };
      }
    } else {
      // General goal after signal (ТБ 0.5 во 2Т / Гол в матче)
      if (goalsSinceSignal > 0) {
        return { outcome: 'WIN', note: `Забит гол после сигнала (${goalsSinceSignal} гол)`, shouldResolve: true };
      }
      if (isMatchFinished) {
        return { outcome: 'LOSS', note: 'Матч завершён без новых голов', shouldResolve: true };
      }
    }
  }

  // 2. Both teams to score (ОЗ - Да)
  if (market.includes('обе забьют') || market.includes('оз') || market.includes('btts')) {
    if (curHome > 0 && curAway > 0) {
      return { outcome: 'WIN', note: `Обе команды забили (${curHome}:${curAway})`, shouldResolve: true };
    }
    if (isMatchFinished) {
      return { outcome: 'LOSS', note: `Матч завершён со счётом ${curHome}:${curAway}`, shouldResolve: true };
    }
  }

  // 3. Corners / Attack pressure markets
  if (market.includes('угл') || market.includes('corner')) {
    if (goalsSinceSignal > 0) {
      return { outcome: 'WIN', note: `Гол после давления угловых (${curHome}:${curAway})`, shouldResolve: true };
    }
    if (isMatchFinished) {
      return { outcome: 'LOSS', note: `Матч завершён со счётом ${curHome}:${curAway}`, shouldResolve: true };
    }
  }

  // 4. Default evaluation on match finish: if goals were scored after signal -> WIN, else LOSS
  if (isMatchFinished) {
    if (goalsSinceSignal > 0) {
      return { outcome: 'WIN', note: `Счёт изменился с ${signal.score} на ${curHome}:${curAway}`, shouldResolve: true };
    } else {
      return { outcome: 'LOSS', note: `Счёт не изменился (${curHome}:${curAway})`, shouldResolve: true };
    }
  }

  return { outcome: 'PENDING', shouldResolve: false };
}


