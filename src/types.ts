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
  status: 'LIVE' | 'HT' | 'FT';
  source: 'Flashscore' | 'Sofascore' | 'SStats' | 'API-Football' | 'Football-Data' | 'Custom-Webhook' | 'Public-Feed';
  stats: MatchStats;
  momentum: number[];
  lastEvent: string;
  odds: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    btts?: number;
    over35?: number;
    under25?: number;
    handicap1?: number;
    handicap2?: number;
    itb1_25?: number;
    itb2_25?: number;
    over15_ht?: number;
  };
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
  };
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
  | 'TOTAL_OVER_2';

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
  | 'custom';

export type BetType = 'LIVE' | 'PREMATCH';

export interface FilterRule {
  id: string;
  name: string;
  description: string;
  category?: FilterCategory;
  ruleType?: 'LIVE' | 'PREMATCH' | 'HYBRID'; // Тип стратегии: Лайв или Предматчевый отбор
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

  // Игровой сценарий и угловые
  scoreDiffExactly1?: boolean;        // Разница в счёте ровно 1 гол (1:0, 2:1, 0:1, 1:2)
  losingTeamMoreCorners?: boolean;    // Проигрывающая команда подала больше угловых (Корнер после 80')
  favoriteLosing?: boolean;           // Фаворит матча проигрывает (для угловых фаворита)
  requireGuestTwoQuickGoals1H?: boolean; // Гости забили 2 быстрых гола подряд (разница <=15 мин) в 1Т

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
  role: 'user' | 'pro' | 'admin' | 'vip';
  plan: 'FREE' | 'PRO_ANALYST' | 'VIP_CLUB';
  planExpiresAt?: string;
  registeredAt: string;
  balanceRub: number;
  telegramBots: TelegramBotProfile[];
  notificationSound: boolean;
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
  bannerType: 'top_ribbon' | 'in_feed' | 'sidebar';
  partnerName: string;
  bgGradient: string;
  active: boolean;
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
