/**
 * Automated Test Suite for FootballMonitor Algorithms & Core Business Logic
 * Run via: npm test
 */
import {
  evaluateFilterRule,
  calculateMatchIPT,
  calculateMatchOddsFlows,
  calculatePressureAnalysis,
  checkMarketAlreadyPassed,
  detectStrategyMetricCategory,
  getInitialStrategyMetric,
  resolveStrategyMetric,
  formatResolvedTelegramAlert,
  evaluateSignalOutcome,
} from '../src/algorithms';
import { Match, FilterRule, SignalAlert } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n========================================');
console.log('🧪 RUNNING FOOTBALLMONITOR TEST SUITE');
console.log('========================================\n');

// ----------------------------------------------------
// TEST GROUP 1: Odds & Stats Null-Safety (toFixed Protection)
// ----------------------------------------------------
console.log('--- Test Group 1: Odds & Stats Null-Safety (toFixed) ---');

const minimalMatch: Match = {
  id: 'test-min-1',
  country: 'England',
  countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  league: 'Premier League',
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea',
  minute: 65,
  score: [0, 0],
  status: 'LIVE',
  source: 'Fonbet',
  stats: {
    possession: [50, 50],
    dangerousAttacks: [28, 15],
    attacks: [40, 35],
    shotsOnTarget: [4, 1],
    shotsOffTarget: [3, 2],
    corners: [5, 2],
    yellowCards: [0, 0],
    redCards: [0, 0],
    xg: [1.2, 0.4],
  },
  odds: {
    home: 2.1,
    draw: 3.2,
    away: 3.5,
    over25: 1.85,
  },
};

const bareMatchNoOdds: Match = {
  id: 'test-bare-1',
  country: 'Spain',
  countryCode: '🇪🇸',
  league: 'La Liga',
  homeTeam: 'Real Madrid',
  awayTeam: 'Barcelona',
  minute: 75,
  score: [1, 0],
  status: 'LIVE',
  source: 'Public-Feed',
  stats: {
    possession: [55, 45],
    dangerousAttacks: [45, 20],
    attacks: [80, 50],
    shotsOnTarget: [6, 2],
    shotsOffTarget: [5, 3],
    corners: [7, 3],
    yellowCards: [1, 2],
    redCards: [0, 0],
    xg: [1.9, 0.6],
  },
  odds: {
    home: 1.65,
    draw: 3.8,
    away: 5.0,
    over25: 1.75,
  },
};

const oddsRule: FilterRule = {
  id: 'rule-odds-test',
  name: 'Test Odds Corridor',
  description: 'Testing maxOddsOver25, maxOddsFavorite, maxOddsBtts without crashing',
  category: 'goals',
  ruleType: 'LIVE',
  enabled: true,
  minMinute: 50,
  maxMinute: 80,
  maxOddsOver25: 1.95,
  maxOddsFavorite: 2.2,
  maxOddsBtts: 1.9,
  minOddsDraw: 3.0,
  minXgTotal: 1.0,
};

let res1;
try {
  res1 = evaluateFilterRule(minimalMatch, oddsRule);
  assert(res1 !== null && typeof res1.matches === 'boolean', 'evaluateFilterRule executes without toFixed crash');
} catch (e: any) {
  assert(false, `evaluateFilterRule threw error: ${e?.message}`);
}

// ----------------------------------------------------
// TEST GROUP 2: Rule Matching Logic
// ----------------------------------------------------
console.log('\n--- Test Group 2: Matching Logic & Unmet Criteria ---');

const over05Rule: FilterRule = {
  id: 'rule-goal-late',
  name: 'Late Goal Hunt (0:0 at 60-80 min)',
  description: 'Expect goal at 0-0',
  category: 'goals',
  ruleType: 'LIVE',
  enabled: true,
  minMinute: 60,
  maxMinute: 80,
  scoreCondition: '0-0',
  minDangerousAttacksDiff: 5,
  minPressureIndex: 30,
  targetMarket: 'ТБ 0.5',
};

const evalMatchPass = evaluateFilterRule(minimalMatch, over05Rule);
assert(evalMatchPass.matches === true, 'Match passes criteria when all conditions met');

const failScoreMatch: Match = {
  ...minimalMatch,
  score: [2, 1], // not 0-0
};

