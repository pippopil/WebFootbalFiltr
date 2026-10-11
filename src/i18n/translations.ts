export type Language = 'ru' | 'en' | 'tr' | 'it' | 'zh';

export interface Translations {
  // Navigation
  navLiveMatches: string;
  navStrategies: string;
  navBacktest: string;
  navPrematch: string;
  navGuide: string;
  navMatrix: string;
  navCabinet: string;
  navDataSources: string;
  navSettings: string;
  navSignals: string;
  newFilter: string;
  
  // Header & Controls
  monitoringActive: string;
  monitoringPaused: string;
  sendDailyReport: string;
  dailyReportSent: string;
  telegramBot: string;
  searchPlaceholder: string;
  searchFiltersPlaceholder: string;
  refreshMatches: string;
  
  // Sports
  sportAll: string;
  sportFootball: string;
  sportHockey: string;
  sportBasketball: string;
  sportTennis: string;
  sportVolleyball: string;
  sportTableTennis: string;
  
  // Top Stable Strategies
  topStableFilter: string;
  topStableBadge: string;
  topStableRunAll: string;
  topStableTitle: string;
  topStableDesc: string;
  
  // Strategy Categories & Status
  catAll: string;
  catActive: string;
  catStopped: string;
  catGoals: string;
  catCorners: string;
  catComeback: string;
  catHalftime: string;
  catPressure: string;
  catOddsDrop: string;
  catCards: string;
  catCustom: string;
  
  // Strategy Card Actions
  btnStart: string;
  btnRunning: string;
  btnEdit: string;
  btnDelete: string;
  btnBacktest: string;
  btnAiAnalyze: string;
  btnNewStrategy: string;
  btnStopAll: string;
  btnOnlyRunning: string;
  
  // Match Status
  statusLive: string;
  statusHalftime: string;
  statusFinished: string;
  minute: string;
  dangerousAttacks: string;
  shotsOnTarget: string;
  corners: string;
  cards: string;
  possession: string;
  pressureIndex: string;
  
  // Daily Telegram Report
  reportTitle: string;
  reportSignalsTotal: string;
  reportPassed: string;
  reportFailed: string;
  reportRefund: string;
  reportWinRate: string;
  reportProfit: string;
  reportRoi: string;
  reportTopStrategies: string;
  reportOnDemandSuccess: string;
  reportCardTitle: string;
  reportCardDesc: string;
  reportCardAutoSchedule: string;
  reportCardSendNow: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ru: {
    navLiveMatches: 'Лайв Матчи',
    navStrategies: 'Стратегии и фильтры',
    navBacktest: 'Бэктест лаборатория',
    navPrematch: 'Прематч сканер',
    navGuide: 'Обучение & База',
    navMatrix: 'Матричный сканер',
    navCabinet: 'Личный кабинет',
    navDataSources: 'Источники данных',
    navSettings: 'Настройки',
    navSignals: 'Сигналы',
    newFilter: 'Новый фильтр',

    monitoringActive: 'Мониторинг активен',
    monitoringPaused: 'Пауза',
    sendDailyReport: '📊 Суточный отчёт в Telegram',
    dailyReportSent: '✅ Суточный отчёт отправлен в Telegram!',
    telegramBot: 'Telegram бот',
    searchPlaceholder: 'Поиск по команде, лиге, стране...',
    searchFiltersPlaceholder: 'Поиск по фильтрам и рынкам...',
    refreshMatches: 'Обновить live-матчи',

    sportAll: '🌐 Все виды спорта',
    sportFootball: '⚽ Футбол',
    sportHockey: '🏒 Хоккей',
    sportBasketball: '🏀 Баскетбол',
    sportTennis: '🎾 Теннис',
    sportVolleyball: '🏐 Волейбол',
    sportTableTennis: '🏓 Настольный теннис',

    topStableFilter: '🏆 ТОП-5 Стабильных',
    topStableBadge: 'ТОП-{rank} СТАБИЛЬНЫХ',
    topStableRunAll: '🚀 Запустить все ТОП-5 стратегий',
    topStableTitle: '5 самых стабильных стратегий по реальным матчам',
    topStableDesc: 'Отобраны на основе ретроспективного анализа 1 200+ завершенных матчей (проходимость 94–100%, кэфы от 1.72 до 1.85).',

    catAll: 'Все',
    catActive: 'Запущенные',
    catStopped: 'Остановленные',
    catGoals: 'Голы',
    catCorners: 'Угловые',
    catComeback: 'Камбэк',
    catHalftime: '1-й тайм',
    catPressure: 'Давление',
    catOddsDrop: 'Прогрузы & Дроп',
    catCards: 'Карточки',
    catCustom: 'Мои фильтры',

    btnStart: 'ЗАПУСТИТЬ',
    btnRunning: 'ЗАПУЩЕН',
    btnEdit: 'Редактировать',
    btnDelete: 'Удалить',
    btnBacktest: 'Тест на истории',
    btnAiAnalyze: 'AI-Анализ',
    btnNewStrategy: 'Создать стратегию',
    btnStopAll: 'Остановить все',
    btnOnlyRunning: 'Только запущенные',

    statusLive: 'В ИГРЕ',
    statusHalftime: 'ПЕРЕРЫВ',
    statusFinished: 'ЗАВЕРШЕН',
    minute: 'мин',
    dangerousAttacks: 'Оп. атаки',
    shotsOnTarget: 'В створ',
    corners: 'Угловые',
    cards: 'Карточки',
    possession: 'Владение',
    pressureIndex: 'Индекс давления',

    reportTitle: '📊 СУТОЧНЫЙ ОТЧЁТ СИГНАЛОВ И ПРОХОДИМОСТИ',
    reportSignalsTotal: 'Всего сигналов',
    reportPassed: 'Прошло (WIN)',
    reportFailed: 'Не прошло (LOSS)',
    reportRefund: 'Возврат (REFUND)',
    reportWinRate: 'Проходимость',
    reportProfit: 'Итоговый профит',
    reportRoi: 'ROI',
    reportTopStrategies: 'ТОП стратегий за сутки',
    reportOnDemandSuccess: 'Суточный отчет успешно отправлен в Telegram',
    reportCardTitle: '📊 Суточный отчёт по сигналам и проходимости',
    reportCardDesc: 'Сводка за 24 часа: сколько событий сыграло (WIN), сколько не прошло (LOSS), проходимость и финансовый результат.',
    reportCardAutoSchedule: '⏰ Автоматическая рассылка: ежедневно в 23:59',
    reportCardSendNow: 'Отправить отчёт в Telegram сейчас',
  },

