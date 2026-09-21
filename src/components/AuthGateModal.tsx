import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Activity,
  Bot,
  UserCheck,
  CheckCircle2,
  Crown,
  UserPlus,
  Mail,
  User,
  Check,
} from 'lucide-react';
import { UserProfile } from '../types';
import { AppLogo } from './AppLogo';

interface AuthGateModalProps {
  allUsers: UserProfile[];
  onLogin: (user: UserProfile) => void;
  onRegisterUser?: (newUser: UserProfile) => void;
  isOpen: boolean;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  allUsers,
  onLogin,
  onRegisterUser,
  isOpen,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [customKey, setCustomKey] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPlan, setRegPlan] = useState<'FREE' | 'PRO_ANALYST' | 'VIP_CLUB'>('PRO_ANALYST');
  const [regBotName, setRegBotName] = useState('');

  if (!isOpen) return null;

  const godUser = allUsers.find((u) => u.role === 'god');

  const handleQuickLogin = (user: UserProfile) => {
    onLogin(user);
  };

  const handleDevKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const key = customKey.trim().toLowerCase();
    if (key === 'god' || key === 'root' || key === 'developer' || key === 'creator' || key === 'admin') {
      if (godUser) {
        onLogin(godUser);
      } else {
        onLogin(allUsers[0]);
      }
    } else {
      setErrorMsg('Неверный ключ доступа. Попробуйте "god" или выберите аккаунт из списка.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const name = regName.trim();
    const username = regUsername.trim().replace(/^@/, '') || name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const email = regEmail.trim();

    if (!name) {
      setErrorMsg('Пожалуйста, укажите имя или никнейм');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMsg('Пожалуйста, укажите корректный адрес электронной почты');
      return;
    }

    // Check email uniqueness
    const exists = allUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
    );
    if (exists) {
      setErrorMsg('Пользователь с таким email или логином уже зарегистрирован');
      return;
    }

    const defaultBotId = `bot-${Date.now()}`;
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      username: username || `user_${Date.now().toString().slice(-4)}`,
      displayName: name,
      email: email,
      role: regPlan === 'VIP_CLUB' ? 'vip' : regPlan === 'PRO_ANALYST' ? 'pro' : 'user',
      plan: regPlan,
      planExpiresAt: regPlan === 'FREE' ? undefined : '2026-12-31',
      registeredAt: new Date().toLocaleDateString('ru-RU'),
      balanceRub: regPlan === 'VIP_CLUB' ? 500000 : regPlan === 'PRO_ANALYST' ? 100000 : 25000,
      notificationSound: true,
      adPreferences: {
        showBanners: regPlan === 'FREE',
        compactAds: true,
      },
      telegramBots: [
        {
          id: defaultBotId,
          name: regBotName.trim() || `🤖 Личный Бот (${name})`,
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
        winRate: 80.0,
        favoriteLeague: 'Английская Премьер-Лига',
        signalsToday: 0,
      },
    };

    if (onRegisterUser) {
      onRegisterUser(newUser);
    } else {
      onLogin(newUser);
    }

    setSuccessMsg(`Добро пожаловать, ${name}! Аккаунт успешно создан.`);
  };

  return (
    <div
      id="auth-gate-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl overflow-y-auto"
    >
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/30 space-y-6 my-auto">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center space-y-3">
          <AppLogo
            size="lg"
            animated={true}
            tagline="Live Football Scanner & Smart Money Detection Platform"
          />
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Для защиты алгоритмов, коэффициентов и Telegram-ботов полный функционал платформы доступен после авторизации в личном аккаунте.
          </p>
        </div>

        {/* Mode Selector Tabs: Вход / Регистрация */}
        <div className="flex items-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              authMode === 'login'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Вход в аккаунт</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              authMode === 'register'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5 text-emerald-300" />
            <span>Регистрация трейдера</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {authMode === 'login' ? (
          <>
            {/* GOD MODE Quick Access Highlight */}
            {godUser && (
              <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border-2 border-purple-500/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-purple-400 transition-all shadow-xl">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg border border-purple-300/40 shrink-0">
                      <Zap className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-sm sm:text-base">
                          {godUser.displayName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/30 text-purple-300 border border-purple-400/60">
                          ДОСТУП УРОВНЯ «БОГ»
                        </span>
                      </div>
                      <p className="text-xs text-purple-200/80 mt-0.5">
                        Прямой вход разработчика: безлимитные боты, вброс прогрузов и ручное управление
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin(godUser)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-950/60 flex items-center justify-center gap-2 transition active:scale-95 shrink-0"
                  >
                    <Crown className="h-4 w-4 text-amber-300" />
                    <span>Войти как Разработчик</span>
                  </button>
                </div>
              </div>
            )}

            {/* Regular Account Profiles Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                <span>Или выберите аккаунт трейдера:</span>
                <span>{allUsers.filter((u) => u.role !== 'god').length} доступно</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                {allUsers
                  .filter((u) => u.role !== 'god')
                  .map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className="p-3 bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 rounded-2xl flex items-center justify-between gap-3 text-left transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
                            {user.displayName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-xs group-hover:text-emerald-400 transition-colors">
                            {user.displayName}
                          </div>
                          <div className="text-[10px] text-slate-500">@{user.username}</div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          user.plan === 'VIP_CLUB'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : user.plan === 'PRO_ANALYST'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {user.plan === 'VIP_CLUB' ? 'VIP' : user.plan === 'PRO_ANALYST' ? 'PRO' : 'FREE'}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Developer Secret Passkey Input */}
            <form
              onSubmit={handleDevKeySubmit}
              className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2 items-center"
            >
              <div className="relative flex-1 w-full">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => {
                    setCustomKey(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Секретный мастер-код разработчика (введите 'god')..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Unlock className="h-3.5 w-3.5 text-purple-400" />
                <span>Активировать God Mode</span>
              </button>
            </form>
          </>
        ) : (
          /* REGISTRATION FORM VIEW */
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <User className="h-3 w-3 text-emerald-400" />
                    Ваше имя или никнейм:
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Например: Артём Трейдер"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Mail className="h-3 w-3 text-emerald-400" />
                    Электронная почта (Email):
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="artem@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    Логин (username):
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="artem_bet (необязательно)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-slate-400" />
                    Пароль для входа:
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Bot className="h-3 w-3 text-cyan-400" />
                  Название первого Telegram-бота (опционально):
                </label>
                <input
                  type="text"
                  value={regBotName}
                  onChange={(e) => setRegBotName(e.target.value)}
                  placeholder="Например: Smart Money Alert Bot"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Plan Choice Cards */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-300">
                  Стартовый тарифный план:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegPlan('FREE')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      regPlan === 'FREE'
                        ? 'bg-slate-800 border-emerald-500 text-white ring-1 ring-emerald-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">FREE</div>
                    <div className="text-[10px] text-slate-400">1 бот • 0 ₽</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegPlan('PRO_ANALYST')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      regPlan === 'PRO_ANALYST'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-emerald-400">PRO Analyst</div>
                    <div className="text-[10px] text-slate-400">5 ботов • Без рекламы</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegPlan('VIP_CLUB')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      regPlan === 'VIP_CLUB'
                        ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-400">VIP Syndicate</div>
                    <div className="text-[10px] text-slate-400">15 ботов • Max Bank</div>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/60 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Создать аккаунт и войти в систему</span>
            </button>
          </form>
        )}

        {errorMsg && (
          <p className="text-xs text-red-400 text-center font-medium animate-fadeIn">
            {errorMsg}
          </p>
        )}

        {/* Footer Features badges */}
        <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-500 flex-wrap">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Flashscore & SStats API
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Smart Money & Odds Flow
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Мгновенные Telegram Боты
          </span>
        </div>
      </div>
    </div>
  );
};