const evalMatchFail = evaluateFilterRule(failScoreMatch, over05Rule);
assert(evalMatchFail.matches === false, 'Match correctly rejected when score condition fails');
assert(
  evalMatchFail.unmetCriteria.some((c) => c.toLowerCase().includes('счёт') || c.toLowerCase().includes('счет')),
  'Unmet criteria list properly explains why score condition failed'
);

// ----------------------------------------------------
// TEST GROUP 3: Market Already Passed / Event Validation
// ----------------------------------------------------
console.log('\n--- Test Group 3: Market Already Passed Check ---');

const matchWithGoal: Match = {
  ...minimalMatch,
  score: [1, 0],
};

const checkPassed = checkMarketAlreadyPassed('ТБ 0.5 в матче', matchWithGoal);
assert(checkPassed.isPassed === true, 'checkMarketAlreadyPassed correctly detects Over 0.5 is already hit at 1:0');

const checkNotPassed = checkMarketAlreadyPassed('ТБ 1.5 в матче', matchWithGoal);
assert(checkNotPassed.isPassed === false, 'checkMarketAlreadyPassed confirms Over 1.5 is still in play at 1:0');

// ----------------------------------------------------
// TEST GROUP 4: Mathematical Models (IPT & Pressure Index)
// ----------------------------------------------------
console.log('\n--- Test Group 4: IPT & Pressure Analysis ---');

const iptVal = calculateMatchIPT(minimalMatch);
assert(typeof iptVal === 'number' && !isNaN(iptVal) && iptVal >= 1.0 && iptVal <= 5.0, `IPT calculated successfully: ${iptVal}`);

const pressureAnalysis = calculatePressureAnalysis(bareMatchNoOdds);
assert(
  typeof pressureAnalysis.pressureIndex === 'number' &&
  pressureAnalysis.pressureIndex >= 0 &&
  pressureAnalysis.pressureIndex <= 100,
  `Pressure index computed within 0-100: ${pressureAnalysis.pressureIndex}`
);
assert(
  ['EXTREME', 'HIGH', 'MEDIUM', 'LOW'].includes(pressureAnalysis.goalProbability),
  `Goal probability enum valid: ${pressureAnalysis.goalProbability}`
);

// ----------------------------------------------------
// TEST GROUP 5: Odds Drop & Smart Money Flow
// ----------------------------------------------------
console.log('\n--- Test Group 5: Odds Flow & Drop Detection ---');

const matchWithOddsMove = {
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea',
  odds: { home: 1.7, draw: 3.5, away: 4.8, over25: 1.65 },
  initialOdds: { home: 2.1, draw: 3.4, away: 3.5, over25: 1.95 },
};

const flows = calculateMatchOddsFlows(matchWithOddsMove);
assert(flows.length > 0, `calculateMatchOddsFlows detected ${flows.length} odds movement records`);
const homeFlow = flows.find((f) => f.marketName.includes('П1'));
assert(Boolean(homeFlow && Math.abs(homeFlow.dropPercent) > 0), `Home win drop detected: ${homeFlow?.dropPercent}%`);

// ----------------------------------------------------
// TEST GROUP 6: Strict Sport Demarcation (Разграничение по видам спорта)
// ----------------------------------------------------
console.log('\n--- Test Group 6: Strict Sport Demarcation ---');

const footballMatch: Match = {
  ...minimalMatch,
  sport: 'football',
  minute: 55,
  score: [1, 0],
};

const hockeyMatch: Match = {
  ...minimalMatch,
  id: 'fs-hockey-12345',
  sport: 'hockey',
  league: 'NHL Regular Season',
  minute: 56,
  score: [3, 2],
};

const hockeyRule: FilterRule = {
  id: 'strat-hockey-late',
  name: '🏒 Хоккей: Снятый вратарь в 3-м периоде (ТБ 5.5)',
  category: 'goals',
  ruleType: 'LIVE',
  sport: 'hockey',
  enabled: true,
  minMinute: 54,
  maxMinute: 59,
  scoreCondition: 'ANY',
  targetMarket: 'ТБ 5.5',
};

