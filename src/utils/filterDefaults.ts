import {
  FilterRule,
  ScannerMatrixConfig,
  ScannerStatRow,
  HistoricalStreakConfig,
  UserProfile,
} from '../types';

export const createDefaultStatRow = (): ScannerStatRow => ({
  side: '12',
  operator: '>=',
  diffThreshold: undefined,
  ind1Min: undefined,
  ind1Max: undefined,
  ind2Min: undefined,
  ind2Max: undefined,
  totalMin: undefined,
  totalMax: undefined,
  last5MinMin: undefined,
  last10MinMin: undefined,
  last15MinMin: undefined,
  half1Min: undefined,
  half2Min: undefined,
});

export const createDefaultHistoryConfig = (): HistoricalStreakConfig => ({
  checked: false,
  matchesCount: 6,
  targetSide: 'ANY',
  minWins: undefined,
  maxLosses: undefined,
  minDraws: undefined,
  minGoalsScored: undefined,
  maxGoalsConceded: undefined,
  bothTeamsScoredHits: undefined,
  over25Hits: undefined,
  zeroZeroCount: undefined,
});

/**
 * 100% чистый бланк матрицы тактического сканера:
 * Никаких предустановленных порогов атак, ударов, угловых или минут!
 */
export const createCleanBlankMatrix = (): ScannerMatrixConfig => ({
  p1: { checked: false, min: 1.0, max: 2.0 },
  draw: { checked: false, min: 1.0, max: 3.5 },
  p2: { checked: false, min: 1.0, max: 4.0 },
  dc1X: { checked: false, min: 1.0, max: 1.5 },
  dc12: { checked: false, min: 1.0, max: 1.5 },
  dcX2: { checked: false, min: 1.0, max: 1.5 },

  period: 'ALL',
  minuteRange: { checked: false, min: 0, max: 90 },

  addedTime1H: { checked: false, min: 1, max: 5 },
  addedTime2H: { checked: false, min: 2, max: 8 },

  includedLeagueGroups: ['championship', 'cups', 'europe', 'nations'],
  excludedLeagues: [],

  favoriteCondition: {
    enabled: false,
    maxOdds: 1.65,
    state: 'ANY',
    location: 'ANY',
  },

  tb05: { checked: false, min: 1.0, max: 2.5 },
  tb15: { checked: false, min: 1.0, max: 2.5 },
  tb25: { checked: false, min: 1.0, max: 2.5 },
  tm05: { checked: false, min: 1.0, max: 2.5 },
  tm15: { checked: false, min: 1.0, max: 2.5 },
  tm25: { checked: false, min: 1.0, max: 2.5 },
  tb15_1h: { checked: false, min: 1.0, max: 2.5 },
  tm15_1h: { checked: false, min: 1.0, max: 2.5 },
  bttsYes: { checked: false, min: 1.45, max: 2.2 },
  bttsNo: { checked: false, min: 1.5, max: 2.5 },

  goals: createDefaultStatRow(),
  attacks: createDefaultStatRow(),
  dangerousAttacks: createDefaultStatRow(),
  possession: createDefaultStatRow(),
  shotsOnTarget: createDefaultStatRow(),
  shotsOffTarget: createDefaultStatRow(),
  corners: createDefaultStatRow(),
  yellowCards: createDefaultStatRow(),
  redCards: createDefaultStatRow(),

  intensity10m: createDefaultStatRow(),
  intensityMatch: createDefaultStatRow(),

  historyForm: createDefaultHistoryConfig(),
  historyGoals: createDefaultHistoryConfig(),
  historyTotals: createDefaultHistoryConfig(),

  xgTotal: createDefaultStatRow(),
  xgDiff: createDefaultStatRow(),
  xgDeficit: createDefaultStatRow(),
  xgMomentum15m: createDefaultStatRow(),
});

/**
 * 100% чистый бланк правила фильтра (для создания авторских фильтров с нуля)
 */
