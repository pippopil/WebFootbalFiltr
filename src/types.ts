export interface MatchStats {
  possession: [number, number];
  dangerousAttacks: [number, number];
  attacks: [number, number];
  shotsOnTarget: [number, number];
  shotsOffTarget: [number, number];
  corners: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  xg: [number, number];
}

export interface Match {
  id: string;
  country: string;
  countryCode: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  score: [number, number];
  minute: number;
  status: 'LIVE' | 'HT' | 'FT' | 'PREMATCH';
  source: 'Flashscore' | 'Sofascore' | 'SStats' | 'API-Football' | 'Football-Data' | 'Custom-Webhook' | 'Public-Feed';
  startTime?: string;
  startsInMinutes?: number;
  prematchAnalysisConducted?: boolean;
  stats: MatchStats;
  momentum: number[];
  lastEvent: string;
  odds: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    over05?: number;
    over15?: number;
    under05?: number;
    under15?: number;
    btts?: number;
    over35?: number;
    under25?: number;
    handicap1?: number;
    handicap2?: number;
    itb1_25?: number;
    itb2_25?: number;
    over15_ht?: number;
  };
  initialOdds?: {
    home?: number;
    draw?: number;
    away?: number;
    over25?: number;
    under25?: number;
    btts?: number;
    over15?: number;
    under15?: number;
  };
  oddsDrop?: OddsDropData;
  marketFlows?: OddsDropData[];
  history?: {
    homeConcededLastMatch?: number;
    awayConcededLastMatch?: number;
    homeLostLastMatch?: boolean;
    awayLostLastMatch?: boolean;
    homeLast5NoZeroZero?: boolean;
    awayLast5NoZeroZero?: boolean;
    homeOver25Streak?: number;
    awayOver25Streak?: number;
    predictedIpt?: number;
    hadRedCardLastMatch?: boolean;
    teamWithRedCardOdds?: number;
    homeLast6LossesMax1?: boolean;
    h2hOver15Pct?: number;
    bothScoredLast5Count?: number;
    last4LateGoalCount?: number;
    guestScoredTwoQuickFirstHalf?: boolean;
    twoQuickGoalsFirstHalf?: boolean;
    goalsAtFirstHalfQuick?: number;
    noGoalsSinceQuickGoals?: boolean;
    twoQuickGoalsMinute?: number;
  };
}

export interface OddsDropData {
  market: 'HOME' | 'DRAW' | 'AWAY' | 'OVER' | 'UNDER' | 'BTTS';
  marketName: string;            // e.g. "Победа 1 (Napoli)" или "ТБ 2.5"
  initialOdds: number;           // Начальный коэффициент (на открытии линии)
  currentOdds: number;           // Текущий коэффициент
  dropPercent: number;           // Процент падения коэффициента, например 20.0%
  moneyVolumePercent: number;    // Доля прогруженных денег в процентах, например 78%
  moneyVolumeAmountEur?: number; // Абсолютный объем прогруза в евро, например 142 000 €
  bookmaker?: string;            // Биржа/букмекер, например "Betfair Exchange / Pinnacle"
  detectedAtMinute?: number;     // Минута обнаружения прогруза
}

export type LiveMatch = Match;

export type ScoreCondition =
  | 'ANY'
  | 'DRAW'
  | '0-0'
  | 'HOME_LEAD'
  | 'AWAY_LEAD'
  | 'ONE_GOAL_DIFF'
  | 'TOTAL_UNDER_2'
  | 'TOTAL_OVER_2'
  | 'TOTAL_UNDER_25'
  | 'TOTAL_UNDER_15'
  | 'BTTS_NO';

export type FilterCategory =
  | 'all'
  | 'active'
  | 'stopped'
  | 'goals'
  | 'corners'
  | 'pressure'
  | 'comeback'
  | 'halftime'
  | 'cards'
  | 'odds_drop'
  | 'custom';

export type BetType = 'LIVE' | 'PREMATCH';