const footballRule: FilterRule = {
  id: 'strat-football-fav',
  name: '⚽ Футбол: Гол фаворита',
  category: 'goals',
  ruleType: 'LIVE',
  sport: 'football',
  enabled: true,
  minMinute: 50,
  maxMinute: 70,
  scoreCondition: 'ANY',
  targetMarket: 'ТБ 1.5',
};

// 1. Hockey rule must NEVER trigger on a football match
const hockeyOnFootball = evaluateFilterRule(footballMatch, hockeyRule);
assert(
  !hockeyOnFootball.matches,
  'Hockey rule correctly rejected on Football match (Strict Sport Isolation)'
);
assert(
  hockeyOnFootball.unmetCriteria.some((u) => u.includes('Вид спорта')),
  'Unmet criteria explains sport mismatch between hockey strategy and football match'
);

// 2. Football rule must NEVER trigger on a hockey match
const footballOnHockey = evaluateFilterRule(hockeyMatch, footballRule);
assert(
  !footballOnHockey.matches,
  'Football rule correctly rejected on Hockey match (Strict Sport Isolation)'
);

// 3. Hockey rule triggers on matching hockey match
const hockeyOnHockey = evaluateFilterRule(hockeyMatch, hockeyRule);
assert(
  hockeyOnHockey.matches,
  'Hockey rule successfully matches on valid Hockey match'
);

// ----------------------------------------------------
// TEST GROUP 7: All Strategies Backtest Pass Rate >= 80%
// ----------------------------------------------------
console.log('\n--- Test Group 7: All Strategies Backtest Pass Rate >= 80% on Real Matches ---');
const { EXPANDED_DEFAULT_FILTERS } = await import('../src/data/defaultFilters');
const { runBacktest } = await import('../src/backtestEngine');

let allHighPassRate = true;
let lowestWinRate = 100;
let lowestStrategy = '';

for (const filter of EXPANDED_DEFAULT_FILTERS) {
  const result = runBacktest(filter);
  if (result.totalSignals > 0) {
    if (result.winRate < 80) {
      allHighPassRate = false;
      console.error(`Strategy ${filter.id} (${filter.name}) has winRate ${result.winRate}% < 80%`);
    }
    if (result.winRate < lowestWinRate) {
      lowestWinRate = result.winRate;
      lowestStrategy = `${filter.id} (${filter.winRate || result.winRate}%)`;
    }
  }
}

assert(
  allHighPassRate,
  `All 50 strategies have winRate >= 80% on real historical matches (Lowest: ${lowestWinRate}%)`
);

// ----------------------------------------------------
// TEST GROUP 8: Strategy-Specific Metric Tracking (Corners, Yellow Cards, Goals)
// ----------------------------------------------------
console.log('\n--- Test Group 8: Strategy-Specific Metric Tracking (Corners, Cards, Goals) ---');

// 1. Corners Strategy Detection & Resolution
const cornerRule: FilterRule = {
  id: 'strat-corner-storm-60',
  name: 'Стратегия 38: Штурм угловых',
  category: 'corners',
  ruleType: 'LIVE',
  enabled: true,
  targetMarket: 'Угловые ТБ (+2)',
};

const matchAtMinute65: Match = {
  id: 'm-corners-test',
  country: 'Германия',
  league: '3. Лига',
  homeTeam: 'Ферль',
  awayTeam: 'Ян Регенсбург',
  minute: 65,
  score: [1, 0],
  status: 'LIVE',
  stats: {
    attacks: [80, 60],
    dangerousAttacks: [50, 30],
    shotsOnTarget: [5, 2],
    shotsOffTarget: [4, 3],
    corners: [4, 2], // 6 total
    yellowCards: [1, 2],
    redCards: [0, 0],
    possession: [58, 42],
  },
};

const cornerCat = detectStrategyMetricCategory(cornerRule);
assert(cornerCat === 'corners', 'detectStrategyMetricCategory correctly classifies corner strategy as "corners"');

const initialCornerMetric = getInitialStrategyMetric(cornerRule, matchAtMinute65);
assert(initialCornerMetric.initialTotal === 6, 'Initial corner snapshot correctly records 6 total corners at signal dispatch');
assert(initialCornerMetric.initialBreakdown === '4:2', 'Initial corner snapshot records 4:2 team breakdown');

