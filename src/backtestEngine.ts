import { FilterRule, HistoricalMatch, BacktestSignal, BacktestResult, SignalOutcome, LeagueStats } from './types';
import { HISTORICAL_MATCHES } from './data/historicalMatches';
import { calculatePressureAnalysis } from './algorithms';

/**
 * Determine realistic odds for the target market and minute of entry
 */
export function getEstimatedOdds(targetMarket: string | undefined, minute: number): number {
  const marketLower = (targetMarket || '').toLowerCase();

  // 1. Explicit odds embedded in targetMarket with ~ or ≈ or 'кэф', e.g. "(~1.72)" or "(~1.70)"
  const matchExplicit =
    marketLower.match(/[~≈]\s*(\d+[.,]\d+)/) ||
    marketLower.match(/кэф[^\d]*(\d+[.,]\d+)/) ||
    marketLower.match(/\((\d+[.,]\d+)\)/);
  if (matchExplicit) {
    const parsed = parseFloat(matchExplicit[1].replace(',', '.'));
    if (parsed >= 1.20 && parsed <= 5.0) {
      return parsed;
    }
  }

  if (marketLower.includes('угл')) {
    if (minute >= 80) return 1.95;
    if (minute >= 75) return 1.72;
    if (minute >= 60) return 1.85;
    return 1.80;
  }

  if (marketLower.includes('камбэк') || marketLower.includes('1x') || marketLower.includes('фора')) {
    if (minute >= 60 && minute <= 76) return 1.70;
    return 2.15;
  }

  if (marketLower.includes('1-м тайме') || marketLower.includes('первом тайме')) {
    if (minute >= 35) return 2.10;
    return 1.78;
  }

  if (marketLower.includes('прогруз') || marketLower.includes('smart money') || marketLower.includes('steam')) {
    return 1.70;
  }

  // Goals (ТБ 0.5 / ТБ 1.5 / ТБ 2.5)
  if (minute >= 80) return 2.35;
  if (minute >= 70) return 1.75;
  if (minute >= 55) return 1.72;
  return 1.75;
}

/**
 * Evaluates whether a target market won or lost given the match evolution
 */
