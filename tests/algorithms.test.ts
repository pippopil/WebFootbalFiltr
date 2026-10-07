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
} from '../src/algorithms';
import { Match, FilterRule } from '../src/types';

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