  en: {
    navLiveMatches: 'Live Matches',
    navStrategies: 'Strategies & Filters',
    navBacktest: 'Backtest Lab',
    navPrematch: 'Prematch Scanner',
    navGuide: 'Education & Guide',
    navMatrix: 'Matrix Scanner',
    navCabinet: 'Personal Cabinet',
    navDataSources: 'Data Sources',
    navSettings: 'Settings',
    navSignals: 'Signals',
    newFilter: 'New Filter',

    monitoringActive: 'Monitoring Active',
    monitoringPaused: 'Paused',
    sendDailyReport: '📊 Daily Report to Telegram',
    dailyReportSent: '✅ Daily report sent to Telegram!',
    telegramBot: 'Telegram Bot',
    searchPlaceholder: 'Search by team, league, country...',
    searchFiltersPlaceholder: 'Search filters and markets...',
    refreshMatches: 'Refresh live matches',

    sportAll: '🌐 All Sports',
    sportFootball: '⚽ Football',
    sportHockey: '🏒 Hockey',
    sportBasketball: '🏀 Basketball',
    sportTennis: '🎾 Tennis',
    sportVolleyball: '🏐 Volleyball',
    sportTableTennis: '🏓 Table Tennis',

    topStableFilter: '🏆 TOP-5 Stable',
    topStableBadge: 'TOP-{rank} STABLE',
    topStableRunAll: '🚀 Run all TOP-5 Strategies',
    topStableTitle: 'Top 5 Most Stable Strategies on Real Matches',
    topStableDesc: 'Selected based on retrospective analysis of 1,200+ real completed fixtures (94–100% win rate, odds 1.72–1.85).',

    catAll: 'All',
    catActive: 'Active',
    catStopped: 'Paused',
    catGoals: 'Goals',
    catCorners: 'Corners',
    catComeback: 'Comeback',
    catHalftime: '1st Half',
    catPressure: 'Pressure',
    catOddsDrop: 'Odds Drops & Money',
    catCards: 'Cards',
    catCustom: 'My Filters',

    btnStart: 'RUN',
    btnRunning: 'ACTIVE',
    btnEdit: 'Edit',
    btnDelete: 'Delete',
    btnBacktest: 'Backtest',
    btnAiAnalyze: 'AI Analyst',
    btnNewStrategy: 'New Strategy',
    btnStopAll: 'Stop All',
    btnOnlyRunning: 'Only Active',

    statusLive: 'LIVE',
    statusHalftime: 'HT',
    statusFinished: 'FT',
    minute: 'min',
    dangerousAttacks: 'Dang. attacks',
    shotsOnTarget: 'On target',
    corners: 'Corners',
    cards: 'Cards',
    possession: 'Possession',
    pressureIndex: 'Pressure Index',

    reportTitle: '📊 DAILY SIGNALS & PASS-RATE REPORT',
    reportSignalsTotal: 'Total Signals',
    reportPassed: 'Passed (WIN)',
    reportFailed: 'Failed (LOSS)',
    reportRefund: 'Refund (REFUND)',
    reportWinRate: 'Win Rate',
    reportProfit: 'Net Profit',
    reportRoi: 'ROI',
    reportTopStrategies: 'Top Daily Strategies',
    reportOnDemandSuccess: 'Daily report successfully sent to Telegram',
    reportCardTitle: '📊 Daily Signals & Pass Rate Report',
    reportCardDesc: '24-hour recap: how many events passed (WIN), how many failed (LOSS), overall win rate and net profit.',
    reportCardAutoSchedule: '⏰ Automatic dispatch: daily at 23:59',
    reportCardSendNow: 'Send Daily Report to Telegram Now',
  },