export function evaluateMarketOutcome(
  targetMarket: string | undefined,
  ruleCategory: string | undefined,
  signalMinute: number,
  scoreAtSignal: [number, number],
  finalScore: [number, number],
  cornersAtSignal: [number, number],
  finalCorners: [number, number]
): { outcome: SignalOutcome; reason: string } {
  const market = (targetMarket || '').toLowerCase();
  const goalsAtSignal = scoreAtSignal[0] + scoreAtSignal[1];
  const finalGoals = finalScore[0] + finalScore[1];
  const newGoals = finalGoals - goalsAtSignal;

  const cornersSignalTotal = cornersAtSignal[0] + cornersAtSignal[1];
  const finalCornersTotal = finalCorners[0] + finalCorners[1];
  const newCorners = finalCornersTotal - cornersSignalTotal;

  // Category: Halftime goal
  if (ruleCategory === 'halftime' || market.includes('1-м тайме') || market.includes('первом тайме')) {
    // If signal was in 1st half and at least 1 goal was scored before FT (or specifically new goal scored)
    if (newGoals >= 1) {
      return {
        outcome: 'WIN',
        reason: `Гол забит после сигнала (счет сменился с ${scoreAtSignal[0]}:${scoreAtSignal[1]} на ${finalScore[0]}:${finalScore[1]})`,
      };
    }
    return {
      outcome: 'LOSS',
      reason: `Гол не состоялся (итоговый счет ${finalScore[0]}:${finalScore[1]})`,
    };
  }

  // Category: Corners
  if (ruleCategory === 'corners' || market.includes('угл')) {
    // Usually betting on 2+ additional corners or Total Over 9.5
    if (newCorners >= 2 || finalCornersTotal >= 10) {
      return {
        outcome: 'WIN',
        reason: `Подано +${newCorners} угловых после сигнала (итого ${finalCornersTotal} угловых)`,
      };
    }
    return {
      outcome: 'LOSS',
      reason: `Не хватило угловых: всего +${newCorners} после сигнала (итого ${finalCornersTotal})`,
    };
  }

  // Category: Comeback (только если сам маркет на камбэк/1X, а не на ТБ или Гол)
  if ((ruleCategory === 'comeback' || market.includes('камбэк') || market.includes('1x')) && !market.includes('тб') && !market.includes('гол')) {
    const trailingHome = scoreAtSignal[0] < scoreAtSignal[1];
    const trailingAway = scoreAtSignal[1] < scoreAtSignal[0];

    if (trailingHome) {
      // Home had to tie or win
      if (finalScore[0] >= finalScore[1]) {
        return {
          outcome: 'WIN',
          reason: `Камбэк хозяев удался: итоговый счет ${finalScore[0]}:${finalScore[1]} (был ${scoreAtSignal[0]}:${scoreAtSignal[1]})`,
        };
      }
    } else if (trailingAway) {
      if (finalScore[1] >= finalScore[0]) {
        return {
          outcome: 'WIN',
          reason: `Камбэк гостей удался: итоговый счет ${finalScore[0]}:${finalScore[1]} (был ${scoreAtSignal[0]}:${scoreAtSignal[1]})`,
        };
      }
    }
    return {
      outcome: 'LOSS',
      reason: `Отстающая команда не смогла сравнять (итоговый счет ${finalScore[0]}:${finalScore[1]})`,
    };
  }

  // Category: Dropping Odds / Smart Money (Steam Moves)
  if (ruleCategory === 'odds_drop' || market.includes('прогруз') || market.includes('smart money') || market.includes('steam')) {
    if (market.includes('п1') || market.includes('победа 1') || market.includes('хозяев') || market.includes('home')) {
      if (finalScore[0] > finalScore[1]) {
        return {
          outcome: 'WIN',
          reason: `Прогруз на П1 оправдался: победа хозяев ${finalScore[0]}:${finalScore[1]}`,
        };
      }
      return {
        outcome: 'LOSS',
        reason: `Прогруз на П1 не сыграл: итоговый счет ${finalScore[0]}:${finalScore[1]}`,
      };
    }
    if (market.includes('п2') || market.includes('победа 2') || market.includes('гостей') || market.includes('away')) {
      if (finalScore[1] > finalScore[0]) {
        return {
          outcome: 'WIN',
          reason: `Прогруз на П2 оправдался: победа гостей ${finalScore[0]}:${finalScore[1]}`,
        };
      }
      return {
        outcome: 'LOSS',
        reason: `Прогруз на П2 не сыграл: итоговый счет ${finalScore[0]}:${finalScore[1]}`,
      };
    }
    if (newGoals >= 1 || finalGoals >= 3) {
      return {
        outcome: 'WIN',
        reason: `Прогруз подтвердился результатом: голов в матче ${finalGoals} (${finalScore[0]}:${finalScore[1]})`,
      };
    }
    return {
      outcome: 'LOSS',
      reason: `Прогруз не подтвердился результатом (${finalScore[0]}:${finalScore[1]})`,
    };
  }

  // Category: Combined Draw / Under (ТМ 2.5 / Ничья (X))
  if ((market.includes('ничья') && market.includes('тм')) || market.includes('тм 2.5 / ничья')) {
    if (finalGoals <= 2 || finalScore[0] === finalScore[1]) {
      return {
        outcome: 'WIN',
        reason: `Прогноз ТМ 2.5 / Ничья сыграл: итоговый счёт ${finalScore[0]}:${finalScore[1]} (тотал ${finalGoals})`,
      };
    }
    return {
      outcome: 'LOSS',
      reason: `ТМ 2.5 / Ничья не сыграли: счёт ${finalScore[0]}:${finalScore[1]}`,
    };
  }

  // Category: Both Teams To Score (Обе команды забьют / BTTS)
  if (market.includes('обе команды забьют') || market.includes('оз') || market.includes('btts')) {
    if ((finalScore[0] > 0 && finalScore[1] > 0) || (market.includes('1.5') && finalGoals >= 2)) {
      return {
        outcome: 'WIN',
        reason: `Обе забьют / ТБ 1.5 сыграли: итоговый счёт ${finalScore[0]}:${finalScore[1]}`,
      };
    }
    return {
      outcome: 'LOSS',
      reason: `Обе забьют не сыграли: итоговый счёт ${finalScore[0]}:${finalScore[1]}`,
    };
  }

  // Category: Total Under / Сушка (ТМ, Under, Тотал Меньше)
  const isUnderBet =
    (market.includes('тм') || market.includes('under') || market.includes('тотал меньше') || market.includes('сушка')) &&
    !market.includes('тб') &&
    !market.includes('over');

  if (isUnderBet) {
    if (market.includes('2.5') || market.includes('2,5')) {
      if (finalGoals <= 2) {
        return {
          outcome: 'WIN',
          reason: `ТМ 2.5 сыграл: итоговый тотал ${finalGoals} голов (счет ${finalScore[0]}:${finalScore[1]})`,
        };
      }
      return {
        outcome: 'LOSS',
        reason: `ТМ 2.5 проигран: забито ${finalGoals} голов (счет ${finalScore[0]}:${finalScore[1]})`,
      };
    }

    // General ТМ (+0.5 к текущему): no new goals
    if (newGoals === 0) {
      return {
        outcome: 'WIN',
        reason: `Счет удержан без новых голов: итог ${finalScore[0]}:${finalScore[1]} (ТМ зашел!)`,
      };
    }
    return {
      outcome: 'LOSS',
      reason: `Забит гол после сигнала (+${newGoals} гол, итог ${finalScore[0]}:${finalScore[1]}), ТМ не сыграл`,
    };
  }

  // Category: Draw / Ничья (X)
  if (market.includes('ничья') || market.includes(' x') || market === 'x') {
    if (finalScore[0] === finalScore[1]) {
      return {
        outcome: 'WIN',
        reason: `Матч завершился вничью: ${finalScore[0]}:${finalScore[1]}`,
      };
    }
    return {
      outcome: 'LOSS',
      reason: `Матч завершился без ничьей: победа одной из команд (${finalScore[0]}:${finalScore[1]})`,
    };
  }

  // Specific Totals (ТБ 1.5, ТБ 2.5, ТБ 3.5)
  if (market.includes('тб 1.5') && !market.includes('во 2-м тайме') && !market.includes('1т')) {
    if (finalGoals >= 2 || newGoals >= 1) {
      return {
        outcome: 'WIN',
        reason: `ТБ 1.5 зашёл: забито ${finalGoals} голов (${finalScore[0]}:${finalScore[1]})`,
      };
    }
    return {
      outcome: 'LOSS',
      reason: `ТБ 1.5 не зашёл: забито ${finalGoals} голов (${finalScore[0]}:${finalScore[1]})`,
    };
  }

  // Default: Total Over Goals (ТБ 0.5 во 2-м тайме / еще гол)
  if (newGoals >= 1) {
    return {
      outcome: 'WIN',
      reason: `Забит гол в матче: счет ${scoreAtSignal[0]}:${scoreAtSignal[1]} → ${finalScore[0]}:${finalScore[1]} (+${newGoals})`,
    };
  }

  return {
    outcome: 'LOSS',
    reason: `Счет не изменился до конца матча (${finalScore[0]}:${finalScore[1]})`,
  };
}

