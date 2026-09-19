import React, { useState } from 'react';
import {
  User,
  Bot,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Send,
  Eye,
  EyeOff,
  Shield,
  Crown,
  Wallet,
  TrendingUp,
  Activity,
  Layers,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Users,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Zap,
  Scale,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { UserProfile, TelegramBotProfile, FilterRule, AdBannerItem } from '../types';

interface PersonalCabinetViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onUpdateCurrentUser: (updated: UserProfile) => void;
  onCreateUser: (newUser: UserProfile) => void;
  userFilters: FilterRule[];
  onNavigateToFilters: () => void;
  onSendTestBotMessage: (bot: TelegramBotProfile) => Promise<{ ok: boolean; messageId?: number; error?: string }>;
  ads?: AdBannerItem[];
  onSaveFilters?: (filters: FilterRule[]) => void;
  onOpenFilterModal?: (filter?: FilterRule) => void;
  currentTheme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSetTheme?: (theme: 'dark' | 'light') => void;
}

export const PersonalCabinetView: React.FC<PersonalCabinetViewProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onUpdateCurrentUser,
  onCreateUser,
  userFilters,
  onNavigateToFilters,
  onSendTestBotMessage,
  ads,
  onSaveFilters,
  onOpenFilterModal,
  currentTheme = 'dark',
  onToggleTheme,
  onSetTheme,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bots' | 'plans' | 'ads' | 'users' | 'profile'>('bots');
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [testingBotId, setTestingBotId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ botId: string; ok: boolean; message: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // New Bot Form State
  const [isAddingBot, setIsAddingBot] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotToken, setNewBotToken] = useState('');
  const [newBotChatId, setNewBotChatId] = useState('');
  const [newBotIsDefault, setNewBotIsDefault] = useState(false);

  // Edit Bot State
  const [editingBotId, setEditingBotId] = useState<string | null>(null);

  // New User Form State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPlan, setNewUserPlan] = useState<'FREE' | 'PRO_ANALYST' | 'VIP_CLUB'>('PRO_ANALYST');

  // Max bots allowed based on user tier (FREE = 1 bot, PRO = 5 bots, VIP = 15 bots)
  const maxBotsAllowed = React.useMemo(() => {
    if (currentUser.plan === 'FREE') return 1;
    if (currentUser.plan === 'PRO_ANALYST') return 5;
    return 15; // VIP_CLUB
  }, [currentUser.plan]);

  // Count filters bound to each bot
  const botFilterCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const defaultBot = currentUser.telegramBots.find((b) => b.isDefault) || currentUser.telegramBots[0];

    userFilters.forEach((f) => {
      if (f.botId) {
        counts[f.botId] = (counts[f.botId] || 0) + 1;
      } else if (f.customBotToken) {
        counts['custom'] = (counts['custom'] || 0) + 1;
      } else if (defaultBot) {
        counts[defaultBot.id] = (counts[defaultBot.id] || 0) + 1;
      }
    });
    return counts;
  }, [userFilters, currentUser.telegramBots]);

  // Handle Add Bot
  const handleAddBot = (e: React.FormEvent) => {
    e.preventDefault();

    // Check plan bot limit
    if (currentUser.telegramBots.length >= maxBotsAllowed) {
      if (currentUser.plan === 'FREE') {
        setShowUpgradeModal(true);
        return;
      } else {
        alert(`На вашем тарифе (${currentUser.plan}) доступно подключение до ${maxBotsAllowed} ботов. Для дальнейшего расширения перейдите на VIP.`);
        return;
      }
    }

    if (!newBotName.trim() || !newBotToken.trim() || !newBotChatId.trim()) {
      alert('Заполните название бота, токен от @BotFather и Chat ID / @канал.');
      return;
    }

    const newBot: TelegramBotProfile = {
      id: `bot-${Date.now()}`,
      name: newBotName.trim(),
      botToken: newBotToken.trim(),
      channelId: newBotChatId.trim(),
      isDefault: newBotIsDefault || currentUser.telegramBots.length === 0,
      active: true,
      status: 'untested',
      createdAt: new Date().toLocaleDateString('ru-RU'),
    };

    let updatedBots = [...currentUser.telegramBots];
    if (newBot.isDefault) {
      updatedBots = updatedBots.map((b) => ({ ...b, isDefault: false }));
    }
    updatedBots.push(newBot);

    onUpdateCurrentUser({
      ...currentUser,
      telegramBots: updatedBots,
    });

    setNewBotName('');
    setNewBotToken('');
    setNewBotChatId('');
    setNewBotIsDefault(false);
    setIsAddingBot(false);
  };

  // Handle Delete Bot
  const handleDeleteBot = (botId: string) => {
    if (currentUser.telegramBots.length <= 1) {
      if (!confirm('У вас останется 0 ботов. Вы уверены?')) return;
    } else {
      if (!confirm('Удалить этого бота из личного кабинета? Фильтры, привязанные к нему, перейдут на бота по умолчанию.')) return;
    }

    const updated = currentUser.telegramBots.filter((b) => b.id !== botId);
    if (updated.length > 0 && !updated.some((b) => b.isDefault)) {
      updated[0].isDefault = true;
    }

    onUpdateCurrentUser({
      ...currentUser,
      telegramBots: updated,
    });
  };

  // Set Default Bot
  const handleSetDefaultBot = (botId: string) => {
    const updated = currentUser.telegramBots.map((b) => ({
      ...b,
      isDefault: b.id === botId,
    }));
    onUpdateCurrentUser({
      ...currentUser,
      telegramBots: updated,
    });
  };

  // Test Telegram Bot
  const handleTestBot = async (bot: TelegramBotProfile) => {
    setTestingBotId(bot.id);
    setTestResult(null);

    try {
      const res = await onSendTestBotMessage(bot);
      if (res.ok) {
        setTestResult({
          botId: bot.id,
          ok: true,
          message: `Успешно отправлено в Telegram! Message ID: #${res.messageId}`,
        });
        // Update verified status
        const updatedBots = currentUser.telegramBots.map((b) =>
          b.id === bot.id ? { ...b, status: 'verified' as const, lastPing: new Date().toLocaleTimeString('ru-RU') } : b
        );
        onUpdateCurrentUser({ ...currentUser, telegramBots: updatedBots });
      } else {
        setTestResult({
          botId: bot.id,
          ok: false,
          message: res.error || 'Ошибка проверки Telegram',
        });
      }
    } catch (err: any) {
      setTestResult({
        botId: bot.id,
        ok: false,
        message: err?.message || 'Сетевая ошибка',
      });
    } finally {
      setTestingBotId(null);
    }
  };

  // Handle Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      username: newUserName.trim().toLowerCase().replace(/\s+/g, '_'),
      displayName: newUserName.trim(),
      email: newUserEmail.trim() || `${newUserName.trim().toLowerCase()}@footbalmonitor.pro`,
      role: newUserPlan === 'VIP_CLUB' ? 'vip' : newUserPlan === 'PRO_ANALYST' ? 'pro' : 'user',
      plan: newUserPlan,
      registeredAt: new Date().toLocaleDateString('ru-RU'),
      balanceRub: newUserPlan === 'VIP_CLUB' ? 100000 : 25000,
      notificationSound: true,
      adPreferences: {
        showBanners: newUserPlan === 'FREE',
        compactAds: true,
      },
      telegramBots: [
        {
          id: `bot-def-${Date.now()}`,
          name: '🤖 Основной Telegram-бот',
          botToken: '',
          channelId: '',
          isDefault: true,
          active: true,
          status: 'untested',
          createdAt: new Date().toLocaleDateString('ru-RU'),
        },
      ],
      stats: {
        totalSignalsGenerated: 0,
        winRate: 0,
        signalsToday: 0,
      },
    };

    onCreateUser(newUser);
    setIsCreatingUser(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  return (
    <div id="personal-cabinet-container" className="space-y-6">
      {/* User Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-xl border-2 border-emerald-400/40">
                  {currentUser.displayName.charAt(0)}
                </div>
              )}
              {currentUser.plan === 'VIP_CLUB' && (
                <div className="absolute -top-1.5 -right-1.5 p-1 bg-amber-500 rounded-full text-slate-950 shadow">
                  <Crown className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {currentUser.displayName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1 ${
                    currentUser.plan === 'VIP_CLUB'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : currentUser.plan === 'PRO_ANALYST'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {currentUser.plan === 'VIP_CLUB'
                    ? 'VIP Syndicate'
                    : currentUser.plan === 'PRO_ANALYST'
                    ? 'PRO Analyst'
                    : 'Free Tier'}
                </span>
                <span className="text-xs text-slate-500">@{currentUser.username}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                <span>Email: <strong className="text-slate-200">{currentUser.email}</strong></span>
                <span>Регистрация: <strong className="text-slate-200">{currentUser.registeredAt}</strong></span>
                <span>Демо-банк: <strong className="text-emerald-400">{currentUser.balanceRub.toLocaleString('ru-RU')} ₽</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & User Switcher Trigger */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Винрейт</div>
              <div className="text-sm font-bold text-emerald-400">{currentUser.stats.winRate}%</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Сигналов</div>
              <div className="text-sm font-bold text-slate-200">{currentUser.stats.totalSignalsGenerated}</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ботов в сети</div>
              <div className="text-sm font-bold text-cyan-400">{currentUser.telegramBots.length}</div>
            </div>

            <button
              onClick={() => setActiveSubTab('users')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Users className="h-3.5 w-3.5 text-cyan-400" />
              <span>Сменить профиль</span>
            </button>
          </div>
        </div>

        {/* Isolation Guarantee Notice */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              <strong>Изолированное пространство:</strong> Ваши фильтры ({userFilters.length} шт.) и боты настроены только для аккаунта <strong>{currentUser.displayName}</strong> и не влияют на других пользователей.
            </span>
          </div>
          <button
            onClick={onNavigateToFilters}
            className="text-emerald-400 hover:text-emerald-300 font-bold underline text-xs shrink-0"
          >
            Перейти к фильтрам →
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('bots')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'bots'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>Мои Telegram-боты ({currentUser.telegramBots.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('plans')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'plans'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Тарифы: FREE vs PRO</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'users'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Пользователи и профили ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ads')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'ads'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Реклама & Партнёры</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Настройки аккаунта</span>
        </button>
      </div>

      {/* SUB-TAB 1: TELEGRAM BOTS MANAGEMENT */}
      {activeSubTab === 'bots' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan-400" />
                Сетка привязанных Telegram-ботов
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser.plan === 'FREE'
                  ? 'Тариф FREE: подключение 1 бота с мгновенной отправкой без задержек. В PRO доступно до 5 ботов.'
                  : 'Тариф PRO: вы можете подключить до 5 ботов и распределить разные стратегии по отдельным каналам.'}
              </p>
            </div>

            <button
              onClick={() => {
                if (currentUser.telegramBots.length >= maxBotsAllowed) {
                  if (currentUser.plan === 'FREE') {
                    setShowUpgradeModal(true);
                    return;
                  } else {
                    alert(`На вашем тарифе (${currentUser.plan}) доступно подключение до ${maxBotsAllowed} ботов. Для расширения сетки перейдите на VIP.`);
                    return;
                  }
                }
                setIsAddingBot(!isAddingBot);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>{isAddingBot ? 'Закрыть форму' : '+ Добавить бота'}</span>
            </button>
          </div>

          {/* Plan & Bot Capacity Notice */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${currentUser.plan === 'FREE' ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">
                    Подключено ботов: <strong className="text-emerald-400">{currentUser.telegramBots.length} из {maxBotsAllowed}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    currentUser.plan === 'FREE'
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : currentUser.plan === 'PRO_ANALYST'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {currentUser.plan === 'FREE' ? 'Тариф FREE (1 бот)' : currentUser.plan === 'PRO_ANALYST' ? 'Тариф PRO (до 5 ботов)' : 'Тариф VIP (до 15 ботов)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> 0 секунд задержки
                  </span>
                  <span>— мгновенная отправка сигналов в реальном времени! Полный функционал фильтров в ручном режиме.</span>
                </p>
              </div>
            </div>

            {currentUser.plan === 'FREE' ? (
              <button
                type="button"
                onClick={() => setActiveSubTab('plans')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>До 5 ботов на разные фильтры (PRO) →</span>
              </button>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl shrink-0">
                ⭐ PRO-режим: до 5 ботов активны
              </span>
            )}
          </div>

          {/* Test Result Notification */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                testResult.ok
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
              <button
                onClick={() => setTestResult(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Add Bot Form */}
          {isAddingBot && (
            <form
              onSubmit={handleAddBot}
              className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl shadow-cyan-950/20 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-cyan-400" />
                  Подключение нового Telegram бота
                </h3>
                <span className="text-[11px] text-slate-400">
                  Создайте бота в @BotFather за 1 минуту
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Название бота / канала:
                  </label>
                  <input
                    type="text"
                    value={newBotName}
                    onChange={(e) => setNewBotName(e.target.value)}
                    placeholder="Например: 🚩 Угловые & Тоталы VIP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500">
                    Понятное имя для выбора в настройках фильтров
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Bot Token (@BotFather):
                  </label>
                  <input
                    type="text"
                    value={newBotToken}
                    onChange={(e) => setNewBotToken(e.target.value)}
                    placeholder="7123456789:AAEjK..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500">
                    Токен доступа HTTP API бота
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Chat ID или @канал:
                  </label>
                  <input
                    type="text"
                    value={newBotChatId}
                    onChange={(e) => setNewBotChatId(e.target.value)}
                    placeholder="-1001928374651 или @my_bets_channel"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500">
                    Бот должен быть администратором канала
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newBotIsDefault}
                    onChange={(e) => setNewBotIsDefault(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-0"
                  />
                  <span>Сделать этого бота основным по умолчанию</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingBot(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Сохранить бота
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Bots Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentUser.telegramBots.map((bot) => {
              const filterCount = botFilterCounts[bot.id] || 0;
              const isDefault = bot.isDefault;
              const isMasked = !showTokens[bot.id];

              return (
                <div
                  key={bot.id}
                  className={`bg-slate-900/80 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                    isDefault
                      ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-white text-sm">
                            {bot.name}
                          </h3>
                          {isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                              По умолчанию
                            </span>
                          )}
                        </div>
                        {bot.botUsername && (
                          <span className="text-[11px] text-cyan-400 font-mono">
                            {bot.botUsername}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteBot(bot.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Удалить бота"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bot Credentials Box */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Chat / Channel ID:</span>
                        <span className="font-mono text-slate-200 text-[11px] font-bold">
                          {bot.channelId || 'Не указан'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Bot Token:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-300 text-[11px]">
                            {bot.botToken
                              ? isMasked
                                ? `${bot.botToken.slice(0, 5)}...${bot.botToken.slice(-4)}`
                                : bot.botToken
                              : 'Не настроен'}
                          </span>
                          {bot.botToken && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowTokens((prev) => ({ ...prev, [bot.id]: !prev[bot.id] }))
                              }
                              className="text-slate-500 hover:text-slate-300"
                              title={isMasked ? 'Показать токен' : 'Скрыть токен'}
                            >
                              {isMasked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
                        <span className="text-slate-500">Привязано фильтров:</span>
                        <span className="font-bold text-emerald-400">
                          {filterCount} шт.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestBot(bot)}
                        disabled={testingBotId === bot.id || !bot.botToken || !bot.channelId}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        {testingBotId === bot.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                        ) : (
                          <Send className="h-3 w-3 text-cyan-400" />
                        )}
                        <span>Тест связи</span>
                      </button>

                      {!isDefault && (
                        <button
                          onClick={() => handleSetDefaultBot(bot.id)}
                          className="px-3 py-1.5 bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium transition"
                          title="Сделать основным ботом для новых фильтров"
                        >
                          Сделать дефолтным
                        </button>
                      )}
                    </div>

                    <button
                      onClick={onNavigateToFilters}
                      className="w-full text-center text-[11px] text-slate-400 hover:text-emerald-400 transition"
                    >
                      Настроить фильтры для этого бота →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: PLANS & ACCESS MODEL */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                Тарифные планы и модель доступа
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Честная модель: 0 сек задержки и полный ручной конструктор на тарифе FREE. До 5 ботов на разные стратегии и Ad-Free на тарифе PRO.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span>Текущий тариф:</span>
              <strong className="text-emerald-400 font-extrabold uppercase">
                {currentUser.plan === 'FREE'
                  ? 'FREE (1 бот)'
                  : currentUser.plan === 'PRO_ANALYST'
                  ? 'PRO Analyst (до 5 ботов)'
                  : 'VIP Club'}
              </strong>
            </div>
          </div>

          {/* Core Product Guarantee Strip */}
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Zap className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Принцип мгновенной доставки (0 секунд задержки):</span>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Мы принципиально <strong>не делаем искусственных задержек</strong> даже на бесплатном тарифе! Сигнал отправляется мгновенно в момент срабатывания триггера, чтобы вы успевали совершить ставку по выгодному коэффициенту.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/30">
                Ping ~150ms
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* PLAN 1: FREE */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition relative ${
                currentUser.plan === 'FREE'
                  ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-extrabold uppercase border border-slate-700">
                    Базовый доступ
                  </span>
                  {currentUser.plan === 'FREE' && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Активен
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">FREE</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Полный функционал для каждого игрока без скрытых платежей
                  </p>
                </div>

                <div className="py-2 border-y border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">0 ₽</span>
                    <span className="text-xs text-slate-400">/ навсегда</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Полный функционал фильтров в ручном режиме:</strong> все 20+ метрик (xG, удары, опасные атаки, угловые, давление, прогрузы коэффициентов Smart Money, камбэки).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>0 секунд задержки:</strong> моментальная отправка сигналов в Telegram без замедления.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>1 Telegram-бот:</strong> отправка в личный чат или ваш канал.</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400">
                    <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Рекламная поддержка:</strong> показ проверенных фрибетов и акций легальных БК РФ (Единый ЦУПИС, 18+).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Неограниченный бэктестинг стратегий по базе матчей.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800">
                {currentUser.plan === 'FREE' ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-800/70 border border-slate-700 text-slate-400 text-xs font-bold cursor-default"
                  >
                    ✓ Ваш текущий тариф
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpdateCurrentUser({
                        ...currentUser,
                        plan: 'FREE',
                        role: 'user',
                        adPreferences: {
                          ...currentUser.adPreferences,
                          showBanners: true,
                        },
                      });
                      alert('Переключено на бесплатный тариф FREE. Лимит: 1 бот, реклама включена.');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
                  >
                    Переключить на FREE (Тест)
                  </button>
                )}
              </div>
            </div>

            {/* PLAN 2: PRO ANALYST (BEST VALUE) */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition relative ${
                currentUser.plan === 'PRO_ANALYST'
                  ? 'bg-gradient-to-b from-slate-900 to-emerald-950/20 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/50'
                  : 'bg-slate-900 border-amber-500/40 shadow-lg hover:border-amber-500/70'
              }`}
            >
              {/* Highlight badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                <Flame className="h-3 w-3" />
                <span>Хит выбора</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-500/30">
                    Для профи & капперов
                  </span>
                  {currentUser.plan === 'PRO_ANALYST' && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Активен
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    <span>PRO Analyst</span>
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Мульти-боты под разные стратегии и работа без отвлекающей рекламы
                  </p>
                </div>

                <div className="py-2 border-y border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-emerald-400">1 490 ₽</span>
                    <span className="text-xs text-slate-400">/ месяц</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-amber-300">До 5 Telegram-ботов одновременно:</strong> привязывайте отдельные боты под разные фильтры (например: Бот угловых, Бот камбэков, Бот Smart Money, Бот голов во 2-м тайме, Бот карточек).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-emerald-300">Полное отключение рекламы (Ad-Free):</strong> чистый интерфейс без баннеров для максимальной концентрации.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>0 секунд задержки:</strong> приоритетные выделенные очереди отправки при пиковой нагрузке выходных.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Неограниченное число активных фильтров и правил.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Приоритетная техническая поддержка в Telegram.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800">
                {currentUser.plan === 'PRO_ANALYST' ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-default"
                  >
                    ✓ Ваш текущий тариф
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpdateCurrentUser({
                        ...currentUser,
                        plan: 'PRO_ANALYST',
                        role: 'pro',
                        adPreferences: {
                          ...currentUser.adPreferences,
                          showBanners: false,
                        },
                      });
                      alert('Тариф PRO Analyst успешно активирован! Доступно подключение до 5 ботов и отключены рекламные баннеры.');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Активировать PRO (1 490 ₽)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* PLAN 3: VIP SYNDICATE */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition relative ${
                currentUser.plan === 'VIP_CLUB'
                  ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/40'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                    Для синдикатов
                  </span>
                  {currentUser.plan === 'VIP_CLUB' && (
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Активен
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    <span>VIP Syndicate</span>
                    <Crown className="h-4 w-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Для закрытых сообществ, каналов и алгоритмических команд
                  </p>
                </div>

                <div className="py-2 border-y border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-amber-400">3 990 ₽</span>
                    <span className="text-xs text-slate-400">/ месяц</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>До 15 Telegram-ботов</strong> для распределения по сеткам каналов.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Персональный Webhook API:</strong> получение потока сигналов в ваши скрипты.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Доступ в закрытый VIP-чат:</strong> готовые пресеты с винрейтом 80%+.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Полное отключение рекламы.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800">
                {currentUser.plan === 'VIP_CLUB' ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-default"
                  >
                    ✓ Ваш текущий тариф
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpdateCurrentUser({
                        ...currentUser,
                        plan: 'VIP_CLUB',
                        role: 'vip',
                        adPreferences: {
                          ...currentUser.adPreferences,
                          showBanners: false,
                        },
                      });
                      alert('Тариф VIP Syndicate успешно активирован! Доступно до 15 ботов и Webhook API.');
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition active:scale-95"
                  >
                    Подключить VIP (3 990 ₽)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Russian Legislation Compliance Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Правовой статус и соответствие законодательству Российской Федерации
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  244-ФЗ (Об азартных играх)
                </span>
                <p className="text-[11px] text-slate-400">
                  Сервис является исключительно информационно-аналитическим программным комплексом. Не принимает ставки, не организует пари и не выплачивает выигрыши.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  38-ФЗ «О рекламе» (ст. 27)
                </span>
                <p className="text-[11px] text-slate-400">
                  Все рекламные баннеры маркируются идентификаторами (erid) через ОРД. Сотрудничество ведется исключительно с лицензированными БК Единого ЦУПИС (ЕРАИ), строго 18+.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                  152-ФЗ (Персональные данные)
                </span>
                <p className="text-[11px] text-slate-400">
                  Безопасное хранение данных пользователей, регистрация через email/Telegram и политика конфиденциальности в строгом соответствии с законами РФ.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: USERS & PROFILE SWITCHER */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                Профили и многопользовательский режим
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Переключайтесь между пользователями или создайте новый аккаунт. Каждый пользователь сохраняет свои фильтры и боты изолированно.
              </p>
            </div>

            <button
              onClick={() => setIsCreatingUser(!isCreatingUser)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>{isCreatingUser ? 'Отмена' : '+ Новый пользователь'}</span>
            </button>
          </div>

          {/* Create User Form */}
          {isCreatingUser && (
            <form
              onSubmit={handleCreateUser}
              className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl"
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                Регистрация нового пользователя
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Имя пользователя:</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Например: Роман Спортивный"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Email:</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="roman@footbalmonitor.pro"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Тарифный план:</label>
                  <select
                    value={newUserPlan}
                    onChange={(e: any) => setNewUserPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="FREE">Free Tier (Базовый)</option>
                    <option value="PRO_ANALYST">PRO Analyst (Рекомендуемый)</option>
                    <option value="VIP_CLUB">VIP Syndicate (Максимальный)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  Создать аккаунт
                </button>
              </div>
            </form>
          )}

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allUsers.map((user) => {
              const isCurrent = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  className={`bg-slate-900 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-emerald-500 bg-slate-900/90 shadow-lg shadow-emerald-950/40'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-lg">
                            {user.displayName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            {user.displayName}
                          </div>
                          <div className="text-[11px] text-slate-400">@{user.username}</div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          user.plan === 'VIP_CLUB'
                            ? 'bg-amber-500/20 text-amber-300'
                            : user.plan === 'PRO_ANALYST'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {user.plan}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 rounded-xl p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Ботов настроено:</span>
                        <strong className="text-slate-200">{user.telegramBots.length}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Демо-банк:</span>
                        <strong className="text-emerald-400">{user.balanceRub.toLocaleString('ru-RU')} ₽</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Винрейт сигналов:</span>
                        <strong className="text-slate-200">{user.stats.winRate}%</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectUser(user)}
                    disabled={isCurrent}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                      isCurrent
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white'
                    }`}
                  >
                    {isCurrent ? '✓ Активный аккаунт' : 'Войти в этот аккаунт'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ADVERTISING & PARTNERS SLOTS */}
      {activeSubTab === 'ads' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Плашки для рекламы и партнёрские предложения
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Настройки показа рекламных плашек и эксклюзивные бонусы от проверенных партнеров платформы
              </p>
            </div>
          </div>

          {/* Ad Visibility Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">
              Настройка отображения плашек в интерфейсе:
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Показывать рекламные баннеры (вверху, слева и справа)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Отображение верхнего промо-баннера, боковых баннеров-небоскребов слева/справа и карточек партнёров
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentUser.adPreferences.showBanners}
                  onChange={(e) =>
                    onUpdateCurrentUser({
                      ...currentUser,
                      adPreferences: {
                        ...currentUser.adPreferences,
                        showBanners: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Компактный режим плашек
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Минимизирует высоту баннеров для максимального фокуса на статистике матчей
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentUser.adPreferences.compactAds}
                  onChange={(e) =>
                    onUpdateCurrentUser({
                      ...currentUser,
                      adPreferences: {
                        ...currentUser.adPreferences,
                        compactAds: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Partner Bonuses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                  Партнёр Winline
                </span>
                <span className="text-xs text-slate-400">18+ Лицензия Единого ЦУПИС</span>
              </div>
              <h4 className="font-bold text-white text-base">
                Фрибет 15 000 ₽ без условий отыгрыша
              </h4>
              <p className="text-xs text-slate-300">
                Зарегистрируйтесь по специальной ссылке и введите промокод <code className="text-amber-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">FOOTMONITOR2026</code> для начисления фрибета на любой футбольный матч.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400">FOOTMONITOR2026</span>
                <a
                  href="https://winline.ru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <span>Забрать фрибет</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-950/30 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px] border border-blue-500/40">
                  Telegram VIP Сетка
                </span>
                <span className="text-xs text-slate-400">Индивидуальные боты</span>
              </div>
              <h4 className="font-bold text-white text-base">
                Закрытый VIP-канал с xG-сигналами 84%+
              </h4>
              <p className="text-xs text-slate-300">
                Возможность подключить прямой вебхук к вашему персональному боту для мгновенной публикации сигналов прямо в ваш Telegram-канал без задержек.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-400">TELEGRAM_PRO</span>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <span>Подключить VIP</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: GENERAL PROFILE SETTINGS */}
      {activeSubTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-400" />
            Параметры профиля
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Отображаемое имя:</label>
              <input
                type="text"
                value={currentUser.displayName}
                onChange={(e) =>
                  onUpdateCurrentUser({ ...currentUser, displayName: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Email:</label>
              <input
                type="email"
                value={currentUser.email}
                onChange={(e) =>
                  onUpdateCurrentUser({ ...currentUser, email: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Theme Switcher Setting */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-200">Тема оформления интерфейса:</label>
                <div className="text-[11px] text-slate-400">
                  Выберите комфортную для глаз цветовую гамму приложения
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-semibold text-emerald-400">
                {currentTheme === 'dark' ? '🌙 Тёмная тема' : '☀️ Светлая тема'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <button
                type="button"
                onClick={() => {
                  onSetTheme?.('dark');
                  onUpdateCurrentUser({ ...currentUser, theme: 'dark' });
                }}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition shadow-sm ${
                  currentTheme === 'dark'
                    ? 'bg-slate-800 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Moon className="h-4 w-4 text-sky-400" />
                <span>Тёмная (Dark Night)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSetTheme?.('light');
                  onUpdateCurrentUser({ ...currentUser, theme: 'light' });
                }}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition shadow-sm ${
                  currentTheme === 'light'
                    ? 'bg-slate-800 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Sun className="h-4 w-4 text-amber-400" />
                <span>Светлая (Clean Light)</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={currentUser.notificationSound}
                onChange={(e) =>
                  onUpdateCurrentUser({ ...currentUser, notificationSound: e.target.checked })
                }
                className="rounded bg-slate-950 border-slate-700 text-emerald-600 h-4 w-4"
              />
              <span>Звуковые оповещения при поступлении новых сигналов</span>
            </label>
          </div>
        </div>
      )}

      {/* Upgrade to PRO Modal (When user on FREE tries to exceed 1 bot limit) */}
      {showUpgradeModal && (
        <div
          id="upgrade-to-pro-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Подключение до 5 ботов доступно в PRO
                  </h3>
                  <span className="text-xs text-slate-400">
                    Лимит тарифа FREE: 1 активный Telegram-бот
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>На тарифе FREE:</strong> вам уже доступен <strong>полный функционал фильтров в ручном режиме</strong>, 1 бот и <strong>мгновенные сигналы без задержек (0 сек)</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2 text-amber-300">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>В тарифе PRO (1 490 ₽/мес):</strong> вы можете подключить <strong>до 5 Telegram-ботов</strong>, чтобы направить разные стратегии (угловые, камбэки, Smart Money, голы) в отдельные каналы + <strong>полное отключение рекламы</strong>.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateCurrentUser({
                    ...currentUser,
                    plan: 'PRO_ANALYST',
                    role: 'pro',
                    adPreferences: {
                      ...currentUser.adPreferences,
                      showBanners: false,
                    },
                  });
                  setShowUpgradeModal(false);
                  setIsAddingBot(true);
                  alert('Тариф PRO успешно активирован! Теперь вы можете добавить до 5 ботов.');
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Перейти на PRO (1 490 ₽)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Остаться на FREE (1 бот)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