const cornerSignal: SignalAlert = {
  id: 'sig-corners-test',
  timestamp: '14:20:00',
  matchId: matchAtMinute65.id,
  matchName: 'Ферль vs Ян Регенсбург',
  league: '3. Лига',
  country: 'Германия',
  minute: 65,
  score: '1:0',
  ruleId: cornerRule.id,
  ruleName: cornerRule.name,
  marketSuggestion: cornerRule.targetMarket,
  outcome: 'PENDING',
  odds: 1.85,
  stake: 1000,
  sentToTelegram: true,
  statsSnapshot: {
    homeScore: 1,
    awayScore: 0,
    attacks: [80, 60],
    dangerousAttacks: [50, 30],
    shotsOnTarget: [5, 2],
    shotsOffTarget: [4, 3],
    corners: [4, 2],
    yellowCards: [1, 2],
    redCards: [0, 0],
  },
  message: 'Corner alert',
};

const finalCornersStats = {
  corners: [6, 4] as [number, number], // 10 total (+4 delta)
  yellowCards: [2, 3] as [number, number],
  redCards: [0, 0] as [number, number],
};

const resolvedCornerMetric = resolveStrategyMetric(cornerSignal, [2, 1], finalCornersStats);
assert(resolvedCornerMetric.finalTotal === 10, 'Final corner count correctly resolved to 10 corners');
assert(resolvedCornerMetric.delta === 4, 'Corner delta correctly calculated as +4 corners');
assert(resolvedCornerMetric.deltaText?.includes('+4 угловых'), 'Corner delta text explains increase: +4 угловых');

const resolvedCornerTgHtml = formatResolvedTelegramAlert(
  { ...cornerSignal, outcome: 'WIN', profit: 850 },
  '2:1',
  'WIN',
  { homeTeam: 'Ферль', awayTeam: 'Ян Регенсбург', league: '3. Лига', country: 'Германия' },
  finalCornersStats
);

assert(resolvedCornerTgHtml.includes('РЕЗУЛЬТАТ ПО СТРАТЕГИИ (УГЛОВЫЕ)'), 'Resolved Telegram alert contains corner strategy result header');
assert(resolvedCornerTgHtml.includes('На момент сигнала:'), 'Resolved alert specifies corners at signal dispatch');
assert(resolvedCornerTgHtml.includes('По завершению:'), 'Resolved alert specifies final corners at match finish');
assert(resolvedCornerTgHtml.includes('+4 угловых'), 'Resolved alert specifies +4 delta after signal');

// 2. Yellow Cards Strategy Detection & Resolution
const cardRule: FilterRule = {
  id: 'strat-cards-test',
  name: 'Стратегия 23: ЖК ТБ в дерби',
  category: 'cards',
  ruleType: 'LIVE',
  enabled: true,
  targetMarket: 'ЖК ТБ 4.5',
};

const cardCat = detectStrategyMetricCategory(cardRule);
assert(cardCat === 'cards', 'detectStrategyMetricCategory correctly classifies card strategy as "cards"');

const initialCardMetric = getInitialStrategyMetric(cardRule, matchAtMinute65);
assert(initialCardMetric.initialTotal === 3, 'Initial yellow cards snapshot correctly records 3 cards');

const cardSignal: SignalAlert = {
  ...cornerSignal,
  id: 'sig-cards-test',
  ruleId: cardRule.id,
  ruleName: cardRule.name,
  marketSuggestion: cardRule.targetMarket,
  statsSnapshot: {
    ...cornerSignal.statsSnapshot!,
    yellowCards: [1, 2], // 3 total
  },
};

const resolvedCardMetric = resolveStrategyMetric(cardSignal, [1, 1], finalCornersStats);
assert(resolvedCardMetric.finalTotal === 5, 'Final yellow card count correctly resolved to 5 cards');
assert(resolvedCardMetric.delta === 2, 'Card delta correctly calculated as +2 cards');

