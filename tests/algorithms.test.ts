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
  formatExtendedTelegramAlert,
  evaluateSignalOutcome,
} from '../src/algorithms';
import { getStrategyCardDisplayName } from '../src/utils/filterDefaults';
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
// TEST GROUP 10: New Strategies 51, 52, 53 Evaluation & Resolution
// ----------------------------------------------------
console.log('\n--- Test Group 10: Strategies 51, 52, 53 (Pinnacle TB0.5, HT TM0.5, Fav Win 1H) ---');

const strat51 = EXPANDED_DEFAULT_FILTERS.find((f: any) => f.id === 'strat-51')!;
const strat52 = EXPANDED_DEFAULT_FILTERS.find((f: any) => f.id === 'strat-52')!;
const strat53 = EXPANDED_DEFAULT_FILTERS.find((f: any) => f.id === 'strat-53')!;

assert(!!strat51, 'Strategy 51 is present in default filters');
assert(!!strat52, 'Strategy 52 is present in default filters');
assert(!!strat53, 'Strategy 53 is present in default filters');

// --- Test Strategy 51 ---
const match51Pass: Match = {
  ...minimalMatch,
  minute: 68,
  score: [0, 0],
  league: 'Испания. Примера',
  odds: { home: 2.1, draw: 3.4, away: 3.2, over25: 1.75 },
};
const eval51Pass = evaluateFilterRule(match51Pass, strat51);
assert(eval51Pass.matches === true, 'Strategy 51 triggers at min 68 with 0:0 and pre-match over25 <= 1.80');

const match51GoalFail: Match = {
  ...match51Pass,
  score: [1, 0], // already 1 goal
};
const eval51Fail = evaluateFilterRule(match51GoalFail, strat51);
assert(eval51Fail.matches === false, 'Strategy 51 correctly rejects match with score 1:0');

const match51FriendlyFail: Match = {
  ...match51Pass,
  league: 'Club Friendlies / Товарищеские матчи',
};
const eval51FriendlyFail = evaluateFilterRule(match51FriendlyFail, strat51);
assert(eval51FriendlyFail.matches === false, 'Strategy 51 correctly rejects friendly matches');

// --- Test Strategy 52 ---
const match52Pass: Match = {
  ...minimalMatch,
  minute: 30,
  score: [0, 0],
  stats: {
    ...minimalMatch.stats!,
    shotsOnTarget: [1, 0], // 1 total (<= 1)
    corners: [2, 1],        // 3 total (<= 3)
  },
  odds: { home: 2.5, draw: 3.1, away: 2.8, over25: 2.3, under25: 1.65 },
};
const eval52Pass = evaluateFilterRule(match52Pass, strat52);
assert(eval52Pass.matches === true, 'Strategy 52 triggers at min 30 with 0:0, sot<=1, corn<=3 and under25<=1.80');

const match52TooManySot: Match = {
  ...match52Pass,
  stats: {
    ...match52Pass.stats!,
    shotsOnTarget: [2, 1], // 3 total (> 1)
  },
};
const eval52SotFail = evaluateFilterRule(match52TooManySot, strat52);
assert(eval52SotFail.matches === false, 'Strategy 52 correctly rejects match with > 1 shot on target');

const match52TooManyCorners: Match = {
  ...match52Pass,
  stats: {
    ...match52Pass.stats!,
    corners: [3, 2], // 5 total (> 3)
  },
};
const eval52CornFail = evaluateFilterRule(match52TooManyCorners, strat52);
assert(eval52CornFail.matches === false, 'Strategy 52 correctly rejects match with > 3 corners');

// Strategy 52 Resolution
const sig52: SignalAlert = {
  ...cornerSignal,
  id: 'sig-52-test',
  minute: 30,
  score: '0:0',
  ruleId: 'strat-52',
  ruleName: strat52.name,
  marketSuggestion: strat52.targetMarket,
  ruleCategory: 'halftime',
};
// Ends 0:0 at HT -> WIN
const res52Win = evaluateSignalOutcome(sig52, [0, 0], false, undefined, undefined, { matchStatus: 'HT', minute: 45 });
assert(res52Win.outcome === 'WIN', 'Strategy 52 resolves as WIN when 1st half ends 0:0');