  tr: {
    navLiveMatches: 'Canlı Maçlar',
    navStrategies: 'Stratejiler ve Filtreler',
    navBacktest: 'Geriye Dönük Test',
    navPrematch: 'Maç Öncesi Tarayıcı',
    navGuide: 'Eğitim & Rehber',
    navMatrix: 'Matris Tarayıcı',
    navCabinet: 'Kişisel Panel',
    navDataSources: 'Veri Kaynakları',
    navSettings: 'Ayarlar',
    navSignals: 'Sinyaller',
    newFilter: 'Yeni Filtre',

    monitoringActive: 'İzleme Aktif',
    monitoringPaused: 'Duraklatıldı',
    sendDailyReport: '📊 Telegram Günlük Raporu',
    dailyReportSent: '✅ Günlük rapor Telegram’a gönderildi!',
    telegramBot: 'Telegram Botu',
    searchPlaceholder: 'Takım, lig, ülke ara...',
    searchFiltersPlaceholder: 'Filtre ve bahis ara...',
    refreshMatches: 'Canlı maçları yenile',

    sportAll: '🌐 Tüm Sporlar',
    sportFootball: '⚽ Futbol',
    sportHockey: '🏒 Buz Hokeyi',
    sportBasketball: '🏀 Basketbol',
    sportTennis: '🎾 Tenis',
    sportVolleyball: '🏐 Voleybol',
    sportTableTennis: '🏓 Masa Tenisi',

    topStableFilter: '🏆 EN İYİ 5 Kararlı',
    topStableBadge: 'EN İYİ-{rank} KARARLI',
    topStableRunAll: '🚀 En İyi 5 Stratejiyi Başlat',
    topStableTitle: 'Gerçek Maçlara Dayalı En Kararlı 5 Strateji',
    topStableDesc: '1.200+ tamamlanmış gerçek maça göre seçilmiştir (%94–%100 kazanma oranı, oranlar 1.72–1.85).',

    catAll: 'Tümü',
    catActive: 'Aktif',
    catStopped: 'Durduruldu',
    catGoals: 'Goller',
    catCorners: 'Kornerler',
    catComeback: 'Geri Dönüş',
    catHalftime: '1. Yarı',
    catPressure: 'Baskı',
    catOddsDrop: 'Oran Düşüşleri',
    catCards: 'Kartlar',
    catCustom: 'Filtrelerim',

    btnStart: 'BAŞLAT',
    btnRunning: 'AKTİF',
    btnEdit: 'Düzenle',
    btnDelete: 'Sil',
    btnBacktest: 'Geriye Test',
    btnAiAnalyze: 'Yapay Zeka Analizi',
    btnNewStrategy: 'Yeni Strateji',
    btnStopAll: 'Hepsini Durdur',
    btnOnlyRunning: 'Yalnızca Aktif',

    statusLive: 'CANLI',
    statusHalftime: 'İY',
    statusFinished: 'MS',
    minute: 'dk',
    dangerousAttacks: 'Tehlikeli Atak',
    shotsOnTarget: 'İsabetli Şut',
    corners: 'Korner',
    cards: 'Kartlar',
    possession: 'Topla Oynama',
    pressureIndex: 'Baskı İndeksi',

    reportTitle: '📊 GÜNLÜK SİNYAL VE BAŞARI RAPORU',
    reportSignalsTotal: 'Toplam Sinyal',
    reportPassed: 'Kazandı (WIN)',
    reportFailed: 'Kaybetti (LOSS)',
    reportRefund: 'İade (REFUND)',
    reportWinRate: 'Başarı Oranı',
    reportProfit: 'Net Kâr',
    reportRoi: 'ROI',
    reportTopStrategies: 'Günün En İyi Stratejileri',
    reportOnDemandSuccess: 'Günlük rapor Telegram’a başarıyla iletildi',
    reportCardTitle: '📊 Günlük Sinyal ve Başarı Raporu',
    reportCardDesc: '24 saatlik özet: kaç etkinlik kazandı (WIN), kaçı kaybetti (LOSS), toplam başarı oranı ve net kâr.',
    reportCardAutoSchedule: '⏰ Otomatik gönderim: her gün saat 23:59',
    reportCardSendNow: 'Telegram Günlük Raporunu Şimdi Gönder',
  },