export interface FilterRule {
  id: string;
  name: string;
  description: string;
  category?: FilterCategory;
  ruleType?: 'LIVE' | 'PREMATCH' | 'HYBRID'; // Тип стратегии: Лайв или Предматчевый отбор
  prematchTimingMinutes?: number; // За сколько минут до матча проводить анализ (по умолчанию 60 мин / 1 час)
  enabled: boolean;
  minMinute: number;
  maxMinute: number;
  scoreCondition: ScoreCondition;
  minDangerousAttacksDiff?: number;
  minDangerousAttacksTotal?: number;
  minAttacksDiff?: number;
  minAttacksTotal?: number;
  minTotalShots?: number;
  minShotsDiff?: number;
  minShotsOnTargetTotal?: number;
  minShotsOnTargetDiff?: number;
  minTotalCorners?: number;
  minCornersDiff?: number;
  minPossessionDiff?: number;
  minXgTotal?: number;
  minXgDiff?: number;
  minXgOverScoreDiff?: number; // Дефицит xG над счётом: (xG[0] + xG[1]) - (score[0] + score[1]) >= X (например 1.60)
  minPressureIndex?: number;
  redCardCondition?: 'ANY' | 'NO_RED_CARDS' | 'HAS_RED_CARD';

  // Коэффициенты и прематч (Стратегии 2, 8, 11, 14, 16 + новые)
  maxOddsFavorite?: number; // Кэф на фаворита <= X (например <= 1.50 или <= 1.70)
  minOddsFavorite?: number; // Равные команды: мин кэф на победу >= X (например >= 1.90)
  maxOddsOver25?: number;   // Кэф на ТБ 2.5 <= X (например <= 1.60 или <= 1.67)
  minOddsOver25?: number;   // Кэф на ТБ 2.5 >= X (например >= 1.50)
  maxOddsOver35?: number;   // Кэф на ТБ 3.5 <= X (например <= 2.00)
  maxOddsUnder25?: number;  // Кэф на ТМ 2.5 <= X (например <= 1.60)
  minOddsDraw?: number;     // Кэф на ничью >= X (например >= 3.70 или >= 5.00)
  maxOddsDraw?: number;     // Кэф на ничью <= X (например <= 3.00)
  minOddsUnderdog?: number; // Кэф на аутсайдера >= X (например >= 5.50)
  maxOddsUnderdog?: number; // Кэф на аутсайдера <= X (например <= 4.20)
  maxOddsBtts?: number;     // Кэф на Обе забьют <= X (например <= 1.67)
  minOddsBtts?: number;     // Кэф на Обе забьют >= X (например >= 1.50)

  // Отслеживание прогрузов и падения коэффициентов (Smart Money & Steam Moves)
  minOddsDropPercent?: number;       // Мин. падение коэффициента в % (например, >= 15%)
  minMoneyVolumePercent?: number;    // Мин. процент прогруза денег на исход (например, >= 70%)
  minMoneyLoadAmount?: number;       // Мин. сумма прогруза в EUR (например, >= 50000 €)
  oddsDropMarket?: 'ANY' | 'HOME' | 'DRAW' | 'AWAY' | 'OVER' | 'UNDER' | 'BTTS'; // Целевой исход прогруза

  // Игровой сценарий и угловые
  maxTotalGoals?: number;             // Максимальный тотал голов в матче (например, <= 2 для непробитого ТБ 2.5)
  requireBttsNotHit?: boolean;        // Обе забьют ещё не наступило (хотя бы одна команда не забила: 0:0, 1:0, 0:1, 2:0 и т.д.)
  scoreDiffExactly1?: boolean;        // Разница в счёте ровно 1 гол (1:0, 2:1, 0:1, 1:2)
  losingTeamMoreCorners?: boolean;    // Проигрывающая команда подала больше угловых (Корнер после 80')
  favoriteLosing?: boolean;           // Фаворит матча проигрывает (для угловых фаворита)
  requireGuestTwoQuickGoals1H?: boolean; // 2 быстрых гола подряд (разница <=15 мин) в 1Т
  requireTwoQuickGoals1H?: boolean;      // 2 быстрых гола в 1Т (любая команда или гости)
  requireNoGoalsSinceQuickGoals?: boolean; // Отсутствие голов после 2 быстрых голов (счёт без изменений до 75')