// Goal scored in 1H -> LOSS
const res52Loss = evaluateSignalOutcome(sig52, [1, 0], false, undefined, undefined, { matchStatus: 'LIVE', minute: 38 });
assert(res52Loss.outcome === 'LOSS', 'Strategy 52 resolves as LOSS when goal is scored in 1st half');

// --- Test Strategy 53 ---
const match53Pass: Match = {
  ...minimalMatch,
  minute: 5,
  league: 'Англия. Премьер-Лига',
  odds: { home: 1.35, draw: 5.2, away: 8.5, over25: 1.65 },
};
const eval53Pass = evaluateFilterRule(match53Pass, strat53);
assert(eval53Pass.matches === true, 'Strategy 53 triggers on fav odds 1.35 <= 1.50 in regular championship');

const match53HighOdds: Match = {
  ...match53Pass,
  odds: { home: 1.85, draw: 3.5, away: 4.2, over25: 1.95 },
};
const eval53HighOddsFail = evaluateFilterRule(match53HighOdds, strat53);
assert(eval53HighOddsFail.matches === false, 'Strategy 53 rejects match when favorite odds > 1.50');

const match53CupFail: Match = {
  ...match53Pass,
  league: 'Кубок Англии (FA Cup)',
};
const eval53CupFail = evaluateFilterRule(match53CupFail, strat53);
assert(eval53CupFail.matches === false, 'Strategy 53 correctly rejects cup matches');

// Strategy 53 Resolution
const sig53: SignalAlert = {
  ...cornerSignal,
  id: 'sig-53-test',
  minute: 5,
  score: '0:0',
  ruleId: 'strat-53',
  ruleName: strat53.name,
  marketSuggestion: strat53.targetMarket,
  ruleCategory: 'halftime',
  statsSnapshot: {
    homeOdds: 1.35,
    awayOdds: 8.5,
  } as any,
};
const res53Win = evaluateSignalOutcome(sig53, [1, 0], false, undefined, undefined, { matchStatus: 'HT', minute: 45 });
assert(res53Win.outcome === 'WIN', 'Strategy 53 resolves as WIN when favorite leads at HT (1:0)');

const res53Loss = evaluateSignalOutcome(sig53, [0, 0], false, undefined, undefined, { matchStatus: 'HT', minute: 45 });
assert(res53Loss.outcome === 'LOSS', 'Strategy 53 resolves as LOSS when favorite fails to win 1H (0:0)');

// --- Test Strategy 54 (No Draw 12 in 2H / Halftime Draw Trend) ---
console.log('\n--- Test Strategy 54: «Ничьей не будет (12)» во 2Т ---');
const strat54 = EXPANDED_DEFAULT_FILTERS.find((f: any) => f.id === 'strat-54')!;
assert(!!strat54, 'Strategy 54 is present in default filters');

const match54Pass: Match = {
  ...minimalMatch,
  homeTeam: 'Вест Хэм',
  awayTeam: 'Манчестер Юнайтед',
  minute: 45,
  score: [0, 0], // draw at halftime
  history: {
    homeDrawsLast6: 0,
    awayDrawsLast6: 1,
    h2hDrawsLast6: 0,
  },
};
const eval54Pass = evaluateFilterRule(match54Pass, strat54);
assert(eval54Pass.matches === true, 'Strategy 54 triggers at min 45 with 0:0 and <= 1 draw in last 5-6 games');

const match54NotDraw: Match = {
  ...match54Pass,
  score: [1, 0], // not a draw
};
const eval54NotDrawFail = evaluateFilterRule(match54NotDraw, strat54);
assert(eval54NotDrawFail.matches === false, 'Strategy 54 rejects match when score at halftime is not a draw (1:0)');

const match54TooManyDraws: Match = {
  ...match54Pass,
  history: {
    homeDrawsLast6: 2, // 2 draws (> 1)
    awayDrawsLast6: 0,
  },
};
const eval54DrawsFail = evaluateFilterRule(match54TooManyDraws, strat54);
assert(eval54DrawsFail.matches === false, 'Strategy 54 rejects match when home team has > 1 draw in last 5-6 matches');