  it: {
    navLiveMatches: 'Partite Live',
    navStrategies: 'Strategie e Filtri',
    navBacktest: 'Laboratorio Backtest',
    navPrematch: 'Scanner Prematch',
    navGuide: 'Formazione & Guida',
    navMatrix: 'Scanner a Matrice',
    navCabinet: 'Area Personale',
    navDataSources: 'Fonti Dati',
    navSettings: 'Impostazioni',
    navSignals: 'Segnali',
    newFilter: 'Nuovo Filtro',

    monitoringActive: 'Monitoraggio attivo',
    monitoringPaused: 'In pausa',
    sendDailyReport: '📊 Report giornaliero su Telegram',
    dailyReportSent: '✅ Report giornaliero inviato su Telegram!',
    telegramBot: 'Bot Telegram',
    searchPlaceholder: 'Cerca per squadra, campionato, paese...',
    searchFiltersPlaceholder: 'Cerca per filtri e mercati...',
    refreshMatches: 'Aggiorna partite live',

    sportAll: '🌐 Tutti gli sport',
    sportFootball: '⚽ Calcio',
    sportHockey: '🏒 Hockey su ghiaccio',
    sportBasketball: '🏀 Basket',
    sportTennis: '🎾 Tennis',
    sportVolleyball: '🏐 Pallavolo',
    sportTableTennis: '🏓 Tennis da tavolo',

    topStableFilter: '🏆 TOP-5 Più Stabili',
    topStableBadge: 'TOP-{rank} STABILI',
    topStableRunAll: '🚀 Avvia tutte le 5 strategie TOP',
    topStableTitle: '5 strategie più stabili su partite reali',
    topStableDesc: 'Selezionate in base ad analisi retrospettiva di oltre 1.200 partite concluse (win rate 94–100%, quote 1.72–1.85).',

    catAll: 'Tutte',
    catActive: 'Attive',
    catStopped: 'Fermate',
    catGoals: 'Gol',
    catCorners: 'Calci d’angolo',
    catComeback: 'Rimonta',
    catHalftime: '1° Tempo',
    catPressure: 'Pressione',
    catOddsDrop: 'Flussi & Calo Quote',
    catCards: 'Cartellini',
    catCustom: 'I miei filtri',

    btnStart: 'AVVIA',
    btnRunning: 'ATTIVO',
    btnEdit: 'Modifica',
    btnDelete: 'Elimina',
    btnBacktest: 'Test storico',
    btnAiAnalyze: 'Analisi AI',
    btnNewStrategy: 'Nuova strategia',
    btnStopAll: 'Ferma tutte',
    btnOnlyRunning: 'Solo attive',

    statusLive: 'IN CORSO',
    statusHalftime: 'INTERVALLO',
    statusFinished: 'TERMINATA',
    minute: 'min',
    dangerousAttacks: 'Attacchi per.',
    shotsOnTarget: 'Tiri in porta',
    corners: 'Angoli',
    cards: 'Cartellini',
    possession: 'Possesso',
    pressureIndex: 'Indice di pressione',

    reportTitle: '📊 REPORT GIORNALIERO SEGNALI E RENDIMENTO',
    reportSignalsTotal: 'Totale segnali',
    reportPassed: 'Vincenti (WIN)',
    reportFailed: 'Perdenti (LOSS)',
    reportRefund: 'Rimborso (REFUND)',
    reportWinRate: 'Percentuale successo',
    reportProfit: 'Profitto netto',
    reportRoi: 'ROI',
    reportTopStrategies: 'TOP strategie del giorno',
    reportOnDemandSuccess: 'Report giornaliero inviato con successo a Telegram',
    reportCardTitle: '📊 Report giornaliero segnali e rendimento',
    reportCardDesc: 'Riepilogo delle 24 ore: quante giocate hanno vinto (WIN), quante perse (LOSS), tasso di successo e profitto netto.',
    reportCardAutoSchedule: '⏰ Invio automatico: ogni giorno alle 23:59',
    reportCardSendNow: 'Invia subito il report a Telegram',
  },

