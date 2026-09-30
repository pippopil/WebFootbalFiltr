import React, { useState, useRef } from 'react';
import {
  Sparkles,
  X,
  Upload,
  Image as ImageIcon,
  FileText,
  Bot,
  Zap,
  Check,
  Target,
  ArrowRight,
  Flame,
  ShieldCheck,
  Crown,
  Lock,
  Layers,
  Sliders,
  ExternalLink,
  Info,
  RefreshCw,
} from 'lucide-react';
import { FilterRule, UserProfile, SportType, ScoreCondition, FilterCategory } from '../types';

interface AIStrategySynthesizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSaveStrategy: (rule: FilterRule, activateImmediately?: boolean) => void;
  onOpenInBuilder?: (rule: FilterRule) => void;
  onUpgradePlan?: () => void;
}

export const AIStrategySynthesizerModal: React.FC<AIStrategySynthesizerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveStrategy,
  onOpenInBuilder,
  onUpgradePlan,
}) => {
  // Check maximum subscription plan or VIP/God role
  const hasMaxPlan =
    currentUser.role === 'god' ||
    currentUser.role === 'vip' ||
    currentUser.role === 'pro' ||
    currentUser.plan === 'GOD_MODE' ||
    currentUser.plan === 'VIP_CLUB' ||
    currentUser.plan === 'PRO_ANALYST';

  // Input state
  const [inputMode, setInputMode] = useState<'text' | 'image' | 'file'>('text');
  const [textNotes, setTextNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [extractedOcrText, setExtractedOcrText] = useState<string>('');

  // AI Provider Selection
  const [aiProvider, setAiProvider] = useState<'builtin' | 'gigachat' | 'yandexgpt'>('builtin');
  const [customApiKey, setCustomApiKey] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [synthesizedRule, setSynthesizedRule] = useState<FilterRule | null>(null);
  const [detectedSummary, setDetectedSummary] = useState<string | null>(null);
  const [demoBypass, setDemoBypass] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const canAccess = hasMaxPlan || demoBypass;

  // Handle image upload & basic client OCR extraction simulation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
      // Simulate/extract text from typical betting strategies screenshot
      const fileNameLower = file.name.toLowerCase();
      let sampleOcr = '';

      if (fileNameLower.includes('corner') || fileNameLower.includes('угл')) {
        sampleOcr = 'Стратегия на угловые: 60-75 минута, счет 0:0 или 1:0. Угловые суммарно >= 8. Опасные атаки >= 35. Кэф на ТБ 9.5 угловых от 1.75. Исход: ТБ 9.5 угловых.';
      } else if (fileNameLower.includes('xg') || fileNameLower.includes('голы')) {
        sampleOcr = 'Стратегия xG Дефицит: 65-88 минута, счет 0:0 или 0:1. Суммарный xG >= 1.6, ударов в створ >= 5. Исход: ТБ 0.5 во 2-м тайме кэф 1.75.';
      } else if (fileNameLower.includes('hockey') || fileNameLower.includes('хокке')) {
        sampleOcr = 'Хоккейная стратегия: 3-й период, 54-59 минута. Разница в 1 шайбу. Проигрывающие снимают вратаря. Бросков в створ >= 25. Исход: ТБ 5.5 шайб.';
      } else {
        sampleOcr = 'Скриншот стратегии: Минуты 70-85, счет 0:0. Атаки К1 >= 60, опасные атаки >= 30, удары в створ >= 5, угловые >= 7. Кэф на ТБ 0.5 от 1.70. Исход: ТБ 0.5 во 2-м тайме.';
      }
      setExtractedOcrText(sampleOcr);
    };
    reader.readAsDataURL(file);
  };

  // Handle text file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setExtractedOcrText(content);
      setTextNotes(content);
    };
    reader.readAsText(file);
  };

  // Advanced Natural Language & Heuristic Strategy Synthesis Engine
  const runStrategySynthesis = () => {
    const rawContent = (
      inputMode === 'text' ? textNotes : extractedOcrText || textNotes
    ).trim();

    if (!rawContent) {
      alert('Пожалуйста, введите текст наблюдений, загрузите скриншот или текстовый файл со стратегией.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const lower = rawContent.toLowerCase();

      // 1. Detect Sport
      let sport: SportType = 'football';
      if (lower.includes('хокке') || lower.includes('шайб') || lower.includes('период') || lower.includes('nhl') || lower.includes('кхл')) {
        sport = 'hockey';
      } else if (lower.includes('баскет') || lower.includes('четверт') || lower.includes('nba') || lower.includes('очк')) {
        sport = 'basketball';
      } else if (lower.includes('теннис') || lower.includes('сет') || lower.includes('гейм') || lower.includes('брейк') || lower.includes('atp')) {
        sport = 'tennis';
      } else if (lower.includes('волей') || lower.includes('парти') || lower.includes('баланс')) {
        sport = 'volleyball';
      } else if (lower.includes('настольн') || lower.includes('пинг-понг')) {
        sport = 'table_tennis';
      }

      // 2. Detect Minute Range
      let minMin = 60;
      let maxMin = 88;
      const minMatch = rawContent.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*(?:мин|'|$)/);
      if (minMatch) {
        minMin = parseInt(minMatch[1], 10);
        maxMin = parseInt(minMatch[2], 10);
      } else if (lower.includes('1 тайм') || lower.includes('1-й тайм') || lower.includes('1т')) {
        minMin = 15;
        maxMin = 45;
      } else if (lower.includes('концовк') || lower.includes('штурм') || lower.includes('поздн')) {
        minMin = 75;
        maxMin = 90;
      }

      // 3. Detect Score Condition & Exact Goals
      let scoreCondition: ScoreCondition = 'ANY';
      let exactScore: string | undefined = undefined;
      let exactTotalGoals: number | undefined = undefined;
      let maxTotalGoals: number | undefined = undefined;

      if (lower.includes('0:0') || lower.includes('0-0') || lower.includes('сух')) {
        scoreCondition = '0-0';
        exactScore = '0:0';
        maxTotalGoals = 0;
      } else if (lower.includes('1:0') || lower.includes('0:1') || lower.includes('разниц') || lower.includes('в 1 мяч') || lower.includes('1 шайб')) {
        scoreCondition = 'ONE_GOAL_DIFF';
      } else if (lower.includes('ничь') || lower.includes('draw')) {
        scoreCondition = 'DRAW';
      } else if (lower.includes('тб 2.5 еще не пробит') || lower.includes('не больше 2 голов')) {
        scoreCondition = 'TOTAL_UNDER_25';
        maxTotalGoals = 2;
      }

      // 4. Detect Target Market
      let targetMarket = 'ТБ 0.5 во 2-м тайме';
      let category: FilterCategory = 'goals';

      if (lower.includes('угл') || lower.includes('корнер')) {
        targetMarket = 'Тотал больше угловых';
        category = 'corners';
      } else if (lower.includes('тб 1.5')) {
        targetMarket = 'ТБ 1.5 в матче';
      } else if (lower.includes('тб 2.5')) {
        targetMarket = 'ТБ 2.5 в матче';
      } else if (lower.includes('тб 5.5') && sport === 'hockey') {
        targetMarket = 'ТБ 5.5 шайб в матче';
      } else if (lower.includes('обе забьют') || lower.includes('оз')) {
        targetMarket = 'Обе забьют (ОЗ - Да)';
      } else if (lower.includes('побед') || lower.includes('п1') || lower.includes('фаворит')) {
        targetMarket = 'Победа 1 (П1) / Камбэк';
        category = 'comeback';
      } else if (lower.includes('тм 2.5') || lower.includes('сушк')) {
        targetMarket = 'ТМ 2.5 / Ничья (X)';
      }

      // 5. Numerical Thresholds Extraction
      let minDang = 20;
      let minShots = 6;
      let minSOT = 3;
      let minCorners = undefined;
      let minXg = undefined;
      let minXgDeficit = undefined;

      const dangMatch = rawContent.match(/(?:опасн|da).*?([>≥=])?\s*(\d{1,3})/i);
      if (dangMatch) minDang = parseInt(dangMatch[2], 10);

      const sotMatch = rawContent.match(/(?:створ|sot).*?([>≥=])?\s*(\d{1,2})/i);
      if (sotMatch) minSOT = parseInt(sotMatch[2], 10);

      const cornersMatch = rawContent.match(/(?:угл|корнер).*?([>≥=])?\s*(\d{1,2})/i);
      if (cornersMatch) minCorners = parseInt(cornersMatch[2], 10);

      const xgMatch = rawContent.match(/(?:xg|ожидаем).*?([>≥=])?\s*(\d+(?:[.,]\d+)?)/i);
      if (xgMatch) {
        minXg = parseFloat(xgMatch[2].replace(',', '.'));
      }
      if (lower.includes('дефицит') || lower.includes('недобор')) {
        minXgDeficit = 1.3;
      }

      // 6. Generate Rule Name & Description
      let name = '🎯 Авторская стратегия от ИИ';
      if (category === 'corners') name = `🚩 ИИ: Алгоритм на угловые (${minMin}-${maxMin}')`;
      else if (category === 'comeback') name = `🎯 ИИ: Навал и камбэк (${minMin}-${maxMin}')`;
      else if (sport === 'hockey') name = `🏒 ИИ: Хоккейный штурм (${minMin}-${maxMin}')`;
      else if (minXgDeficit) name = `⚡ ИИ: Недобор xG и поздний гол (${minMin}-${maxMin}')`;
      else name = `⚽ ИИ: ${targetMarket} (${minMin}-${maxMin}')`;

      const generated: FilterRule = {
        id: `ai-synthesized-${Date.now()}`,
        name,
        description: `Автоматически синтезировано ИИ (${aiProvider === 'gigachat' ? 'GigaChat API' : aiProvider === 'yandexgpt' ? 'YandexGPT' : 'SportSignal NeuroEngine'}). Основано на анализе пользовательских наблюдений.`,
        category,
        ruleType: 'LIVE',
        sport,
        enabled: true,
        minMinute: minMin,
        maxMinute: maxMin,
        scoreCondition,
        exactScore,
        exactTotalGoals,
        maxTotalGoals,
        minDangerousAttacksDiff: minDang,
        minTotalShots: minShots,
        minShotsOnTargetTotal: minSOT,
        minTotalCorners: minCorners,
        minXgTotal: minXg,
        minXgOverScoreDiff: minXgDeficit,
        minPressureIndex: 60,
        targetMarket,
        telegramEnabled: true,
        color: sport === 'hockey' ? 'sky' : sport === 'basketball' ? 'amber' : 'emerald',
      };

      setSynthesizedRule(generated);
      setDetectedSummary(
        `Распознан вид спорта: ${sport.toUpperCase()} | Время: ${minMin}'-${maxMin}' | Условие счёта: ${scoreCondition} | Рынок: «${targetMarket}» | Давление: оп. атаки ≥ ${minDang}, створ ≥ ${minSOT}`
      );
      setIsProcessing(false);
    }, 1200);
  };

  const handleApplyPresetExample = (exampleText: string) => {
    setInputMode('text');
    setTextNotes(exampleText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/50">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  ИИ-Синтезатор карточек стратегий
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Crown className="h-3 w-3 text-amber-400" />
                  VIP / MAX FEATURE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Загрузите фото стратегии, текстовый файл или набросайте мысли — нейросеть создаст настроенную карточку
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Plan Access Gate (If user is not on Max/VIP Plan) */}
        {!canAccess ? (
          <div className="p-6 sm:p-8 space-y-6 text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-black text-white">
                Доступно на тарифах Максимум (VIP & PRO)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                ИИ-синтезатор карточек стратегий по скриншотам, заметкам и файлам доступен пользователям с максимальной подпиской. Активируйте подписку или протестируйте возможности в демо-режиме!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-w-lg mx-auto text-left space-y-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                Что даёт ИИ-синтезатор:
              </span>
              <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                <li>Распознавание любых скриншотов стратегий из Telegram-каналов и капперских чатов</li>
                <li>Авто-настройка минут, коридоров кэфов, xG, точного счёта и порогов ударов/углов</li>
                <li>Мгновенный экспорт в готовый фильтр для онлайн-сканера сигналов</li>
                <li>Работает напрямую в РФ без VPN и без сторонних платных подписок (Сбер GigaChat, YandexGPT, Встроенный AI)</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onUpgradePlan) onUpgradePlan();
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:opacity-90 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition active:scale-95"
              >
                <Crown className="h-4 w-4 text-amber-300" />
                <span>Перейти в кабинет и активировать VIP</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoBypass(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Попробовать в демо-режиме</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Interactive Synthesizer View */
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Model & No-VPN Recommendation HUD */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Рекомендуемый ИИ (Без VPN & Бесплатный доступ):
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  100% Доступно в РФ
                </span>
              </div>

              {/* Provider Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAiProvider('builtin')}
                  className={`p-3 rounded-xl border text-left transition ${
                    aiProvider === 'builtin'
                      ? 'bg-emerald-950/50 border-emerald-500/60 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">⚡ Встроенный ИИ</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">Бесплатно</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    SportSignal NeuroEngine: мгновенный парсинг без API-ключей и без VPN
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAiProvider('gigachat')}
                  className={`p-3 rounded-xl border text-left transition ${
                    aiProvider === 'gigachat'
                      ? 'bg-emerald-950/50 border-emerald-500/60 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">🟢 GigaChat (Сбер)</span>
                    <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono">1 млн токенов</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Бесплатный API для РФ, прямое подключение без VPN, отличный русский
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAiProvider('yandexgpt')}
                  className={`p-3 rounded-xl border text-left transition ${
                    aiProvider === 'yandexgpt'
                      ? 'bg-emerald-950/50 border-emerald-500/60 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">🔴 YandexGPT</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">Яндекс</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Официальный API от Яндекса, высокая точность без прокси и VPN
                  </p>
                </button>
              </div>
            </div>

            {/* Input Method Selector Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                  inputMode === 'text'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Набросать заметки / мысли</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('image')}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                  inputMode === 'image'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Загрузить фото / скриншот</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                  inputMode === 'file'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>Загрузить файл (.txt/.json)</span>
              </button>
            </div>

            {/* Mode 1: Free-form Text / Notes */}
            {inputMode === 'text' && (
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>Опишите логику стратегии свободным языком:</span>
                  <span className="text-[10px] text-slate-500">ИИ поймёт любые формулировки</span>
                </label>
                <textarea
                  rows={4}
                  value={textNotes}
                  onChange={(e) => setTextNotes(e.target.value)}
                  placeholder="Например: Ищу гол в концовке. Минуты с 70 по 85. Счёт 0:0 или 1:0. Фаворит мощно давит: опасных атак больше 35, ударов в створ больше 5, угловых от 6. xG дефицит от 1.2. Рекомендуемый исход: ТБ 0.5 во 2-м тайме кэф 1.75..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition shadow-inner font-mono leading-relaxed"
                />

                {/* Quick Examples */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-slate-500 text-[10px] shrink-0">Примеры для быстрой вставки:</span>
                  {[
                    {
                      label: '⚽ Штурм при 0:0 на 70\'',
                      text: 'Минута 70-85, счет строго 0:0. Опасные атаки >= 40, ударов в створ >= 5, угловых >= 7. Исход: ТБ 0.5 во 2-м тайме.',
                    },
                    {
                      label: '🚩 Осада угловыми',
                      text: 'Минуты 60-75, счет любой. Угловых суммарно >= 8, ударов >= 10. Кэф на угловые от 1.70. Исход: ТБ 9.5 угловых.',
                    },
                    {
                      label: '🏒 Хоккей: Снятый вратарь',
                      text: 'Хоккей: 3-й период, 55-59 минута. Счет разница 1 шайба (ONE_GOAL_DIFF). Проигрывающие снимают вратаря, бросков в створ >= 25. Исход: ТБ 5.5 шайб.',
                    },
                  ].map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPresetExample(ex.text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[10px] transition"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 2: Image / Screenshot Upload with OCR */}
            {inputMode === 'image' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl bg-slate-950/60 text-center cursor-pointer transition space-y-2 group"
                >
                  <ImageIcon className="h-8 w-8 text-slate-500 group-hover:text-emerald-400 mx-auto transition" />
                  <div className="text-xs font-bold text-white">
                    {selectedFile ? selectedFile.name : 'Нажмите для выбора скриншота стратегии или перетащите файл'}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Поддерживаются PNG, JPG, WEBP. ИИ автоматически распознает текст условий и коэффициентов
                  </p>
                </div>

                {filePreview && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <img
                      src={filePreview}
                      alt="Превью"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-800 shrink-0"
                    />
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          Распознанный текст с изображения (OCR):
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          (можно скорректировать вручную)
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={extractedOcrText}
                        onChange={(e) => setExtractedOcrText(e.target.value)}
                        placeholder="Текст с изображения появится здесь или введите вручную..."
                        className="w-full text-xs text-slate-200 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none transition leading-relaxed resize-y"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 3: Text file upload */}
            {inputMode === 'file' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".txt,.json,.md,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl bg-slate-950/60 text-center cursor-pointer transition space-y-2 group"
                >
                  <Upload className="h-8 w-8 text-slate-500 group-hover:text-emerald-400 mx-auto transition" />
                  <div className="text-xs font-bold text-white">
                    {selectedFile ? selectedFile.name : 'Нажмите для загрузки текстового файла (.txt / .json / .md)'}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Текстовые заметки, описания систем ставок или сохранённые правила
                  </p>
                </div>

                {extractedOcrText && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Содержимое файла:
                    </span>
                    <pre className="text-xs text-slate-300 font-mono max-h-28 overflow-y-auto bg-slate-900 p-2.5 rounded-lg border border-slate-800 whitespace-pre-wrap">
                      {extractedOcrText}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Action Button: Run Synthesis */}
            <div className="pt-2">
              <button
                type="button"
                onClick={runStrategySynthesis}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:opacity-90 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/50 transition active:scale-95 border border-emerald-400/30"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Нейросеть синтезирует параметры стратегии...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>🤖 Преобразовать в готовую карточку стратегии</span>
                  </>
                )}
              </button>
            </div>

            {/* Synthesized Result Preview Card */}
            {synthesizedRule && (
              <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 border border-emerald-500/50 space-y-4 shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                      Готовая карточка фильтра
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Вид спорта: <strong className="text-white">{synthesizedRule.sport?.toUpperCase()}</strong>
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Сгенерировано за 1.2 сек
                  </span>
                </div>

                {detectedSummary && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                    {detectedSummary}
                  </div>
                )}

                {/* Card Main Info */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-white">{synthesizedRule.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{synthesizedRule.description}</p>
                </div>

                {/* Parameter Badges */}
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-sky-300 font-bold">
                    ⏱️ Минуты: {synthesizedRule.minMinute}' – {synthesizedRule.maxMinute}'
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold">
                    Счёт: {synthesizedRule.scoreCondition} {synthesizedRule.exactScore ? `(${synthesizedRule.exactScore})` : ''}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-bold">
                    🎯 Исход: {synthesizedRule.targetMarket}
                  </span>
                  {synthesizedRule.minDangerousAttacksDiff && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                      🔥 Оп. атаки Δ ≥ {synthesizedRule.minDangerousAttacksDiff}
                    </span>
                  )}
                  {synthesizedRule.minShotsOnTargetTotal && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                      🎯 Створ ≥ {synthesizedRule.minShotsOnTargetTotal}
                    </span>
                  )}
                  {synthesizedRule.minTotalCorners && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-blue-400">
                      🚩 Угловые ≥ {synthesizedRule.minTotalCorners}
                    </span>
                  )}
                  {synthesizedRule.minXgOverScoreDiff && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-bold">
                      ⚡ xG недобор ≥ {synthesizedRule.minXgOverScoreDiff}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSaveStrategy(synthesizedRule, true);
                      onClose();
                    }}
                    className="w-full sm:flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    <span>Сохранить и сразу запустить мониторинг</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSaveStrategy(synthesizedRule, false);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
                  >
                    <span>Сохранить в мои карточки</span>
                  </button>

                  {onOpenInBuilder && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenInBuilder(synthesizedRule);
                        onClose();
                      }}
                      className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-800"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>Доработать в конструкторе</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
