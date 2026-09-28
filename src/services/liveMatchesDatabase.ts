import { Match, HistoricalMatch, HistoricalSnapshot } from '../types';

const STORAGE_KEY = 'footbalmonitor_live_accumulated_matches_v1';

/**
 * Converts a current live or finished Match into a HistoricalMatch format
 * so that it can be processed by runBacktest just like archival datasets.
 */
export function convertLiveMatchToHistorical(match: Match): HistoricalMatch {
  const finalCorners: [number, number] = [match.stats.corners[0], match.stats.corners[1]];
  const finalYellowCards: [number, number] = [match.stats.yellowCards[0], match.stats.yellowCards[1]];
  const finalRedCards: [number, number] = [match.stats.redCards[0], match.stats.redCards[1]];
  const finalScore: [number, number] = [match.score[0], match.score[1]];

  const snapshot: HistoricalSnapshot = {
    minute: match.minute || 1,
    score: [match.score[0], match.score[1]],
    stats: { ...match.stats },
    odds: match.odds ? {
      home: match.odds.home,
      draw: match.odds.draw,
      away: match.odds.away,
      over25: match.odds.over25,
      under25: match.odds.under25,
      btts: match.odds.btts,
    } : undefined,
    oddsDrop: match.oddsDrop,
    marketFlows: match.marketFlows,
  };

  return {
    id: match.id,
    date: match.startTime || new Date().toISOString().slice(0, 10),
    league: match.league || 'Неизвестная лига',
    country: match.country || 'Мир',
    countryCode: match.countryCode || '🌐',
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    finalScore,
    finalCorners,
    finalYellowCards,
    finalRedCards,
    snapshots: [snapshot],
    history: match.history,
  };
}

/**
 * Load accumulated live matches from localStorage
 */
export function loadAccumulatedLiveMatches(): HistoricalMatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    console.error('Failed to load accumulated live matches', err);
  }
  return [];
}

/**
 * Save / append matches to accumulated database.
 * If match exists, update its snapshots and final score; if new, add it.
 */
export function saveMatchesToAccumulatedLiveDB(incomingMatches: Match[]): number {
  if (!incomingMatches || incomingMatches.length === 0) return 0;

  try {
    const current = loadAccumulatedLiveMatches();
    const map = new Map<string, HistoricalMatch>();

    // Index existing
    for (const m of current) {
      map.set(m.id, m);
    }

    let addedOrUpdated = 0;
    for (const m of incomingMatches) {
      if (!m.id || !m.homeTeam || !m.awayTeam) continue;

      const existing = map.get(m.id);
      const newSnapshot: HistoricalSnapshot = {
        minute: m.minute || 1,
        score: [m.score[0], m.score[1]],
        stats: { ...m.stats },
        odds: m.odds ? {
          home: m.odds.home,
          draw: m.odds.draw,
          away: m.odds.away,
          over25: m.odds.over25,
          under25: m.odds.under25,
          btts: m.odds.btts,
        } : undefined,
        oddsDrop: m.oddsDrop,
        marketFlows: m.marketFlows,
      };

      if (existing) {
        // Update final status
        existing.finalScore = [m.score[0], m.score[1]];
        existing.finalCorners = [m.stats.corners[0], m.stats.corners[1]];
        existing.finalYellowCards = [m.stats.yellowCards[0], m.stats.yellowCards[1]];
        existing.finalRedCards = [m.stats.redCards[0], m.stats.redCards[1]];
        if (m.history) {
          existing.history = { ...existing.history, ...m.history };
        }

        // Append snapshot if minute changed (avoid duplicates)
        const lastMinute = existing.snapshots[existing.snapshots.length - 1]?.minute;
        if (lastMinute !== newSnapshot.minute) {
          existing.snapshots.push(newSnapshot);
          addedOrUpdated++;
        }
      } else {
        const hist = convertLiveMatchToHistorical(m);
        map.set(m.id, hist);
        addedOrUpdated++;
      }
    }

    const updatedList = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList.length;
  } catch (err) {
    console.error('Failed to save accumulated live matches', err);
    return 0;
  }
}

/**
 * Clear the accumulated live matches database (reset from scratch)
 */
export function clearAccumulatedLiveDB(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear accumulated live matches', err);
  }
}