export const createCleanBlankFilter = (userId?: string): FilterRule => ({
  id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  name: 'Мой авторский фильтр',
  description: 'Пользовательский алгоритм лайв-сканера (чистый бланк)',
  category: 'custom',
  ruleType: 'LIVE',
  sport: 'football',
  enabled: false,
  minMinute: 0,
  maxMinute: 90,
  scoreCondition: 'ANY',
  targetMarket: '',
  telegramEnabled: true,
  color: 'emerald',
  isPreset: false,
  requiredPlan: 'FREE',
  userId: userId || undefined,
  scannerMatrix: createCleanBlankMatrix(),
  exactScore: undefined,
  exactTotalGoals: undefined,
  exactHomeGoals: undefined,
  exactAwayGoals: undefined,
  minDangerousAttacksDiff: undefined,
  minDangerousAttacksTotal: undefined,
  minAttacksDiff: undefined,
  minAttacksTotal: undefined,
  minTotalShots: undefined,
  minShotsDiff: undefined,
  minShotsOnTargetTotal: undefined,
  minShotsOnTargetDiff: undefined,
  minTotalCorners: undefined,
  minCornersDiff: undefined,
  minPossessionDiff: undefined,
  minXgTotal: undefined,
  minXgDiff: undefined,
  minXgOverScoreDiff: undefined,
  minPressureIndex: undefined,
  maxPressureIndex: undefined,
  maxDangerousAttacksTotal: undefined,
  maxShotsOnTargetTotal: undefined,
  maxScoreDiff: undefined,
  redCardCondition: 'ANY',
  maxOddsFavorite: undefined,
  minOddsFavorite: undefined,
  maxOddsOver25: undefined,
  minOddsOver25: undefined,
  minOddsDropPercent: undefined,
  minMoneyVolumePercent: undefined,
  excludeYouthAndWomen: false,
});

/**
 * Проверка наличия платной подписки (PRO, VIP, GOD_MODE)
 */
export const isUserPaid = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  return (
    user.plan === 'GOD_MODE' ||
    user.plan === 'VIP_CLUB' ||
    user.plan === 'PRO_ANALYST' ||
    user.role === 'god' ||
    user.role === 'pro' ||
    user.role === 'vip'
  );
};

/**
 * Проверка прав разработчика / создателя платформы
 * Только разработчик имеет доступ к просмотру внутренних формул, порогов и редактированию вшитых алгоритмов.
 * Для всех обычных пользователей параметры скрыты для защиты от копирования.
 */
export const isUserDeveloper = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  return (
    user.role === 'god' ||
    user.role === 'admin' ||
    user.plan === 'GOD_MODE' ||
    user.username === 'developer_god'
  );
};

/**
 * Очищает название вшитой стратегии от раскрытия внутренних параметров
 * (минуты, точный счёт, пороги атак/кэфов в скобках), чтобы пользователи видели чистое название алгоритма.
 */
export const cleanPresetTitle = (name: string): string => {
  if (!name) return '';
  return name
    // Убираем скобки с минутами или условиями, например: (60-85 мин), (55-88 мин), (HT Over 0.5 / 18-38 мин), (0:0 на 50-68'), (Деньги ≥ 65%)
    .replace(/\s*\([^)]*(?:мин|'|секунд|\d+:\d+|≥|<=|>=|%|кэф|коридор|прогруз|счёт|тотал|падение)[^)]*\)/gi, '')
    // Убираем указания минут прямо в тексте (на 50-68', на 17-й минуте, на 70' и т.д.)
    .replace(/\s+на\s+\d+[-–]\d+['мин]*/gi, '')
    .replace(/\s+на\s+\d+[-–]?й?\s+минуте/gi, '')
    .replace(/\s+после\s+\d+[-–]?й?\s+минуты/gi, '')
    // Убираем счёт в скобках или тексте типа 0:0
    .replace(/\s+при\s+ничьей\s+0:0/gi, ' при ничьей')
    .replace(/\s+при\s+0:0/gi, '')
    .replace(/\s+при\s+0:1/gi, '')
    .replace(/\s+при\s+1:1/gi, '')
    .replace(/\s*≥\s*\d+%?/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

/**
 * Возвращает отображаемое название карточки:
 * Для разработчика (isDeveloper) — полное оригинальное название алгоритма со всеми деталями.
 * Для обычных пользователей (пользователи видят только "Стратегия 1", "Стратегия 2", "Стратегия 3"...) — строго номер стратегии.
 * Для авторских карточек пользователя (!rule.isPreset) — их собственное название.
 */
export const getStrategyCardDisplayName = (
  rule: FilterRule,
  isDeveloper: boolean = false,
  allFilters?: FilterRule[]
): string => {
  if (!rule) return '';
  // Пользовательские авторские фильтры сохраняют свое название
  if (!rule.isPreset) return rule.name;

  // Разработчик видит стратегию полностью со всеми формулами и метками
  if (isDeveloper) return rule.name;

  // Обычные пользователи видят строго "Стратегия 1", "Стратегия 2", "Стратегия 3"...
  const matchF = rule.id.match(/^f-(\d+)$/i);
  if (matchF) {
    return `Стратегия ${matchF[1]}`;
  }

  const matchPresetNum = rule.name.match(/Стратегия\s+(\d+)/i);
  if (matchPresetNum) {
    return `Стратегия ${matchPresetNum[1]}`;
  }

  if (allFilters) {
    const presetIndex = allFilters.filter((f) => f.isPreset).findIndex((f) => f.id === rule.id);
    if (presetIndex !== -1) {
      return `Стратегия ${presetIndex + 1}`;
    }
  }

  return 'Стратегия';
};