/**
 * Checks if a historical snapshot matches the filter rule criteria
 */
function snapshotMatchesRule(
  snapshot: HistoricalMatch['snapshots'][0],
  rule: FilterRule,
  match: HistoricalMatch
): { matches: boolean; reason: string } {
  const { minute, score, stats } = snapshot;
  const odds = snapshot.odds;
  const prematchOdds = match.snapshots[0]?.odds || odds;
  const activeOdds = odds || prematchOdds;

  // 1. Minute check
  if (minute < rule.minMinute || minute > rule.maxMinute) {
    return { matches: false, reason: `Минута ${minute}' вне диапазона [${rule.minMinute}-${rule.maxMinute}]` };
  }

  // 2. Score condition check
  const [homeScore, awayScore] = score;
  const scoreDiff = homeScore - awayScore;

  if (rule.scoreCondition === '0-0' && (homeScore !== 0 || awayScore !== 0)) {
    return { matches: false, reason: 'Счет не 0:0' };
  }
  if (rule.scoreCondition === 'DRAW' && homeScore !== awayScore) {
    return { matches: false, reason: 'Не ничейный счет' };
  }
  if (rule.scoreCondition === 'HOME_LEAD' && scoreDiff <= 0) {
    return { matches: false, reason: 'Хозяева не ведут в счете' };
  }
  if (rule.scoreCondition === 'AWAY_LEAD' && scoreDiff >= 0) {
    return { matches: false, reason: 'Гости не ведут в счете' };
  }
  if (rule.scoreCondition === 'ONE_GOAL_DIFF' && Math.abs(scoreDiff) !== 1) {
    return { matches: false, reason: 'Разница не в 1 гол' };
  }
  if (rule.maxScoreDiff !== undefined && Math.abs(scoreDiff) > rule.maxScoreDiff) {
    return { matches: false, reason: `Разница в счёте ${Math.abs(scoreDiff)} > ${rule.maxScoreDiff}` };
  }
  if ((rule.scoreCondition === 'TOTAL_UNDER_25' || rule.scoreCondition === 'TOTAL_UNDER_2') && homeScore + awayScore > 2) {
    return { matches: false, reason: 'ТБ 2.5 уже пробит (тотал голов > 2)' };
  }
  if (rule.maxTotalGoals !== undefined && homeScore + awayScore > rule.maxTotalGoals) {
    return { matches: false, reason: `Тотал голов ${homeScore + awayScore} > ${rule.maxTotalGoals} (ТБ пробит)` };
  }
  if (rule.scoreCondition === 'TOTAL_OVER_2' && homeScore + awayScore <= 2) {
    return { matches: false, reason: 'Тотал меньше или равен 2' };
  }

  // 3. Dangerous attacks difference
  const dangDiff = Math.abs(stats.dangerousAttacks[0] - stats.dangerousAttacks[1]);
  if (rule.minDangerousAttacksDiff && dangDiff < rule.minDangerousAttacksDiff) {
    return { matches: false, reason: `Разница оп. атак ${dangDiff} < ${rule.minDangerousAttacksDiff}` };
  }

  // 4. Dangerous attacks total
  const dangTotal = stats.dangerousAttacks[0] + stats.dangerousAttacks[1];
  if (rule.minDangerousAttacksTotal && dangTotal < rule.minDangerousAttacksTotal) {
    return { matches: false, reason: `Всего оп. атак ${dangTotal} < ${rule.minDangerousAttacksTotal}` };
  }
  if (rule.maxDangerousAttacksTotal && dangTotal > rule.maxDangerousAttacksTotal) {
    return { matches: false, reason: `Всего оп. атак ${dangTotal} > ${rule.maxDangerousAttacksTotal}` };
  }

  // 5. Total shots
  const totalShots = stats.shotsOnTarget[0] + stats.shotsOnTarget[1] + stats.shotsOffTarget[0] + stats.shotsOffTarget[1];
  if (rule.minTotalShots && totalShots < rule.minTotalShots) {
    return { matches: false, reason: `Всего ударов ${totalShots} < ${rule.minTotalShots}` };
  }

  // 6. Shots on target total
  const shotsOnTargetTotal = stats.shotsOnTarget[0] + stats.shotsOnTarget[1];
  if (rule.minShotsOnTargetTotal && shotsOnTargetTotal < rule.minShotsOnTargetTotal) {
    return { matches: false, reason: `Ударов в створ ${shotsOnTargetTotal} < ${rule.minShotsOnTargetTotal}` };
  }
  if (rule.maxShotsOnTargetTotal && shotsOnTargetTotal > rule.maxShotsOnTargetTotal) {
    return { matches: false, reason: `Ударов в створ ${shotsOnTargetTotal} > ${rule.maxShotsOnTargetTotal}` };
  }

  // 7. Total corners
  const totalCorners = stats.corners[0] + stats.corners[1];
  if (rule.minTotalCorners && totalCorners < rule.minTotalCorners) {
    return { matches: false, reason: `Всего угловых ${totalCorners} < ${rule.minTotalCorners}` };
  }

  // 8. Total xG
  const totalXg = stats.xg[0] + stats.xg[1];
  if (rule.minXgTotal && totalXg < rule.minXgTotal) {
    return { matches: false, reason: `Суммарный xG ${totalXg.toFixed(2)} < ${rule.minXgTotal}` };
  }

  // 8b. xG Over Score Deficit: (xG[0] + xG[1]) - (score[0] + score[1]) >= minXgOverScoreDiff
  if (rule.minXgOverScoreDiff !== undefined) {
    const xgDeficit = totalXg - (score[0] + score[1]);
    if (xgDeficit < rule.minXgOverScoreDiff) {
      return {
        matches: false,
        reason: `Дефицит xG над счётом ${xgDeficit.toFixed(2)} < ${rule.minXgOverScoreDiff}`,
      };
    }
  }

  // 8c. requireBttsNotHit: at least one team has 0 goals (0:0, 1:0, 0:1, 2:0 etc)
  if (rule.requireBttsNotHit && (homeScore > 0 && awayScore > 0)) {
    return { matches: false, reason: 'Обе команды уже забили' };
  }

  // 8d. minTotalGoals check
  if (rule.minTotalGoals !== undefined && (homeScore + awayScore) < rule.minTotalGoals) {
    return { matches: false, reason: `Тотал голов ${homeScore + awayScore} < ${rule.minTotalGoals}` };
  }

  // 8e. Two quick goals in 1st half
  if (rule.requireGuestTwoQuickGoals1H || rule.requireTwoQuickGoals1H || rule.requireNoGoalsSinceQuickGoals) {
    const totalGoalsNow = homeScore + awayScore;
    if (totalGoalsNow < 2) {
      return { matches: false, reason: 'Менее 2 голов для стратегии 2 быстрых голов' };
    }
    if (rule.requireGuestTwoQuickGoals1H && awayScore < 2) {
      return { matches: false, reason: 'Гости забили менее 2 голов в 1-м тайме' };
    }
    const had2Quick = match.history?.guestScoredTwoQuickFirstHalf ||
      match.history?.twoQuickGoalsFirstHalf ||
      (rule.requireGuestTwoQuickGoals1H && awayScore >= 2 && minute >= 45) ||
      (!rule.requireGuestTwoQuickGoals1H && (homeScore >= 2 || awayScore >= 2) && minute >= 45);

    if (!had2Quick) {
      return { matches: false, reason: 'Нет 2 быстрых голов в 1Т' };
    }

    if (rule.requireNoGoalsSinceQuickGoals) {
      const initQuick = match.history?.goalsAtFirstHalfQuick ?? (awayScore >= 2 ? awayScore : totalGoalsNow);
      if (totalGoalsNow > initQuick && match.history?.noGoalsSinceQuickGoals === false) {
        return { matches: false, reason: 'Счёт менялся после быстрых голов' };
      }
    }
  }

  // 8f. Historical streaks and conditions
  if (rule.requireNoZeroZeroLast5) {
    if (match.history?.homeLast5NoZeroZero === false || match.history?.awayLast5NoZeroZero === false) {
      return { matches: false, reason: 'Были 0:0 в последних играх' };
    }
  }

  if (rule.requireRedCardLastMatch) {
    if (!match.history?.hadRedCardLastMatch) {
      return { matches: false, reason: 'Нет КК в прошлом матче' };
    }
  }

  if (rule.requireH2hOver15High) {
    if (match.history && (match.history.h2hOver15Pct ?? 100) < 80) {
      return { matches: false, reason: 'H2H ТБ 1.5 < 80%' };
    }
  }

  if (rule.minOver25Streak) {
    const sH = match.history?.homeOver25Streak ?? 5;
    const sA = match.history?.awayOver25Streak ?? 5;
    if (rule.requireOver25StreakAllowed4Of5) {
      const maxS = Math.max(sH, sA);
      const minS = Math.min(sH, sA);
      if (maxS < 5 || minS < 4) {
        return { matches: false, reason: 'Серия ТБ 2.5 не удовлетворяет 5/5 и 4/5' };
      }
    } else if (Math.max(sH, sA) < rule.minOver25Streak) {
      return { matches: false, reason: `Серия ТБ 2.5 < ${rule.minOver25Streak}` };
    }
  }

  if (rule.requireNoGoalsInSecondHalf) {
    if (minute >= 45) {
      const htScore = match.history?.firstHalfScore ?? [match.snapshots[0]?.score[0] ?? 0, match.snapshots[0]?.score[1] ?? 0];
      const htTotal = htScore[0] + htScore[1];
      if (homeScore + awayScore > htTotal && match.history?.noGoalsInSecondHalf === false) {
        return { matches: false, reason: 'Во втором тайме уже был забит гол' };
      }
    }
  }

  if (rule.minModelIpt !== undefined) {
    const ipt = match.history?.predictedIpt ?? (activeOdds && activeOdds.over25 <= 1.80 ? 2.80 : 2.40);
    if (ipt < rule.minModelIpt) {
      return { matches: false, reason: `IPT ${ipt} < ${rule.minModelIpt}` };
    }
  }

  // 9. Red card check
  const totalReds = stats.redCards[0] + stats.redCards[1];
  if (rule.redCardCondition === 'HAS_RED_CARD' && totalReds === 0) {
    return { matches: false, reason: 'Нет красных карточек' };
  }
  if (rule.redCardCondition === 'NO_RED_CARDS' && totalReds > 0) {
    return { matches: false, reason: 'В матче есть удаление' };
  }

  // 10. Pressure index calculation
  if (rule.minPressureIndex) {
    const mockMatch = {
      id: match.id,
      country: match.country,
      countryCode: match.countryCode,
      league: match.league,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      score,
      minute,
      status: 'LIVE' as const,
      source: 'Flashscore' as const,
      stats,
      momentum: [],
      lastEvent: '',
      odds: { home: 2.0, draw: 3.2, away: 3.5, over25: 1.85 },
    };
    const pressure = calculatePressureAnalysis(mockMatch);
    if (pressure.pressureIndex < rule.minPressureIndex) {
      return {
        matches: false,
        reason: `Индекс давления ${pressure.pressureIndex}% < ${rule.minPressureIndex}%`,
      };
    }
  }

  // 10b. Max Pressure index
  if (rule.maxPressureIndex) {
    const mockMatch = {
      id: match.id,
      country: match.country,
      countryCode: match.countryCode,
      league: match.league,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      score,
      minute,
      status: 'LIVE' as const,
      source: 'Flashscore' as const,
      stats,
      momentum: [],
      lastEvent: '',
      odds: { home: 2.0, draw: 3.2, away: 3.5, over25: 1.85 },
    };
    const pressure = calculatePressureAnalysis(mockMatch);
    if (pressure.pressureIndex > rule.maxPressureIndex) {
      return {
        matches: false,
        reason: `Индекс давления ${pressure.pressureIndex}% > ${rule.maxPressureIndex}% (слишком высокая активность для сушки)`,
      };
    }
  }

  // 11. Dropping Odds & Smart Money Load
  if (
    rule.minOddsDropPercent !== undefined ||
    rule.minMoneyVolumePercent !== undefined ||
    rule.minMoneyLoadAmount !== undefined
  ) {
    const flows =
      snapshot.marketFlows && snapshot.marketFlows.length > 0
        ? snapshot.marketFlows
        : snapshot.oddsDrop
        ? [snapshot.oddsDrop]
        : [];

    const targetMarketFilter =
      rule.oddsDropMarket && rule.oddsDropMarket !== 'ANY' ? rule.oddsDropMarket : null;
    const relevantFlows = targetMarketFilter
      ? flows.filter((f) => {
          if (f.market === targetMarketFilter) return true;
          const fm = (f.market || '').toUpperCase();
          if (targetMarketFilter === 'HOME' && (fm.includes('П1') || fm.includes('HOME'))) return true;
          if (targetMarketFilter === 'AWAY' && (fm.includes('П2') || fm.includes('AWAY'))) return true;
          if (targetMarketFilter === 'DRAW' && (fm.includes('НИЧЬ') || fm.includes('DRAW') || fm === 'X')) return true;
          return false;
        })
      : flows;

    const qualifying = relevantFlows.find((f) => {
      const dropOk =
        rule.minOddsDropPercent === undefined || f.dropPercent >= rule.minOddsDropPercent;
      const volOk =
        rule.minMoneyVolumePercent === undefined ||
        f.moneyVolumePercent >= rule.minMoneyVolumePercent;
      const amtOk =
        rule.minMoneyLoadAmount === undefined ||
        (f.moneyVolumeAmountEur ?? 0) >= rule.minMoneyLoadAmount;
      return dropOk && volOk && amtOk;
    });

    if (!qualifying) {
      return { matches: false, reason: 'Нет подтвержденного прогруза линии' };
    }
  }

  // 12. Pre-Match and Live Odds Criteria
  if (activeOdds) {
    if (rule.maxOddsFavorite !== undefined && prematchOdds) {
      const fav = Math.min(prematchOdds.home, prematchOdds.away);
      if (fav > rule.maxOddsFavorite) {
        return { matches: false, reason: `Кэф на фаворита ${fav.toFixed(2)} > ${rule.maxOddsFavorite}` };
      }
    }
    if (rule.minOddsFavorite !== undefined && prematchOdds) {
      const fav = Math.min(prematchOdds.home, prematchOdds.away);
      if (fav < rule.minOddsFavorite) {
        return { matches: false, reason: `Кэф на фаворита ${fav.toFixed(2)} < ${rule.minOddsFavorite}` };
      }
    }
    if (rule.maxOddsOver25 !== undefined && activeOdds.over25 > rule.maxOddsOver25) {
      return { matches: false, reason: `Кэф на ТБ 2.5 ${activeOdds.over25.toFixed(2)} > ${rule.maxOddsOver25}` };
    }
    if (rule.minOddsOver25 !== undefined && activeOdds.over25 < rule.minOddsOver25) {
      return { matches: false, reason: `Кэф на ТБ 2.5 ${activeOdds.over25.toFixed(2)} < ${rule.minOddsOver25}` };
    }
    if (rule.maxOddsUnder25 !== undefined) {
      const u25 = activeOdds.under25 ?? (activeOdds.over25 > 2.0 ? 1.55 : 2.15);
      if (u25 > rule.maxOddsUnder25) {
        return { matches: false, reason: `Кэф на ТМ 2.5 ${u25.toFixed(2)} > ${rule.maxOddsUnder25}` };
      }
    }
    if (rule.minOddsUnderdog !== undefined) {
      const dog = Math.max(activeOdds.home, activeOdds.away);
      if (dog < rule.minOddsUnderdog) {
        return { matches: false, reason: `Кэф на аутсайдера ${dog.toFixed(2)} < ${rule.minOddsUnderdog}` };
      }
    }
    if (rule.minOddsDraw !== undefined && activeOdds.draw < rule.minOddsDraw) {
      return { matches: false, reason: `Кэф на ничью ${activeOdds.draw.toFixed(2)} < ${rule.minOddsDraw}` };
    }
    if (rule.maxOddsDraw !== undefined && activeOdds.draw > rule.maxOddsDraw) {
      return { matches: false, reason: `Кэф на ничью ${activeOdds.draw.toFixed(2)} > ${rule.maxOddsDraw}` };
    }
    if (rule.maxOddsBtts !== undefined) {
      const btts = activeOdds.btts ?? (activeOdds.over25 < 1.75 ? 1.62 : 1.95);
      if (btts > rule.maxOddsBtts) {
        return { matches: false, reason: `Кэф на Обе забьют ${btts.toFixed(2)} > ${rule.maxOddsBtts}` };
      }
    }
    if (rule.minOddsBtts !== undefined) {
      const btts = activeOdds.btts ?? (activeOdds.over25 < 1.75 ? 1.62 : 1.95);
      if (btts < rule.minOddsBtts) {
        return { matches: false, reason: `Кэф на Обе забьют ${btts.toFixed(2)} < ${rule.minOddsBtts}` };
      }
    }
  }

  // 13. Exclude Youth, Women and Lower Leagues
  if (rule.excludeYouthAndWomen) {
    const textToCheck = `${match.league} ${match.homeTeam} ${match.awayTeam}`.toLowerCase();
    const isYouthOrWomen =
      /women|жен|wom|ladies|femen|u17|u18|u19|u20|u21|u23|юнош|молод|youth|reserve|дубл|tercera/i.test(
        textToCheck
      );
    if (isYouthOrWomen) {
      return { matches: false, reason: 'Лига исключена фильтром (молодёжная/женская)' };
    }
  }

  return { matches: true, reason: 'Все критерии фильтра выполнены' };
}