  // Лиги и фильтры исключений (Стратегии 4, 12, 14)
  excludeYouthAndWomen?: boolean; // Исключать молодежки U19-U23, женские лиги и низшие дивизионы
  leagueKeywords?: string[];      // Белый список ключевых слов лиг (например 'Premier', 'Bundesliga')

  // История матчей, серии и математические модели (Стратегии 1, 4, 5, 7, 12, 13 + новые)
  requireLastMatchConceded2Plus?: boolean; // Обе команды проиграли и пропустили >=2 в прошлом матче
  requireNoZeroZeroLast5?: boolean;        // В последних 5 матчах команд не было 0:0
  minOver25Streak?: number;                // Серия матчей на ТБ 2.5 у команд (например >= 5)
  minModelIpt?: number;                    // Взвешенный математический тотал IPT > X (Стратегия 7, порог 2.70)
  requireRedCardLastMatch?: boolean;       // Команда получила КК в крайнем матче (кэф на неё <= 3.20)
  requireLateGoalsLastMatches?: boolean;   // В 3 из 4 последних матчей был гол на 65-90'
  requireH2hOver15High?: boolean;          // В личных встречах >= 80% матчей на ТБ 1.5
  isDeadlyCombination?: boolean;           // «Смертельная комбинация» коэффициентов на ТБ 3.5 / 4.5

  targetMarket?: string;
  telegramEnabled: boolean;
  color: string;
  isPreset?: boolean;

  // Привязка бота к фильтру (пользовательский бот или кастомные реквизиты)
  botId?: string;             // ID привязанного бота из личного кабинета (например, 'bot-main', 'bot-corners')
  customBotToken?: string;    // Индивидуальный токен бота для этого конкретного фильтра
  customChatId?: string;      // Индивидуальный chat_id / @канал для этого конкретного фильтра
  userId?: string;            // ID владельца фильтра

  // Матрица параметров сканера (Обо всем понемножку)
  scannerMatrix?: ScannerMatrixConfig;
}

export type StatSideChoice = 'K1' | 'K2' | '12';

export interface ScannerStatRow {
  side: StatSideChoice;
  operator: '>=' | '<=' | '==' | '>' | '<' | 'DIFF';
  diffThreshold?: number;
  ind1Min?: number;
  ind1Max?: number;
  ind2Min?: number;
  ind2Max?: number;
  totalMin?: number;
  totalMax?: number;
}

export interface ScannerOddsItem {
  checked: boolean;
  min: number;
  max: number;
}

export interface ScannerMatrixConfig {
  // Исходы
  p1: ScannerOddsItem;
  draw: ScannerOddsItem;
  p2: ScannerOddsItem;
  dc1X: ScannerOddsItem;
  dc12: ScannerOddsItem;
  dcX2: ScannerOddsItem;

  // Период и сыгранные минуты
  period: 'ALL' | '1H' | '2H';
  minuteRange: {
    checked: boolean;
    min: number;
    max: number;
  };

  // Тоталы
  tb05: ScannerOddsItem;
  tb15: ScannerOddsItem;
  tb25: ScannerOddsItem;
  tm05: ScannerOddsItem;
  tm15: ScannerOddsItem;
  tm25: ScannerOddsItem;

  // 9 статистических строк
  goals: ScannerStatRow;
  attacks: ScannerStatRow;
  dangerousAttacks: ScannerStatRow;
  possession: ScannerStatRow;
  shotsOnTarget: ScannerStatRow;
  shotsOffTarget: ScannerStatRow;
  corners: ScannerStatRow;
  yellowCards: ScannerStatRow;
  redCards: ScannerStatRow;
}

