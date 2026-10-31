import { FilterRule, SignalAlert } from '../types';

/**
 * Robust LocalStorage Utility with automatic quota eviction, 
 * filter and signal payload compaction, and error boundary protection.
 */

const NON_ESSENTIAL_KEYS_TO_EVICT = [
  'footbalmonitor_live_accumulated_matches_v1',
  'footbalmonitor_sent_signals_tracker',
  'footbalmonitor_daily_prematch_cache_',
  'sportsignal_analytics_',
  'footbalmonitor_analytics_history',
];

/**
 * Evicts non-essential cached data (telemetry logs, old prematch caches, oversized trackers)
 * to free up storage space when QuotaExceededError occurs.
 */
export function evictStorageCache(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const keysToRemove: string[] = [];
    const todayStr = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Remove accumulated live match snapshots (can take 2-3 MB)
      if (key === 'footbalmonitor_live_accumulated_matches_v1') {
        keysToRemove.push(key);
      }
      // Remove old prematch caches from previous days
      else if (key.startsWith('footbalmonitor_daily_prematch_cache_') && !key.endsWith(todayStr)) {
        keysToRemove.push(key);
      }
      // Remove legacy analytics dumps or debug trackers
      else if (key.startsWith('sportsignal_analytics_') || key.startsWith('footbalmonitor_debug_') || key.startsWith('footbalmonitor_analytics_history')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });

    // Prune anti-spam tracker if oversized
    try {
      const rawTracker = localStorage.getItem('footbalmonitor_sent_signals_tracker');
      if (rawTracker && rawTracker.length > 50000) {
        localStorage.removeItem('footbalmonitor_sent_signals_tracker');
      }
    } catch {}

    // Prune signals safely to latest 30 items if oversized
    try {
      const rawSignals = localStorage.getItem('footbalmonitor_signals');
      if (rawSignals && rawSignals.length > 100000) {
        const parsed = JSON.parse(rawSignals);
        if (Array.isArray(parsed) && parsed.length > 30) {
          const trimmed = compactSignalsForStorage(parsed, 30);
          localStorage.setItem('footbalmonitor_signals', JSON.stringify(trimmed));
        }
      }
    } catch {}
  } catch (err) {
    console.warn('[Storage] Cache eviction warning:', err);
  }
}

/**
 * Compacts signals for storage to prevent QuotaExceededError while retaining 
 * essential metadata for the UI, analytics, and outcome tracking.
 */
export function compactSignalsForStorage(signals: SignalAlert[], limit: number = 80): any[] {
  if (!Array.isArray(signals)) return [];
  return signals.slice(0, limit).map((s) => ({
    id: s.id,
    timestamp: s.timestamp,
    matchId: s.matchId,
    matchName: s.matchName,
    league: s.league,
    country: s.country,
    sport: s.sport,
    minute: s.minute,
    score: s.score,
    period: s.period,
    statsSnapshot: s.statsSnapshot,
    finalStats: s.finalStats,
    strategyMetricSnapshot: s.strategyMetricSnapshot,
    ruleId: s.ruleId,
    ruleName: s.ruleName,
    ruleCategory: s.ruleCategory,
    // Cap message length to 600 chars to avoid multi-kilobyte text dumps
    message: typeof s.message === 'string' && s.message.length > 600 ? s.message.slice(0, 600) + '...' : s.message,
    sentToTelegram: s.sentToTelegram,
    telegramStatusText: s.telegramStatusText,
    telegramMessageId: s.telegramMessageId,
    marketSuggestion: s.marketSuggestion,
    noResolutionTrack: s.noResolutionTrack,
    trackOutcome: s.trackOutcome,
    botId: s.botId,
    botName: s.botName,
    userId: s.userId,
    betType: s.betType,
    outcome: s.outcome,
    odds: s.odds,
    stake: s.stake,
    profit: s.profit,
    finalScore: s.finalScore,
    initialScore: s.initialScore,
    resolvedAt: s.resolvedAt,
    resolutionNote: s.resolutionNote,
    isCombo: s.isCombo,
    comboCount: s.comboCount,
    comboStrategyNames: s.comboStrategyNames,
    comboRuleIds: s.comboRuleIds,
    comboRecommendation: s.comboRecommendation,
    comboConfidence: s.comboConfidence,
    comboTargetCluster: s.comboTargetCluster,
    comboClusterName: s.comboClusterName,
    targetAction: s.targetAction,
    targetLine: s.targetLine,
    telegramEdited: s.telegramEdited,
    telegramEditedAt: s.telegramEditedAt,
  }));
}