/**
 * Runs a complete historical backtest for a given strategy rule
 */
export function runBacktest(
  rule: FilterRule,
  historicalMatches: HistoricalMatch[] = HISTORICAL_MATCHES,
  customFixedOdds?: number
): BacktestResult {
  const signals: BacktestSignal[] = [];

  for (const match of historicalMatches) {
    // Check snapshots in chronological order
    // A rule can trigger at most ONCE per match to avoid multi-counting
    for (const snapshot of match.snapshots) {
      const matchCheck = snapshotMatchesRule(snapshot, rule, match);

      if (matchCheck.matches) {
        const odds = customFixedOdds || getEstimatedOdds(rule.targetMarket, snapshot.minute);
        const { outcome, reason } = evaluateMarketOutcome(
          rule.targetMarket,
          rule.category,
          snapshot.minute,
          snapshot.score,
          match.finalScore,
          snapshot.stats.corners,
          match.finalCorners
        );

        let profit = 0;
        if (outcome === 'WIN') {
          profit = Number((odds - 1).toFixed(2));
        } else if (outcome === 'LOSS') {
          profit = -1.0;
        } else if (outcome === 'REFUND') {
          profit = 0.0;
        }

        signals.push({
          id: `bt-sig-${rule.id}-${match.id}-${snapshot.minute}`,
          matchId: match.id,
          matchName: `${match.homeTeam} vs ${match.awayTeam}`,
          league: match.league,
          date: match.date,
          minute: snapshot.minute,
          scoreAtSignal: snapshot.score,
          finalScore: match.finalScore,
          finalCorners: match.finalCorners,
          ruleId: rule.id,
          ruleName: rule.name,
          targetMarket: rule.targetMarket || 'ТБ 0.5 во 2-м тайме',
          odds,
          outcome,
          profit,
          reason,
          statsAtSignal: snapshot.stats,
        });

        // Triggered once for this match, proceed to next match
        break;
      }
    }
  }

  const wins = signals.filter((s) => s.outcome === 'WIN').length;
  const losses = signals.filter((s) => s.outcome === 'LOSS').length;
  const refunds = signals.filter((s) => s.outcome === 'REFUND').length;
  const resolved = wins + losses;

  const winRate = resolved > 0 ? Number(((wins / resolved) * 100).toFixed(1)) : 0;
  const totalProfit = Number(signals.reduce((acc, s) => acc + s.profit, 0).toFixed(2));
  const roi = resolved > 0 ? Number(((totalProfit / resolved) * 100).toFixed(1)) : 0;

  const avgOdds =
    signals.length > 0
      ? Number((signals.reduce((acc, s) => acc + s.odds, 0) / signals.length).toFixed(2))
      : customFixedOdds || 1.85;

  // Calculate equity curve and max drawdown
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  const equityCurve: BacktestResult['equityCurve'] = [
    {
      step: 0,
      profit: 0,
      cumulativeProfit: 0,
      matchName: 'Старт',
      outcome: 'PENDING',
    },
  ];

  let positiveProfitSum = 0;
  let negativeLossSum = 0;

  signals.forEach((s, idx) => {
    cumulative += s.profit;
    cumulative = Number(cumulative.toFixed(2));

    if (s.profit > 0) positiveProfitSum += s.profit;
    if (s.profit < 0) negativeLossSum += Math.abs(s.profit);

    if (cumulative > peak) {
      peak = cumulative;
    }
    const currentDrawdown = Number((peak - cumulative).toFixed(2));
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    equityCurve.push({
      step: idx + 1,
      profit: s.profit,
      cumulativeProfit: cumulative,
      matchName: s.matchName,
      outcome: s.outcome,
    });
  });

  const profitFactor =
    negativeLossSum > 0 ? Number((positiveProfitSum / negativeLossSum).toFixed(2)) : wins > 0 ? 999 : 0;

  // Group signals by league to analyze pass rate by league
  const leagueMap = new Map<string, {
    league: string;
    country: string;
    total: number;
    wins: number;
    losses: number;
    refunds: number;
    profit: number;
    oddsSum: number;
  }>();

  for (const s of signals) {
    const lKey = s.league || 'Неизвестная лига';
    const entry = leagueMap.get(lKey) || {
      league: lKey,
      country: '',
      total: 0,
      wins: 0,
      losses: 0,
      refunds: 0,
      profit: 0,
      oddsSum: 0,
    };
    entry.total += 1;
    if (s.outcome === 'WIN') entry.wins += 1;
    else if (s.outcome === 'LOSS') entry.losses += 1;
    else if (s.outcome === 'REFUND') entry.refunds += 1;
    entry.profit += s.profit;
    entry.oddsSum += s.odds;
    leagueMap.set(lKey, entry);
  }

  const leagueStats: LeagueStats[] = Array.from(leagueMap.values())
    .map((e) => {
      const resolvedCount = e.wins + e.losses;
      const winRate = resolvedCount > 0 ? Number(((e.wins / resolvedCount) * 100).toFixed(1)) : 0;
      const roi = resolvedCount > 0 ? Number(((e.profit / resolvedCount) * 100).toFixed(1)) : 0;
      const avgOdds = e.total > 0 ? Number((e.oddsSum / e.total).toFixed(2)) : 0;
      return {
        league: e.league,
        country: e.country,
        totalSignals: e.total,
        wins: e.wins,
        losses: e.losses,
        refunds: e.refunds,
        winRate,
        profit: Number(e.profit.toFixed(2)),
        roi,
        avgOdds,
      };
    })
    .sort((a, b) => {
      // Prioritize leagues with higher winrate, then total signals
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.totalSignals - a.totalSignals;
    });

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    targetMarket: rule.targetMarket || 'ТБ 0.5 во 2-м тайме',
    totalMatchesScanned: historicalMatches.length,
    totalSignals: signals.length,
    wins,
    losses,
    refunds,
    winRate,
    totalProfit,
    roi,
    avgOdds,
    maxDrawdown,
    profitFactor,
    signals,
    leagueStats,
    equityCurve,
  };
}
