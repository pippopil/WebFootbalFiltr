import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Activity,
  Bell,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  Send,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Flame,
  Zap,
  Search,
  Plus,
  Trash2,
  Clock,
  Target,
  Radio,
  Share2,
  Filter,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Cpu,
  Shield,
  Layers,
  Bot,
  XCircle,
  Key,
  Hash,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  ExternalLink,
  User,
  MessageSquare,
  Sparkles,
  Edit3,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Check,
  FileSpreadsheet,
  Globe,
  Database,
  FlaskConical,
  PowerOff,
  SlidersHorizontal,
  TableProperties,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Pin,
  ArrowDown,
  ArrowUp,
  Sun,
  Moon,
  LogOut,
  Crown,
} from 'lucide-react';

import {
  Match,
  MatchStats,
  FilterRule,
  SignalAlert,
  SignalOutcome,
  TelegramConfig,
  FilterCategory,
  ScoreCondition,
  PressureAnalysis,
  DataSourceConfig,
  DataSourceType,
  UserProfile,
  TelegramBotProfile,
  AdBannerItem,
  OddsDropData,
} from './types';
import { EXPANDED_DEFAULT_FILTERS } from './data/defaultFilters';
import { DEFAULT_USERS } from './data/defaultUsers';
import { DEFAULT_ADS } from './data/defaultAds';
import {
  calculatePressureAnalysis,
  evaluateFilterRule,
  formatExtendedTelegramAlert,
  formatResolvedTelegramAlert,
  evaluateSignalOutcome,
  getBetTypeForSignal,
  calculateMatchIPT,
  enrichMatchWithOddsTracker,
  calculateMatchOddsFlows,
} from './algorithms';
import { FilterBuilderModal } from './components/FilterBuilderModal';
import { BacktestingView } from './components/BacktestingView';
import { AIAnalystModal } from './components/AIAnalystModal';
import { DataSourcesModal } from './components/DataSourcesModal';
import { RealMatchTesterModal } from './components/RealMatchTesterModal';
import { PersonalCabinetView } from './components/PersonalCabinetView';
import { AdBanner } from './components/AdBanner';
import { getEstimatedOdds } from './backtestEngine';
import { ScannerMatrixFilterView } from './components/ScannerMatrixFilterView';
import { ScannerSignalsTableView } from './components/ScannerSignalsTableView';
import { AppLogo } from './components/AppLogo';
import { AuthGateModal } from './components/AuthGateModal';
import { GodModeConsole } from './components/GodModeConsole';

const INITIAL_SIGNALS: SignalAlert[] = [
  {
    id: 'sig-seed-1',
    timestamp: '15:42:10',
    matchId: 'm-den-1',
    matchName: 'Hvidovre vs Koge',
    league: '1st Division',
    country: '🇩🇰 Дания',
    minute: 79,
    period: '2-й тайм',
    score: '1:1',
    finalScore: '2:1',
    ruleName: 'NoName',
    marketSuggestion: 'ТБ 0.5 во 2-м тайме',
    message: '⚽ [СИГНАЛ] Дания | 1st Division\nHvidovre 1:1 Koge (79\')\n🎯 Исход: ТБ 0.5 во 2-м тайме',
    sentToTelegram: true,
    telegramStatusText: 'Доставлено в TG',
    botName: 'Основной Бот',
    outcome: 'WIN',
    odds: 1.82,
    stake: 1000,
    profit: 820,
    statsSnapshot: {
      homeScore: 1,
      awayScore: 1,
      attacks: [52, 38],
      dangerousAttacks: [41, 24],
      shotsOnTarget: [6, 3],
      shotsOffTarget: [5, 2],
      corners: [5, 3],
      yellowCards: [2, 1],
      redCards: [0, 0],
    },
    resolvedAt: '16:05:00',
  },
  {
    id: 'sig-seed-2',
    timestamp: '15:20:05',
    matchId: 'm-fin-1',
    matchName: 'Ilves vs KuPS',
    league: 'Veikkausliiga',
    country: '🇫🇮 Финляндия',
    minute: 32,
    period: '1-й тайм',
    score: '0:0',
    ruleName: 'ТБ 1.5 Фаворит',
    marketSuggestion: 'ТБ 0.5 в 1-м тайме',
    message: '⚽ [СИГНАЛ] Финляндия | Veikkausliiga\nIlves 0:0 KuPS (32\')\n🎯 Исход: ТБ 0.5 в 1-м тайме',
    sentToTelegram: true,
    telegramStatusText: 'Доставлено в TG',
    botName: 'Основной Бот',
    outcome: 'WIN',
    odds: 1.95,
    stake: 1000,
    profit: 950,
    finalScore: '1:1',
    statsSnapshot: {
      homeScore: 0,
      awayScore: 0,
      attacks: [34, 21],
      dangerousAttacks: [25, 12],
      shotsOnTarget: [4, 1],
      shotsOffTarget: [3, 2],
      corners: [4, 1],
      yellowCards: [1, 0],
      redCards: [0, 0],
    },
    resolvedAt: '15:40:00',
  },
  {
    id: 'sig-seed-3',
    timestamp: '14:48:30',
    matchId: 'm-par-1',
    matchName: 'Olimpia vs Libertad',
    league: 'Primera Division',
    country: '🇵🇾 Парагвай',
    minute: 34,
    period: '1-й тайм',
    score: '0:1',
    ruleName: 'Осада угловыми',
    marketSuggestion: 'ТБ угловых в 1Т',
    message: '⚽ [СИГНАЛ] Парагвай | Primera Division\nOlimpia 0:1 Libertad (34\')\n🎯 Исход: ТБ угловых',
    sentToTelegram: true,
    telegramStatusText: 'Доставлено в TG',
    botName: 'VIP Бот',
    outcome: 'WIN',
    odds: 1.90,
    stake: 1000,
    profit: 900,
    finalScore: '1:2',
    statsSnapshot: {
      homeScore: 0,
      awayScore: 1,
      attacks: [39, 25],
      dangerousAttacks: [29, 16],
      shotsOnTarget: [4, 3],
      shotsOffTarget: [4, 1],
      corners: [6, 2],
      yellowCards: [1, 2],
      redCards: [0, 0],
    },
    resolvedAt: '15:35:00',
  },
  {
    id: 'sig-seed-4',
    timestamp: '14:35:12',
    matchId: 'm-idn-1',
    matchName: 'Persija vs Bali United',
    league: 'Liga 1',
    country: '🇮🇩 Индонезия',
    minute: 35,
    period: '1-й тайм',
    score: '1:0',
    ruleName: 'Штурм аутсайдера',
    marketSuggestion: '1X (двойной шанс)',
    message: '⚽ [СИГНАЛ] Индонезия | Liga 1\nPersija 1:0 Bali United (35\')\n🎯 Исход: 1X',
    sentToTelegram: false,
    telegramStatusText: 'Локальный сигнал',
    outcome: 'WIN',
    odds: 1.75,
    stake: 1000,
    profit: 750,
    finalScore: '2:1',
    statsSnapshot: {
      homeScore: 1,
      awayScore: 0,
      attacks: [36, 28],
      dangerousAttacks: [24, 18],
      shotsOnTarget: [5, 2],
      shotsOffTarget: [3, 2],
      corners: [4, 3],
      yellowCards: [1, 1],
      redCards: [0, 0],
    },
    resolvedAt: '15:15:00',
  },
  {
    id: 'sig-seed-5',
    timestamp: '13:54:00',
    matchId: 'm-uru-1',
    matchName: 'Nacional vs Penarol',
    league: 'Primera Division',
    country: '🇺🇾 Уругвай',
    minute: 54,
    period: '2-й тайм',
    score: '1:1',
    ruleName: 'Прессинг в большинстве',
    marketSuggestion: 'Победа 1 (П1)',
    message: '⚽ [СИГНАЛ] Уругвай | Primera Division\nNacional 1:1 Penarol (54\')\n🎯 Исход: П1',
    sentToTelegram: true,
    telegramStatusText: 'Доставлено в TG',
    botName: 'Основной Бот',
    outcome: 'WIN',
    odds: 2.15,
    stake: 1000,
    profit: 1150,
    finalScore: '2:1',
    statsSnapshot: {
      homeScore: 1,
      awayScore: 1,
      attacks: [58, 32],
      dangerousAttacks: [46, 19],
      shotsOnTarget: [8, 3],
      shotsOffTarget: [6, 2],
      corners: [7, 2],
      yellowCards: [3, 4],
      redCards: [0, 1],
    },
    resolvedAt: '14:45:00',
  },
  {
    id: 'sig-seed-6',
    timestamp: '13:20:18',
    matchId: 'm-pol-1',
    matchName: 'Legia vs Lech Poznan',
    league: 'Ekstraklasa',
    country: '🇵🇱 Польша',
    minute: 68,
    period: '2-й тайм',
    score: '0:0',
    ruleName: 'Сухое доминирование при 0:0',
    marketSuggestion: 'ТБ 0.5 в матче',
    message: '⚽ [СИГНАЛ] Польша | Ekstraklasa\nLegia 0:0 Lech Poznan (68\')\n🎯 Исход: ТБ 0.5 в матче',
    sentToTelegram: true,
    telegramStatusText: 'Доставлено в TG',
    botName: 'Основной Бот',
    outcome: 'PENDING',
    odds: 1.88,
    stake: 1000,
    statsSnapshot: {
      homeScore: 0,
      awayScore: 0,
      attacks: [62, 38],
      dangerousAttacks: [53, 22],
      shotsOnTarget: [7, 2],
      shotsOffTarget: [5, 3],
      corners: [8, 3],
      yellowCards: [1, 2],
      redCards: [0, 0],
    },
  },
  {
    id: 'sig-seed-7',
    timestamp: '12:45:00',
    matchId: 'm-nor-1',
    matchName: 'Bodo/Glimt vs Molde',
    league: 'Eliteserien',
    country: '🇳🇴 Норвегия',
    minute: 71,
    period: '2-й тайм',
    score: '2:1',
    ruleName: 'Тотал Больше 2.5',
    marketSuggestion: 'ТБ 3.5 в матче',
    message: '⚽ [СИГНАЛ] Норвегия | Eliteserien\nBodo/Glimt 2:1 Molde (71\')\n🎯 Исход: ТБ 3.5 в матче',
    sentToTelegram: true,
    telegramStatusText: 'Доставлено в TG',
    botName: 'Основной Бот',
    outcome: 'WIN',
    odds: 1.85,
    stake: 1000,
    profit: 850,
    finalScore: '3:1',
    statsSnapshot: {
      homeScore: 2,
      awayScore: 1,
      attacks: [65, 48],
      dangerousAttacks: [54, 35],
      shotsOnTarget: [9, 5],
      shotsOffTarget: [7, 4],
      corners: [9, 5],
      yellowCards: [2, 2],
      redCards: [0, 0],
    },
    resolvedAt: '13:30:00',
  },
];

const INITIAL_MATCHES: Match[] = [
  {
    id: 'm-1',
    country: 'England',
    countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    score: [1, 1],
    minute: 68,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [58, 42],
      dangerousAttacks: [64, 38],
      attacks: [112, 74],
      shotsOnTarget: [7, 3],
      shotsOffTarget: [6, 2],
      corners: [8, 2],
      yellowCards: [2, 3],
      redCards: [0, 0],
      xg: [1.82, 0.94],
    },
    momentum: [15, 30, 45, 60, -20, 55, 70, 65],
    lastEvent: "67' Опасный удар со штрафного (Arsenal)",
    odds: { home: 1.65, draw: 3.4, away: 5.5, over25: 1.62, btts: 1.60 },
    oddsDrop: {
      market: 'HOME',
      marketName: 'П1 (Arsenal)',
      initialOdds: 2.15,
      currentOdds: 1.65,
      dropPercent: 23.3,
      moneyVolumePercent: 79,
      moneyVolumeAmountEur: 184500,
      bookmaker: 'Betfair Exchange / Pinnacle',
      detectedAtMinute: 35,
    },
    marketFlows: [
      {
        market: 'HOME',
        marketName: 'П1 (Arsenal)',
        initialOdds: 2.15,
        currentOdds: 1.65,
        dropPercent: 23.3,
        moneyVolumePercent: 79,
        moneyVolumeAmountEur: 184500,
        bookmaker: 'Betfair Exchange',
        detectedAtMinute: 35,
      },
      {
        market: 'OVER',
        marketName: 'ТБ 2.5',
        initialOdds: 1.95,
        currentOdds: 1.62,
        dropPercent: 16.9,
        moneyVolumePercent: 71,
        moneyVolumeAmountEur: 92000,
        bookmaker: 'Pinnacle',
        detectedAtMinute: 20,
      },
    ],
    history: {
      homeConcededLastMatch: 2,
      awayConcededLastMatch: 2,
      homeLostLastMatch: true,
      awayLostLastMatch: true,
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 5,
      awayOver25Streak: 4,
      predictedIpt: 2.85,
    },
  },
  {
    id: 'm-2',
    country: 'Spain',
    countryCode: '🇪🇸',
    league: 'LaLiga EA Sports',
    homeTeam: 'Real Madrid',
    awayTeam: 'Valencia',
    score: [0, 0],
    minute: 74,
    status: 'LIVE',
    source: 'SStats',
    stats: {
      possession: [68, 32],
      dangerousAttacks: [82, 19],
      attacks: [134, 45],
      shotsOnTarget: [9, 1],
      shotsOffTarget: [8, 2],
      corners: [11, 1],
      yellowCards: [1, 4],
      redCards: [0, 0],
      xg: [2.15, 0.22],
    },
    momentum: [40, 50, 75, 80, 85, 90, 80, 88],
    lastEvent: "72' Сейв вратаря Valencia после удара в створ",
    initialOdds: { home: 1.85, draw: 3.6, away: 4.8, over25: 1.85, under25: 1.95, btts: 1.85 },
    odds: { home: 1.44, draw: 3.8, away: 8.5, over25: 1.65, btts: 1.80 },
    oddsDrop: {
      market: 'HOME',
      marketName: 'П1 (Real Madrid)',
      initialOdds: 1.85,
      currentOdds: 1.44,
      dropPercent: 22.2,
      moneyVolumePercent: 82,
      moneyVolumeAmountEur: 215000,
      bookmaker: 'Betfair Exchange / Pinnacle',
      detectedAtMinute: 65,
    },
    marketFlows: [
      {
        market: 'HOME',
        marketName: 'П1 (Real Madrid)',
        initialOdds: 1.85,
        currentOdds: 1.44,
        dropPercent: 22.2,
        moneyVolumePercent: 82,
        moneyVolumeAmountEur: 215000,
        bookmaker: 'Betfair Exchange',
        detectedAtMinute: 65,
      },
    ],
    history: {
      homeConcededLastMatch: 1,
      awayConcededLastMatch: 2,
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 6,
      awayOver25Streak: 3,
      predictedIpt: 2.92,
    },
  },
  {
    id: 'm-3',
    country: 'Germany',
    countryCode: '🇩🇪',
    league: 'Bundesliga',
    homeTeam: 'Borussia Dortmund',
    awayTeam: 'RB Leipzig',
    score: [2, 1],
    minute: 54,
    status: 'LIVE',
    source: 'Sofascore',
    stats: {
      possession: [51, 49],
      dangerousAttacks: [44, 47],
      attacks: [89, 91],
      shotsOnTarget: [5, 4],
      shotsOffTarget: [4, 5],
      corners: [4, 5],
      yellowCards: [1, 1],
      redCards: [0, 0],
      xg: [1.34, 1.28],
    },
    momentum: [10, -20, 25, -15, 30, 40, -10, 20],
    lastEvent: "53' Гол! Dortmund выходит вперед (2:1)",
    odds: { home: 1.85, draw: 3.75, away: 4.1, over25: 1.35, btts: 1.52 },
    history: {
      predictedIpt: 3.2,
      homeOver25Streak: 7,
      awayOver25Streak: 5,
    },
  },
  {
    id: 'm-4',
    country: 'Italy',
    countryCode: '🇮🇹',
    league: 'Serie A',
    homeTeam: 'Juventus',
    awayTeam: 'Atalanta',
    score: [0, 1],
    minute: 81,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [62, 38],
      dangerousAttacks: [73, 31],
      attacks: [118, 62],
      shotsOnTarget: [6, 2],
      shotsOffTarget: [7, 3],
      corners: [9, 2],
      yellowCards: [3, 2],
      redCards: [0, 0],
      xg: [1.76, 0.65],
    },
    momentum: [35, 60, 70, 75, 80, 85, 80, 92],
    lastEvent: "80' Штурм ворот Atalanta, заблокирован удар",
    odds: { home: 2.1, draw: 2.45, away: 4.8, over25: 1.70, btts: 1.65 },
    history: {
      predictedIpt: 2.75,
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
    },
  },
  {
    id: 'm-5',
    country: 'Brazil',
    countryCode: '🇧🇷',
    league: 'Serie A Betano',
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    score: [0, 0],
    minute: 38,
    status: 'LIVE',
    source: 'SStats',
    stats: {
      possession: [52, 48],
      dangerousAttacks: [29, 32],
      attacks: [58, 61],
      shotsOnTarget: [2, 2],
      shotsOffTarget: [3, 1],
      corners: [3, 4],
      yellowCards: [2, 1],
      redCards: [0, 0],
      xg: [0.45, 0.52],
    },
    momentum: [-5, 10, -15, 20, 10, -5, 15, -10],
    lastEvent: "35' Опасная контратака Palmeiras",
    odds: { home: 2.3, draw: 3.1, away: 3.2, over25: 2.05, btts: 1.95 },
  },
  {
    id: 'm-6',
    country: 'England',
    countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    league: 'Premier League',
    homeTeam: 'Manchester City',
    awayTeam: 'Everton',
    score: [0, 0],
    minute: 17,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [72, 28],
      dangerousAttacks: [24, 6],
      attacks: [38, 12],
      shotsOnTarget: [3, 0],
      shotsOffTarget: [3, 0],
      corners: [3, 0],
      yellowCards: [0, 1],
      redCards: [0, 0],
      xg: [0.78, 0.05],
    },
    momentum: [60, 75, 80, 85, 88],
    lastEvent: "16' Плотный дальний удар фаворита в створ",
    odds: { home: 1.25, draw: 6.5, away: 12.0, over25: 1.55, btts: 1.85 },
    oddsDrop: {
      market: 'HOME',
      marketName: 'П1 (Manchester City)',
      initialOdds: 1.45,
      currentOdds: 1.22,
      dropPercent: 15.8,
      moneyVolumePercent: 84,
      moneyVolumeAmountEur: 245000,
      bookmaker: 'Betfair Exchange / Pinnacle',
      detectedAtMinute: 11,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      predictedIpt: 3.15,
    },
  },
  {
    id: 'm-7',
    country: 'Italy',
    countryCode: '🇮🇹',
    league: 'Serie A',
    homeTeam: 'Napoli',
    awayTeam: 'Cagliari',
    score: [0, 0],
    minute: 76,
    status: 'LIVE',
    source: 'Sofascore',
    stats: {
      possession: [66, 34],
      dangerousAttacks: [58, 22],
      attacks: [98, 41],
      shotsOnTarget: [6, 1],
      shotsOffTarget: [5, 2],
      corners: [8, 1],
      yellowCards: [1, 2],
      redCards: [0, 0],
      xg: [1.74, 0.18],
    },
    momentum: [45, 60, 70, 80, 85, 90],
    lastEvent: "75' Штурм ворот Cagliari: суммарный xG 1.92 при счёте 0:0, гол назревает",
    odds: { home: 1.48, draw: 4.2, away: 7.5, over25: 1.62, btts: 1.75 },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 5,
      awayOver25Streak: 3,
      predictedIpt: 2.88,
    },
  },
  {
    id: 'm-8',
    country: 'Germany',
    countryCode: '🇩🇪',
    league: 'Bundesliga',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Hoffenheim',
    score: [1, 0],
    minute: 28,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [74, 26],
      dangerousAttacks: [42, 11],
      attacks: [65, 20],
      shotsOnTarget: [5, 1],
      shotsOffTarget: [4, 1],
      corners: [5, 1],
      yellowCards: [0, 1],
      redCards: [0, 0],
      xg: [1.62, 0.15],
    },
    momentum: [65, 80, 85, 90],
    lastEvent: "27' Удар в перекладину ворот Hoffenheim",
    odds: {
      home: 1.18,
      draw: 7.5,
      away: 14.0,
      over25: 1.38,
      over35: 1.88,
      handicap1: 1.45,
      itb1_25: 1.50,
      btts: 1.55,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      predictedIpt: 3.45,
    },
  },
  {
    id: 'm-9',
    country: 'England',
    countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    league: 'Premier League',
    homeTeam: 'Liverpool',
    awayTeam: 'Aston Villa',
    score: [1, 2],
    minute: 82,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [65, 35],
      dangerousAttacks: [78, 28],
      attacks: [126, 54],
      shotsOnTarget: [8, 3],
      shotsOffTarget: [7, 2],
      corners: [10, 3],
      yellowCards: [2, 3],
      redCards: [0, 0],
      xg: [2.35, 1.10],
    },
    momentum: [50, 70, 80, 85, 92, 95],
    lastEvent: "81' Сейв вратаря Aston Villa после углового",
    odds: { home: 1.55, draw: 3.9, away: 5.8, over25: 1.60, btts: 1.62 },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      last4LateGoalCount: 3,
    },
  },
  {
    id: 'm-10',
    country: 'Italy',
    countryCode: '🇮🇹',
    league: 'Serie A',
    homeTeam: 'Inter',
    awayTeam: 'Torino',
    score: [0, 1],
    minute: 52,
    status: 'LIVE',
    source: 'Sofascore',
    stats: {
      possession: [67, 33],
      dangerousAttacks: [54, 18],
      attacks: [92, 39],
      shotsOnTarget: [5, 1],
      shotsOffTarget: [6, 2],
      corners: [7, 1],
      yellowCards: [1, 2],
      redCards: [0, 0],
      xg: [1.45, 0.40],
    },
    momentum: [40, 60, 75, 80, 85],
    lastEvent: "50' Давление Интера у ворот Torino",
    odds: { home: 1.35, draw: 4.8, away: 8.5, over25: 1.68, btts: 1.85 },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
    },
  },
  {
    id: 'm-11',
    country: 'Portugal',
    countryCode: '🇵🇹',
    league: 'Primeira Liga',
    homeTeam: 'Benfica',
    awayTeam: 'Sporting',
    score: [0, 2],
    minute: 75,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [55, 45],
      dangerousAttacks: [58, 48],
      attacks: [92, 82],
      shotsOnTarget: [6, 5],
      shotsOffTarget: [5, 3],
      corners: [6, 4],
      yellowCards: [3, 2],
      redCards: [0, 0],
      xg: [1.65, 1.40],
    },
    momentum: [25, -20, 35, 15, 40],
    lastEvent: "75' С 29-й мин без голов после 2 быстрых голов Спортинга в 1Т (21', 29')",
    odds: { home: 14.0, draw: 6.0, away: 1.22, over25: 1.95, btts: 2.20 },
    history: {
      guestScoredTwoQuickFirstHalf: true,
      twoQuickGoalsFirstHalf: true,
      goalsAtFirstHalfQuick: 2,
      noGoalsSinceQuickGoals: true,
      twoQuickGoalsMinute: 29,
      h2hOver15Pct: 85,
    },
  },
  {
    id: 'm-12',
    country: 'Spain',
    countryCode: '🇪🇸',
    league: 'La Liga',
    homeTeam: 'Barcelona',
    awayTeam: 'Getafe',
    score: [0, 0],
    minute: 0,
    status: 'PREMATCH',
    startTime: '21:00',
    startsInMinutes: 60, // Ровно 1 час до начала матча
    source: 'Sofascore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [0, 0],
      attacks: [0, 0],
      shotsOnTarget: [0, 0],
      shotsOffTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [0, 0],
    },
    momentum: [0, 0, 0, 0],
    lastEvent: "До матча: 1 час (21:00). Проведён предматчевый отбор за 60 мин до свистка",
    odds: {
      home: 1.18,
      draw: 7.50,
      away: 14.50,
      over25: 1.42,
      over35: 1.95,
      handicap1: 1.48,
      btts: 1.70,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 6,
      awayOver25Streak: 4,
      predictedIpt: 3.25,
      h2hOver15Pct: 90,
    },
  },
  {
    id: 'm-13',
    country: 'Germany',
    countryCode: '🇩🇪',
    league: 'Bundesliga',
    homeTeam: 'Bayer Leverkusen',
    awayTeam: 'Stuttgart',
    score: [0, 0],
    minute: 0,
    status: 'PREMATCH',
    startTime: '18:30',
    startsInMinutes: 60, // Ровно 1 час до начала матча
    source: 'Flashscore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [0, 0],
      attacks: [0, 0],
      shotsOnTarget: [0, 0],
      shotsOffTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [0, 0],
    },
    momentum: [0, 0, 0, 0],
    lastEvent: "До матча: 60 мин (18:30). Линия 1.50–1.67, сигнал за час до старта",
    odds: {
      home: 1.88,
      draw: 3.85,
      away: 3.90,
      over25: 1.58,
      btts: 1.56,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 5,
      awayOver25Streak: 5,
      predictedIpt: 2.95,
      bothScoredLast5Count: 5,
      h2hOver15Pct: 95,
    },
  },
  {
    id: 'm-14',
    country: 'Italy',
    countryCode: '🇮🇹',
    league: 'Serie A',
    homeTeam: 'Milan',
    awayTeam: 'Roma',
    score: [0, 0],
    minute: 0,
    status: 'PREMATCH',
    startTime: '22:45',
    startsInMinutes: 180, // 3 часа до начала матча (будет ждать окна 1 часа)
    source: 'Flashscore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [0, 0],
      attacks: [0, 0],
      shotsOnTarget: [0, 0],
      shotsOffTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [0, 0],
    },
    momentum: [0, 0, 0, 0],
    lastEvent: "До матча: 3 часа (22:45). Анализ запустится строго за 1 час (60 мин) до начала",
    odds: {
      home: 2.10,
      draw: 3.40,
      away: 3.50,
      over25: 1.90,
      btts: 1.75,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      predictedIpt: 2.40,
      h2hOver15Pct: 75,
    },
  },
];