  zh: {
    navLiveMatches: '实时比赛',
    navStrategies: '策略与过滤器',
    navBacktest: '历史回测实验室',
    navPrematch: '赛前扫描器',
    navGuide: '教程与知识库',
    navMatrix: '矩阵扫描器',
    navCabinet: '个人中心',
    navDataSources: '数据源',
    navSettings: '系统设置',
    navSignals: '预警信号',
    newFilter: '新建过滤器',

    monitoringActive: '实时监控中',
    monitoringPaused: '已暂停',
    sendDailyReport: '📊 发送每日报告至 Telegram',
    dailyReportSent: '✅ 每日报告已成功发送至 Telegram！',
    telegramBot: 'Telegram 机器人',
    searchPlaceholder: '搜索球队、联赛、国家...',
    searchFiltersPlaceholder: '搜索过滤器与投注盘口...',
    refreshMatches: '刷新实时比赛',

    sportAll: '🌐 全部体育项目',
    sportFootball: '⚽ 足球',
    sportHockey: '🏒 冰球',
    sportBasketball: '🏀 篮球',
    sportTennis: '🎾 网球',
    sportVolleyball: '🏐 排球',
    sportTableTennis: '🏓 乒乓球',

    topStableFilter: '🏆 TOP-5 高胜率稳健策略',
    topStableBadge: 'TOP-{rank} 稳健策略',
    topStableRunAll: '🚀 一键启动全部 TOP-5 策略',
    topStableTitle: '基于真实比赛精选的 5 大最高胜率稳定策略',
    topStableDesc: '基于对 1,200+ 场真实完赛赛事的历史回测深度优选（胜率 94–100%，赔率 1.72–1.85）。',

    catAll: '全部',
    catActive: '运行中',
    catStopped: '已停止',
    catGoals: '进球',
    catCorners: '角球',
    catComeback: '逆转追赶',
    catHalftime: '上半场',
    catPressure: '场面压制',
    catOddsDrop: '资金流向与赔率异动',
    catCards: '红黄牌',
    catCustom: '自定义策略',

    btnStart: '启动策略',
    btnRunning: '运行中',
    btnEdit: '编辑',
    btnDelete: '删除',
    btnBacktest: '历史回测',
    btnAiAnalyze: 'AI 深度分析',
    btnNewStrategy: '新建策略',
    btnStopAll: '全部暂停',
    btnOnlyRunning: '仅看运行中',

    statusLive: '比赛进行中',
    statusHalftime: '中场休息',
    statusFinished: '比赛结束',
    minute: '分',
    dangerousAttacks: '危险进攻',
    shotsOnTarget: '射正次数',
    corners: '角球数',
    cards: '红黄牌',
    possession: '控球率',
    pressureIndex: '攻防压制指数',

    reportTitle: '📊 每日信号与胜率统计报告',
    reportSignalsTotal: '信号总数',
    reportPassed: '命中盈利 (WIN)',
    reportFailed: '未命中 (LOSS)',
    reportRefund: '走盘退款 (REFUND)',
    reportWinRate: '综合胜率',
    reportProfit: '累计净利润',
    reportRoi: '投资回报率 (ROI)',
    reportTopStrategies: '今日最佳策略榜',
    reportOnDemandSuccess: '每日报告已成功推送至 Telegram',
    reportCardTitle: '📊 每日信号与盈利率汇总报告',
    reportCardDesc: '过去 24 小时完整复盘：盈利场次 (WIN)、失利场次 (LOSS)、综合命中率以及财务盈亏数据。',
    reportCardAutoSchedule: '⏰ 自动推送时间：每日 23:59',
    reportCardSendNow: '立即推送报告至 Telegram',
  },
};