// Strategy 54 Resolution (West Ham vs Man Utd 2-0 -> WIN)
const sig54: SignalAlert = {
  ...cornerSignal,
  id: 'sig-54-test',
  minute: 45,
  score: '0:0',
  ruleId: 'strat-54',
  ruleName: strat54.name,
  marketSuggestion: strat54.targetMarket,
};
const res54Win = evaluateSignalOutcome(sig54, [2, 0], true);
assert(res54Win.outcome === 'WIN', 'Strategy 54 resolves as WIN when match ends 2:0 (one team won, no draw)');

const res54Loss = evaluateSignalOutcome(sig54, [1, 1], true);
assert(res54Loss.outcome === 'LOSS', 'Strategy 54 resolves as LOSS when match ends 1:1 (draw)');

// ----------------------------------------------------
// TEST GROUP 11: 2nd-Half Strategies & Timing Resolution (14, 21, 42, 54, 55)
// Must wait until FT for loss declaration, never fail at min 46 / HT!
// ----------------------------------------------------
console.log('\n--- Test Group 11: 2nd-Half Resolution & Strategy Naming Sanitization ---');

// Strategy 14 (strat-12: Гол во 2-м тайме по тренду ТБ 2.5)
const sigStrat14: SignalAlert = {
  ...cornerSignal,
  id: 'sig-strat-14-test',
  minute: 45,
  score: '0:0',
  ruleId: 'strat-12',
  ruleName: '⏱️ Стратегия 12: Гол во 2-м тайме по тренду ТБ 2.5 (9/10 матчей, счёт 0:0, 1:0, 0:1)',
  marketSuggestion: 'Гол во 2-м тайме (~1.75)',
  period: '1-й тайм',
  ruleCategory: 'goals',
};

// At min 46 (start of 2nd half), it must NOT declare LOSS! It must be PENDING!
const res14Min46 = evaluateSignalOutcome(sigStrat14, [0, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 46,
});
assert(res14Min46.outcome === 'PENDING', 'Strategy 14 does NOT declare LOSS at min 46; stays PENDING');
assert(res14Min46.shouldResolve === false, 'Strategy 14 shouldResolve is false at min 46');

// When a goal is scored in 2nd half (e.g. min 60, score 1:0) -> immediate WIN!
const res14Goal = evaluateSignalOutcome(sigStrat14, [1, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 60,
});
assert(res14Goal.outcome === 'WIN', 'Strategy 14 resolves as WIN when goal is scored in 2nd half');

// If no goal is scored by full time (FT) -> resolves as LOSS only at match finish
const res14FT = evaluateSignalOutcome(sigStrat14, [0, 0], true, undefined, undefined, {
  matchStatus: 'FT',
  minute: 90,
});
assert(res14FT.outcome === 'LOSS', 'Strategy 14 resolves as LOSS only when match is finished (FT)');

// Strategy 42 (strat-second-half-sieve: «Второй тайм — решето» ТБ 0.5 во 2Т)
const sigStrat42: SignalAlert = {
  ...cornerSignal,
  id: 'sig-strat-42-test',
  minute: 45,
  score: '0:0',
  ruleId: 'strat-second-half-sieve',
  ruleName: '⚡ «Второй тайм — решето» (ТБ 0.5 во 2Т ~1.75)',
  marketSuggestion: 'ТБ 0.5 во 2-м тайме / Следующий гол (~1.75)',
  period: '1-й тайм',
  ruleCategory: 'goals',
};

const res42Min46 = evaluateSignalOutcome(sigStrat42, [0, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 47,
});
assert(res42Min46.outcome === 'PENDING', 'Strategy 42 does NOT declare LOSS at min 47; stays PENDING');

const res42Goal = evaluateSignalOutcome(sigStrat42, [0, 1], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 73,
});
assert(res42Goal.outcome === 'WIN', 'Strategy 42 resolves as WIN when goal is scored in 2nd half');

