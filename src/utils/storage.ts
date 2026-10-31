import { FilterRule } from '../types';

/**
 * Robust LocalStorage Utility with automatic quota eviction, 
 * filter payload compaction, and error boundary protection.
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
      else if (key.startsWith('sportsignal_analytics_') || key.startsWith('footbalmonitor_debug_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });

    // Prune signals to latest 40 items if oversized
    try {
      const rawSignals = localStorage.getItem('footbalmonitor_signals');
      if (rawSignals && rawSignals.length > 200000) {
        const parsed = JSON.parse(rawSignals);
        if (Array.isArray(parsed) && parsed.length > 40) {
          localStorage.setItem('footbalmonitor_signals', JSON.stringify(parsed.slice(0, 40)));
        }
      }
    } catch {}

    // Prune anti-spam tracker if oversized
    try {
      const rawTracker = localStorage.getItem('footbalmonitor_sent_signals_tracker');
      if (rawTracker && rawTracker.length > 100000) {
        const parsed = JSON.parse(rawTracker);
        if (Array.isArray(parsed) && parsed.length > 30) {
          localStorage.setItem('footbalmonitor_sent_signals_tracker', JSON.stringify(parsed.slice(-30)));
        }
      }
    } catch {}
  } catch (err) {
    console.warn('[Storage] Cache eviction warning:', err);
  }
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

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[Storage] safeSetItem initial attempt failed for "${key}". Attempting eviction...`, err?.name);

    try {
      evictStorageCache();

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

      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.error(`[Storage] safeSetItem: Quota permanently exceeded for key "${key}". Gracefully suppressed.`, retryErr);

      // Last-ditch: if it's a filter key, remove heavy accumulated caches and try once more
      try {
        localStorage.removeItem('footbalmonitor_live_accumulated_matches_v1');
        localStorage.removeItem('footbalmonitor_sent_signals_tracker');
        if (key.includes('filters')) {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            const compacted = compactFiltersForStorage(parsed);
            localStorage.setItem(key, JSON.stringify(compacted));
            return true;
          }
        }
      } catch {}

      return false;
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