export type SignalOutcome = 'WIN' | 'LOSS' | 'PENDING' | 'REFUND';

export interface SignalAlert {
  id: string;
  timestamp: string;
  matchId: string;
  matchName: string;
  league: string;
  country: string;
  minute: number;
  score: string;
  period?: string; // 1-й тайм, 2-й тайм, Перерыв
  statsSnapshot?: {
    homeScore: number;
    awayScore: number;
    attacks: [number, number];
    dangerousAttacks: [number, number];
    shotsOnTarget: [number, number];
    shotsOffTarget: [number, number];
    corners: [number, number];
    yellowCards: [number, number];
    redCards: [number, number];
    possession?: [number, number];
  };
  ruleId?: string;
  ruleName: string;
  message: string;
  sentToTelegram: boolean;
  telegramStatusText?: string;
  telegramMessageId?: number;
  marketSuggestion?: string;
  // Информация о боте, отправившем сигнал
  botId?: string;
  botName?: string;
  botToken?: string;
  chatId?: string;
  userId?: string;
  // Live vs Pre-match bet separation
  betType?: BetType;
  prematchFactors?: string[];
  liveFactors?: string[];
  // Tracker & ROI fields
  outcome: SignalOutcome;
  odds: number;
  stake: number;
  profit?: number;
  finalScore?: string;
  initialScore?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  telegramEdited?: boolean;
  telegramEditedAt?: string;
}

export type DeduplicationMode = 'once-per-match' | 'cooldown' | 'score-change' | 'disabled';

export interface TelegramBotProfile {
  id: string;
  name: string;                // Название: например, "⚽ Основной канал (Live)", "🚩 Бот Угловых"
  botToken: string;           // HTTP API Token от @BotFather
  channelId: string;          // Chat ID или @username канала
  isDefault?: boolean;        // Бот по умолчанию для всех новых правил
  active: boolean;            // Включен / выключен
  botUsername?: string;       // @Username бота после проверки
  status?: 'verified' | 'error' | 'untested';
  lastPing?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: 'user' | 'pro' | 'admin' | 'vip' | 'god';
  plan: 'FREE' | 'PRO_ANALYST' | 'VIP_CLUB' | 'GOD_MODE';
  planExpiresAt?: string;
  registeredAt: string;
  balanceRub: number;
  telegramBots: TelegramBotProfile[];
  notificationSound: boolean;
  theme?: 'dark' | 'light' | 'system';
  adPreferences: {
    showBanners: boolean;
    compactAds: boolean;
  };
  stats: {
    totalSignalsGenerated: number;
    winRate: number;
    favoriteLeague?: string;
    signalsToday: number;
  };
}

export interface AdBannerItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  bonusText?: string;
  promoCode?: string;
  ctaText: string;
  ctaUrl: string;
  bannerType: 'top_ribbon' | 'top_billboard' | 'in_feed' | 'sidebar' | 'skyscraper_left' | 'skyscraper_right' | 'skyscraper';
  partnerName: string;
  bgGradient: string;
  active: boolean;
  features?: string[];
  side?: 'left' | 'right';
}

export interface TelegramConfig {
  botToken: string;
  channelId: string;
  notificationsCount: number;
  lastPing: string;
  autoSend: boolean;
  silentMode: boolean;
  parseMode: 'HTML' | 'Markdown';
  suppressDuplicates: boolean;
  deduplicationMode: DeduplicationMode;
  cooldownMinutes: number;
  blockedDuplicatesCount?: number;
  autoUpdateOnFinish?: boolean;
}

export interface PressureAnalysis {
  pressureIndex: number; // 0 - 100
  dominantSide: 'home' | 'away' | 'balanced';
  dominantTeamName: string;
  dominantDiff: number;
  goalProbability: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  goalProbabilityScore: number; // 0 - 100%
  attacksPerMinute: number;
  reasons: string[];
}