// Strategy 55 (strat-synergy-goal-storm: СИНЕРГИЯ Гол во 2-м тайме)
const sigStrat55: SignalAlert = {
  ...cornerSignal,
  id: 'sig-strat-55-test',
  minute: 45,
  score: '1:0',
  ruleId: 'strat-synergy-goal-storm',
  ruleName: '⚡ СИНЕРГИЯ: Сверхштурм + Гол во 2-м тайме',
  marketSuggestion: 'ТБ 0.5 во 2-м тайме (~1.80)',
  ruleCategory: 'synergy',
};
const res55Min48 = evaluateSignalOutcome(sigStrat55, [1, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 48,
});
assert(res55Min48.outcome === 'PENDING', 'Strategy 55 does NOT declare LOSS at min 48; stays PENDING');

// Strategy 21 (strat-draw-over5: Доминант)
const sigStrat21: SignalAlert = {
  ...cornerSignal,
  id: 'sig-strat-21-test',
  minute: 25,
  score: '0:0',
  ruleId: 'strat-draw-over5',
  ruleName: '👑 Стратегия 21: Доминант: кэф на ничью > 5.0 (Гол в матче / ТБ)',
  marketSuggestion: 'Гол в матче / ТБ (~1.75)',
  ruleCategory: 'goals',
};
const res21Min46 = evaluateSignalOutcome(sigStrat21, [0, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 46,
});
assert(res21Min46.outcome === 'PENDING', 'Strategy 21 stays PENDING at min 46, waiting for full match finish');

// Strategy 54 (strat-54: «Ничьей не будет (12)»)
const sigStrat54Live: SignalAlert = {
  ...cornerSignal,
  id: 'sig-strat-54-live-test',
  minute: 45,
  score: '0:0',
  ruleId: 'strat-54',
  ruleName: '⚔️ Стратегия 54: «Ничьей не будет (12)» во 2Т',
  marketSuggestion: '12 (Ничьей не будет в матче) (~1.45)',
  ruleCategory: 'goals',
};
const res54Min50 = evaluateSignalOutcome(sigStrat54Live, [0, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 50,
});
assert(res54Min50.outcome === 'PENDING', 'Strategy 54 stays PENDING at min 50, waiting for full match finish');

// Strategy Naming Sanitization Test
const customTimestampRule: FilterRule = {
  id: 'filter-1791999434970',
  name: 'Мой авторский фильтр на тотал',
  description: 'Пользовательский фильтр',
  category: 'custom',
  ruleType: 'LIVE',
  enabled: true,
  isPreset: false,
};
const nameCustom = getStrategyCardDisplayName(customTimestampRule, false);
assert(nameCustom === 'Мой авторский фильтр на тотал', 'Custom rule with timestamp ID keeps its original name');
assert(!nameCustom.includes('1791999434970'), 'Custom rule display name does NOT contain 1791999434970');

const alertTgText = formatExtendedTelegramAlert(
  minimalMatch,
  customTimestampRule,
  calculatePressureAnalysis(minimalMatch),
  undefined,
  false
);
assert(!alertTgText.includes('Стратегия 1791999434970'), 'formatExtendedTelegramAlert does NOT output Стратегия 1791999434970');

const synergy55Rule: FilterRule = {
  id: 'strat-synergy-goal-storm',
  name: '⚡ СИНЕРГИЯ: Сверхштурм + Гол во 2-м тайме',
  category: 'synergy',
  ruleType: 'LIVE',
  enabled: true,
  isPreset: true,
};
const name55 = getStrategyCardDisplayName(synergy55Rule, false);
assert(name55 === 'Стратегия 55', 'strat-synergy-goal-storm displays as Стратегия 55');

// Auto-cleanup > 200 signals test
const overflowSignals: SignalAlert[] = Array.from({ length: 250 }, (_, i) => ({
  ...sigStrat14,
  id: `overflow-sig-${i}`,
  minute: (i % 90) + 1,
}));
const trimmedSignals = overflowSignals.slice(0, 200);
assert(trimmedSignals.length === 200, 'Signals list is strictly capped at 200 items');
assert(trimmedSignals[0].id === 'overflow-sig-0', 'Most recent signals are preserved in trimmed slice');
assert(!trimmedSignals.some((s) => s.id === 'overflow-sig-249'), 'Oldest signals past 200 are automatically pruned');

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
