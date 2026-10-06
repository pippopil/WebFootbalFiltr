export type Language = 'ru' | 'en' | 'tr';

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
};