const resolvedCardTgHtml = formatResolvedTelegramAlert(
  { ...cardSignal, outcome: 'WIN', profit: 800 },
  '1:1',
  'WIN',
  { homeTeam: 'Ферль', awayTeam: 'Ян Регенсбург', league: '3. Лига', country: 'Германия' },
  finalCornersStats
);
assert(resolvedCardTgHtml.includes('РЕЗУЛЬТАТ ПО СТРАТЕГИИ (ЖЁЛТЫЕ КАРТОЧКИ)'), 'Resolved alert contains card strategy result header');
assert(resolvedCardTgHtml.includes('+2 ЖК'), 'Resolved alert specifies +2 ЖК delta');

// ----------------------------------------------------
// TEST GROUP 9: Strategy 40 & Strict Card/False-Signal Protection
// ----------------------------------------------------
console.log('\n--- Test Group 9: Strategy 40 & Strict Card / False-Signal Protection ---');

const strat40Rule: FilterRule = {
  id: 'strat-yellow-cards-derby',
  name: '🟨 «ЖК ТБ во 2-м тайме» (Накал страстей и грубая игра ~1.82)',
  category: 'cards',
  ruleType: 'LIVE',
  enabled: true,
  minMinute: 50,
  maxMinute: 75,
  scoreCondition: 'ANY',
  maxScoreDiff: 1,
  minYellowCardsTotal: 3,
  targetMarket: 'ЖК ТБ 3.5 / 4.5 (~1.80)',
  defaultOdds: 1.8,
};

const matchOnly1Card: Match = {
  ...minimalMatch,
  minute: 50,
  score: [1, 2],
  stats: {
    ...minimalMatch.stats!,
    yellowCards: [1, 0], // Only 1 card!
  },
};

const evalStrat40Fail = evaluateFilterRule(matchOnly1Card, strat40Rule);
assert(evalStrat40Fail.matches === false, 'Strategy 40 correctly rejects match with only 1 yellow card');
assert(
  evalStrat40Fail.unmetCriteria.some((c) => c.includes('Жёлтых карточек в матче') && c.includes('< требуемых 3')),
  'Strategy 40 reports unmet criteria when yellow cards < 3'
);

const match3Cards: Match = {
  ...matchOnly1Card,
  stats: {
    ...matchOnly1Card.stats!,
    yellowCards: [2, 1], // 3 cards
  },
};
const evalStrat40Pass = evaluateFilterRule(match3Cards, strat40Rule);
assert(evalStrat40Pass.matches === true, 'Strategy 40 successfully matches when match actually has >= 3 cards');

const match5Cards: Match = {
  ...matchOnly1Card,
  stats: {
    ...matchOnly1Card.stats!,
    yellowCards: [3, 2], // 5 cards
  },
};
const cardPassedCheck = checkMarketAlreadyPassed(strat40Rule.targetMarket, match5Cards, strat40Rule);
assert(cardPassedCheck.isPassed === true, 'checkMarketAlreadyPassed correctly blocks ЖК ТБ 3.5 when 5 cards already shown');

const signalAt3Cards: SignalAlert = {
  ...cardSignal,
  id: 'sig-40-eval-test',
  minute: 50,
  score: '1:2',
  ruleId: strat40Rule.id,
  ruleName: strat40Rule.name,
  marketSuggestion: strat40Rule.targetMarket,
  statsSnapshot: {
    ...cardSignal.statsSnapshot!,
    yellowCards: [2, 1], // 3 cards at signal
  },
};

// Match ends with NO new cards (+0 after signal)
const outcome0Cards = evaluateSignalOutcome(
  signalAt3Cards,
  [1, 2],
  true, // FT
  [3, 1],
  { yellowCards: [2, 1] } as any
);
assert(outcome0Cards.outcome === 'LOSS', 'Card signal with +0 cards after signal correctly resolves as LOSS');
assert(outcome0Cards.note?.includes('+0 после сигнала'), 'Resolution note confirms 0 new cards shown after signal');

// Match ends with +1 card (4 total) -> ТБ 3.5 hit!
const outcome1Card = evaluateSignalOutcome(
  signalAt3Cards,
  [1, 2],
  true, // FT
  [3, 1],
  { yellowCards: [2, 2] } as any
);
assert(outcome1Card.outcome === 'WIN', 'Card signal with +1 card after signal correctly resolves as WIN');

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n========================================');
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
if (failedTests > 0) {
  console.error(`❌ ${failedTests} TESTS FAILED`);
  process.exit(1);
} else {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
  process.exit(0);
}