/**
 * Compacts filters for storage: factory presets only need state flags (enabled, botId, etc.)
 * because static criteria (descriptions, formulas) are rehydrated from EXPANDED_DEFAULT_FILTERS.
 * This shrinks 70+ filters from ~150 KB to ~3 KB (a 98% space reduction).
 */
export function compactFiltersForStorage(filters: FilterRule[]): any[] {
  return filters.map((f) => {
    if (f.isPreset) {
      // Store compact representation of preset filter
      return {
        id: f.id,
        enabled: f.enabled,
        telegramEnabled: f.telegramEnabled,
        botId: f.botId,
        userId: f.userId,
        isPreset: true,
        color: f.color,
        sport: f.sport,
      };
    }
    // Custom user filters: keep full rule
    return f;
  });
}

/**
 * Rehydrates compact or full filters from storage against default presets
 */
export function rehydrateStoredFilters(
  stored: any[],
  defaultPresets: FilterRule[],
  userId?: string
): FilterRule[] {
  if (!Array.isArray(stored) || stored.length === 0) return defaultPresets;

  const defaultPresetMap = new Map(defaultPresets.map((p) => [p.id, p]));

  const rehydrated = stored.map((item: any) => {
    if (item.isPreset || defaultPresetMap.has(item.id)) {
      const basePreset = defaultPresetMap.get(item.id);
      if (basePreset) {
        return {
          ...basePreset,
          enabled: item.enabled !== undefined ? item.enabled : basePreset.enabled,
          telegramEnabled: item.telegramEnabled !== undefined ? item.telegramEnabled : basePreset.telegramEnabled,
          botId: item.botId || basePreset.botId,
          userId: item.userId || userId,
          color: item.color || basePreset.color,
          sport: item.sport || basePreset.sport,
        };
      }
    }
    return item as FilterRule;
  });

  return rehydrated;
}

/**
 * Safe LocalStorage setItem with automatic error containment and quota eviction.
 * Never throws QuotaExceededError or crashes React rendering.
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  // Pre-emptive compaction for signals and filters
  let payload = value;
  if (key === 'footbalmonitor_signals') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        payload = JSON.stringify(compactSignalsForStorage(parsed, 80));
      }
    } catch {}
  } else if (key.includes('filters')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        payload = JSON.stringify(compactFiltersForStorage(parsed));
      }
    } catch {}
  }

  try {
    localStorage.setItem(key, payload);
    return true;
  } catch (err: any) {
    console.warn(`[Storage] safeSetItem initial attempt failed for "${key}". Attempting eviction...`, err?.name);

    try {
      evictStorageCache();

      // Progressive compaction fallback for signals
      if (key === 'footbalmonitor_signals') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            try {
              localStorage.setItem(key, JSON.stringify(compactSignalsForStorage(parsed, 40)));
              return true;
            } catch {
              try {
                localStorage.setItem(key, JSON.stringify(compactSignalsForStorage(parsed, 20)));
                return true;
              } catch {
                localStorage.setItem(key, JSON.stringify(compactSignalsForStorage(parsed, 10)));
                return true;
              }
            }
          }
        } catch {}
      }

      // If storing filters, try storing compacted version
      if (key.includes('filters')) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            const compacted = compactFiltersForStorage(parsed);
            localStorage.setItem(key, JSON.stringify(compacted));
            return true;
          }
        } catch {}
      }

      localStorage.setItem(key, payload);
      return true;
    } catch (retryErr) {
      console.warn(`[Storage] safeSetItem: Quota heavily constrained for key "${key}". Deep cleaning...`);

      // Last-ditch: purge non-essential stores and retry with minimal payload
      try {
        localStorage.removeItem('footbalmonitor_live_accumulated_matches_v1');
        localStorage.removeItem('footbalmonitor_sent_signals_tracker');
        localStorage.removeItem('footbalmonitor_analytics_history');

        if (key === 'footbalmonitor_signals') {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            localStorage.setItem(key, JSON.stringify(compactSignalsForStorage(parsed, 15)));
            return true;
          }
        }

        if (key.includes('filters')) {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            const compacted = compactFiltersForStorage(parsed);
            localStorage.setItem(key, JSON.stringify(compacted));
            return true;
          }
        }

        localStorage.setItem(key, payload);
        return true;
      } catch {
        // Suppress gracefully without crashing UI or logging unhandled error
        return false;
      }
    }
  }
}

/**
 * Safe LocalStorage getItem
 */
export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safe LocalStorage removeItem
 */
export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}