export default function App() {
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);

  // Multi-user state management
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('footbalmonitor_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sanitize any dummy mock tokens so they do not block real Telegram delivery
          return parsed.map((u: UserProfile) => ({
            ...u,
            telegramBots: (u.telegramBots || []).map((b) => ({
              ...b,
              botToken:
                b.botToken &&
                (b.botToken.startsWith('7123456789') ||
                  b.botToken.startsWith('7987654321') ||
                  b.botToken.startsWith('7456123789') ||
                  b.botToken.startsWith('7654321987') ||
                  b.botToken.startsWith('7332211445'))
                  ? ''
                  : b.botToken,
              channelId:
                b.channelId &&
                (b.channelId.startsWith('-1001928374') ||
                  b.channelId.startsWith('-1001999888') ||
                  b.channelId.startsWith('-1001888777') ||
                  b.channelId.startsWith('-1002000111') ||
                  b.channelId.startsWith('-1002111333'))
                  ? ''
                  : b.channelId,
            })),
          }));
        }
      } catch (e) {}
    }
    return DEFAULT_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('footbalmonitor_current_user_id');
    if (saved) return saved;
    return DEFAULT_USERS[0].id;
  });

  // Authentication Gate state: User must log in to view the platform
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authStatus = localStorage.getItem('footbalmonitor_authenticated');
    return authStatus === 'true';
  });

  // Dark / Light Theme switching state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('footbalmonitor_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
    try {
      localStorage.setItem('footbalmonitor_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const currentUser = useMemo(() => {
    return allUsers.find((u) => u.id === currentUserId) || allUsers[0] || DEFAULT_USERS[0];
  }, [allUsers, currentUserId]);

  // Ads state
  const [ads] = useState<AdBannerItem[]>(DEFAULT_ADS);
  const [dismissedTopBanner, setDismissedTopBanner] = useState<boolean>(false);
  const [dismissedLeftBanner, setDismissedLeftBanner] = useState<boolean>(false);
  const [dismissedRightBanner, setDismissedRightBanner] = useState<boolean>(false);

  const topAd = useMemo(() => {
    return (
      ads.find((a) => a.bannerType === 'top_billboard') ||
      ads.find((a) => a.bannerType === 'top_ribbon') ||
      ads[0]
    );
  }, [ads]);

  const leftAd = useMemo(() => {
    return (
      ads.find((a) => a.bannerType === 'skyscraper_left' || a.side === 'left') ||
      ads.find((a) => a.id === 'ad-skyscraper-left') ||
      ads[1] ||
      ads[0]
    );
  }, [ads]);

  const rightAd = useMemo(() => {
    return (
      ads.find((a) => a.bannerType === 'skyscraper_right' || a.side === 'right') ||
      ads.find((a) => a.id === 'ad-skyscraper-right') ||
      ads[2] ||
      ads[0]
    );
  }, [ads]);

  // Persistent filters isolated per user (Only run filters explicitly launched by the user)
  const [filters, setFilters] = useState<FilterRule[]>(() => {
    const uid = localStorage.getItem('footbalmonitor_current_user_id') || DEFAULT_USERS[0].id;
    const userSaved = localStorage.getItem(`footbalmonitor_filters_user_${uid}`);
    const migrationFlag = localStorage.getItem('footbalmonitor_user_launched_only_v2');

    if (userSaved) {
      try {
        const parsed = JSON.parse(userSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Update strat-guest-two-quick to 75' rule if present
          const migratedSaved = parsed.map((p: FilterRule) => {
            if (p.id === 'strat-guest-two-quick') {
              return {
                ...p,
                name: '⚡ Два быстрых гола в 1-м тайме (Сигнал на 75\' без голов)',
                description: 'В 1-м тайме забито 2 быстрых гола подряд (разница ≤ 15 мин). Если до 75-й минуты голов больше не было — сигнал на ТБ матча (поздний гол).',
                minMinute: 75,
                maxMinute: 77,
                requireGuestTwoQuickGoals1H: true,
                requireNoGoalsSinceQuickGoals: true,
                targetMarket: 'ТБ матча (+1 гол после 75\')',
              };
            }
            if (p.id === 'strat-7') {
              return {
                ...p,
                name: '📐 Стратегия 7: Алгоритм на ТБ 2.5 (Сигнал на 70\' при непробитом ТБ 2.5)',
                description: 'Сигнал на 70-й минуте (70-75\'), когда в матче забито не более 2 голов (ТБ 2.5 ещё не пробит) при расчетном IPT > 2.70 или доматчевом кэфе ТБ 2.5 ≤ 1.90. Ставка на ТБ 2.5 / Поздний гол.',
                ruleType: 'LIVE' as const,
                minMinute: 70,
                maxMinute: 75,
                scoreCondition: 'TOTAL_UNDER_25' as const,
                maxTotalGoals: 2,
                minModelIpt: 2.70,
                maxOddsOver25: 1.90,
                targetMarket: 'Тотал больше 2.5 / Гол после 70-й мин',
              };
            }
            if (p.id === 'strat-smart-money-drop') {
              return {
                ...p,
                name: '📉 Прогруз линии / Smart Money: Падение кэфа ≥ 12% (Деньги ≥ 65%)',
                description: 'Отслеживание аномального прогруза денег крупными игроками (Steam Move): резкое падение коэффициента на исход от 12% при доле ставок от 65% всего пула рынка на бирже Betfair / Pinnacle.',
                minOddsDropPercent: 12,
                minMoneyVolumePercent: 65,
              };
            }
            return p;
          });

          // Merge in any newly added system preset strategies (e.g. strat-xg-deficit-75)
          const existingIds = new Set(migratedSaved.map((p: FilterRule) => p.id));
          const missingPresets = EXPANDED_DEFAULT_FILTERS.filter(
            (dp) => !existingIds.has(dp.id)
          ).map((dp) => ({
            ...dp,
            userId: uid,
            enabled: false,
            botId: DEFAULT_USERS[0].telegramBots.find((b) => b.isDefault)?.id,
          }));

          const combined = [...migratedSaved, ...missingPresets];

          if (!migrationFlag) {
            localStorage.setItem('footbalmonitor_user_launched_only_v2', 'true');
            // If previous session had massive bulk enabled, default to only filter #1 launched
            return combined.map((f: FilterRule, idx: number) => ({
              ...f,
              userId: uid,
              enabled: idx === 0,
            }));
          }
          return combined;
        }
      } catch (e) {}
    }

    localStorage.setItem('footbalmonitor_user_launched_only_v2', 'true');
    return EXPANDED_DEFAULT_FILTERS.map((f, idx) => ({
      ...f,
      enabled: idx === 0, // Only 1 filter launched initially, user explicitly launches others
      userId: uid,
      botId: DEFAULT_USERS[0].telegramBots.find((b) => b.isDefault)?.id,
    }));
  });

  // Filter manager UI state
  const [activeFilterCategory, setActiveFilterCategory] = useState<FilterCategory>('all');
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [editingFilter, setEditingFilter] = useState<FilterRule | null>(null);

  // Save users & current user id
  useEffect(() => {
    localStorage.setItem('footbalmonitor_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('footbalmonitor_current_user_id', currentUserId);
  }, [currentUserId]);

  // Save filters isolated to the active user
  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(`footbalmonitor_filters_user_${currentUser.id}`, JSON.stringify(filters));
    }
  }, [filters, currentUser?.id]);

  const [selectedMatchId, setSelectedMatchId] = useState<string>(INITIAL_MATCHES[0].id);
  const [inspectorOffset, setInspectorOffset] = useState<number>(0);
  const [inspectorAlignMode, setInspectorAlignMode] = useState<'opposite' | 'sticky' | 'top'>('opposite');
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const matchesGridRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);

  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'filters' | 'signals' | 'backtest' | 'telegram' | 'cabinet'>('matches');
  const [filterViewMode, setFilterViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [signalsViewMode, setSignalsViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Persistent signals tracker state
  const [signals, setSignals] = useState<SignalAlert[]>(() => {
    const saved = localStorage.getItem('footbalmonitor_signals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_SIGNALS;
  });

  // Save signals to localStorage
  useEffect(() => {
    localStorage.setItem('footbalmonitor_signals', JSON.stringify(signals));
  }, [signals]);

  // Signal tracker UI filters
  const [signalOutcomeFilter, setSignalOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'PENDING' | 'REFUND'>('ALL');
  const [signalSearchQuery, setSignalSearchQuery] = useState<string>('');

  // AI Match Analyst modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [aiTargetMatch, setAiTargetMatch] = useState<Match | null>(null);

  const handleOpenAIAnalyst = (targetMatch: Match) => {
    setAiTargetMatch(targetMatch);
    setIsAIModalOpen(true);
  };

  // Real Match Tester modal state
  const [isRealMatchTesterOpen, setIsRealMatchTesterOpen] = useState<boolean>(false);

  // User Management & Cabinet Handlers
  const handleSelectUser = (newUser: UserProfile) => {
    // 1. Save current user's filters
    if (currentUser?.id) {
      localStorage.setItem(`footbalmonitor_filters_user_${currentUser.id}`, JSON.stringify(filters));
    }

    setCurrentUserId(newUser.id);
    localStorage.setItem('footbalmonitor_current_user_id', newUser.id);

    // 2. Load selected user's filters
    const userSaved = localStorage.getItem(`footbalmonitor_filters_user_${newUser.id}`);
    if (userSaved) {
      try {
        const parsed = JSON.parse(userSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map((p: FilterRule) => {
            if (p.id === 'strat-7') {
              return {
                ...p,
                name: '📐 Стратегия 7: Алгоритм на ТБ 2.5 (Сигнал на 70\' при непробитом ТБ 2.5)',
                description: 'Сигнал на 70-й минуте (70-75\'), когда в матче забито не более 2 голов (ТБ 2.5 ещё не пробит) при расчетном IPT > 2.70 или доматчевом кэфе ТБ 2.5 ≤ 1.90. Ставка на ТБ 2.5 / Поздний гол.',
                ruleType: 'LIVE' as const,
                minMinute: 70,
                maxMinute: 75,
                scoreCondition: 'TOTAL_UNDER_25' as const,
                maxTotalGoals: 2,
                minModelIpt: 2.70,
                maxOddsOver25: 1.90,
                targetMarket: 'Тотал больше 2.5 / Гол после 70-й мин',
              };
            }
            if (p.id === 'strat-smart-money-drop') {
              return {
                ...p,
                name: '📉 Прогруз линии / Smart Money: Падение кэфа ≥ 12% (Деньги ≥ 65%)',
                description: 'Отслеживание аномального прогруза денег крупными игроками (Steam Move): резкое падение коэффициента на исход от 12% при доле ставок от 65% всего пула рынка на бирже Betfair / Pinnacle.',
                minOddsDropPercent: 12,
                minMoneyVolumePercent: 65,
              };
            }
            return p;
          });
          setFilters(migrated);
          return;
        }
      } catch (e) {}
    }

    // Default filters for new user with default bot assignment
    const defaultBot = newUser.telegramBots.find((b) => b.isDefault) || newUser.telegramBots[0];
    const initialForUser = EXPANDED_DEFAULT_FILTERS.map((f, idx) => ({
      ...f,
      userId: newUser.id,
      enabled: idx === 0,
      botId: defaultBot?.id,
    }));
    setFilters(initialForUser);
  };

  const handleUpdateCurrentUser = (updated: UserProfile) => {
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleCreateUser = (newUser: UserProfile) => {
    setAllUsers((prev) => [...prev, newUser]);
    handleSelectUser(newUser);
  };

  const handleLogin = (user: UserProfile) => {
    handleSelectUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('footbalmonitor_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('footbalmonitor_authenticated');
  };

  const handleSendTestBotMessage = async (bot: TelegramBotProfile) => {
    if (!bot.botToken || !bot.channelId) {
      return { ok: false, error: 'Укажите Bot Token и Chat ID для проверки' };
    }
    const testText = `🤖 <b>Проверка связи с ботом FootbalMonitor Pro</b>\n\n` +
      `✅ Бот: <b>${bot.name}</b>\n` +
      `👤 Личный кабинет: <b>${currentUser.displayName}</b> (@${currentUser.username})\n` +
      `🕒 Время проверки: ${new Date().toLocaleTimeString('ru-RU')}\n` +
      `⚡ Статус: Бот успешно подключен и готов к привязке персональных фильтров!`;

    const res = await sendTelegramMessage(testText, true, {
      force: true,
      botToken: bot.botToken,
      chatId: bot.channelId,
    });
    return res;
  };

  // Data Sources configuration state
  const [isDataSourcesModalOpen, setIsDataSourcesModalOpen] = useState<boolean>(false);
  const [isRefreshingMatches, setIsRefreshingMatches] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [dataSourceError, setDataSourceError] = useState<string | null>(null);

  const [dataSourceConfig, setDataSourceConfig] = useState<DataSourceConfig>(() => {
    const saved = localStorage.getItem('footbalmonitor_datasource_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            activeSource: (parsed.activeSource || 'flashscore') as DataSourceType,
            flashscore: parsed.flashscore || {
              enabled: true,
              includeOdds: true,
              maxMatches: 150,
            },
            sstats: parsed.sstats || {
              enabled: true,
              apiKey: '',
            },
            sofascore: parsed.sofascore || {
              enabled: true,
              useProxy: false,
            },
            apiFootball: parsed.apiFootball || {
              enabled: false,
              apiKey: '',
              provider: 'api-sports' as const,
              leaguesFilter: '39,140,135,78,61',
            },
            footballData: parsed.footballData || {
              enabled: false,
              apiToken: '',
              plan: 'free' as const,
            },
            webhook: parsed.webhook || {
              enabled: false,
              secretKey: '',
              ingestedCount: 0,
            },
            publicFeed: parsed.publicFeed || {
              enabled: true,
            },
            autoRefresh: parsed.autoRefresh ?? true,
            refreshIntervalSeconds: parsed.refreshIntervalSeconds || 30,
          };
        }
      } catch (e) {}
    }
    return {
      activeSource: 'flashscore' as DataSourceType,
      flashscore: {
        enabled: true,
        includeOdds: true,
        maxMatches: 150,
      },
      sstats: {
        enabled: true,
        apiKey: '',
      },
      sofascore: {
        enabled: true,
        useProxy: false,
      },
      apiFootball: {
        enabled: false,
        apiKey: '',
        provider: 'api-sports' as const,
        leaguesFilter: '39,140,135,78,61',
      },
      footballData: {
        enabled: false,
        apiToken: '',
        plan: 'free' as const,
      },
      webhook: {
        enabled: false,
        secretKey: '',
        ingestedCount: 0,
      },
      publicFeed: {
        enabled: true,
      },
      autoRefresh: true,
      refreshIntervalSeconds: 30,
    };
  });

  // Save data source config to localStorage
  useEffect(() => {
    localStorage.setItem('footbalmonitor_datasource_config', JSON.stringify(dataSourceConfig));
  }, [dataSourceConfig]);

  // Fetch real matches from selected data source
  const fetchLiveMatchesFromSource = async (sourceType?: DataSourceType) => {
    const src = sourceType || dataSourceConfig.activeSource;
    if (src === 'simulated') {
      setMatches(INITIAL_MATCHES);
      setLastFetchedAt(new Date().toLocaleTimeString('ru-RU'));
      return;
    }

    setIsRefreshingMatches(true);
    setDataSourceError(null);

    try {
      let query = `?source=${src}&nocache=1`;
      if (src === 'sstats' && dataSourceConfig.sstats?.apiKey) {
        query += `&sstats_key=${encodeURIComponent(dataSourceConfig.sstats.apiKey)}`;
      } else if (src === 'api-football' && dataSourceConfig.apiFootball?.apiKey) {
        query += `&api_key=${encodeURIComponent(dataSourceConfig.apiFootball.apiKey)}&provider=${dataSourceConfig.apiFootball.provider}&leagues=${encodeURIComponent(dataSourceConfig.apiFootball.leaguesFilter)}`;
      } else if (src === 'football-data' && dataSourceConfig.footballData?.apiToken) {
        query += `&football_data_token=${encodeURIComponent(dataSourceConfig.footballData.apiToken)}`;
      }

      const res = await fetch(`/api/datasources/live${query}`);
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches((prev) =>
          data.matches.map((newM: Match) => {
            const prevM = prev.find((m) => m.id === newM.id);
            return enrichMatchWithOddsTracker(newM, prevM);
          })
        );
        if (!data.matches.some((m: Match) => m.id === selectedMatchId)) {
          setSelectedMatchId(data.matches[0].id);
        }
        setLastFetchedAt(data.fetchedAt || new Date().toLocaleTimeString('ru-RU'));
      } else if (data.matches && data.matches.length === 0) {
        setDataSourceError('В выбранном источнике сейчас нет активных Live-матчей. Попробуйте Flashscore или Public Feed.');
      } else {
        setDataSourceError(data.error || 'Ошибка при получении матчей из источника');
      }
    } catch (err: any) {
      setDataSourceError(`Сетевая ошибка: ${err?.message || err}`);
    } finally {
      setIsRefreshingMatches(false);
    }
  };

  // Initial load of real matches if public-feed or api is chosen
  useEffect(() => {
    if (dataSourceConfig.activeSource !== 'simulated') {
      fetchLiveMatchesFromSource(dataSourceConfig.activeSource);
    }
  }, [dataSourceConfig.activeSource]);

  // Periodic auto-refresh for real live matches
  useEffect(() => {
    if (dataSourceConfig.activeSource !== 'simulated' && dataSourceConfig.autoRefresh && isMonitoringActive) {
      const intervalMs = Math.max(15, dataSourceConfig.refreshIntervalSeconds || 30) * 1000;
      const timer = setInterval(() => {
        fetchLiveMatchesFromSource(dataSourceConfig.activeSource);
      }, intervalMs);
      return () => clearInterval(timer);
    }
  }, [dataSourceConfig.activeSource, dataSourceConfig.autoRefresh, dataSourceConfig.refreshIntervalSeconds, isMonitoringActive]);

  const handleAddMatchToLive = (newMatch: Match) => {
    setMatches((prev) => [newMatch, ...prev.filter((m) => m.id !== newMatch.id)]);
    setSelectedMatchId(newMatch.id);
  };

  // Update signal outcome (WIN, LOSS, REFUND, PENDING) with Telegram message rewrite
  const updateSignalOutcome = (signalId: string, outcome: SignalOutcome, oddsOverride?: number) => {
    setSignals((prev) => {
      const target = prev.find((s) => s.id === signalId);
      if (!target) return prev;

      const finalOdds = oddsOverride !== undefined ? oddsOverride : target.odds;
      const stake = target.stake || 1000;
      let profit: number | undefined = undefined;
      if (outcome === 'WIN') {
        profit = Number(((finalOdds - 1) * stake).toFixed(2));
      } else if (outcome === 'LOSS') {
        profit = -stake;
      } else if (outcome === 'REFUND') {
        profit = 0;
      }

      const match = matches.find((m) => m.id === target.matchId);
      const scoreToUse = target.finalScore || (match ? `${match.score[0]}:${match.score[1]}` : target.score);

      const updatedSig: SignalAlert = {
        ...target,
        outcome,
        odds: finalOdds,
        profit,
        finalScore: scoreToUse,
        resolvedAt: outcome !== 'PENDING' ? new Date().toLocaleTimeString('ru-RU') : undefined,
      };

      // Auto-rewrite existing Telegram message if message ID exists
      if (
        target.telegramMessageId &&
        target.sentToTelegram &&
        telegramConfig.autoUpdateOnFinish !== false &&
        outcome !== 'PENDING'
      ) {
        const resolvedHtml = formatResolvedTelegramAlert(
          updatedSig,
          scoreToUse,
          outcome,
          match
            ? {
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                league: match.league,
                country: match.country,
              }
            : undefined
        );

        editTelegramMessage(target.telegramMessageId, resolvedHtml).then((res) => {
          setSignals((curr) =>
            curr.map((s) =>
              s.id === signalId
                ? {
                    ...s,
                    telegramEdited: res.ok,
                    telegramEditedAt: res.ok ? new Date().toLocaleTimeString('ru-RU') : undefined,
                    telegramStatusText: res.ok
                      ? `Обновлено в TG (${outcome === 'WIN' ? '✅ WIN' : '❌ LOSS'})`
                      : (res.error || 'Ошибка обновления TG'),
                  }
                : s
            )
          );
        });
      }

      return prev.map((s) => (s.id === signalId ? updatedSig : s));
    });
  };

  // Export signals to CSV
  const handleExportSignalsCsv = () => {
    const headers = ['ID', 'Время', 'Матч', 'Лига', 'Страна', 'Мин', 'Счет', 'Итог', 'Стратегия', 'Маркет', 'Кэф', 'Ставка', 'Исход', 'Профит', 'Telegram'];
    const rows = signals.map((s) => [
      s.id,
      s.timestamp,
      `"${s.matchName.replace(/"/g, '""')}"`,
      `"${s.league.replace(/"/g, '""')}"`,
      `"${s.country.replace(/"/g, '""')}"`,
      s.minute,
      `"${s.score}"`,
      `"${s.finalScore || '-'}"`,
      `"${s.ruleName.replace(/"/g, '""')}"`,
      `"${(s.marketSuggestion || '').replace(/"/g, '""')}"`,
      s.odds,
      s.stake,
      s.outcome,
      s.profit !== undefined ? s.profit : '',
      s.sentToTelegram ? 'Отправлено' : 'Локально',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `footbalmonitor_signals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('footbalmonitor_tg_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          botToken: parsed.botToken || '',
          channelId: parsed.channelId || '',
          notificationsCount: parsed.notificationsCount || 0,
          lastPing: parsed.lastPing || '',
          autoSend: parsed.autoSend ?? true,
          silentMode: parsed.silentMode ?? false,
          parseMode: parsed.parseMode || 'HTML',
          suppressDuplicates: parsed.suppressDuplicates ?? true,
          deduplicationMode: parsed.deduplicationMode || 'once-per-match',
          cooldownMinutes: parsed.cooldownMinutes ?? 15,
          blockedDuplicatesCount: parsed.blockedDuplicatesCount || 0,
          autoUpdateOnFinish: parsed.autoUpdateOnFinish ?? true,
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      botToken: '',
      channelId: '',
      notificationsCount: 0,
      lastPing: '',
      autoSend: true,
      silentMode: false,
      parseMode: 'HTML' as const,
      suppressDuplicates: true,
      deduplicationMode: 'once-per-match' as const,
      cooldownMinutes: 15,
      blockedDuplicatesCount: 0,
      autoUpdateOnFinish: true,
    };
  });

  // Sent signals tracker to block duplicate alerts every minute
  const sentSignalsTrackerRef = useRef<Map<string, { lastSentAt: number; lastMinute: number; lastScore: string }>>((() => {
    const map = new Map<string, { lastSentAt: number; lastMinute: number; lastScore: string }>();
    try {
      const saved = localStorage.getItem('footbalmonitor_sent_signals_tracker');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(([k, v]) => map.set(k, v));
        }
      }
    } catch (e) {
      // ignore
    }
    return map;
  })());
  const inFlightSendingRef = useRef<Set<string>>(new Set());

  // Keep tracker in sync with localStorage on updates
  const persistSentSignalsTracker = () => {
    try {
      localStorage.setItem(
        'footbalmonitor_sent_signals_tracker',
        JSON.stringify(Array.from(sentSignalsTrackerRef.current.entries()))
      );
    } catch (e) {
      // ignore
    }
  };

  const clearDeduplicationHistory = async () => {
    sentSignalsTrackerRef.current.clear();
    try {
      localStorage.removeItem('footbalmonitor_sent_signals_tracker');
    } catch (e) {
      // ignore
    }
    setTelegramConfig((prev) => ({ ...prev, blockedDuplicatesCount: 0 }));
    try {
      await fetch('/api/telegram/clear-dedup', { method: 'POST' });
    } catch (e) {
      // ignore
    }
  };

  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'checking' | 'connected' | 'error' | 'sending'>('idle');
  const [telegramBotInfo, setTelegramBotInfo] = useState<{ id?: number; username?: string; first_name?: string } | null>(null);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [lastSentResult, setLastSentResult] = useState<{ ok: boolean; messageId?: number; text?: string; time?: string } | null>(null);

  // Auto-detect chat state
  const [isDetectingChat, setIsDetectingChat] = useState<boolean>(false);
  const [detectedChats, setDetectedChats] = useState<Array<{ id: number | string; title: string; type: string; username?: string }>>([]);
  const [showChatPicker, setShowChatPicker] = useState<boolean>(false);

  // Check if user accidentally entered bot's own username / ID
  const isEnteringBotItself = useMemo(() => {
    if (!telegramBotInfo?.username && !telegramBotInfo?.id) return false;
    const cleanInput = telegramConfig.channelId.trim().replace(/^@/, '').toLowerCase();
    const botUser = (telegramBotInfo?.username || '').toLowerCase();
    const botId = String(telegramBotInfo?.id || '');
    return cleanInput.length > 0 && (cleanInput === botUser || cleanInput === botId);
  }, [telegramConfig.channelId, telegramBotInfo]);

  // Query bot updates to discover user chat ID or channel ID
  const detectChatId = async () => {
    if (!telegramConfig.botToken.trim()) {
      setTelegramError('Сначала введите Bot Token и проверьте статус бота.');
      return;
    }
    setIsDetectingChat(true);
    setTelegramError(null);
    try {
      const res = await fetch(`/api/telegram/updates?token=${encodeURIComponent(telegramConfig.botToken.trim())}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.chats && data.chats.length > 0) {
          setDetectedChats(data.chats);
          setShowChatPicker(true);
          // If only 1 chat found, automatically set it
          if (data.chats.length === 1) {
            const firstChat = data.chats[0];
            setTelegramConfig((c: typeof telegramConfig) => ({ ...c, channelId: String(firstChat.id) }));
          }
        } else {
          setTelegramError(
            `Бот пока не получил ни одного сообщения. Откройте диалог с @${telegramBotInfo?.username || 'вашим ботом'} в Telegram, нажмите кнопку «Запустить» (/start) или отправьте любое сообщение, затем нажмите «Определить мой Chat ID» ещё раз.`
          );
        }
      } else {
        setTelegramError(data.error || 'Не удалось получить список чатов бота');
      }
    } catch (e: any) {
      setTelegramError(`Сетевая ошибка при поиске чатов: ${e?.message || e}`);
    } finally {
      setIsDetectingChat(false);
    }
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('footbalmonitor_tg_config', JSON.stringify(telegramConfig));
  }, [telegramConfig]);

  // Format alert into structured HTML for Telegram
  const formatTelegramAlert = (match: Match, ruleName: string): string => {
    const diffDang = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
    const dangSign = diffDang > 0 ? `+${diffDang} (Хозяева)` : diffDang < 0 ? `+${Math.abs(diffDang)} (Гости)` : 'Равенство';
    const totalShots = match.stats.shotsOnTarget[0] + match.stats.shotsOnTarget[1] + match.stats.shotsOffTarget[0] + match.stats.shotsOffTarget[1];
    const totalCorners = match.stats.corners[0] + match.stats.corners[1];

    const dropInfo = match.oddsDrop
      ? `📉 <b>Прогруз линии (Smart Money):</b> ${match.oddsDrop.marketName}\n` +
        `   • Падение кэфа: <b>-${match.oddsDrop.dropPercent}%</b> (${match.oddsDrop.initialOdds} ➔ ${match.oddsDrop.currentOdds})\n` +
        `   • Доля денег: <b>${match.oddsDrop.moneyVolumePercent}% пула</b>${match.oddsDrop.moneyVolumeAmountEur ? ` (≈ €${match.oddsDrop.moneyVolumeAmountEur.toLocaleString('ru-RU')})` : ''}\n` +
        `   • Биржа/Букмекер: <i>${match.oddsDrop.bookmaker || 'Betfair Exchange / Pinnacle'}</i>\n\n`
      : '';

    return `⚽ <b>СИГНАЛ ФИЛЬТРА: ${ruleName}</b>\n` +
      `🏆 <b>${match.countryCode} ${match.country} | ${match.league}</b>\n\n` +
      `⚔️ <b>${match.homeTeam} ${match.score[0]} : ${match.score[1]} ${match.awayTeam}</b> (<b>${match.minute}'</b>)\n\n` +
      dropInfo +
      `🔥 <b>Опасные атаки:</b> ${match.stats.dangerousAttacks[0]} - ${match.stats.dangerousAttacks[1]} [${dangSign}]\n` +
      `🎯 <b>Удары в створ:</b> ${match.stats.shotsOnTarget[0]} - ${match.stats.shotsOnTarget[1]} (Всего: ${totalShots})\n` +
      `🚩 <b>Угловые:</b> ${match.stats.corners[0]} - ${match.stats.corners[1]} (Всего: ${totalCorners})\n` +
      `📊 <b>xG:</b> ${match.stats.xg[0].toFixed(2)} vs ${match.stats.xg[1].toFixed(2)}\n` +
      `⚡ <b>Владение мячом:</b> ${match.stats.possession[0]}% - ${match.stats.possession[1]}%\n\n` +
      `⏱ <i>Время: ${new Date().toLocaleTimeString('ru-RU')} | Источник: ${match.source}</i>\n` +
      `🤖 <i>Footbalmonitor Live Engine</i>`;
  };

  // Verify Bot via API
  const verifyTelegramBot = async (tokenOverride?: string, chatOverride?: string) => {
    const token = tokenOverride !== undefined ? tokenOverride : telegramConfig.botToken;
    const chat = chatOverride !== undefined ? chatOverride : telegramConfig.channelId;

    if (!token.trim()) {
      setTelegramStatus('idle');
      setTelegramError('Укажите токен бота для проверки.');
      return;
    }

    setTelegramStatus('checking');
    setTelegramError(null);
    try {
      const res = await fetch(`/api/telegram/status?token=${encodeURIComponent(token.trim())}&chat_id=${encodeURIComponent(chat.trim())}`);
      const data = await res.json();
      if (res.ok && data.configured && data.bot) {
        setTelegramStatus('connected');
        setTelegramBotInfo(data.bot);
        setTelegramConfig((prev: typeof telegramConfig) => ({
          ...prev,
          lastPing: new Date().toLocaleTimeString('ru-RU'),
        }));
        // Synchronize default bot in allUsers
        setAllUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === currentUserId
              ? {
                  ...u,
                  telegramBots: (u.telegramBots || []).map((b) =>
                    b.isDefault
                      ? {
                          ...b,
                          botToken: token.trim(),
                          channelId: chat.trim(),
                          botUsername: data.bot.username ? `@${data.bot.username}` : b.botUsername,
                          status: 'verified' as const,
                          lastPing: new Date().toLocaleTimeString('ru-RU'),
                        }
                      : b
                  ),
                }
              : u
          )
        );
      } else {
        setTelegramStatus('error');
        setTelegramError(data.error || 'Не удалось авторизовать бота. Проверьте правильность токена.');
        setTelegramBotInfo(null);
      }
    } catch (err: any) {
      setTelegramStatus('error');
      setTelegramError(`Сетевая ошибка при связи с сервером: ${err?.message || err}`);
    }
  };

  // Check on mount if token is saved
  useEffect(() => {
    if (telegramConfig.botToken) {
      verifyTelegramBot(telegramConfig.botToken, telegramConfig.channelId);
    }
  }, []);

  // Send message through backend API
  const sendTelegramMessage = async (
    text: string,
    isManualTest = false,
    options?: {
      matchId?: string;
      ruleId?: string;
      force?: boolean;
      botToken?: string;
      chatId?: string;
    }
  ) => {
    const defaultBot = currentUser?.telegramBots?.find((b) => b.isDefault) || currentUser?.telegramBots?.[0];
    const token = (options?.botToken || telegramConfig.botToken || defaultBot?.botToken || '').trim();
    const chatId = (options?.chatId || telegramConfig.channelId || defaultBot?.channelId || '').trim();

    if (!token || !chatId) {
      if (isManualTest) {
        setTelegramError('Заполните Bot Token и Chat ID перед отправкой сообщения.');
      }
      return { ok: false, error: 'Заполните Bot Token и Chat ID' };
    }

    setTelegramStatus('sending');
    setTelegramError(null);

    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          chat_id: chatId,
          bot_token: token,
          disable_notification: telegramConfig.silentMode,
          parse_mode: telegramConfig.parseMode,
          match_id: options?.matchId,
          rule_id: options?.ruleId,
          force: options?.force ?? isManualTest,
          dedup_mode: telegramConfig.deduplicationMode,
          cooldown_seconds: (telegramConfig.cooldownMinutes || 15) * 60,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.duplicateSuppressed) {
          setTelegramStatus('connected');
          setTelegramConfig((prev: typeof telegramConfig) => ({
            ...prev,
            blockedDuplicatesCount: (prev.blockedDuplicatesCount || 0) + 1,
          }));
          return { ok: true, duplicateSuppressed: true, message: data.message };
        }

        setTelegramStatus('connected');
        setTelegramConfig((prev: typeof telegramConfig) => ({
          ...prev,
          notificationsCount: prev.notificationsCount + 1,
          lastPing: new Date().toLocaleTimeString('ru-RU'),
        }));
        setLastSentResult({
          ok: true,
          messageId: data.messageId,
          text: `Сообщение доставлено в чат/канал (ID: #${data.messageId})`,
          time: new Date().toLocaleTimeString('ru-RU'),
        });
        return { ok: true, messageId: data.messageId };
      } else {
        setTelegramStatus('error');
        const errMsg = data.error || 'Ошибка при отправке в Telegram';
        setTelegramError(errMsg);
        setLastSentResult({
          ok: false,
          text: errMsg,
          time: new Date().toLocaleTimeString('ru-RU'),
        });
        return { ok: false, error: errMsg };
      }
    } catch (err: any) {
      setTelegramStatus('error');
      const netErr = `Сетевая ошибка отправки: ${err?.message || err}`;
      setTelegramError(netErr);
      return { ok: false, error: netErr };
    }
  };

  // Edit existing Telegram message via backend API (/api/telegram/edit)
  const editTelegramMessage = async (
    messageId: number,
    text: string,
    options?: { botToken?: string; chatId?: string }
  ): Promise<{ ok: boolean; error?: string }> => {
    const defaultBot = currentUser?.telegramBots?.find((b) => b.isDefault) || currentUser?.telegramBots?.[0];
    const token = (options?.botToken || telegramConfig.botToken || defaultBot?.botToken || '').trim();
    const chatId = (options?.chatId || telegramConfig.channelId || defaultBot?.channelId || '').trim();

    if (!token || !chatId) {
      return { ok: false, error: 'Заполните Bot Token и Chat ID' };
    }

    try {
      const res = await fetch('/api/telegram/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          text,
          chat_id: chatId,
          bot_token: token,
          parse_mode: telegramConfig.parseMode || 'HTML',
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        return { ok: true };
      } else {
        return { ok: false, error: data.error || 'Ошибка при редактировании сообщения' };
      }
    } catch (err: any) {
      return { ok: false, error: `Сетевая ошибка редактирования: ${err?.message || err}` };
    }
  };

  // Rewrite Telegram message for a specific signal with outcome result
  const handleRewriteTelegramMessage = async (sig: SignalAlert, overrideOutcome?: SignalOutcome) => {
    if (!sig.telegramMessageId) {
      alert('У этого сигнала отсутствует Telegram Message ID для редактирования.');
      return;
    }

    const outcomeToUse = overrideOutcome || (sig.outcome === 'PENDING' ? 'WIN' : sig.outcome);
    const match = matches.find((m) => m.id === sig.matchId);
    const scoreToUse = sig.finalScore || (match ? `${match.score[0]}:${match.score[1]}` : sig.score);

    const stake = sig.stake || 1000;
    const profit =
      outcomeToUse === 'WIN'
        ? Number(((sig.odds - 1) * stake).toFixed(2))
        : outcomeToUse === 'LOSS'
        ? -stake
        : 0;

    const resolvedHtml = formatResolvedTelegramAlert(
      { ...sig, outcome: outcomeToUse, profit },
      scoreToUse,
      outcomeToUse,
      match
        ? {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.league,
            country: match.country,
          }
        : undefined
    );

    const botTokenToUse = sig.botToken || telegramConfig.botToken;
    const chatIdToUse = sig.chatId || telegramConfig.channelId;

    const res = await editTelegramMessage(sig.telegramMessageId, resolvedHtml, {
      botToken: botTokenToUse,
      chatId: chatIdToUse,
    });
    if (res.ok) {
      setSignals((prev) =>
        prev.map((s) =>
          s.id === sig.id
            ? {
                ...s,
                outcome: outcomeToUse,
                profit,
                finalScore: scoreToUse,
                telegramEdited: true,
                telegramEditedAt: new Date().toLocaleTimeString('ru-RU'),
                telegramStatusText: `Обновлено в TG (${outcomeToUse === 'WIN' ? '✅ WIN' : '❌ LOSS'})`,
              }
            : s
        )
      );
    } else {
      alert(`Не удалось переписать сообщение в Telegram: ${res.error}`);
    }
  };

  // Simulation: live ticking (only when in simulated demo mode)
  useEffect(() => {
    if (!isMonitoringActive) return;
    if (dataSourceConfig.activeSource !== 'simulated') return;

    const interval = setInterval(() => {
      setMatches((prev) =>
        prev.map((m) => {
          if (m.status !== 'LIVE') return m;
          const nextMinute = m.minute >= 90 ? 90 : m.minute + 1;
          const isHomePressuring = Math.random() > 0.45;
          const deltaAttacks = Math.floor(Math.random() * 2);
          const deltaDang = Math.random() > 0.6 ? 1 : 0;
          const deltaShots = Math.random() > 0.85 ? 1 : 0;
          const deltaCorners = Math.random() > 0.9 ? 1 : 0;

          // Occasional goal during heavy pressure
          const homeScores = isHomePressuring && deltaShots > 0 && Math.random() > 0.92;
          const awayScores = !isHomePressuring && deltaShots > 0 && Math.random() > 0.94;
          const nextScore: [number, number] = [
            m.score[0] + (homeScores ? 1 : 0),
            m.score[1] + (awayScores ? 1 : 0),
          ];

          const updatedMatch: Match = {
            ...m,
            minute: nextMinute,
            status: nextMinute >= 90 ? 'FT' : m.status,
            score: nextScore,
            stats: {
              ...m.stats,
              attacks: [
                m.stats.attacks[0] + (isHomePressuring ? deltaAttacks : 0),
                m.stats.attacks[1] + (!isHomePressuring ? deltaAttacks : 0),
              ],
              dangerousAttacks: [
                m.stats.dangerousAttacks[0] + (isHomePressuring ? deltaDang : 0),
                m.stats.dangerousAttacks[1] + (!isHomePressuring ? deltaDang : 0),
              ],
              shotsOnTarget: [
                m.stats.shotsOnTarget[0] + (isHomePressuring && deltaShots ? 1 : 0),
                m.stats.shotsOnTarget[1] + (!isHomePressuring && deltaShots ? 1 : 0),
              ],
              corners: [
                m.stats.corners[0] + (isHomePressuring && deltaCorners ? 1 : 0),
                m.stats.corners[1] + (!isHomePressuring && deltaCorners ? 1 : 0),
              ],
            },
          };
          return enrichMatchWithOddsTracker(updatedMatch, m);
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isMonitoringActive, dataSourceConfig.activeSource]);

  // Automated outcome evaluation and Telegram message rewriting on match completion or goal
  useEffect(() => {
    if (telegramConfig.autoUpdateOnFinish === false) return;

    signals.forEach((sig) => {
      if (sig.outcome !== 'PENDING') return;
      const match = matches.find((m) => m.id === sig.matchId);
      if (!match) return;

      const isFinished = match.status === 'FT' || match.minute >= 90;
      const evalRes = evaluateSignalOutcome(sig, match.score, isFinished);

      if (evalRes.shouldResolve) {
        const finalScoreStr = `${match.score[0]}:${match.score[1]}`;
        const stake = sig.stake || 1000;
        const profit =
          evalRes.outcome === 'WIN'
            ? Number(((sig.odds - 1) * stake).toFixed(2))
            : evalRes.outcome === 'LOSS'
            ? -stake
            : 0;

        const updatedSignal: SignalAlert = {
          ...sig,
          outcome: evalRes.outcome,
          finalScore: finalScoreStr,
          profit,
          resolvedAt: new Date().toLocaleTimeString('ru-RU'),
          resolutionNote: evalRes.note,
        };

        if (sig.telegramMessageId && sig.sentToTelegram) {
          const resolvedHtml = formatResolvedTelegramAlert(
            updatedSignal,
            finalScoreStr,
            evalRes.outcome,
            {
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              league: match.league,
              country: match.country,
            }
          );

          editTelegramMessage(sig.telegramMessageId, resolvedHtml).then((res) => {
            setSignals((curr) =>
              curr.map((s) =>
                s.id === sig.id
                  ? {
                      ...updatedSignal,
                      telegramEdited: res.ok,
                      telegramEditedAt: res.ok ? new Date().toLocaleTimeString('ru-RU') : undefined,
                      telegramStatusText: res.ok
                        ? `Обновлено в TG (${evalRes.outcome === 'WIN' ? '✅ WIN' : '❌ LOSS'})`
                        : (res.error || 'Ошибка обновления TG'),
                    }
                  : s
              )
            );
          });
        } else {
          setSignals((curr) => curr.map((s) => (s.id === sig.id ? updatedSignal : s)));
        }
      }
    });
  }, [matches, telegramConfig.autoUpdateOnFinish]);

  // Check filter triggers and auto-send alerts with Anti-Spam deduplication
  // CRITICAL: ONLY run filters that are explicitly launched (enabled === true) by the current user!
  useEffect(() => {
    if (!isMonitoringActive) return;

    const activeLaunchedFilters = filters.filter(
      (f) => f.enabled && (!f.userId || f.userId === currentUser?.id)
    );
    if (activeLaunchedFilters.length === 0) return;

    matches.forEach((match) => {
      const analysis = calculatePressureAnalysis(match);

      activeLaunchedFilters.forEach((rule) => {
        const evalResult = evaluateFilterRule(match, rule);
        if (!evalResult.matches) return;

        const matchTrackerKey = `match_${match.id}`;
        const ruleTrackerKey = `match_${match.id}__rule_${rule.id}`;
        const currentScoreStr = `${match.score[0]}:${match.score[1]}`;

        let isDuplicateSuppressed = false;

        if (telegramConfig.suppressDuplicates) {
          // If already in flight, suppress immediately
          if (inFlightSendingRef.current.has(matchTrackerKey)) {
            return;
          }

          const existingMatchTrack = sentSignalsTrackerRef.current.get(matchTrackerKey);
          const existingRuleTrack = sentSignalsTrackerRef.current.get(ruleTrackerKey);

          if (telegramConfig.deduplicationMode === 'once-per-match') {
            if (existingMatchTrack) {
              isDuplicateSuppressed = true;
            }
          } else if (telegramConfig.deduplicationMode === 'cooldown') {
            const trackToCheck = existingMatchTrack || existingRuleTrack;
            if (trackToCheck) {
              const minutesPassed = Math.abs(match.minute - trackToCheck.lastMinute);
              const msPassed = Date.now() - trackToCheck.lastSentAt;
              const cooldownMs = (telegramConfig.cooldownMinutes || 15) * 60 * 1000;
              if (minutesPassed < (telegramConfig.cooldownMinutes || 15) && msPassed < cooldownMs) {
                isDuplicateSuppressed = true;
              }
            }
          } else if (telegramConfig.deduplicationMode === 'score-change') {
            const trackToCheck = existingMatchTrack || existingRuleTrack;
            if (trackToCheck && currentScoreStr === trackToCheck.lastScore) {
              isDuplicateSuppressed = true;
            }
          }
        }

        if (isDuplicateSuppressed) {
          return;
        }

        // Record into anti-spam memory
        sentSignalsTrackerRef.current.set(matchTrackerKey, {
          lastSentAt: Date.now(),
          lastMinute: match.minute,
          lastScore: currentScoreStr,
        });
        sentSignalsTrackerRef.current.set(ruleTrackerKey, {
          lastSentAt: Date.now(),
          lastMinute: match.minute,
          lastScore: currentScoreStr,
        });
        persistSentSignalsTracker();

        // Check if alert already recorded in current state list
        const isPrematch = getBetTypeForSignal(rule, match.minute, match) === 'PREMATCH' || match.status === 'PREMATCH';
        const alertId = isPrematch ? `${match.id}-${rule.id}-prematch-60` : `${match.id}-${rule.id}-${match.minute}`;
        const estimatedOdds = getEstimatedOdds(rule.targetMarket, match.minute);

        // Determine destination bot for this rule
        let targetBotToken = '';
        let targetChatId = '';
        let targetBotName = 'Основной бот';

        if (rule.customBotToken && rule.customChatId) {
          targetBotToken = rule.customBotToken.trim();
          targetChatId = rule.customChatId.trim();
          targetBotName = 'Кастомный бот';
        } else if (rule.botId) {
          const foundBot = currentUser?.telegramBots?.find((b) => b.id === rule.botId);
          if (foundBot && foundBot.botToken?.trim() && foundBot.channelId?.trim()) {
            targetBotToken = foundBot.botToken.trim();
            targetChatId = foundBot.channelId.trim();
            targetBotName = foundBot.name;
          }
        }

        if (!targetBotToken || !targetChatId) {
          const defaultBot = currentUser?.telegramBots?.find((b) => b.isDefault) || currentUser?.telegramBots?.[0];
          targetBotToken = (telegramConfig.botToken || defaultBot?.botToken || '').trim();
          targetChatId = (telegramConfig.channelId || defaultBot?.channelId || '').trim();
          targetBotName = defaultBot?.name || 'Основной бот';
        }

        const shouldSendTg = rule.telegramEnabled && telegramConfig.autoSend && !!targetBotToken && !!targetChatId;

        const periodStr = isPrematch
          ? 'Прематч (за 1 час до матча)'
          : (match.minute <= 45 ? '1-й тайм' : (match.status === 'HT' ? 'Перерыв' : '2-й тайм'));

        const signalMessage = isPrematch
          ? `📋 [ПРЕДМАТЧЕВЫЙ СИГНАЛ ЗА 1 ЧАС] ${match.countryCode} ${match.country} | ${match.league}\n` +
            `⚔️ ${match.homeTeam} vs ${match.awayTeam} (⏳ Старт через ${match.startsInMinutes ?? 60} мин${match.startTime ? `, ${match.startTime}` : ''})\n` +
            (rule.targetMarket ? `🎯 Рекомендуемый исход: ${rule.targetMarket}\n` : '') +
            `⏱ Анализ проведён строго за 1 час (60 мин) до свистка | Стратегия: ${rule.name}`
          : `⚽ [СИГНАЛ] ${match.country} | ${match.league}\n${match.homeTeam} ${match.score[0]}:${match.score[1]} ${match.awayTeam} (${match.minute}')\n` +
            (rule.targetMarket ? `🎯 Исход: ${rule.targetMarket}\n` : '') +
            `🔥 Давление: ${analysis.pressureIndex}/100 | Оп. атаки ${match.stats.dangerousAttacks[0]}-${match.stats.dangerousAttacks[1]} | Удары в створ ${match.stats.shotsOnTarget[0]}-${match.stats.shotsOnTarget[1]} | Углы ${match.stats.corners[0]}-${match.stats.corners[1]}`;

        const newAlert: SignalAlert = {
          id: alertId,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          matchId: match.id,
          matchName: `${match.homeTeam} vs ${match.awayTeam}`,
          league: match.league,
          country: match.country,
          minute: match.minute,
          period: periodStr,
          betType: isPrematch ? 'PREMATCH' : 'LIVE',
          score: currentScoreStr,
          initialScore: currentScoreStr,
          ruleId: rule.id,
          ruleName: rule.name,
          marketSuggestion: rule.targetMarket,
          outcome: 'PENDING',
          odds: estimatedOdds,
          stake: 1000,
          botId: rule.botId,
          botName: targetBotName,
          botToken: targetBotToken,
          chatId: targetChatId,
          userId: currentUser?.id,
          statsSnapshot: {
            homeScore: match.score[0],
            awayScore: match.score[1],
            attacks: [match.stats.attacks[0], match.stats.attacks[1]],
            dangerousAttacks: [match.stats.dangerousAttacks[0], match.stats.dangerousAttacks[1]],
            shotsOnTarget: [match.stats.shotsOnTarget[0], match.stats.shotsOnTarget[1]],
            shotsOffTarget: [match.stats.shotsOffTarget[0], match.stats.shotsOffTarget[1]],
            corners: [match.stats.corners[0], match.stats.corners[1]],
            yellowCards: [match.stats.yellowCards[0], match.stats.yellowCards[1]],
            redCards: [match.stats.redCards[0], match.stats.redCards[1]],
            possession: [match.stats.possession[0], match.stats.possession[1]],
          },
          message: signalMessage,
          sentToTelegram: shouldSendTg,
          telegramStatusText: shouldSendTg ? `Отправка в TG (${targetBotName})...` : 'Локальный сигнал',
        };

        setSignals((prev) => {
          if (prev.some((s) => s.id === alertId)) return prev;
          return [newAlert, ...prev].slice(0, 50);
        });

        // Dispatch Telegram alert outside of setSignals to avoid multiple dispatches during render
        if (shouldSendTg) {
          inFlightSendingRef.current.add(matchTrackerKey);
          sendTelegramMessage(
            formatExtendedTelegramAlert(match, rule, analysis),
            false,
            {
              matchId: match.id,
              ruleId: rule.id,
              botToken: targetBotToken,
              chatId: targetChatId,
            }
          ).then((res) => {
            inFlightSendingRef.current.delete(matchTrackerKey);
            if (!res.ok) {
              sentSignalsTrackerRef.current.delete(matchTrackerKey);
              sentSignalsTrackerRef.current.delete(ruleTrackerKey);
              persistSentSignalsTracker();
            }
            setSignals((curr) =>
              curr.map((item) =>
                item.id === alertId
                  ? {
                      ...item,
                      sentToTelegram: res.ok && !res.duplicateSuppressed,
                      telegramStatusText: res.duplicateSuppressed
                        ? '🛡️ Дубликат подавлен'
                        : res.ok
                        ? `Доставлено в TG (${targetBotName} #${res.messageId})`
                        : (res.error || 'Ошибка отправки'),
                      telegramMessageId: res.messageId,
                    }
                  : item
              )
            );
          }).catch(() => {
            inFlightSendingRef.current.delete(matchTrackerKey);
            sentSignalsTrackerRef.current.delete(matchTrackerKey);
            sentSignalsTrackerRef.current.delete(ruleTrackerKey);
            persistSentSignalsTracker();
          });
        }
      });
    });
  }, [
    isMonitoringActive,
    matches,
    filters,
    currentUser,
    telegramConfig.autoSend,
    telegramConfig.botToken,
    telegramConfig.channelId,
    telegramConfig.suppressDuplicates,
    telegramConfig.deduplicationMode,
    telegramConfig.cooldownMinutes,
  ]);

  const selectedMatch = useMemo(() => {
    return matches.find((m) => m.id === selectedMatchId) || matches[0];
  }, [matches, selectedMatchId]);

  // Counts how many filters (active or preset) triggered on this match
  const getMatchTriggeredCount = useCallback(
    (match: Match) => {
      const activeFilters = filters.filter((f) => f.enabled && (!f.userId || f.userId === currentUser?.id));
      if (activeFilters.length > 0) {
        return activeFilters.filter((f) => evaluateFilterRule(match, f).matches).length;
      }
      return filters.filter((f) => (!f.userId || f.userId === currentUser?.id) && evaluateFilterRule(match, f).matches).length;
    },
    [filters, currentUser?.id]
  );

  const filteredMatches = useMemo(() => {
    const queried = matches.filter(
      (m) =>
        m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.league.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // CRITICAL USER DIRECTIVE:
    // "Матчи в которых сработали фильтры должны находиться в верхнем списке всех матчей."
    return [...queried].sort((a, b) => {
      const aCount = getMatchTriggeredCount(a);
      const bCount = getMatchTriggeredCount(b);
      const aHasSignal = signals.some((s) => s.matchId === a.id);
      const bHasSignal = signals.some((s) => s.matchId === b.id);

      const aTriggered = aCount > 0 || aHasSignal;
      const bTriggered = bCount > 0 || bHasSignal;

      // 1. Matches where filters triggered MUST ALWAYS BE AT THE TOP!
      if (aTriggered && !bTriggered) return -1;
      if (!aTriggered && bTriggered) return 1;

      // 2. If both triggered, sort by number of triggered filters descending
      if (aTriggered && bTriggered) {
        if (aCount !== bCount) return bCount - aCount;
      }

      // 3. Status grouping: LIVE first, then PREMATCH, then FT
      const statusOrder: Record<string, number> = { LIVE: 0, HT: 1, PREMATCH: 2, FT: 3 };
      const aOrder = statusOrder[a.status] ?? 2;
      const bOrder = statusOrder[b.status] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;

      // 4. For PREMATCH matches: sort by startsInMinutes ascending (e.g. 60 min before 180 min)
      if (a.status === 'PREMATCH' && b.status === 'PREMATCH') {
        return (a.startsInMinutes ?? 999) - (b.startsInMinutes ?? 999);
      }

      // 5. For LIVE matches: sort by minute descending
      return (b.minute || 0) - (a.minute || 0);
    });
  }, [matches, searchQuery, getMatchTriggeredCount, signals]);

  // Screen resize watcher for desktop 2-column layout
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate and align inspector column opposite the selected match card
  const updateInspectorPosition = useCallback((targetId?: string) => {
    if (typeof window === 'undefined' || window.innerWidth < 1024) {
      setInspectorOffset(0);
      return;
    }

    if (inspectorAlignMode === 'top') {
      setInspectorOffset(0);
      return;
    }

    const idToFind = targetId || selectedMatchId;
    if (!idToFind) return;

    const cardElement = document.getElementById(`match-card-${idToFind}`);
    const gridElement = matchesGridRef.current;

    if (cardElement && gridElement) {
      const gridRect = gridElement.getBoundingClientRect();
      const cardRect = cardElement.getBoundingClientRect();
      // Calculate distance from grid container top to the selected match card top
      const relativeTop = cardRect.top - gridRect.top;
      setInspectorOffset(Math.max(0, Math.round(relativeTop)));
    }
  }, [selectedMatchId, inspectorAlignMode]);

  // Keep inspector synchronized when activeTab is matches, list length changes, or filter updates
  useEffect(() => {
    if (activeTab !== 'matches') return;
    updateInspectorPosition();
    const rAf = requestAnimationFrame(() => updateInspectorPosition());
    const timer = setTimeout(() => updateInspectorPosition(), 50);
    return () => {
      cancelAnimationFrame(rAf);
      clearTimeout(timer);
    };
  }, [selectedMatchId, activeTab, filteredMatches.length, searchQuery, inspectorAlignMode, updateInspectorPosition]);

  // Handle selecting a match with instant position calculation and smooth alignment
  const handleSelectMatch = useCallback((matchId: string, shouldScrollIfHidden: boolean = false) => {
    setSelectedMatchId(matchId);

    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const cardElement = document.getElementById(`match-card-${matchId}`);
      const gridElement = matchesGridRef.current;
      if (cardElement && gridElement && inspectorAlignMode === 'opposite') {
        const gridRect = gridElement.getBoundingClientRect();
        const cardRect = cardElement.getBoundingClientRect();
        const relativeTop = cardRect.top - gridRect.top;
        setInspectorOffset(Math.max(0, Math.round(relativeTop)));

        // If card was clicked near the extreme edge of viewport, smoothly adjust
        if (shouldScrollIfHidden) {
          const viewportHeight = window.innerHeight;
          if (cardRect.top < 80 || cardRect.bottom > viewportHeight - 60) {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    } else {
      // On mobile/tablet (< 1024px), scroll to the statistics inspector smoothly
      setTimeout(() => {
        const inspectorCard = document.getElementById('match-inspector-card');
        inspectorCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [inspectorAlignMode]);

  // Navigate directly to match tab, select target match, and scroll smoothly into view
  const handleNavigateToMatchFromSignal = useCallback((targetMatchId?: string, matchName?: string, signalObj?: SignalAlert) => {
    // 1. Reset match search so the target match is 100% visible in the list
    setSearchQuery('');

    // 2. Find the match in the current live matches collection
    let targetMatch = matches.find((m) => m.id === targetMatchId);
    if (!targetMatch && matchName) {
      const parts = matchName.split(' vs ');
      const homePart = parts[0]?.trim().toLowerCase();
      const awayPart = parts[1]?.trim().toLowerCase();
      targetMatch = matches.find((m) => {
        const h = m.homeTeam.toLowerCase();
        const a = m.awayTeam.toLowerCase();
        return (homePart && (h.includes(homePart) || homePart.includes(h))) ||
               (awayPart && (a.includes(awayPart) || awayPart.includes(a)));
      });
    }

    // 3. If the match wasn't in the active live collection (e.g. simulated signal or historical):
    // Construct a live match from the signal alert so the user ALWAYS gets directed to this exact match!
    if (!targetMatch && signalObj) {
      const parts = signalObj.matchName.split(' vs ');
      const home = parts[0]?.trim() || 'Хозяева';
      const away = parts[1]?.trim() || 'Гости';
      const scoreParts = (signalObj.score || '0:0').split(':');
      const s0 = parseInt(scoreParts[0], 10) || 0;
      const s1 = parseInt(scoreParts[1], 10) || 0;
      const snap = signalObj.statsSnapshot;

      targetMatch = {
        id: signalObj.matchId || `match-${signalObj.id}`,
        country: signalObj.country || 'Европа',
        countryCode: '⚽',
        league: signalObj.league || 'Live League',
        homeTeam: home,
        awayTeam: away,
        score: [s0, s1],
        minute: signalObj.minute || 65,
        status: 'LIVE',
        source: 'Public-Feed',
        stats: {
          possession: snap?.possession || [54, 46],
          dangerousAttacks: snap?.dangerousAttacks || [42, 28],
          attacks: snap?.attacks || [68, 49],
          shotsOnTarget: snap?.shotsOnTarget || [5, 2],
          shotsOffTarget: snap?.shotsOffTarget || [4, 3],
          corners: snap?.corners || [6, 3],
          yellowCards: snap?.yellowCards || [1, 2],
          redCards: snap?.redCards || [0, 0],
          xg: [1.35, 0.62],
        },
        momentum: [12, 18, 25, 20, 35, 45, 40, 55],
        lastEvent: `Сигнал по фильтру «${signalObj.ruleName}» на ${signalObj.minute}' мин`,
        odds: {
          home: 1.85,
          draw: 3.40,
          away: 4.20,
          over25: 1.72,
          over05: 1.15,
          over15: 1.38,
          under25: 2.10,
        },
      };

      setMatches((prev) => [targetMatch!, ...prev.filter((m) => m.id !== targetMatch!.id)]);
    } else if (!targetMatch && matches.length > 0) {
      targetMatch = matches[0];
    }

    if (!targetMatch) return;

    // 4. Switch to matches tab
    setActiveTab('matches');
    setSelectedMatchId(targetMatch.id);

    // 5. Scroll to match card & adjust inspector
    setTimeout(() => {
      handleSelectMatch(targetMatch!.id, true);
      const cardElement = document.getElementById(`match-card-${targetMatch!.id}`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  }, [matches, handleSelectMatch]);

  // Filter manager operations
  const handleSaveFilter = (savedRule: FilterRule) => {
    setFilters((prev) => {
      const exists = prev.some((f) => f.id === savedRule.id);
      if (exists) {
        return prev.map((f) => (f.id === savedRule.id ? savedRule : f));
      }
      return [savedRule, ...prev];
    });
  };

  const handleDeleteFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDuplicateFilter = (rule: FilterRule) => {
    const copy: FilterRule = {
      ...rule,
      id: `copy-${Date.now()}`,
      name: `${rule.name} (копия)`,
      isPreset: false,
    };
    setFilters((prev) => [copy, ...prev]);
  };

  const handleCreateFilterFromMatch = (match: Match) => {
    const dangDiff = Math.abs(match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1]);
    const totalShots =
      match.stats.shotsOnTarget[0] +
      match.stats.shotsOnTarget[1] +
      match.stats.shotsOffTarget[0] +
      match.stats.shotsOffTarget[1];
    const totalSot = match.stats.shotsOnTarget[0] + match.stats.shotsOnTarget[1];
    const totalCorners = match.stats.corners[0] + match.stats.corners[1];
    const totalXg = match.stats.xg[0] + match.stats.xg[1];
    const analysis = calculatePressureAnalysis(match);

    const customRule: FilterRule = {
      id: `custom-match-${Date.now()}`,
      name: `⚡ Стратегия под ${match.homeTeam} (${match.minute}')`,
      description: `Создано на основе параметров игры ${match.homeTeam} vs ${match.awayTeam} (${match.score[0]}:${match.score[1]}, ${match.minute}')`,
      category: 'custom',
      enabled: true,
      minMinute: Math.max(0, match.minute - 10),
      maxMinute: Math.min(90, match.minute + 15),
      scoreCondition:
        match.score[0] === match.score[1]
          ? match.score[0] === 0
            ? '0-0'
            : 'DRAW'
          : Math.abs(match.score[0] - match.score[1]) === 1
          ? 'ONE_GOAL_DIFF'
          : 'ANY',
      minDangerousAttacksDiff: dangDiff >= 10 ? dangDiff - 5 : 10,
      minTotalShots: totalShots >= 5 ? totalShots - 2 : undefined,
      minShotsOnTargetTotal: totalSot >= 3 ? totalSot - 1 : undefined,
      minTotalCorners: totalCorners >= 4 ? totalCorners - 1 : undefined,
      minXgTotal: totalXg >= 1 ? Number((totalXg * 0.8).toFixed(1)) : undefined,
      minPressureIndex: Math.max(40, analysis.pressureIndex - 10),
      redCardCondition:
        match.stats.redCards[0] > 0 || match.stats.redCards[1] > 0 ? 'HAS_RED_CARD' : 'ANY',
      targetMarket:
        match.score[0] + match.score[1] === 0
          ? 'ТБ 0.5 в матче'
          : 'Следующий гол / ТБ',
      telegramEnabled: true,
      color: 'emerald',
      isPreset: false,
    };

    setEditingFilter(customRule);
    setIsFilterModalOpen(true);
  };

  const handleResetFilters = () => {
    if (window.confirm('Сбросить все фильтры к расширенным заводским алгоритмам? Все пользовательские изменения будут сброшены.')) {
      setFilters(EXPANDED_DEFAULT_FILTERS);
    }
  };

  const handleExportFiltersJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filters, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `footbalmonitor_filters_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportFiltersJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFilters(parsed);
        } else {
          alert('Файл должен содержать массив правил фильтрации');
        }
      } catch (err: any) {
        alert('Ошибка при импорте JSON: ' + (err?.message || err));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const triggerTestSignal = async () => {
    if (!selectedMatch) return;
    const alertId = `manual-${Date.now()}`;
    const analysis = calculatePressureAnalysis(selectedMatch);
    const activeRule = filters.find((f) => f.enabled) || filters[0];
    const textHtml = formatExtendedTelegramAlert(selectedMatch, activeRule, analysis);
    const displayMsg = `🔔 [ТЕСТОВЫЙ ПУШ]\n${selectedMatch.countryCode} ${selectedMatch.country} | ${selectedMatch.league}\n${selectedMatch.homeTeam} ${selectedMatch.score[0]}:${selectedMatch.score[1]} ${selectedMatch.awayTeam} (${selectedMatch.minute}')\n` +
      `🔥 Давление: ${analysis.pressureIndex}/100 | Опасные атаки: ${selectedMatch.stats.dangerousAttacks[0]}-${selectedMatch.stats.dangerousAttacks[1]} | Удары в створ: ${selectedMatch.stats.shotsOnTarget[0]}-${selectedMatch.stats.shotsOnTarget[1]}`;

    const res = await sendTelegramMessage(textHtml, true);
    const currentScore = `${selectedMatch.score[0]}:${selectedMatch.score[1]}`;

    const testAlert: SignalAlert = {
      id: alertId,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      matchId: selectedMatch.id,
      matchName: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
      league: selectedMatch.league,
      country: selectedMatch.country,
      minute: selectedMatch.minute,
      period: selectedMatch.minute <= 45 ? '1-й тайм' : (selectedMatch.status === 'HT' ? 'Перерыв' : '2-й тайм'),
      score: currentScore,
      initialScore: currentScore,
      ruleId: activeRule?.id,
      ruleName: `Тестовый сигнал (${activeRule?.name || 'Ручной'})`,
      marketSuggestion: activeRule?.targetMarket || 'ТБ 0.5',
      outcome: 'PENDING',
      odds: 1.85,
      stake: 1000,
      statsSnapshot: {
        homeScore: selectedMatch.score[0],
        awayScore: selectedMatch.score[1],
        attacks: [selectedMatch.stats.attacks[0], selectedMatch.stats.attacks[1]],
        dangerousAttacks: [selectedMatch.stats.dangerousAttacks[0], selectedMatch.stats.dangerousAttacks[1]],
        shotsOnTarget: [selectedMatch.stats.shotsOnTarget[0], selectedMatch.stats.shotsOnTarget[1]],
        shotsOffTarget: [selectedMatch.stats.shotsOffTarget[0], selectedMatch.stats.shotsOffTarget[1]],
        corners: [selectedMatch.stats.corners[0], selectedMatch.stats.corners[1]],
        yellowCards: [selectedMatch.stats.yellowCards[0], selectedMatch.stats.yellowCards[1]],
        redCards: [selectedMatch.stats.redCards[0], selectedMatch.stats.redCards[1]],
        possession: [selectedMatch.stats.possession[0], selectedMatch.stats.possession[1]],
      },
      message: displayMsg,
      sentToTelegram: res.ok,
      telegramStatusText: res.ok ? `Доставлено в TG (#${res.messageId}) - ожидает расчета` : (res.error || 'Ошибка отправки'),
      telegramMessageId: res.messageId,
    };
    setSignals((prev) => [testAlert, ...prev]);
  };

  // Demo: send test signal and auto-rewrite it in Telegram after 3 seconds
  const [isDemoRewriting, setIsDemoRewriting] = useState(false);
  const triggerTestAndRewriteDemo = async () => {
    if (!selectedMatch) return;
    setIsDemoRewriting(true);
    const alertId = `demo-${Date.now()}`;
    const analysis = calculatePressureAnalysis(selectedMatch);
    const activeRule = filters.find((f) => f.enabled) || filters[0];
    const textHtml = formatExtendedTelegramAlert(selectedMatch, activeRule, analysis);
    const currentScore = `${selectedMatch.score[0]}:${selectedMatch.score[1]}`;

    const res = await sendTelegramMessage(textHtml, true);
    if (!res.ok || !res.messageId) {
      setIsDemoRewriting(false);
      return;
    }

    const testAlert: SignalAlert = {
      id: alertId,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      matchId: selectedMatch.id,
      matchName: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
      league: selectedMatch.league,
      country: selectedMatch.country,
      minute: selectedMatch.minute,
      period: selectedMatch.minute <= 45 ? '1-й тайм' : (selectedMatch.status === 'HT' ? 'Перерыв' : '2-й тайм'),
      score: currentScore,
      initialScore: currentScore,
      ruleId: activeRule?.id,
      ruleName: `Демо переписывания (${activeRule?.name || 'ТБ'})`,
      marketSuggestion: activeRule?.targetMarket || 'ТБ 0.5',
      outcome: 'PENDING',
      odds: 1.85,
      stake: 1000,
      statsSnapshot: {
        homeScore: selectedMatch.score[0],
        awayScore: selectedMatch.score[1],
        attacks: [selectedMatch.stats.attacks[0], selectedMatch.stats.attacks[1]],
        dangerousAttacks: [selectedMatch.stats.dangerousAttacks[0], selectedMatch.stats.dangerousAttacks[1]],
        shotsOnTarget: [selectedMatch.stats.shotsOnTarget[0], selectedMatch.stats.shotsOnTarget[1]],
        shotsOffTarget: [selectedMatch.stats.shotsOffTarget[0], selectedMatch.stats.shotsOffTarget[1]],
        corners: [selectedMatch.stats.corners[0], selectedMatch.stats.corners[1]],
        yellowCards: [selectedMatch.stats.yellowCards[0], selectedMatch.stats.yellowCards[1]],
        redCards: [selectedMatch.stats.redCards[0], selectedMatch.stats.redCards[1]],
        possession: [selectedMatch.stats.possession[0], selectedMatch.stats.possession[1]],
      },
      message: `🔔 Сигнал отправлен (#${res.messageId}). Ожидание завершения матча для переписывания...`,
      sentToTelegram: true,
      telegramStatusText: `Доставлено (#${res.messageId}) - перепишется через 3 сек...`,
      telegramMessageId: res.messageId,
    };
    setSignals((prev) => [testAlert, ...prev]);

    // Simulate match completion and edit Telegram message after 3 seconds
    setTimeout(async () => {
      const finalScoreStr = `${selectedMatch.score[0] + 1}:${selectedMatch.score[1]}`;
      const resolvedHtml = formatResolvedTelegramAlert(
        { ...testAlert, outcome: 'WIN', profit: 850, finalScore: finalScoreStr },
        finalScoreStr,
        'WIN',
        {
          homeTeam: selectedMatch.homeTeam,
          awayTeam: selectedMatch.awayTeam,
          league: selectedMatch.league,
          country: selectedMatch.country,
        }
      );

      const editRes = await editTelegramMessage(res.messageId!, resolvedHtml);
      setSignals((prev) =>
        prev.map((s) =>
          s.id === alertId
            ? {
                ...s,
                outcome: 'WIN',
                profit: 850,
                finalScore: finalScoreStr,
                resolvedAt: new Date().toLocaleTimeString('ru-RU'),
                resolutionNote: 'Матч завершен (FT) - ставка успешно сыграла!',
                telegramEdited: editRes.ok,
                telegramEditedAt: editRes.ok ? new Date().toLocaleTimeString('ru-RU') : undefined,
                telegramStatusText: editRes.ok
                  ? `Успешно переписано в TG: ✅ WIN (#${res.messageId})`
                  : 'Ошибка редактирования в TG',
              }
            : s
        )
      );
      setIsDemoRewriting(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header id="app-header" className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppLogo size="md" animated={true} />
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Data Sources / Real Matches Trigger */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              id="open-datasources-btn"
              onClick={() => setIsDataSourcesModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
              title="Открыть настройку источников данных (Public Live Feed, API-Football, Webhook)"
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                {dataSourceConfig.activeSource === 'flashscore'
                  ? '⚡ Flashscore Live'
                  : dataSourceConfig.activeSource === 'sstats'
                  ? '📊 SStats.net'
                  : dataSourceConfig.activeSource === 'sofascore'
                  ? '⚽ Sofascore'
                  : dataSourceConfig.activeSource === 'public-feed'
                  ? 'Public Live Feed'
                  : dataSourceConfig.activeSource === 'api-football'
                  ? 'API-Football'
                  : dataSourceConfig.activeSource === 'football-data'
                  ? 'Football-Data'
                  : dataSourceConfig.activeSource === 'webhook'
                  ? 'Webhook Feed'
                  : 'Демо-симулятор'}
              </span>
              <span className="sm:hidden">Фид</span>
            </button>
            <button
              onClick={() => fetchLiveMatchesFromSource()}
              disabled={isRefreshingMatches}
              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition disabled:opacity-50"
              title="Синхронизировать реальные live-матчи прямо сейчас"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingMatches ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          {/* Real Match Lab / Tester */}
          <button
            id="open-real-match-tester-btn"
            onClick={() => setIsRealMatchTesterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
            title="Протестировать любой реальный матч из БК или Flashscore на всех 35 стратегиях"
          >
            <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
            <span>Тест матча</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-[10px] font-extrabold uppercase">
              LAB
            </span>
          </button>

          <button
            id="toggle-monitoring-btn"
            onClick={() => setIsMonitoringActive(!isMonitoringActive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isMonitoringActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isMonitoringActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isMonitoringActive ? 'Мониторинг активен' : 'Пауза'}</span>
          </button>

          <button
            id="send-test-signal-btn"
            onClick={triggerTestSignal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
            title="Отправить тестовый сигнал в настроенный Telegram канал"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Тест в TG</span>
          </button>

          <button
            id="open-ai-analyst-header-btn"
            onClick={() => handleOpenAIAnalyst(selectedMatch || matches[0])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-950/50 border border-indigo-400/30 transition hover:scale-[1.02] active:scale-[0.98]"
            title="Запустить мгновенный AI-анализ матча"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-200 animate-pulse" />
            <span>AI-Аналитик</span>
          </button>

          <button
            id="create-filter-header-btn"
            onClick={() => {
              setEditingFilter(null);
              setIsFilterModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/40 transition hover:scale-[1.02] active:scale-[0.98]"
            title="Создать и настроить собственный алгоритм фильтрации"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Новый фильтр</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Navigation tabs */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'matches' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Матчи ({matches.length})
            </button>
            <button
              onClick={() => setActiveTab('filters')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'filters' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Фильтры ({filters.filter((f) => f.enabled).length})
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={`px-3 py-1 rounded-md transition relative ${activeTab === 'signals' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Сигналы
              {signals.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  {signals.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('backtest')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                activeTab === 'backtest'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              Бэктестинг & ROI
            </button>
            <button
              onClick={() => setActiveTab('telegram')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'telegram' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Telegram Бот
            </button>
            <button
              id="cabinet-nav-btn"
              onClick={() => setActiveTab('cabinet')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                currentUser.role === 'god'
                  ? 'bg-purple-950/80 border border-purple-500/50 text-purple-200 font-bold shadow-md shadow-purple-950/50'
                  : activeTab === 'cabinet'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 font-medium'
              }`}
            >
              {currentUser.role === 'god' ? (
                <Zap className="h-3 w-3 text-purple-400 animate-pulse" />
              ) : (
                <User className="h-3 w-3 text-emerald-400" />
              )}
              <span>{currentUser.role === 'god' ? 'GOD MODE' : 'Кабинет'}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                  currentUser.role === 'god'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {currentUser.role === 'god' ? 'ROOT' : currentUser.displayName.split(' ')[0]}
              </span>
            </button>

            {/* Logout button */}
            <button
              id="header-logout-btn"
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1 rounded-md border border-slate-700 hover:border-red-500/60 bg-slate-900/80 hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition flex items-center gap-1 text-xs font-semibold shadow-sm active:scale-95"
              title="Выйти из аккаунта (Заблокировать доступ)"
            >
              <LogOut className="h-3.5 w-3.5 text-red-400" />
              <span className="hidden xl:inline text-[11px]">Выход</span>
            </button>

            {/* Quick Theme Switcher Button */}
            <button
              id="theme-quick-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded-md border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-amber-400 transition flex items-center gap-1.5 text-xs font-semibold ml-1 shadow-sm active:scale-95"
              title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              aria-label="Переключение темы оформления"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="hidden xl:inline text-[11px] text-slate-200 font-bold">Светлая</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <span className="hidden xl:inline text-[11px] text-slate-700 font-bold">Тёмная</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Outer Layout Wrapper with Left & Right Flanking Ad Banners */}
      <div className="flex-1 w-full max-w-[1880px] mx-auto px-2 sm:px-4 lg:px-6 flex justify-center items-start gap-4 xl:gap-6 relative">
        {/* Left Skyscraper Banner (Desktop) */}
        {currentUser.adPreferences.showBanners && !dismissedLeftBanner && leftAd && (
          <aside
            id="ad-flank-left"
            className="hidden xl:block w-44 2xl:w-56 shrink-0 pt-6 sticky top-16 z-20"
          >
            <AdBanner
              ad={leftAd}
              variant="skyscraper"
              side="left"
              onDismiss={() => setDismissedLeftBanner(true)}
            />
          </aside>
        )}

        {/* Restore Left Banner pill if dismissed */}
        {dismissedLeftBanner && currentUser.adPreferences.showBanners && (
          <button
            onClick={() => setDismissedLeftBanner(false)}
            className="hidden xl:flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 bg-slate-900/95 border border-amber-500/40 px-2 py-1 rounded-r-lg fixed left-0 top-32 z-30 transition shadow-lg backdrop-blur-sm active:scale-95"
            title="Восстановить баннер слева"
          >
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold">Баннер слева</span>
          </button>
        )}

        {/* Main Container */}
        <div className="flex-1 max-w-7xl w-full mx-auto py-6 space-y-6 min-w-0">
          {/* Top Billboard Ad Banner ("такой же баннер сверху") */}
          {currentUser.adPreferences.showBanners && !dismissedTopBanner && topAd && (
            <div id="ad-billboard-top" className="w-full">
              <AdBanner
                ad={topAd}
                variant="top_billboard"
                onDismiss={() => setDismissedTopBanner(true)}
              />
            </div>
          )}

          {/* Restore Top Banner button if dismissed */}
          {dismissedTopBanner && currentUser.adPreferences.showBanners && (
            <div className="flex justify-end">
              <button
                onClick={() => setDismissedTopBanner(false)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-slate-900/95 border border-amber-500/40 px-3 py-1 rounded-xl transition shadow-md active:scale-95"
                title="Восстановить верхний рекламный баннер"
              >
                <Flame className="h-3 w-3 text-amber-400" />
                <span>Восстановить верхний баннер</span>
              </button>
            </div>
          )}

          {/* Mobile partner promotions bar if banners are enabled */}
          {currentUser.adPreferences.showBanners && (
            <div className="xl:hidden flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 min-w-0 truncate">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Спецпредложения партнёров:</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={leftAd.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[11px] hover:bg-amber-500/30 transition flex items-center gap-1"
                >
                  <span>{leftAd.badge}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
                <a
                  href={rightAd.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 text-[11px] hover:bg-indigo-500/30 transition flex items-center gap-1"
                >
                  <span>{rightAd.badge}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          )}

        {/* Developer GOD MODE Console (Visible only when Creator/God is logged in) */}
        {currentUser.role === 'god' && (
          <GodModeConsole
            currentUser={currentUser}
            allUsers={allUsers}
            matches={matches}
            filters={filters}
            onSetMatches={setMatches}
            onSetFilters={setFilters}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            onSendTestBroadcast={async (message: string) => {
              const res = await sendTelegramMessage(message, true, { force: true });
              if (!res.ok) {
                throw new Error(res.error || 'Ошибка отправки в Telegram');
              }
            }}
          />
        )}

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            onClick={() => setIsDataSourcesModalOpen(true)}
            className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 flex items-center justify-between cursor-pointer transition group"
            title="Нажмите, чтобы переключить источник (Public Live Feed, API-Football, Webhook)"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-cyan-300 transition">
                <span>Провайдер данных</span>
                <span className="text-[10px] text-cyan-400 font-mono">⚙</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  dataSourceConfig.activeSource !== 'simulated' ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 animate-ping'
                }`} />
                <span className="text-sm font-semibold text-white">
                  {dataSourceConfig.activeSource === 'public-feed'
                    ? 'Public Live Feed'
                    : dataSourceConfig.activeSource === 'api-football'
                    ? 'API-Football Live'
                    : dataSourceConfig.activeSource === 'webhook'
                    ? 'Webhook Stream'
                    : 'Flashscore Demo'}
                </span>
              </div>
              {lastFetchedAt && (
                <div className="text-[10px] text-slate-500">
                  Обновлено: {lastFetchedAt}
                </div>
              )}
            </div>
            <Globe className="h-6 w-6 text-cyan-400/50 group-hover:text-cyan-400 transition" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Матчей в лайве</span>
              <div className="text-xl font-bold text-white">{matches.length}</div>
            </div>
            <Flame className="h-6 w-6 text-amber-400/50" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Активные фильтры</span>
              <div className="text-xl font-bold text-emerald-400">{filters.filter((f) => f.enabled).length} / {filters.length}</div>
            </div>
            <Sliders className="h-6 w-6 text-blue-400/50" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                Отправлено в канал
                {telegramConfig.blockedDuplicatesCount ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono" title="Заблокировано повторных спам-сигналов">
                    🛡️ -{telegramConfig.blockedDuplicatesCount} спама
                  </span>
                ) : null}
              </span>
              <div className="text-xl font-bold text-blue-400">{telegramConfig.notificationsCount} алертов</div>
            </div>
            <Send className="h-6 w-6 text-blue-400/50" />
          </div>
        </div>

        {/* Data Source Error Banner */}
        {dataSourceError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{dataSourceError}</span>
            </div>
            <button
              onClick={() => setDataSourceError(null)}
              className="text-slate-400 hover:text-white text-xs px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Live Matches & Detailed In-Play Analytics */}
        {activeTab === 'matches' && (
          <div id="matches-grid-container" ref={matchesGridRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
            {/* Matches list (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="search-match-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по команде, лиге, стране..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={() => setIsRealMatchTesterOpen(true)}
                  className="px-2.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition shrink-0"
                  title="Открыть лабораторию тестирования реального матча"
                >
                  <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Тестер</span>
                </button>

                <button
                  onClick={() => fetchLiveMatchesFromSource()}
                  disabled={isRefreshingMatches}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-slate-700 transition shrink-0 disabled:opacity-50"
                  title="Обновить live-матчи"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingMatches ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>

              {/* Feed mode indicator bar */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dataSourceConfig.activeSource !== 'simulated' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                  <span>
                    Источник: <strong className="text-slate-200">{
                      dataSourceConfig.activeSource === 'flashscore' ? '⚡ Flashscore Live (Парсер)' :
                      dataSourceConfig.activeSource === 'sstats' ? '📊 SStats.net API' :
                      dataSourceConfig.activeSource === 'sofascore' ? '⚽ Sofascore Live' :
                      dataSourceConfig.activeSource === 'public-feed' ? 'Реальный онлайн-фид' :
                      dataSourceConfig.activeSource === 'api-football' ? 'API-Football' :
                      dataSourceConfig.activeSource === 'football-data' ? 'Football-Data.org' :
                      dataSourceConfig.activeSource === 'webhook' ? 'Webhook' : 'Демо-симулятор'
                    }</strong>
                  </span>
                </div>
                <button
                  onClick={() => setIsDataSourcesModalOpen(true)}
                  className="text-cyan-400 hover:underline font-medium text-[10px]"
                >
                  Сменить / Настроить →
                </button>
              </div>

              {/* Priority indicator banner: matches with triggered filters */}
              {(() => {
                const triggeredCount = filteredMatches.filter((m) => getMatchTriggeredCount(m) > 0).length;
                if (triggeredCount === 0) return null;
                return (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>
                        <strong>{triggeredCount} {triggeredCount === 1 ? 'матч' : triggeredCount < 5 ? 'матча' : 'матчей'}</strong> со сработавшими фильтрами подняты <strong>в верхний список</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                      Вверху списка ⬆
                    </span>
                  </div>
                );
              })()}

              <div className="space-y-2">
                {filteredMatches.map((match) => {
                  const isSelected = match.id === selectedMatchId;
                  const dangDiff = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
                  const isHighPressure = Math.abs(dangDiff) >= 25;
                  const analysis = calculatePressureAnalysis(match);
                  const matchingRules = filters.filter(
                    (f) => f.enabled && (!f.userId || f.userId === currentUser?.id) && evaluateFilterRule(match, f).matches
                  );

                  return (
                    <div
                      key={match.id}
                      id={`match-card-${match.id}`}
                      onClick={() => handleSelectMatch(match.id, true)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                          : matchingRules.length > 0
                          ? 'bg-slate-900/80 border-emerald-500/40 hover:border-emerald-500/70 shadow-lg shadow-emerald-950/20'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Highlight badge for matches with triggered filters (at the top of list) */}
                      {matchingRules.length > 0 && (
                        <div className="mb-2.5 -mt-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300">
                          <span className="flex items-center gap-1.5 font-bold truncate pr-2">
                            <Zap className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400 shrink-0 animate-pulse" />
                            <span className="shrink-0">{matchingRules.length === 1 ? 'Сработал фильтр:' : `Сработало фильтров (${matchingRules.length}):`}</span>
                            <span className="text-emerald-100 font-semibold truncate">
                              {matchingRules[0].name.split('(')[0].trim()}
                              {matchingRules.length > 1 ? ` +ещё ${matchingRules.length - 1}` : ''}
                            </span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40 shrink-0">
                            Вверху списка ⬆
                          </span>
                        </div>
                      )}

                      {/* Prematch status banner (1-hour window indicator) */}
                      {match.status === 'PREMATCH' && (
                        <div className="mb-2 -mt-1 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-between text-[11px] text-sky-300">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                            <span>
                              {match.startsInMinutes !== undefined && match.startsInMinutes <= 60
                                ? `Анализ за 1 час до матча (${match.startsInMinutes} мин до старта)`
                                : `До начала ${match.startsInMinutes ?? 60} мин (Анализ за 1 час / 60 мин)`}
                            </span>
                          </span>
                          {match.startTime && (
                            <span className="text-[10px] font-mono text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/20 shrink-0">
                              Старт {match.startTime}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span>{match.countryCode}</span>
                          <span>{match.country}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-300">{match.league}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAIAnalyst(match);
                            }}
                            className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                            title="Открыть AI-анализ матча в один клик"
                          >
                            <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                            AI
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateFilterFromMatch(match);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-[10px] font-semibold flex items-center gap-1 transition"
                            title="Создать алгоритм фильтрации по текущей статистике этого матча"
                          >
                            <Sliders className="h-2.5 w-2.5 text-emerald-400" />
                            Фильтр
                          </button>
                          {match.status === 'PREMATCH' ? (
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono font-bold text-[11px] border border-sky-500/30 flex items-center gap-1" title="Предматчевый статус: анализ за 1 час до начала">
                              <Clock className="h-2.5 w-2.5 text-sky-400" />
                              {match.startsInMinutes !== undefined ? `${match.startsInMinutes}м` : '60м'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[11px] border border-emerald-500/20">
                              {match.status === 'FT' ? 'FT' : match.status === 'HT' ? 'HT' : `${match.minute}'`}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">{match.source}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between my-2">
                        <div className="flex-1 space-y-1">
                          <div className="font-semibold text-sm text-white flex items-center justify-between pr-4">
                            <span>{match.homeTeam}</span>
                            <span className="text-lg font-bold font-mono">
                              {match.status === 'PREMATCH' ? '-' : match.score[0]}
                            </span>
                          </div>
                          <div className="font-semibold text-sm text-white flex items-center justify-between pr-4">
                            <span>{match.awayTeam}</span>
                            <span className="text-lg font-bold font-mono">
                              {match.status === 'PREMATCH' ? '-' : match.score[1]}
                            </span>
                          </div>
                        </div>

                        {/* Pressure badge */}
                        <div className="pl-3 border-l border-slate-800 flex flex-col items-center justify-center min-w-[65px]">
                          <span
                            className={`p-1.5 rounded-lg border text-xs font-bold font-mono flex items-center gap-1 ${
                              match.status === 'PREMATCH'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : analysis.pressureIndex >= 75
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                                : analysis.pressureIndex >= 50
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {match.status === 'PREMATCH' ? (
                              <>
                                <Clock className="h-3.5 w-3.5 text-sky-400" />
                                IPT {calculateMatchIPT(match).toFixed(1)}
                              </>
                            ) : (
                              <>
                                <Flame className="h-3.5 w-3.5" />
                                {analysis.pressureIndex}%
                              </>
                            )}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-1 font-medium text-center">
                            {match.status === 'PREMATCH'
                              ? 'Прематч (1 ч)'
                              : analysis.goalProbability === 'EXTREME'
                              ? 'Гол назревает'
                              : analysis.goalProbability === 'HIGH'
                              ? 'Высокое давл.'
                              : analysis.goalProbability === 'MEDIUM'
                              ? 'Средний темп'
                              : 'Спокойно'}
                          </span>
                        </div>
                      </div>

                      {/* Quick stat bar */}
                      {match.status === 'PREMATCH' ? (
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            П1: <strong className="text-slate-200">@{match.odds.home.toFixed(2)}</strong> | П2: <strong className="text-slate-200">@{match.odds.away.toFixed(2)}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            ТБ 2.5: <strong className="text-emerald-400 font-mono">@{match.odds.over25.toFixed(2)}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            IPT: <strong className="text-sky-300 font-mono">{calculateMatchIPT(match).toFixed(2)}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            Оп. атаки: <strong className="text-slate-200">{match.stats.dangerousAttacks[0]} - {match.stats.dangerousAttacks[1]}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            Удары: <strong className="text-slate-200">{match.stats.shotsOnTarget[0] + match.stats.shotsOffTarget[0]} - {match.stats.shotsOnTarget[1] + match.stats.shotsOffTarget[1]}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            Углы: <strong className="text-slate-200">{match.stats.corners[0]} - {match.stats.corners[1]}</strong>
                          </span>
                        </div>
                      )}

                      {/* Matching Filters badges on card */}
                      {matchingRules.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Сработали ({matchingRules.length}):
                          </span>
                          {matchingRules.map((rule) => (
                            <span
                              key={rule.id}
                              className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1"
                              title={rule.name}
                            >
                              {rule.name.split('(')[0].trim()}
                              {rule.targetMarket && <span className="text-emerald-400/80 font-mono font-normal">[{rule.targetMarket}]</span>}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Dropping Odds / Smart Money Steam Move Badge on Card */}
                      {match.oddsDrop && (
                        <div className="mt-2 pt-2 border-t border-amber-500/25 flex items-center justify-between text-[11px] bg-amber-500/5 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl">
                          <span className="flex items-center gap-1 text-amber-400 font-semibold truncate">
                            <TrendingDown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Прогруз: {match.oddsDrop.marketName}</span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20">
                              -{match.oddsDrop.dropPercent}%
                            </span>
                            <span className="text-amber-300 font-bold bg-amber-500/15 px-1 py-0.5 rounded border border-amber-500/30">
                              {match.oddsDrop.moneyVolumePercent}% €
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Active selection indicator pointing right to statistics */}
                      {isSelected && isLargeScreen && inspectorAlignMode === 'opposite' && (
                        <div
                          className="hidden lg:flex absolute -right-3 top-5 z-10 h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/60 border-2 border-slate-900"
                          title="Статистика этого матча отображается прямо напротив"
                        >
                          <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}

                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Crosshair className="h-3 w-3 text-emerald-400" />
                            <span>Статистика открыта напротив →</span>
                          </span>
                          <span className="lg:hidden text-[10px] text-slate-400">
                            (см. ниже в инспекторе)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Match In-Depth Inspector (7 cols) */}
            <div
              id="match-inspector-column"
              ref={inspectorRef}
              style={
                isLargeScreen && inspectorAlignMode === 'opposite'
                  ? {
                      marginTop: `${inspectorOffset}px`,
                      transition: 'margin-top 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    }
                  : isLargeScreen && inspectorAlignMode === 'sticky'
                  ? {
                      position: 'sticky',
                      top: '5.5rem',
                    }
                  : undefined
              }
              className="lg:col-span-7 space-y-4"
            >
              {selectedMatch && (
                <div id="match-inspector-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 relative shadow-xl">
                  {/* Position status & alignment bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-slate-400">Панель:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Crosshair className="h-3.5 w-3.5" />
                        {inspectorAlignMode === 'opposite' ? 'Напротив выбранного матча' : inspectorAlignMode === 'sticky' ? 'Закреплена (Sticky)' : 'Вверху страницы'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Button to quickly scroll back to the match card in the list */}
                      <button
                        type="button"
                        onClick={() => {
                          const card = document.getElementById(`match-card-${selectedMatch.id}`);
                          card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 flex items-center gap-1 transition"
                        title="Прокрутить к карточке этого матча в списке"
                      >
                        <ArrowUp className="h-3 w-3 text-emerald-400" />
                        <span>К матчу в списке</span>
                      </button>

                      {/* Alignment modes */}
                      <div className="hidden sm:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectorAlignMode('opposite');
                            updateInspectorPosition();
                          }}
                          className={`px-2 py-0.5 rounded-md font-medium transition ${
                            inspectorAlignMode === 'opposite'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Статистика плавно позиционируется строго напротив выбранного матча"
                        >
                          Напротив
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectorAlignMode('sticky');
                          }}
                          className={`px-2 py-0.5 rounded-md font-medium transition ${
                            inspectorAlignMode === 'sticky'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Закрепить панель при прокрутке экрана"
                        >
                          Sticky
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectorAlignMode('top');
                            setInspectorOffset(0);
                          }}
                          className={`px-2 py-0.5 rounded-md font-medium transition ${
                            inspectorAlignMode === 'top'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Зафиксировать вверху"
                        >
                          Вверху
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Title Bar */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-base">{selectedMatch.countryCode}</span>
                        <span className="font-semibold text-slate-200">{selectedMatch.country}</span>
                        <span>•</span>
                        <span>{selectedMatch.league}</span>
                      </div>
                      <h2 className="text-2xl font-black text-white mt-1">
                        {selectedMatch.homeTeam} <span className="text-emerald-400">{selectedMatch.score[0]} : {selectedMatch.score[1]}</span> {selectedMatch.awayTeam}
                      </h2>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          id="match-inspector-create-filter-btn"
                          onClick={() => handleCreateFilterFromMatch(selectedMatch)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 hover:border-emerald-500/50 transition active:scale-[0.98]"
                          title="Создать собственный фильтр по текущим показателям этого матча"
                        >
                          <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Создать фильтр по матчу</span>
                        </button>

                        <button
                          id="match-inspector-ai-btn"
                          onClick={() => handleOpenAIAnalyst(selectedMatch)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/60 border border-indigo-400/30 transition hover:scale-[1.02] active:scale-[0.98]"
                          title="Запустить глубокий AI-анализ матча и расчет вероятностей"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-indigo-200 animate-pulse" />
                          <span>AI-Аналитик в 1 клик</span>
                        </button>

                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          {selectedMatch.minute} МИНУТА
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400">Синхронизация: {selectedMatch.source} API</div>
                    </div>
                  </div>

                  {/* Last Match Event */}
                  {selectedMatch.lastEvent && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Последнее ключевое событие</div>
                        <div className="text-xs text-slate-200 font-medium">{selectedMatch.lastEvent}</div>
                      </div>
                    </div>
                  )}

                  {/* Algorithmic Pressure & Filter Intelligence Inspector */}
                  {(() => {
                    const analysis = calculatePressureAnalysis(selectedMatch);
                    const userLaunchedFilters = filters.filter(
                      (f) => f.enabled && (!f.userId || f.userId === currentUser?.id)
                    );
                    const matchingRules = userLaunchedFilters.filter(
                      (f) => evaluateFilterRule(selectedMatch, f).matches
                    );
                    const evaluatedRules = userLaunchedFilters.map((rule) => ({
                      rule,
                      result: evaluateFilterRule(selectedMatch, rule),
                    }));

                    return (
                      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-emerald-400" />
                            Алгоритмический анализ давления и вероятность гола
                          </h3>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              analysis.goalProbability === 'EXTREME'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : analysis.goalProbability === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : analysis.goalProbability === 'MEDIUM'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            Вероятность гола: {analysis.goalProbability} ({analysis.pressureIndex}/100)
                          </span>
                        </div>

                        {/* Pressure progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Индекс штурма (Pressure Index)</span>
                            <span className="font-bold text-white">{analysis.pressureIndex}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${analysis.pressureIndex}%` }}
                              className={`h-full transition-all duration-500 ${
                                analysis.pressureIndex >= 75
                                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                  : analysis.pressureIndex >= 50
                                  ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Reasons grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {analysis.reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              <span className="text-[11px]">{reason}</span>
                            </div>
                          ))}
                        </div>

                        {/* Evaluated Rules Matrix */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                            <span>Проверка запущенных фильтров для этого матча:</span>
                            <span className="text-emerald-400 font-mono font-bold">
                              {matchingRules.length} из {userLaunchedFilters.length} совпало
                            </span>
                          </div>
                          {userLaunchedFilters.length === 0 ? (
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1.5">
                              <p className="text-xs text-slate-400 font-medium">Нет запущенных фильтров</p>
                              <p className="text-[11px] text-slate-500">
                                Перейдите во вкладку «Фильтры» и нажмите «Запустить» на нужных стратегиях.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {evaluatedRules.map(({ rule, result }) => (
                              <div
                                key={rule.id}
                                className={`p-2 rounded-lg border flex items-center justify-between text-xs transition ${
                                  result.matches
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                                    : 'bg-slate-900/40 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {result.matches ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full border border-slate-700 shrink-0 flex items-center justify-center text-[9px] text-slate-600">
                                      ✕
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-white text-[12px]">{rule.name}</div>
                                    {rule.targetMarket && (
                                      <div className="text-[10px] text-amber-400 font-mono">🎯 Исход: {rule.targetMarket}</div>
                                    )}
                                    {!result.matches && result.unmetCriteria && result.unmetCriteria.length > 0 && (
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        Не выполнено: {result.unmetCriteria[0]}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingFilter(rule);
                                      setIsFilterModalOpen(true);
                                    }}
                                    className="p-1 rounded bg-slate-850 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700/60 transition"
                                    title="Настроить параметры этого фильтра"
                                  >
                                    <Sliders className="h-3 w-3 text-emerald-400" />
                                  </button>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                    result.matches ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {result.matches ? 'СИГНАЛ' : 'НЕТ'}
                                  </span>
                                </div>
                              </div>
                            ))}
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setEditingFilter(null);
                              setIsFilterModalOpen(true);
                            }}
                            className="w-full mt-2.5 py-1.5 px-3 rounded-lg border border-dashed border-slate-700 hover:border-emerald-500/80 text-slate-400 hover:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-slate-900/40 hover:bg-slate-900"
                          >
                            <Plus className="h-3.5 w-3.5 text-emerald-400" />
                            Создать новый фильтр под этот матч
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Stat Comparison Bars */}
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-400" />
                      Статистика матча в реальном времени
                    </h3>

                    {/* Possession */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{selectedMatch.stats.possession[0]}%</span>
                        <span className="text-slate-400 font-normal">Владение мячом</span>
                        <span>{selectedMatch.stats.possession[1]}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${selectedMatch.stats.possession[0]}%` }} className="bg-emerald-500" />
                        <div style={{ width: `${selectedMatch.stats.possession[1]}%` }} className="bg-blue-500" />
                      </div>
                    </div>

                    {/* Dangerous Attacks */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-emerald-400 font-bold">{selectedMatch.stats.dangerousAttacks[0]}</span>
                        <span className="text-slate-400 font-normal">Опасные атаки (DA)</span>
                        <span className="text-blue-400 font-bold">{selectedMatch.stats.dangerousAttacks[1]}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.dangerousAttacks[0] /
                                (selectedMatch.stats.dangerousAttacks[0] + selectedMatch.stats.dangerousAttacks[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-emerald-500"
                        />
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.dangerousAttacks[1] /
                                (selectedMatch.stats.dangerousAttacks[0] + selectedMatch.stats.dangerousAttacks[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-blue-500"
                        />
                      </div>
                    </div>

                    {/* Shots on Target */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{selectedMatch.stats.shotsOnTarget[0]}</span>
                        <span className="text-slate-400 font-normal">Удары в створ</span>
                        <span>{selectedMatch.stats.shotsOnTarget[1]}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.shotsOnTarget[0] /
                                (selectedMatch.stats.shotsOnTarget[0] + selectedMatch.stats.shotsOnTarget[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-emerald-500"
                        />
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.shotsOnTarget[1] /
                                (selectedMatch.stats.shotsOnTarget[0] + selectedMatch.stats.shotsOnTarget[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-blue-500"
                        />
                      </div>
                    </div>

                    {/* Corners */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{selectedMatch.stats.corners[0]}</span>
                        <span className="text-slate-400 font-normal">Угловые</span>
                        <span>{selectedMatch.stats.corners[1]}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.corners[0] /
                                (selectedMatch.stats.corners[0] + selectedMatch.stats.corners[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-emerald-500"
                        />
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.corners[1] /
                                (selectedMatch.stats.corners[0] + selectedMatch.stats.corners[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-blue-500"
                        />
                      </div>
                    </div>

                    {/* xG Model */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="font-mono">{selectedMatch.stats.xg[0]}</span>
                        <span className="text-slate-400 font-normal">Ожидаемые голы (xG)</span>
                        <span className="font-mono">{selectedMatch.stats.xg[1]}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.xg[0] /
                                (selectedMatch.stats.xg[0] + selectedMatch.stats.xg[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-emerald-400"
                        />
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.xg[1] /
                                (selectedMatch.stats.xg[0] + selectedMatch.stats.xg[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-blue-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Odds */}
                  <div className="border-t border-slate-800 pt-4">
                    <div className="text-xs text-slate-400 mb-2 font-medium">Коэффициенты (1X2 & ТБ 2.5)</div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500">П1 ({selectedMatch.homeTeam})</div>
                        <div className="text-sm font-bold font-mono text-emerald-400">{selectedMatch.odds.home}</div>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500">Ничья (X)</div>
                        <div className="text-sm font-bold font-mono text-white">{selectedMatch.odds.draw}</div>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500">П2 ({selectedMatch.awayTeam})</div>
                        <div className="text-sm font-bold font-mono text-blue-400">{selectedMatch.odds.away}</div>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500">ТБ 2.5</div>
                        <div className="text-sm font-bold font-mono text-amber-400">{selectedMatch.odds.over25}</div>
                      </div>
                    </div>

                    {/* Dropping Odds & Money Flow (Smart Money Steam Moves) */}
                    {selectedMatch.oddsDrop && (
                      <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                            <TrendingDown className="h-4 w-4 text-amber-400" />
                            Прогруз линии / Smart Money (Steam Move)
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {selectedMatch.oddsDrop.bookmaker || 'Биржа Betfair / Pinnacle'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Исход с прогрузом</div>
                            <div className="text-xs font-bold text-white mt-0.5 truncate">{selectedMatch.oddsDrop.marketName}</div>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Падение кэфа</div>
                            <div className="text-xs font-bold text-rose-400 font-mono mt-0.5">
                              -{selectedMatch.oddsDrop.dropPercent}% ({selectedMatch.oddsDrop.initialOdds} → {selectedMatch.oddsDrop.currentOdds})
                            </div>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Доля денег в рынке</div>
                            <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                              {selectedMatch.oddsDrop.moneyVolumePercent}% пула
                            </div>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Объем ставок</div>
                            <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                              {selectedMatch.oddsDrop.moneyVolumeAmountEur
                                ? `€${selectedMatch.oddsDrop.moneyVolumeAmountEur.toLocaleString('ru-RU')}`
                                : 'Крупный пул'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Обнаружено на {selectedMatch.oddsDrop.detectedAtMinute || selectedMatch.minute}' мин</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFilter({
                                id: `custom-steam-${Date.now()}`,
                                name: `📉 Прогруз на ${selectedMatch.oddsDrop?.marketName}`,
                                description: `Отслеживание падения кэфа от ${selectedMatch.oddsDrop?.dropPercent}% при прогрузе денег от ${selectedMatch.oddsDrop?.moneyVolumePercent}%`,
                                category: 'odds_drop',
                                ruleType: 'LIVE',
                                enabled: true,
                                minMinute: 1,
                                maxMinute: 90,
                                scoreCondition: 'ANY',
                                minOddsDropPercent: selectedMatch.oddsDrop?.dropPercent,
                                minMoneyVolumePercent: selectedMatch.oddsDrop?.moneyVolumePercent,
                                oddsDropMarket: selectedMatch.oddsDrop?.market,
                                targetMarket: selectedMatch.oddsDrop?.marketName,
                                telegramEnabled: true,
                                color: 'amber',
                              });
                              setIsFilterModalOpen(true);
                            }}
                            className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1"
                          >
                            Создать фильтр под этот прогруз →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Simulation & Live Match Testing Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-amber-400" />
                          Тестирование сигналов и исходов (Live):
                        </span>
                        <span className="font-mono text-slate-500">
                          {selectedMatch.status === 'PREMATCH'
                            ? `Прематч: ${selectedMatch.startsInMinutes ?? 60} мин до старта`
                            : selectedMatch.status === 'FT'
                            ? 'Матч завершен (FT)'
                            : `${selectedMatch.minute}' мин`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setMatches((prev) =>
                              prev.map((m) =>
                                m.id === selectedMatch.id
                                  ? {
                                      ...m,
                                      status: 'PREMATCH',
                                      minute: 0,
                                      startsInMinutes: 60,
                                      startTime: '21:00',
                                      lastEvent: 'До матча: 1 час (21:00). Запущен предматчевый отбор за 60 мин',
                                    }
                                  : m
                              )
                            );
                          }}
                          className="px-2 py-1.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 flex items-center justify-center gap-1 font-medium transition"
                          title="Установить ровно 1 час до матча для проверки предматчевого триггера и поднятия в верх списка"
                        >
                          ⏱️ За 1 час (60м)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMatches((prev) =>
                              prev.map((m) =>
                                m.id === selectedMatch.id
                                  ? {
                                      ...m,
                                      status: 'PREMATCH',
                                      minute: 0,
                                      startsInMinutes: 180,
                                      startTime: '23:00',
                                      lastEvent: 'До матча: 3 часа. Ожидает окна за 1 час до начала',
                                    }
                                  : m
                              )
                            );
                          }}
                          className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 flex items-center justify-center gap-1 font-medium transition"
                          title="Установить за 3 часа (вне 1-часового окна)"
                        >
                          ⏳ За 3 часа (180м)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMatches((prev) =>
                              prev.map((m) =>
                                m.id === selectedMatch.id
                                  ? {
                                      ...m,
                                      status: 'LIVE',
                                      minute: 75,
                                      lastEvent: "75' Live мониторинг второго тайма",
                                    }
                                  : m
                              )
                            );
                          }}
                          className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 flex items-center justify-center gap-1 font-medium transition"
                          title="Вернуть в Live 75' (проверка паттерна быстрых голов)"
                        >
                          🔄 В лайв (75')
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMatches((prev) =>
                              prev.map((m) =>
                                m.id === selectedMatch.id
                                  ? { ...m, score: [m.score[0] + 1, m.score[1]] as [number, number] }
                                  : m
                              )
                            );
                          }}
                          className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 font-medium transition"
                          title="Добавить гол хозяевам"
                        >
                          ⚽ Гол 1 (+1)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMatches((prev) =>
                              prev.map((m) =>
                                m.id === selectedMatch.id
                                  ? { ...m, score: [m.score[0], m.score[1] + 1] as [number, number] }
                                  : m
                              )
                            );
                          }}
                          className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 font-medium transition"
                          title="Добавить гол гостям"
                        >
                          ⚽ Гол 2 (+1)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMatches((prev) =>
                              prev.map((m) =>
                                m.id === selectedMatch.id
                                  ? { ...m, status: 'FT', minute: 90 }
                                  : m
                              )
                            );
                          }}
                          className="px-2 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1 font-medium transition"
                          title="Завершить матч для проверки переписывания сообщения"
                        >
                          🏁 Завершить (FT)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMatches((prev) =>
                              prev.map((m) => {
                                if (m.id !== selectedMatch.id) return m;
                                return {
                                  ...m,
                                  status: 'LIVE',
                                  minute: 70,
                                  score: [1, 0] as [number, number],
                                  odds: {
                                    ...m.odds,
                                    over25: 1.85,
                                  },
                                  history: {
                                    ...(m.history || {}),
                                    predictedIpt: 2.85,
                                  },
                                  lastEvent: "70' Моделирование Стратегии 7: 70 мин, счет 1:0 (тотал ≤ 2), IPT 2.85",
                                };
                              })
                            );
                          }}
                          className="px-2 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1 font-medium transition"
                          title="Установить параметры для срабатывания Стратегии 7 (70', тотал ≤ 2, IPT > 2.70)"
                        >
                          📐 Тест Стратегии 7 (70')
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMatches((prev) =>
                              prev.map((m) => {
                                if (m.id !== selectedMatch.id) return m;
                                const initO = m.initialOdds || {
                                  home: 2.10,
                                  draw: 3.40,
                                  away: 4.80,
                                  over25: 1.95,
                                  under25: 1.85,
                                  btts: 1.75,
                                };
                                const currO = {
                                  ...m.odds,
                                  home: 1.62,
                                  over25: 1.58,
                                };
                                const oddsDrop: OddsDropData = {
                                  market: 'HOME',
                                  marketName: `П1 (${m.homeTeam})`,
                                  initialOdds: 2.10,
                                  currentOdds: 1.62,
                                  dropPercent: 22.8,
                                  moneyVolumePercent: 78,
                                  moneyVolumeAmountEur: 185000,
                                  bookmaker: 'Betfair Exchange / Pinnacle',
                                  detectedAtMinute: m.minute || 45,
                                };
                                const marketFlows: OddsDropData[] = [
                                  oddsDrop,
                                  {
                                    market: 'OVER',
                                    marketName: 'ТБ 2.5',
                                    initialOdds: 1.95,
                                    currentOdds: 1.58,
                                    dropPercent: 18.9,
                                    moneyVolumePercent: 72,
                                    moneyVolumeAmountEur: 120000,
                                    bookmaker: 'Pinnacle',
                                    detectedAtMinute: m.minute || 45,
                                  },
                                ];
                                return {
                                  ...m,
                                  initialOdds: initO,
                                  odds: currO,
                                  oddsDrop,
                                  marketFlows,
                                  lastEvent: "📉 Зафиксирован резкий прогруз линии: кэф на П1 упал с 2.10 до 1.62 (-22.8%, 78% денег)",
                                };
                              })
                            );
                          }}
                          className="px-2 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1 font-medium transition"
                          title="Смоделировать прогруз линии и Smart Money (падение кэфа -22.8%, 78% пула рынка)"
                        >
                          📉 Тест Прогруза (-22%)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Filter Engine (Expanded Management Center) */}
        {activeTab === 'filters' && (
          <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-emerald-400" />
                  Алгоритмические стратегии и фильтры сигналов
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Продвинутый конструктор правил для отслеживания аномалий, анализа давления и мгновенных алертов
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFilterViewMode('matrix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      filterViewMode === 'matrix'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Матрица сканера</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      filterViewMode === 'cards'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Карточки ({filters.length})</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setEditingFilter(null);
                    setIsFilterModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Создать алгоритм
                </button>

                <button
                  onClick={handleResetFilters}
                  title="Восстановить заводские 8 алгоритмов"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                  Сброс пресетов
                </button>

                <button
                  onClick={handleExportFiltersJson}
                  title="Экспортировать правила в JSON"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  JSON Экспорт
                </button>

                <label
                  title="Импортировать правила из JSON"
                  className="cursor-pointer px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-400" />
                  JSON Импорт
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFiltersJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {filterViewMode === 'matrix' ? (
              <ScannerMatrixFilterView
                filters={filters}
                onSaveFilter={handleSaveFilter}
                onDeleteFilter={handleDeleteFilter}
                isMonitoringActive={isMonitoringActive}
                onToggleMonitoring={() => setIsMonitoringActive(!isMonitoringActive)}
                userBots={currentUser?.telegramBots}
                currentUserId={currentUser?.id}
                liveMatches={matches}
              />
            ) : (
              <>
                {/* Quick Strategy Templates Banner */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Быстрый старт: популярные шаблоны алгоритмов для настройки
                </span>
                <span className="text-[11px] text-slate-500">
                  Кликните по шаблону для открытия конструктора с готовыми параметрами
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    name: '🔥 Штурм (75-90\')',
                    desc: 'Навал в концовке',
                    preset: {
                      name: '🔥 Штурм в концовке (75-90\')',
                      description: 'Интенсивный навал в заключительные 15 минут матча при высокой активности',
                      category: 'pressure' as FilterCategory,
                      minMinute: 75,
                      maxMinute: 90,
                      scoreCondition: 'ANY' as ScoreCondition,
                      minDangerousAttacksDiff: 18,
                      minDangerousAttacksTotal: 45,
                      minTotalShots: 10,
                      minShotsOnTargetTotal: 4,
                      minTotalCorners: 6,
                      minPressureIndex: 65,
                      targetMarket: 'ТБ 0.5 во 2-м тайме / Гол в концовке',
                      color: 'rose',
                    },
                  },
                  {
                    name: '⚽ 0:0 Доминация',
                    desc: 'Сухой фаворит',
                    preset: {
                      name: '⚽ Сухое доминирование при 0:0',
                      description: 'Матч без голов во 2-м тайме, где одна из команд создала огромный перевес',
                      category: 'goals' as FilterCategory,
                      minMinute: 60,
                      maxMinute: 85,
                      scoreCondition: '0-0' as ScoreCondition,
                      minDangerousAttacksDiff: 22,
                      minTotalShots: 8,
                      minShotsOnTargetTotal: 4,
                      minXgTotal: 1.2,
                      minPressureIndex: 60,
                      targetMarket: 'ТБ 0.5 в матче / Победа фаворита',
                      color: 'emerald',
                    },
                  },
                  {
                    name: '🚩 Осада угловыми',
                    desc: 'Угловые ТБ',
                    preset: {
                      name: '🚩 Серия угловых и осада ворот',
                      description: 'Частые навесы, рикошеты и шквал стандартов у ворот соперника',
                      category: 'corners' as FilterCategory,
                      minMinute: 65,
                      maxMinute: 90,
                      scoreCondition: 'ANY' as ScoreCondition,
                      minDangerousAttacksDiff: 15,
                      minTotalCorners: 8,
                      minCornersDiff: 3,
                      minTotalShots: 10,
                      minPressureIndex: 55,
                      targetMarket: 'Тотал больше угловых',
                      color: 'blue',
                    },
                  },
                  {
                    name: '🎯 Камбэк фаворита',
                    desc: '1X / Фора 0',
                    preset: {
                      name: '🎯 Камбэк уступающего фаворита',
                      description: 'Фаворит уступает в 1 мяч при колоссальном перевесе по статистике',
                      category: 'comeback' as FilterCategory,
                      minMinute: 55,
                      maxMinute: 88,
                      scoreCondition: 'AWAY_LEAD' as ScoreCondition,
                      minDangerousAttacksDiff: 24,
                      minShotsOnTargetTotal: 5,
                      minPossessionDiff: 15,
                      minPressureIndex: 70,
                      targetMarket: '1X (двойной шанс) / Гол Хозяев',
                      color: 'amber',
                    },
                  },
                  {
                    name: '⏱️ 1-й тайм (HT Over)',
                    desc: 'Гол до перерыва',
                    preset: {
                      name: '⏱️ Открытая игра в 1-м тайме (HT Over)',
                      description: 'Высокий темп опасных атак и ударов в створ до 45-й минуты',
                      category: 'halftime' as FilterCategory,
                      minMinute: 25,
                      maxMinute: 45,
                      scoreCondition: '0-0' as ScoreCondition,
                      minDangerousAttacksTotal: 40,
                      minTotalShots: 7,
                      minShotsOnTargetTotal: 3,
                      minPressureIndex: 50,
                      targetMarket: 'ТБ 0.5 в 1-м тайме',
                      color: 'cyan',
                    },
                  },
                  {
                    name: '🟥 В большинстве',
                    desc: '11 vs 10',
                    preset: {
                      name: '🟥 Прессинг в численном большинстве',
                      description: 'Команда играет в большинстве после удаления и наращивает давление',
                      category: 'cards' as FilterCategory,
                      minMinute: 45,
                      maxMinute: 90,
                      scoreCondition: 'DRAW' as ScoreCondition,
                      redCardCondition: 'HAS_RED_CARD' as const,
                      minDangerousAttacksDiff: 15,
                      minPressureIndex: 60,
                      targetMarket: 'Победа команды в большинстве',
                      color: 'purple',
                    },
                  },
                  {
                    name: '📉 Smart Money / Прогруз',
                    desc: 'Падение кэфа ≥15%, пул ≥70%',
                    preset: {
                      name: '📉 Smart Money: Падение кэфа ≥15% (Деньги ≥70%)',
                      description: 'Фиксация крупного денежного прогруза на исход: резкое падение кэфа от 15% при доле денег от 70%',
                      category: 'odds_drop' as FilterCategory,
                      minMinute: 1,
                      maxMinute: 90,
                      scoreCondition: 'ANY' as ScoreCondition,
                      minOddsDropPercent: 15,
                      minMoneyVolumePercent: 70,
                      oddsDropMarket: 'ANY' as const,
                      targetMarket: 'Исход с прогрузом (Steam Move)',
                      color: 'amber',
                    },
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setEditingFilter({
                        id: `custom-${Date.now()}`,
                        enabled: true,
                        telegramEnabled: true,
                        isPreset: false,
                        ...item.preset,
                      });
                      setIsFilterModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({item.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Filter Controller Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                  filters.filter((f) => f.enabled).length > 0
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-950/40'
                    : 'bg-slate-800/80 border-slate-700 text-slate-500'
                }`}>
                  {filters.filter((f) => f.enabled).length}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">
                      Запущено в мониторинг: {filters.filter((f) => f.enabled).length} из {filters.length} фильтров
                    </span>
                    {filters.filter((f) => f.enabled).length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        СИГНАЛЫ АКТИВНЫ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Остановлены
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Работают и отправляют сигналы только включенные вами фильтры. Выключенные фильтры не создают спама и не присылают уведомлений.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => {
                    setFilters((prev) => prev.map((f) => ({ ...f, enabled: false })));
                  }}
                  disabled={filters.filter((f) => f.enabled).length === 0}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Остановить все активные фильтры"
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  Остановить все ({filters.filter((f) => f.enabled).length})
                </button>

                <button
                  onClick={() => setActiveFilterCategory('active')}
                  className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeFilterCategory === 'active'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-950/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Только запущенные
                </button>
              </div>
            </div>

            {/* Category Filter Chips & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', label: 'Все', icon: '⚡' },
                    { id: 'active', label: 'Запущенные', icon: '🟢' },
                    { id: 'stopped', label: 'Остановленные', icon: '⚪' },
                    { id: 'goals', label: 'Голы', icon: '⚽' },
                    { id: 'corners', label: 'Угловые', icon: '🚩' },
                    { id: 'comeback', label: 'Камбэк', icon: '🎯' },
                    { id: 'halftime', label: '1-й тайм', icon: '⏱️' },
                    { id: 'pressure', label: 'Давление', icon: '🔥' },
                    { id: 'odds_drop', label: 'Прогрузы & Дроп', icon: '📉' },
                    { id: 'cards', label: 'Карточки', icon: '🟥' },
                    { id: 'custom', label: 'Мои фильтры', icon: '🛠️' },
                  ] as Array<{ id: FilterCategory; label: string; icon: string }>
                ).map((cat) => {
                  const count =
                    cat.id === 'all'
                      ? filters.length
                      : cat.id === 'active'
                      ? filters.filter((f) => f.enabled).length
                      : cat.id === 'stopped'
                      ? filters.filter((f) => !f.enabled).length
                      : cat.id === 'custom'
                      ? filters.filter((f) => !f.isPreset).length
                      : filters.filter((f) => f.category === cat.id).length;

                  const isSelected = activeFilterCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveFilterCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search in filters */}
              <div className="relative min-w-[220px]">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={filterSearchQuery}
                  onChange={(e) => setFilterSearchQuery(e.target.value)}
                  placeholder="Поиск по фильтрам и рынкам..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Grid of Strategy Cards */}
            {(() => {
              const filteredList = filters.filter((rule) => {
                const matchCategory =
                  activeFilterCategory === 'all'
                    ? true
                    : activeFilterCategory === 'active'
                    ? rule.enabled
                    : activeFilterCategory === 'stopped'
                    ? !rule.enabled
                    : activeFilterCategory === 'custom'
                    ? !rule.isPreset
                    : rule.category === activeFilterCategory;

                const matchQuery =
                  !filterSearchQuery.trim() ||
                  rule.name.toLowerCase().includes(filterSearchQuery.toLowerCase()) ||
                  rule.description.toLowerCase().includes(filterSearchQuery.toLowerCase()) ||
                  (rule.targetMarket && rule.targetMarket.toLowerCase().includes(filterSearchQuery.toLowerCase()));

                return matchCategory && matchQuery;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                    <Filter className="h-8 w-8 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400">В этой категории или по вашему запросу нет фильтров.</p>
                    <button
                      onClick={() => {
                        setActiveFilterCategory('all');
                        setFilterSearchQuery('');
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                    >
                      Показать все стратегии
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredList.map((filter) => {
                    const matchingLiveMatches = filter.enabled
                      ? matches.filter((m) => evaluateFilterRule(m, filter).matches)
                      : [];
                    const hasLiveMatches = matchingLiveMatches.length > 0;

                    return (
                      <div
                        key={filter.id}
                        className={`bg-slate-900 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                          filter.enabled
                            ? hasLiveMatches
                              ? 'border-emerald-500/70 shadow-lg shadow-emerald-950/30'
                              : 'border-slate-800 hover:border-slate-700'
                            : 'border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {filter.minMinute}' - {filter.maxMinute}'
                              </span>
                              {filter.category && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-emerald-500/20">
                                  {filter.category}
                                </span>
                              )}
                              {filter.isPreset ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  Пресет
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                  Авторский
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() =>
                                setFilters((prev) =>
                                  prev.map((f) => (f.id === filter.id ? { ...f, enabled: !f.enabled } : f))
                                )
                              }
                              className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                                filter.enabled
                                  ? 'bg-emerald-500 text-slate-950 border border-emerald-400 hover:bg-emerald-400 shadow-md shadow-emerald-950/40'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                              }`}
                              title={filter.enabled ? 'Нажмите, чтобы остановить этот фильтр' : 'Нажмите, чтобы запустить этот фильтр в работу'}
                            >
                              {filter.enabled ? (
                                <>
                                  <span className="h-2 w-2 rounded-full bg-slate-950 animate-pulse" />
                                  ЗАПУЩЕН
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                                  ЗАПУСТИТЬ
                                </>
                              )}
                            </button>
                          </div>

                          {/* Rule Title & Target Market */}
                          <div>
                            <h3 className="text-sm font-bold text-white leading-tight">{filter.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{filter.description}</p>
                            {filter.targetMarket && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-medium font-mono">
                                <Target className="h-3 w-3 text-amber-400" />
                                {filter.targetMarket}
                              </div>
                            )}
                          </div>

                          {/* Live match indicator */}
                          <div className="pt-1">
                            {filter.enabled ? (
                              hasLiveMatches ? (
                                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                    Совпадает прямо сейчас ({matchingLiveMatches.length}):
                                  </span>
                                  <span className="font-mono text-white text-[10px]">
                                    {matchingLiveMatches.map((m) => m.homeTeam).join(', ')}
                                  </span>
                                </div>
                              ) : (
                                <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-500 flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  В работе • Ожидание подходящей ситуации в live
                                </div>
                              )
                            ) : (
                              <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                                  Остановлен пользователем
                                </span>
                                <span className="text-slate-600 font-mono">Сигналы отключены</span>
                              </div>
                            )}
                          </div>

                          {/* Conditions Grid */}
                          <div className="pt-2 space-y-1.5 text-xs text-slate-300 font-mono bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                            <div className="flex justify-between border-b border-slate-800/60 pb-1">
                              <span className="text-slate-500 font-sans">Минуты:</span>
                              <span className="font-bold text-sky-300">{filter.minMinute}' – {filter.maxMinute}'</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800/60 pb-1">
                              <span className="text-slate-500 font-sans">Счёт:</span>
                              <span className="font-bold text-slate-200">
                                {filter.scoreCondition === '0-0'
                                  ? '0:0'
                                  : filter.scoreCondition === 'DRAW'
                                  ? 'Любая ничья'
                                  : filter.scoreCondition === 'HOME_LEAD'
                                  ? 'Хозяева ведут'
                                  : filter.scoreCondition === 'AWAY_LEAD'
                                  ? 'Гости ведут'
                                  : filter.scoreCondition === 'ONE_GOAL_DIFF'
                                  ? 'Разница в 1 гол'
                                  : filter.scoreCondition === 'TOTAL_UNDER_25'
                                  ? 'ТБ 2.5 не пробит (≤ 2)'
                                  : filter.scoreCondition === 'TOTAL_UNDER_2'
                                  ? 'ТМ 2.5 (≤ 2)'
                                  : filter.scoreCondition === 'TOTAL_OVER_2'
                                  ? 'ТБ 2.5'
                                  : 'Любой'}
                              </span>
                            </div>

                            {filter.minDangerousAttacksDiff && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Разница оп. атак:</span>
                                <span>≥ {filter.minDangerousAttacksDiff}</span>
                              </div>
                            )}
                            {filter.minTotalShots && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Всего ударов:</span>
                                <span>≥ {filter.minTotalShots}</span>
                              </div>
                            )}
                            {filter.minShotsOnTargetTotal && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Удары в створ:</span>
                                <span>≥ {filter.minShotsOnTargetTotal}</span>
                              </div>
                            )}
                            {filter.minTotalCorners && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Всего угловых:</span>
                                <span>≥ {filter.minTotalCorners}</span>
                              </div>
                            )}
                            {filter.minPressureIndex && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Индекс давления:</span>
                                <span className="text-rose-400 font-bold">≥ {filter.minPressureIndex}%</span>
                              </div>
                            )}
                            {filter.minXgTotal && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Суммарный xG:</span>
                                <span>≥ {filter.minXgTotal}</span>
                              </div>
                            )}
                            {filter.minXgOverScoreDiff && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">xG перевес над счётом:</span>
                                <span className="text-amber-400 font-bold">≥ +{filter.minXgOverScoreDiff.toFixed(1)}</span>
                              </div>
                            )}
                            {filter.minAttacksDiff && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Разница атак:</span>
                                <span>≥ {filter.minAttacksDiff}</span>
                              </div>
                            )}
                            {filter.minShotsDiff && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Разница ударов:</span>
                                <span>≥ {filter.minShotsDiff}</span>
                              </div>
                            )}
                            {filter.maxOddsFavorite && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Кэф фаворита:</span>
                                <span className="text-emerald-400 font-bold">≤ {filter.maxOddsFavorite.toFixed(2)}</span>
                              </div>
                            )}
                            {filter.minOddsDropPercent && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1 bg-amber-500/10 -mx-1 px-1 rounded">
                                <span className="text-amber-400 font-sans flex items-center gap-1">
                                  <TrendingDown className="h-3 w-3" />
                                  Падение кэфа:
                                </span>
                                <span className="text-rose-400 font-bold">≥ {filter.minOddsDropPercent}%</span>
                              </div>
                            )}
                            {filter.minMoneyVolumePercent && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1 bg-amber-500/10 -mx-1 px-1 rounded">
                                <span className="text-amber-400 font-sans">Прогруз денег:</span>
                                <span className="text-amber-300 font-bold">≥ {filter.minMoneyVolumePercent}% пула</span>
                              </div>
                            )}
                            {filter.minMoneyLoadAmount && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Сумма прогруза:</span>
                                <span className="text-emerald-400 font-bold">≥ €{filter.minMoneyLoadAmount.toLocaleString('ru-RU')}</span>
                              </div>
                            )}
                            {filter.oddsDropMarket && filter.oddsDropMarket !== 'ANY' && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Целевой исход:</span>
                                <span className="text-sky-300 font-bold">{filter.oddsDropMarket}</span>
                              </div>
                            )}
                            {(filter.minOddsOver25 || filter.maxOddsOver25) && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Кэф ТБ 2.5:</span>
                                <span className="text-emerald-400">
                                  {filter.minOddsOver25 ? `${filter.minOddsOver25.toFixed(2)} – ` : '≤ '}
                                  {filter.maxOddsOver25 ? filter.maxOddsOver25.toFixed(2) : ''}
                                </span>
                              </div>
                            )}
                            {(filter.minOddsBtts || filter.maxOddsBtts) && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Кэф ОЗ:</span>
                                <span className="text-sky-400">
                                  {filter.minOddsBtts ? `${filter.minOddsBtts.toFixed(2)} – ` : '≤ '}
                                  {filter.maxOddsBtts ? filter.maxOddsBtts.toFixed(2) : ''}
                                </span>
                              </div>
                            )}
                            {filter.minModelIpt && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Модель IPT:</span>
                                <span className="text-amber-400 font-bold">&gt; {filter.minModelIpt}</span>
                              </div>
                            )}
                            {filter.maxTotalGoals !== undefined && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Макс. тотал:</span>
                                <span className="text-amber-300 font-bold">≤ {filter.maxTotalGoals} (ТБ {filter.maxTotalGoals}.5 не пробит)</span>
                              </div>
                            )}
                            {filter.excludeYouthAndWomen && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Лиги:</span>
                                <span className="text-purple-400">Без молодежек/женских</span>
                              </div>
                            )}
                            {filter.minOver25Streak && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Серия ТБ 2.5:</span>
                                <span className="text-purple-300 font-bold">≥ {filter.minOver25Streak} матчей</span>
                              </div>
                            )}
                            {filter.redCardCondition === 'NO_RED_CARDS' && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Составы:</span>
                                <span className="text-emerald-400">Строго 11 vs 11</span>
                              </div>
                            )}
                            {filter.redCardCondition === 'HAS_RED_CARD' && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Красная карточка:</span>
                                <span className="text-rose-400 font-bold">Обязательно (10 vs 11)</span>
                              </div>
                            )}
                            {filter.requireGuestTwoQuickGoals1H && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Паттерн:</span>
                                <span className="text-amber-400 font-bold">2 быстрых гола в 1Т</span>
                              </div>
                            )}
                            {filter.requireNoGoalsSinceQuickGoals && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Сигнал на 75':</span>
                                <span className="text-emerald-400 font-bold">Строго без голов после них</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Per-Filter Telegram Bot Assignment */}
                        <div className="pt-2.5 pb-1 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Bot className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="text-[11px] font-medium">Бот:</span>
                          </div>
                          <select
                            value={filter.customBotToken ? 'custom' : (filter.botId || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFilters((prev) =>
                                prev.map((f) =>
                                  f.id === filter.id
                                    ? {
                                        ...f,
                                        botId: val === 'custom' ? undefined : (val || undefined),
                                        customBotToken: val === 'custom' ? (f.customBotToken || '') : undefined,
                                        customChatId: val === 'custom' ? (f.customChatId || '') : undefined,
                                      }
                                    : f
                                )
                              );
                            }}
                            className="bg-slate-950 border border-slate-700 hover:border-cyan-500 rounded-lg px-2 py-1 text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-500 max-w-[170px] truncate font-medium"
                          >
                            <option value="">🤖 По умолчанию</option>
                            {currentUser.telegramBots.map((bot) => (
                              <option key={bot.id} value={bot.id}>
                                🤖 {bot.name}
                              </option>
                            ))}
                            {filter.customBotToken && <option value="custom">⚙️ Кастомный бот</option>}
                          </select>
                        </div>

                        {/* Card Controls Footer */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                          {/* Telegram Switch */}
                          <div className="flex items-center gap-1.5">
                            <Send className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-slate-400">Telegram:</span>
                            <button
                              onClick={() =>
                                setFilters((prev) =>
                                  prev.map((f) => (f.id === filter.id ? { ...f, telegramEnabled: !f.telegramEnabled } : f))
                                )
                              }
                              className={`font-semibold ml-1 ${
                                filter.telegramEnabled ? 'text-emerald-400' : 'text-slate-500'
                              }`}
                            >
                              {filter.telegramEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                            </button>
                          </div>

                          {/* Edit / Clone / Delete buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingFilter(filter);
                                setIsFilterModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs flex items-center gap-1 border border-slate-700 hover:border-emerald-500/40 transition"
                              title="Настроить критерии фильтра"
                            >
                              <Sliders className="h-3 w-3 text-emerald-400" />
                              <span>Настроить</span>
                            </button>

                            <button
                              onClick={() => handleDuplicateFilter(filter)}
                              title="Дублировать фильтр"
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Удалить фильтр «${filter.name}»?`)) {
                                  handleDeleteFilter(filter.id);
                                }
                              }}
                              title="Удалить фильтр"
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
              </>
            )}
          </div>
        )}

        {/* Tab 3: Signal Feed & Real-time Tracker */}
        {activeTab === 'signals' && (() => {
          const updateSignalOutcome = (signalId: string, outcome: SignalOutcome) => {
            setSignals((prev) =>
              prev.map((s) => {
                if (s.id !== signalId) return s;
                const stake = s.stake || 1000;
                const profit =
                  outcome === 'WIN'
                    ? Number(((s.odds - 1) * stake).toFixed(2))
                    : outcome === 'LOSS'
                    ? -stake
                    : 0;
                return {
                  ...s,
                  outcome,
                  profit,
                  resolvedAt: new Date().toLocaleTimeString('ru-RU'),
                  resolutionNote:
                    outcome === 'WIN'
                      ? 'Ставка рассчитана как выигрышная'
                      : outcome === 'LOSS'
                      ? 'Ставка не зашла'
                      : outcome === 'REFUND'
                      ? 'Возврат ставки'
                      : 'В ожидании расчета',
                };
              })
            );
          };

          const totalCount = signals.length;
          const winsCount = signals.filter((s) => s.outcome === 'WIN').length;
          const lossesCount = signals.filter((s) => s.outcome === 'LOSS').length;
          const pendingCount = signals.filter((s) => s.outcome === 'PENDING').length;
          const refundsCount = signals.filter((s) => s.outcome === 'REFUND').length;
          const resolvedCount = winsCount + lossesCount;
          const winRate = resolvedCount > 0 ? Number(((winsCount / resolvedCount) * 100).toFixed(1)) : 0;
          const totalProfit = signals.reduce((acc, s) => acc + (s.profit || 0), 0);
          const totalStaked = resolvedCount * 1000;
          const roi = totalStaked > 0 ? Number(((totalProfit / totalStaked) * 100).toFixed(1)) : 0;

          const filteredSignalsList = signals.filter((sig) => {
            const matchesOutcome =
              signalOutcomeFilter === 'ALL'
                ? true
                : sig.outcome === signalOutcomeFilter;
            const matchesSearch =
              !signalSearchQuery.trim() ||
              sig.matchName.toLowerCase().includes(signalSearchQuery.toLowerCase()) ||
              sig.ruleName.toLowerCase().includes(signalSearchQuery.toLowerCase()) ||
              sig.league.toLowerCase().includes(signalSearchQuery.toLowerCase());
            return matchesOutcome && matchesSearch;
          });

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-400" />
                      Трекер проходимости сигналов (Live Win Rate & ROI)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Учет результатов ставок, проходимость стратегий в реальном времени и экспорт отчетов
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSignalsViewMode('table')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          signalsViewMode === 'table'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <TableProperties className="h-3.5 w-3.5" />
                        <span>Таблица сканера</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignalsViewMode('cards')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          signalsViewMode === 'cards'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Target className="h-3.5 w-3.5" />
                        <span>Карточки Win Rate & ROI</span>
                      </button>
                    </div>

                    <button
                      onClick={handleExportSignalsCsv}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                      Экспорт в CSV
                    </button>
                    {signals.length > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm('Очистить всю историю сигналов текущей сессии?')) {
                            setSignals([]);
                          }
                        }}
                        className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-900 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Очистить
                      </button>
                    )}
                  </div>
                </div>

                {signalsViewMode === 'table' ? (
                  <ScannerSignalsTableView
                    signals={signals}
                    matches={matches}
                    isMonitoringActive={isMonitoringActive}
                    onToggleMonitoring={() => setIsMonitoringActive((prev) => !prev)}
                    onClearSignals={() => {
                      if (window.confirm('Очистить всю историю сигналов текущей сессии?')) {
                        setSignals([]);
                      }
                    }}
                    onOpenAIAnalyst={(match) => {
                      setSelectedMatchId(match.id);
                      handleOpenAIAnalyst(match);
                    }}
                    onSelectMatch={(match) => {
                      handleNavigateToMatchFromSignal(match.id, `${match.homeTeam} vs ${match.awayTeam}`);
                    }}
                    onNavigateToMatch={(matchId, matchName, sig) => {
                      handleNavigateToMatchFromSignal(matchId, matchName, sig);
                    }}
                    onDeleteSignal={(id) => {
                      setSignals((prev) => prev.filter((s) => s.id !== id));
                    }}
                    onUpdateOutcome={updateSignalOutcome}
                    onExportCsv={handleExportSignalsCsv}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Tracker KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400">Проходимость (Win Rate)</div>
                    <div className="text-2xl font-bold font-mono mt-1 text-white">
                      <span
                        className={
                          winRate >= 65
                            ? 'text-emerald-400'
                            : winRate >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {winRate}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {winsCount} зашло / {lossesCount} не зашло
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400">Чистый профит (PnL)</div>
                    <div className="text-2xl font-bold font-mono mt-1">
                      <span className={totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {totalProfit >= 0 ? `+${totalProfit.toLocaleString('ru-RU')}` : totalProfit.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {totalProfit >= 0 ? '+' : ''}{(totalProfit / 1000).toFixed(2)} флетов (флет 1 000 ₽)
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400">Доходность (ROI)</div>
                    <div className="text-2xl font-bold font-mono mt-1">
                      <span className={roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {roi >= 0 ? `+${roi}%` : `${roi}%`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Оборот: {(resolvedCount * 1000).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400">Всего сигналов</div>
                    <div className="text-2xl font-bold font-mono mt-1 text-white">
                      {totalCount}
                      <span className="text-xs font-normal text-slate-500 ml-1.5 font-sans">
                        ({pendingCount} в игре)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {refundsCount > 0 ? `${refundsCount} возвратов • ` : ''}Авто-фиксация
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setSignalOutcomeFilter('ALL')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        signalOutcomeFilter === 'ALL'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Все ({totalCount})
                    </button>
                    <button
                      onClick={() => setSignalOutcomeFilter('WIN')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        signalOutcomeFilter === 'WIN'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ✅ Зашли ({winsCount})
                    </button>
                    <button
                      onClick={() => setSignalOutcomeFilter('LOSS')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        signalOutcomeFilter === 'LOSS'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ❌ Не зашли ({lossesCount})
                    </button>
                    <button
                      onClick={() => setSignalOutcomeFilter('PENDING')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        signalOutcomeFilter === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⏳ В игре ({pendingCount})
                    </button>
                  </div>

                  <div className="relative min-w-[220px]">
                    <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Поиск по матчу или стратегии..."
                      value={signalSearchQuery}
                      onChange={(e) => setSignalSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

              {/* Signals Cards Feed */}
              {filteredSignalsList.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
                  <Bell className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400">Нет сигналов по выбранным критериям фильтра.</p>
                  <button
                    onClick={triggerTestSignal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Сгенерировать сигнал
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSignalsList.map((sig) => (
                    <div
                      key={sig.id}
                      onClick={() => handleNavigateToMatchFromSignal(sig.matchId, sig.matchName, sig)}
                      className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 rounded-xl p-4 space-y-3 transition cursor-pointer group shadow-sm hover:shadow-emerald-950/20"
                    >
                      {/* Top row: match minute, country, league, timestamp, telegram */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                            {sig.minute}'
                          </span>
                          <span className="font-semibold text-white group-hover:text-emerald-300 transition">
                            {sig.country} • {sig.league}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {sig.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              const foundMatch = matches.find((m) => m.id === sig.matchId || sig.matchName.includes(m.homeTeam)) || matches[0];
                              handleOpenAIAnalyst(foundMatch);
                            }}
                            className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Открыть AI-анализ этого матча в один клик"
                          >
                            <Sparkles className="h-3 w-3 text-indigo-400" />
                            AI-Разбор
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavigateToMatchFromSignal(sig.matchId, sig.matchName, sig)}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Перейти к лайв-матчу и статистике"
                          >
                            <ExternalLink className="h-3 w-3 text-emerald-400" />
                            <span>К матчу →</span>
                          </button>
                          {sig.botName && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-mono font-medium">
                              <Bot className="h-3 w-3 text-cyan-400" />
                              {sig.botName}
                            </span>
                          )}
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded flex items-center gap-1.5 font-medium border ${
                              sig.sentToTelegram
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <Send className="h-3 w-3" />
                            {sig.telegramStatusText || (sig.sentToTelegram ? 'Отправлено в TG' : 'Локально')}
                          </span>
                        </div>
                      </div>

                      {/* Match title and market */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="group-hover:text-emerald-400 transition flex items-center gap-1.5">
                              {sig.matchName}
                              <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                            </span>
                            <span className="font-mono text-sky-400">({sig.score})</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="text-slate-500">Стратегия:</span>
                            <span className="text-slate-300 font-medium">{sig.ruleName}</span>
                            {sig.marketSuggestion && (
                              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px] font-medium">
                                🎯 {sig.marketSuggestion}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Outcome Marker */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-500">Коэффициент:</div>
                            <div className="font-mono font-bold text-amber-300 text-sm">
                              {sig.odds?.toFixed(2) || '1.85'}
                            </div>
                          </div>

                          <div className="h-7 w-px bg-slate-800 mx-1" />

                          {/* Outcome Status Badge */}
                          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                            <button
                              type="button"
                              onClick={() => updateSignalOutcome(sig.id, 'WIN')}
                              title="Отметить как выигранную ставку"
                              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                                sig.outcome === 'WIN'
                                  ? 'bg-emerald-500 text-slate-950 shadow'
                                  : 'text-slate-400 hover:text-emerald-400'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Зашел
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSignalOutcome(sig.id, 'LOSS')}
                              title="Отметить как проигранную ставку"
                              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                                sig.outcome === 'LOSS'
                                  ? 'bg-rose-500 text-white shadow'
                                  : 'text-slate-400 hover:text-rose-400'
                              }`}
                            >
                              <XCircle className="h-3 w-3" />
                              Минус
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSignalOutcome(sig.id, 'REFUND')}
                              title="Возврат ставки (кэф 1.0)"
                              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                                sig.outcome === 'REFUND'
                                  ? 'bg-slate-700 text-white'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              Возврат
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSignalOutcome(sig.id, 'PENDING')}
                              title="Сбросить статус в ожидание"
                              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                                sig.outcome === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'text-slate-500 hover:text-amber-400'
                              }`}
                            >
                              В игре
                            </button>

                            {sig.telegramMessageId && sig.sentToTelegram && (
                              <button
                                type="button"
                                onClick={() => handleRewriteTelegramMessage(sig)}
                                title={
                                  sig.telegramEdited
                                    ? `Переписано в TG в ${sig.telegramEditedAt || ''}. Нажмите для повторного обновления.`
                                    : 'Переписать это сообщение в Telegram с текущим счётом и результатом матча'
                                }
                                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ml-1 ${
                                  sig.telegramEdited
                                    ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30'
                                    : 'bg-slate-800 hover:bg-sky-900/60 text-slate-300 hover:text-sky-200 border border-slate-700'
                                }`}
                              >
                                <Edit3 className="h-3 w-3 text-sky-400" />
                                {sig.telegramEdited ? 'Обновлено в TG ✏️' : 'Переписать в TG'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Profit and Resolution Note */}
                      <div className="flex items-center justify-between text-xs bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800/80">
                        <div className="text-slate-400 flex flex-wrap items-center gap-2">
                          {sig.resolutionNote ? (
                            <span>📌 {sig.resolutionNote}</span>
                          ) : sig.outcome === 'WIN' ? (
                            <span className="text-emerald-400">Ставка рассчитана как выигрышная</span>
                          ) : sig.outcome === 'LOSS' ? (
                            <span className="text-rose-400">Ставка не зашла</span>
                          ) : (
                            <span className="text-amber-400/80">Матч продолжается / ожидает расчета</span>
                          )}

                          {sig.finalScore && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
                              FT: {sig.finalScore}
                            </span>
                          )}

                          {sig.telegramEdited && (
                            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-medium border border-sky-500/30 flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Сообщение в TG переписано
                            </span>
                          )}
                        </div>

                        <div className="font-mono font-bold text-xs flex items-center gap-2">
                          <span className="text-slate-500 font-sans font-normal text-[11px]">Результат:</span>
                          <span
                            className={
                              sig.profit && sig.profit > 0
                                ? 'text-emerald-400'
                                : sig.profit && sig.profit < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {sig.profit !== undefined ? (
                              <>
                                {sig.profit > 0 ? `+${sig.profit}` : sig.profit} ₽ (
                                {sig.profit > 0 ? `+${(sig.profit / 1000).toFixed(2)}` : (sig.profit / 1000).toFixed(2)} фл.)
                              </>
                            ) : (
                              'В расчете...'
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Expandable message payload */}
                      <details className="text-xs group">
                        <summary className="cursor-pointer text-slate-500 hover:text-slate-400 select-none flex items-center gap-1 text-[11px]">
                          <span>Показать текст уведомления</span>
                        </summary>
                        <div className="mt-2 text-slate-400 font-mono bg-slate-950 p-3 rounded-lg whitespace-pre-line border border-slate-800/80">
                          {sig.message}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    })()}

        {/* Tab 4: Backtesting & ROI Laboratory */}
        {activeTab === 'backtest' && (
          <BacktestingView
            filters={filters}
            onSelectFilterToEdit={(rule) => {
              setEditingFilter(rule);
              setIsFilterModalOpen(true);
            }}
          />
        )}

        {/* Tab 5: Telegram Settings & Preview */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Config & Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Bot className="h-5 w-5 text-sky-400" />
                        Параметры Telegram бота
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Отправка оповещений в реальном времени при совпадении live-фильтров матчей
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {telegramStatus === 'connected' && telegramBotInfo ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>@{telegramBotInfo.username || 'Бот активен'}</span>
                        </div>
                      ) : telegramStatus === 'checking' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Проверка токена...</span>
                        </div>
                      ) : telegramStatus === 'sending' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                          <Send className="h-3.5 w-3.5 animate-pulse" />
                          <span>Отправка в TG...</span>
                        </div>
                      ) : telegramStatus === 'error' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Ошибка связи</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs">
                          <span>Не подключен</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4 pt-1">
                    {/* Bot Token Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Key className="h-3.5 w-3.5 text-slate-400" />
                          Bot Token (от @BotFather)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                        >
                          {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {showToken ? 'Скрыть' : 'Показать'}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          placeholder="Пример: 6892401248:AAF9j3-xLpQ..."
                          value={telegramConfig.botToken}
                          onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    {/* Chat ID Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          Chat ID или Юзернейм канала
                        </label>
                        <button
                          type="button"
                          onClick={detectChatId}
                          disabled={isDetectingChat || !telegramConfig.botToken.trim()}
                          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium disabled:opacity-40 transition"
                          title="Определить ID чата по входящим сообщениям боту"
                        >
                          <Sparkles className={`h-3 w-3 ${isDetectingChat ? 'animate-spin' : ''}`} />
                          {isDetectingChat ? 'Поиск сообщений...' : 'Определить мой Chat ID'}
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Личный ID (12345678) или канал (@channel_name)"
                          value={telegramConfig.channelId}
                          onChange={(e) => setTelegramConfig({ ...telegramConfig, channelId: e.target.value })}
                          className={`w-full bg-slate-950 border rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none placeholder:text-slate-600 ${
                            isEnteringBotItself
                              ? 'border-amber-500 focus:border-amber-400'
                              : 'border-slate-800 focus:border-sky-500'
                          }`}
                        />
                      </div>

                      {/* Warning if user entered bot's own username */}
                      {isEnteringBotItself && (
                        <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs space-y-1.5">
                          <div className="font-bold flex items-center gap-1.5 text-amber-200">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                            Ошибка: Указан юзернейм самого бота (@{telegramBotInfo?.username})
                          </div>
                          <p className="text-[11px] text-amber-300/90 leading-relaxed">
                            Telegram API запрещает ботам отправлять сообщения самим себе (ошибка <i>«the bot can't send messages to the bot»</i>).
                          </p>
                          <div className="text-[11px] text-amber-200 pt-1 border-t border-amber-500/20">
                            <strong>Как исправить:</strong>
                            <div className="mt-1 space-y-1 text-amber-300/90">
                              <div>• <b>В личные сообщения:</b> напишите боту в Telegram <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-200 font-mono">/start</code> и нажмите синюю кнопку <b>«Определить мой Chat ID»</b> выше.</div>
                              <div>• <b>В Telegram-канал:</b> укажите юзернейм канала (например <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-200 font-mono">@my_channel</code>), сделав бота администратором с правом публикации.</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Detected Chats List */}
                      {showChatPicker && detectedChats.length > 0 && (
                        <div className="p-3 rounded-lg bg-slate-950 border border-sky-500/30 text-xs space-y-2 mt-2 shadow-lg">
                          <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
                            <span className="flex items-center gap-1.5 text-sky-400">
                              <MessageSquare className="h-3.5 w-3.5" />
                              Найденные чаты (нажмите, чтобы подставить):
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowChatPicker(false)}
                              className="text-slate-500 hover:text-slate-300 text-[10px]"
                            >
                              Закрыть ✕
                            </button>
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {detectedChats.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setTelegramConfig({ ...telegramConfig, channelId: String(c.id) });
                                  setShowChatPicker(false);
                                  setTelegramError(null);
                                }}
                                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                                  String(telegramConfig.channelId) === String(c.id)
                                    ? 'bg-sky-500/20 border-sky-500 text-white'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {c.type === 'private' ? (
                                    <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                                      <User className="h-3.5 w-3.5" />
                                    </div>
                                  ) : (
                                    <div className="p-1 rounded bg-sky-500/20 text-sky-400">
                                      <Hash className="h-3.5 w-3.5" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-white text-xs">{c.title}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {c.type === 'private' ? 'Личный диалог' : c.type} {c.username ? `@${c.username}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <div className="font-mono text-xs font-semibold text-sky-300">ID: {c.id}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div
                        onClick={() => setTelegramConfig({ ...telegramConfig, autoSend: !telegramConfig.autoSend })}
                        className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                          telegramConfig.autoSend
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-medium">
                          <div className="font-semibold text-white">Автоотправка сигналов</div>
                          <div className="text-[11px] text-slate-400">При срабатывании фильтров</div>
                        </div>
                        <div
                          className={`w-9 h-5 rounded-full relative transition-colors ${
                            telegramConfig.autoSend ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                              telegramConfig.autoSend ? 'left-4.5' : 'left-0.5'
                            }`}
                          />
                        </div>
                      </div>

                      <div
                        onClick={() => setTelegramConfig({ ...telegramConfig, silentMode: !telegramConfig.silentMode })}
                        className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                          telegramConfig.silentMode
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-medium">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {telegramConfig.silentMode ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                            Тихий режим
                          </div>
                          <div className="text-[11px] text-slate-400">Без звука на устройствах</div>
                        </div>
                        <div
                          className={`w-9 h-5 rounded-full relative transition-colors ${
                            telegramConfig.silentMode ? 'bg-blue-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                              telegramConfig.silentMode ? 'left-4.5' : 'left-0.5'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Anti-Spam & Deduplication Filtering Section */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              Анти-спам фильтрация повторных сигналов
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-normal ${
                                telegramConfig.suppressDuplicates
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {telegramConfig.suppressDuplicates ? 'Активен' : 'Отключен'}
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Блокирует повторную отправку одних и тех же сигналов каждую минуту для текущего матча
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setTelegramConfig({ ...telegramConfig, suppressDuplicates: !telegramConfig.suppressDuplicates })}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                              telegramConfig.suppressDuplicates
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {telegramConfig.suppressDuplicates ? 'Включено' : 'Выключено'}
                          </button>
                          <button
                            type="button"
                            onClick={clearDeduplicationHistory}
                            title="Сбросить историю отправленных сигналов для повторного тестирования"
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Сбросить память
                          </button>
                        </div>
                      </div>

                      {telegramConfig.suppressDuplicates && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                            {/* Mode 1: 1 per match */}
                            <div
                              onClick={() => setTelegramConfig({ ...telegramConfig, deduplicationMode: 'once-per-match' })}
                              className={`p-3 rounded-lg border cursor-pointer transition ${
                                telegramConfig.deduplicationMode === 'once-per-match'
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-semibold text-xs text-emerald-300 flex items-center gap-1.5">
                                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                                  1 сигнал на матч
                                </div>
                                {telegramConfig.deduplicationMode === 'once-per-match' && (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Фильтр срабатывает ровно 1 раз за матч. Полный запрет повторов в бот каждую минуту (Рекомендуется).
                              </p>
                            </div>

                            {/* Mode 2: Cooldown */}
                            <div
                              onClick={() => setTelegramConfig({ ...telegramConfig, deduplicationMode: 'cooldown' })}
                              className={`p-3 rounded-lg border cursor-pointer transition ${
                                telegramConfig.deduplicationMode === 'cooldown'
                                  ? 'bg-sky-500/10 border-sky-500/40 text-white shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-semibold text-xs text-sky-300 flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-sky-400" />
                                  Кулдаун (пауза)
                                </div>
                                {telegramConfig.deduplicationMode === 'cooldown' && (
                                  <Check className="h-3.5 w-3.5 text-sky-400" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Повторный сигнал разрешён только через {telegramConfig.cooldownMinutes || 15} мин, если условия сохраняются.
                              </p>
                            </div>

                            {/* Mode 3: Score Change */}
                            <div
                              onClick={() => setTelegramConfig({ ...telegramConfig, deduplicationMode: 'score-change' })}
                              className={`p-3 rounded-lg border cursor-pointer transition ${
                                telegramConfig.deduplicationMode === 'score-change'
                                  ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-semibold text-xs text-amber-300 flex items-center gap-1.5">
                                  <Activity className="h-3.5 w-3.5 text-amber-400" />
                                  При смене счёта
                                </div>
                                {telegramConfig.deduplicationMode === 'score-change' && (
                                  <Check className="h-3.5 w-3.5 text-amber-400" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Повторный сигнал отправляется только если в матче был забит гол и изменился счёт.
                              </p>
                            </div>
                          </div>

                          {/* Cooldown duration selector when cooldown mode is selected */}
                          {telegramConfig.deduplicationMode === 'cooldown' && (
                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                              <span className="text-slate-400 font-medium">Интервал паузы между сигналами:</span>
                              <div className="flex items-center gap-1.5">
                                {[5, 10, 15, 20, 30].map((mins) => (
                                  <button
                                    key={mins}
                                    type="button"
                                    onClick={() => setTelegramConfig({ ...telegramConfig, cooldownMinutes: mins })}
                                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                                      telegramConfig.cooldownMinutes === mins
                                        ? 'bg-sky-600 text-white shadow'
                                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                    }`}
                                  >
                                    {mins} мин
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Заблокировано спам-дубликатов:</span>
                          <span className="font-bold font-mono text-emerald-400">{telegramConfig.blockedDuplicatesCount || 0}</span>
                        </div>
                        <div className="text-slate-500">
                          Режим:{' '}
                          {telegramConfig.deduplicationMode === 'once-per-match'
                            ? '1 сигнал на матч'
                            : telegramConfig.deduplicationMode === 'cooldown'
                            ? `Пауза ${telegramConfig.cooldownMinutes} мин`
                            : 'Только при новом голе'}
                        </div>
                      </div>
                    </div>

                    {/* Auto-rewrite signal upon match completion */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                            <Edit3 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-white flex items-center gap-2">
                              <span>Переписывать сигнал по завершению матча</span>
                              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-semibold border border-sky-500/30">
                                Результат в исходный пост
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              После окончания матча бот автоматически редактирует сообщение (<code>editMessageText</code>) со статусом ✅ СИГНАЛ ЗАШЁЛ (WIN) или ❌ НЕ ЗАШЁЛ (LOSS), добавляя итоговый счёт и расчёт профита.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setTelegramConfig({
                              ...telegramConfig,
                              autoUpdateOnFinish: !telegramConfig.autoUpdateOnFinish,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            telegramConfig.autoUpdateOnFinish ? 'bg-sky-500' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              telegramConfig.autoUpdateOnFinish ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/60 text-[11px]">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
                          <div className="font-semibold text-slate-200 flex items-center gap-1">
                            <span>1️⃣ Фиксация ID</span>
                          </div>
                          <p className="text-slate-400 mt-1 leading-snug">
                            При отправке сигнала бот сохраняет уникальный <code>message_id</code> в базу.
                          </p>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
                          <div className="font-semibold text-slate-200 flex items-center gap-1">
                            <span>2️⃣ Анализ FT</span>
                          </div>
                          <p className="text-slate-400 mt-1 leading-snug">
                            По свистку об окончании матча проверяется рынок (ТБ/ТМ/П1) и факт голов.
                          </p>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
                          <div className="font-semibold text-sky-300 flex items-center gap-1">
                            <span>3️⃣ Перезапись</span>
                          </div>
                          <p className="text-slate-400 mt-1 leading-snug">
                            Исходное сообщение бесшумно обновляется в канале без создания дублей.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => verifyTelegramBot()}
                        disabled={telegramStatus === 'checking'}
                        className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${telegramStatus === 'checking' ? 'animate-spin' : ''}`} />
                        Проверить статус бота
                      </button>

                      <button
                        type="button"
                        onClick={triggerTestSignal}
                        disabled={telegramStatus === 'sending' || !telegramConfig.botToken || !telegramConfig.channelId}
                        className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-900/30"
                      >
                        <Send className={`h-3.5 w-3.5 ${telegramStatus === 'sending' ? 'animate-pulse' : ''}`} />
                        Отправить тестовый сигнал
                      </button>

                      <button
                        type="button"
                        onClick={triggerTestAndRewriteDemo}
                        disabled={isDemoRewriting || !telegramConfig.botToken || !telegramConfig.channelId}
                        className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/30"
                      >
                        <Sparkles className={`h-3.5 w-3.5 ${isDemoRewriting ? 'animate-spin' : ''}`} />
                        {isDemoRewriting ? 'Переписываем сообщение в TG...' : 'Тест: Сигнал ➔ Переписать в TG (3 сек)'}
                      </button>
                    </div>

                    {/* Error or Success notification */}
                    {telegramError && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <div className="font-semibold text-rose-200">Ошибка взаимодействия с Telegram</div>
                          <div className="mt-0.5 text-[11px] text-rose-300/90">{telegramError}</div>
                        </div>
                      </div>
                    )}

                    {lastSentResult && (
                      <div
                        className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                          lastSentResult.ok
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        {lastSentResult.ok ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                        )}
                        <div>
                          <div className="font-semibold">{lastSentResult.ok ? 'Успешная доставка' : 'Статус отправки'}</div>
                          <div className="text-[11px]">{lastSentResult.text} ({lastSentResult.time})</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Setup Guide */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Куда бот может отправлять сигналы?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        Вариант 1: В ваши личные сообщения
                      </div>
                      <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
                        <li>Откройте бота в Telegram: {telegramBotInfo?.username ? <strong className="text-white">@{telegramBotInfo.username}</strong> : 'по его юзернейму'}.</li>
                        <li>Нажмите кнопку <b>«Запустить» (/start)</b> или отправьте приветствие.</li>
                        <li>В этом приложении нажмите кнопку <span className="text-sky-300 font-semibold">«Определить мой Chat ID»</span> — ваш личный ID подставится сам!</li>
                      </ol>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="font-bold text-sky-400 flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" />
                        Вариант 2: В Telegram-канал или группу
                      </div>
                      <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
                        <li>Зайдите в настройки вашего канала или группы.</li>
                        <li>Добавьте бота в <b>Администраторы</b> с правом публикации сообщений.</li>
                        <li>В поле Chat ID укажите <code className="text-sky-300 font-mono">@имя_канала</code> (для открытого) или ID (например <code className="text-sky-300 font-mono">-100...</code>).</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Telegram Live Preview (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Radio className="h-4 w-4 text-emerald-400" />
                      Предпросмотр сигнала в Telegram
                    </h2>
                    <span className="text-[11px] font-mono text-slate-400">
                      Матч: {selectedMatch?.homeTeam}
                    </span>
                  </div>

                  {/* Telegram Client Simulation Card */}
                  <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-4 text-slate-200 text-xs font-sans space-y-2.5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#242f3d]/80 pb-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-[10px] font-bold text-white">
                          FM
                        </div>
                        <div>
                          <div className="font-semibold text-sky-400">
                            {telegramBotInfo?.first_name || 'Footbalmonitor Alert Bot'}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {telegramBotInfo?.username ? `@${telegramBotInfo.username}` : 'bot'}
                          </div>
                        </div>
                      </div>
                      <span className="text-slate-400 text-[10px] font-mono">
                        {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="space-y-2 text-slate-200 leading-relaxed font-sans text-xs">
                      <div>
                        ⚽ <span className="font-bold text-white">СИГНАЛ:</span> <span className="text-amber-300 font-semibold">Доминирование при ничьей 0:0</span>
                      </div>
                      <div>
                        🏆 <span className="font-bold text-slate-100">{selectedMatch?.countryCode} {selectedMatch?.country} | {selectedMatch?.league}</span>
                      </div>

                      <div className="bg-[#1f2b38] p-2.5 rounded-lg border border-[#2b3a4a] my-2">
                        <div className="text-sm font-bold text-emerald-400 flex items-center justify-between">
                          <span>{selectedMatch?.homeTeam} {selectedMatch?.score[0]} : {selectedMatch?.score[1]} {selectedMatch?.awayTeam}</span>
                          <span className="text-xs font-mono text-emerald-300">({selectedMatch?.minute}')</span>
                        </div>
                      </div>

                      {/* PROMINENT RECOMMENDED OUTCOME IN TELEGRAM PREVIEW */}
                      <div className="bg-gradient-to-r from-emerald-950/90 via-[#18362b] to-emerald-950/90 p-3 rounded-xl border-2 border-emerald-400 my-2.5 shadow-lg shadow-emerald-950/70">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                            🎯 РЕКОМЕНДОВАННЫЙ ИСХОД / СТАВКА:
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/90 text-emerald-300 border border-emerald-500/40 font-bold">
                            Кэф ~1.85
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm sm:text-base tracking-wide shadow flex items-center gap-1.5">
                            <span>🔥</span>
                            <span>{filters.find((f) => f.enabled)?.targetMarket || 'ТБ 0.5 ВО 2-М ТАЙМЕ'}</span>
                          </div>
                          <span className="text-[11px] text-emerald-300 font-semibold hidden sm:inline">
                            Точка входа: {selectedMatch?.minute || 75}'
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-slate-300 text-[11.5px]">
                        <div>
                          🔥 <strong>Опасные атаки:</strong> {selectedMatch?.stats.dangerousAttacks[0]} - {selectedMatch?.stats.dangerousAttacks[1]} <span className="text-emerald-400">(+{Math.abs((selectedMatch?.stats.dangerousAttacks[0] || 0) - (selectedMatch?.stats.dangerousAttacks[1] || 0))})</span>
                        </div>
                        <div>
                          🎯 <strong>Удары в створ:</strong> {selectedMatch?.stats.shotsOnTarget[0]} - {selectedMatch?.stats.shotsOnTarget[1]} (Всего: {(selectedMatch?.stats.shotsOnTarget[0] || 0) + (selectedMatch?.stats.shotsOnTarget[1] || 0) + (selectedMatch?.stats.shotsOffTarget[0] || 0) + (selectedMatch?.stats.shotsOffTarget[1] || 0)})
                        </div>
                        <div>
                          🚩 <strong>Угловые:</strong> {selectedMatch?.stats.corners[0]} - {selectedMatch?.stats.corners[1]}
                        </div>
                        <div>
                          📊 <strong>xG:</strong> {selectedMatch?.stats.xg[0].toFixed(2)} vs {selectedMatch?.stats.xg[1].toFixed(2)}
                        </div>
                        <div>
                          ⚡ <strong>Владение:</strong> {selectedMatch?.stats.possession[0]}% - {selectedMatch?.stats.possession[1]}%
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#242f3d]/80 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Источник: {selectedMatch?.source}</span>
                        <span className="italic">Footbalmonitor Live Engine</span>
                      </div>
                    </div>
                  </div>

                  {/* Telegram Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Отправлено сигналов</div>
                      <div className="text-lg font-bold text-white font-mono mt-0.5">{telegramConfig.notificationsCount}</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Последняя активность</div>
                      <div className="text-xs font-semibold text-emerald-400 font-mono mt-1">
                        {telegramConfig.lastPing || 'Ожидание'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Personal Cabinet & Multi-Bot Management */}
        {activeTab === 'cabinet' && (
          <PersonalCabinetView
            currentUser={currentUser}
            allUsers={allUsers}
            userFilters={filters}
            ads={ads}
            currentTheme={theme}
            onToggleTheme={toggleTheme}
            onSetTheme={setTheme}
            onSelectUser={handleSelectUser}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            onCreateUser={handleCreateUser}
            onSaveFilters={setFilters}
            onNavigateToFilters={() => setActiveTab('filters')}
            onOpenFilterModal={(f?: FilterRule) => {
              setEditingFilter(f || null);
              setIsFilterModalOpen(true);
            }}
            onSendTestBotMessage={handleSendTestBotMessage}
            onLogout={handleLogout}
          />
        )}

        {/* Filter Builder & Editor Modal */}
        <FilterBuilderModal
          isOpen={isFilterModalOpen}
          initialFilter={editingFilter}
          liveMatches={matches}
          userBots={currentUser.telegramBots}
          onClose={() => {
            setIsFilterModalOpen(false);
            setEditingFilter(null);
          }}
          onSave={(savedRule) => {
            handleSaveFilter({
              ...savedRule,
              userId: currentUser.id,
            });
            setIsFilterModalOpen(false);
            setEditingFilter(null);
          }}
        />

        {/* AI Match Analyst in 1 Click Modal */}
        <AIAnalystModal
          isOpen={isAIModalOpen}
          match={aiTargetMatch || selectedMatch}
          pressureAnalysis={
            aiTargetMatch
              ? calculatePressureAnalysis(aiTargetMatch)
              : selectedMatch
              ? calculatePressureAnalysis(selectedMatch)
              : undefined
          }
          telegramConfig={telegramConfig}
          onClose={() => {
            setIsAIModalOpen(false);
            setAiTargetMatch(null);
          }}
          onSendTelegramMessage={async (textHtml) => {
            const res = await sendTelegramMessage(textHtml, false);
            return {
              ok: res.ok,
              messageId: res.messageId,
              error: res.error,
            };
          }}
        />

        {/* Data Sources & Real Match Feed Modal */}
        <DataSourcesModal
          isOpen={isDataSourcesModalOpen}
          onClose={() => setIsDataSourcesModalOpen(false)}
          config={dataSourceConfig}
          onUpdateConfig={(newConfig) => {
            setDataSourceConfig(newConfig);
            if (newConfig.activeSource !== dataSourceConfig.activeSource) {
              fetchLiveMatchesFromSource(newConfig.activeSource);
            }
          }}
          activeMatchesCount={matches.length}
          onRefreshMatches={async () => {
            await fetchLiveMatchesFromSource();
          }}
          isRefreshing={isRefreshingMatches}
          lastFetchedAt={lastFetchedAt}
        />

        {/* Real Match Live Tester & Scenario Lab */}
        <RealMatchTesterModal
          isOpen={isRealMatchTesterOpen}
          onClose={() => setIsRealMatchTesterOpen(false)}
          currentMatches={matches}
          filters={filters}
          onSendTelegramAlert={async (targetMatch, rule) => {
            const analysis = calculatePressureAnalysis(targetMatch);
            const msgHtml = formatExtendedTelegramAlert(targetMatch, rule, analysis);
            const res = await sendTelegramMessage(msgHtml, false);
            return {
              ok: res.ok,
              messageId: res.messageId,
              error: res.error,
            };
          }}
          onOpenAIAnalyst={(targetMatch) => {
            setIsRealMatchTesterOpen(false);
            handleOpenAIAnalyst(targetMatch);
          }}
          onAddMatchToLive={(newMatch) => {
            handleAddMatchToLive(newMatch);
          }}
        />
      </div>

      {/* Restore Right Banner pill if dismissed */}
      {dismissedRightBanner && currentUser.adPreferences.showBanners && (
        <button
          onClick={() => setDismissedRightBanner(false)}
          className="hidden xl:flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 bg-slate-900/95 border border-indigo-500/40 px-2 py-1 rounded-l-lg fixed right-0 top-32 z-30 transition shadow-lg backdrop-blur-sm active:scale-95"
          title="Восстановить баннер справа"
        >
          <span className="font-bold">Баннер справа</span>
          <ChevronLeft className="h-3 w-3" />
        </button>
      )}

      {/* Right Skyscraper Banner (Desktop) */}
      {currentUser.adPreferences.showBanners && !dismissedRightBanner && rightAd && (
        <aside
          id="ad-flank-right"
          className="hidden xl:block w-44 2xl:w-56 shrink-0 pt-6 sticky top-16 z-20"
        >
          <AdBanner
            ad={rightAd}
            variant="skyscraper"
            side="right"
            onDismiss={() => setDismissedRightBanner(true)}
          />
        </aside>
      )}
    </div>

    {/* Authentication Gate & Logo Splash Screen Modal */}
    <AuthGateModal
      isOpen={!isAuthenticated}
      allUsers={allUsers}
      onLogin={handleLogin}
      onRegisterUser={(newUser) => {
        handleCreateUser(newUser);
        handleLogin(newUser);
      }}
    />
    </div>
  );
}