export interface HistoricalSnapshot {
  minute: number;
  score: [number, number];
  stats: MatchStats;
  odds?: { home: number; draw: number; away: number; over25: number; under25?: number; btts?: number };
  oddsDrop?: OddsDropData;
  marketFlows?: OddsDropData[];
}

export interface HistoricalMatch {
  id: string;
  date: string;
  league: string;
  country: string;
  countryCode: string;
  homeTeam: string;
  awayTeam: string;
  finalScore: [number, number];
  finalCorners: [number, number];
  finalYellowCards: [number, number];
  finalRedCards: [number, number];
  snapshots: HistoricalSnapshot[];
}

export interface BacktestSignal {
  id: string;
  matchId: string;
  matchName: string;
  league: string;
  date: string;
  minute: number;
  scoreAtSignal: [number, number];
  finalScore: [number, number];
  finalCorners: [number, number];
  ruleId: string;
  ruleName: string;
  targetMarket: string;
  odds: number;
  outcome: SignalOutcome;
  profit: number; // in units (e.g. +0.85 or -1.0)
  reason: string;
  statsAtSignal: MatchStats;
}

export interface BacktestResult {
  ruleId: string;
  ruleName: string;
  targetMarket: string;
  totalMatchesScanned: number;
  totalSignals: number;
  wins: number;
  losses: number;
  refunds: number;
  winRate: number; // 0 - 100%
  totalProfit: number; // in units
  roi: number; // in %
  avgOdds: number;
  maxDrawdown: number;
  profitFactor: number;
  signals: BacktestSignal[];
  equityCurve: Array<{
    step: number;
    profit: number;
    cumulativeProfit: number;
    matchName: string;
    outcome: SignalOutcome;
  }>;
}

export interface AIMatchAnalysis {
  matchId: string;
  generatedAt: string;
  headline: string;
  summary: string;
  momentum: {
    dominantSide: 'home' | 'away' | 'balanced';
    dominantTeam: string;
    pressureDescription: string;
    intensityLevel: 'CALM' | 'ACTIVE' | 'HIGH_PRESSURE' | 'SIEGE';
  };
  probabilities: {
    nextGoalHome: number;
    nextGoalAway: number;
    noMoreGoals: number;
    expectedTotalGoals: string;
  };
  recommendations: Array<{
    market: string;
    oddsEstimate: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
    reasoning: string;
    edge: string;
  }>;
  keyRisks: string[];
  tacticalNote: string;
  telegramFormattedText: string;
  source: 'gemini' | 'heuristic';
}

export type DataSourceType =
  | 'flashscore'
  | 'sstats'
  | 'sofascore'
  | 'webhook'
  | 'public-feed'
  | 'api-football'
  | 'football-data'
  | 'simulated';

export interface DataSourceConfig {
  activeSource: DataSourceType;
  flashscore: {
    enabled: boolean;
    includeOdds: boolean;
    maxMatches: number;
  };
  sstats: {
    enabled: boolean;
    apiKey?: string;
  };
  sofascore: {
    enabled: boolean;
    useProxy: boolean;
  };
  apiFootball: {
    enabled: boolean;
    apiKey: string;
    provider: 'api-sports' | 'rapidapi';
    leaguesFilter: string; // comma-separated league IDs e.g. "39,140,135,78,61"
  };
  footballData: {
    enabled: boolean;
    apiToken: string;
    plan: 'free' | 'tier1';
  };
  webhook: {
    enabled: boolean;
    secretKey: string;
    lastIngestedAt?: string;
    ingestedCount: number;
  };
  publicFeed: {
    enabled: boolean;
  };
  autoRefresh: boolean;
  refreshIntervalSeconds: number;
}

export interface DataSourceStatus {
  source: DataSourceType;
  configured: boolean;
  status: 'connected' | 'error' | 'idle' | 'testing';
  lastSync?: string;
  matchesCount: number;
  latencyMs?: number;
  quotaInfo?: string;
  message?: string;
  error?: string;
}
