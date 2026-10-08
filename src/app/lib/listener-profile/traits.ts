import {
  clamp,
  normalizeRatio,
  TRAIT_WEIGHTS,
  weightedScore,
} from "./config";
import type { ListenerStats, ListenerTraits } from "./types";

/**
 * Explorer Score (0–100)
 * Measures inclination toward discovering new, unfamiliar DJs and broad musical variety.
 * High: high new DJ ratio, high DJ diversity, low repeat-listening.
 */
export function calculateExplorer(stats: ListenerStats): number {
  if (stats.totalInteractions === 0 && stats.setsStarted === 0) return 0;

  const setsCount = Math.max(stats.setsStarted, stats.savedSets, 1);
  const djDiversityRatio = normalizeRatio(stats.uniqueDjs / setsCount);

  const baseScore = weightedScore([
    {
      value: stats.newDjListenRatio * 100,
      weight: TRAIT_WEIGHTS.explorer.newDjWeight,
    },
    {
      value: djDiversityRatio * 100,
      weight: TRAIT_WEIGHTS.explorer.diversityWeight,
    },
  ]);

  const penalty =
    stats.repeatDjRatio * 100 * TRAIT_WEIGHTS.explorer.repeatPenalty;
  return clamp(Math.round(baseScore - penalty));
}

/**
 * Deep Listener Score (0–100)
 * Measures willingness to commit to long sessions and listen through full DJ sets.
 * High: high average set completion rate, high listening minutes per set.
 */
export function calculateDeepListener(stats: ListenerStats): number {
  if (stats.totalInteractions === 0 && stats.setsStarted === 0) return 0;

  const setsCount = Math.max(stats.setsStarted, stats.savedSets, 1);
  const avgMinutesPerSet = stats.totalListeningMinutes / setsCount;
  // 45 minutes considered reference standard for deep immersion
  const relativeListeningScore = normalizeRatio(avgMinutesPerSet / 45) * 100;

  // If completion rate was measured, combine it with listening duration.
  // If telemetry completion is 0 but user has moments placed deep in sets, blend that.
  let completionValue = stats.avgCompletionRate * 100;
  if (completionValue === 0 && stats.avgMomentTimestampRatio > 0) {
    completionValue = stats.avgMomentTimestampRatio * 85;
  }

  return weightedScore([
    {
      value: completionValue,
      weight: TRAIT_WEIGHTS.deepListener.completionRateWeight,
    },
    {
      value: relativeListeningScore,
      weight: TRAIT_WEIGHTS.deepListener.relativeListeningWeight,
    },
  ]);
}

/**
 * Collector Score (0–100)
 * Measures passion for saving, cataloging, and archiving sets and moments.
 * High: high saved sets count relative to listened sets, high saved moments.
 */
export function calculateCollector(stats: ListenerStats): number {
  if (stats.totalInteractions === 0 && stats.savedSets === 0 && stats.savedMoments === 0) {
    return 0;
  }

  // 10 saved sets & 15 saved moments scale to reference full collector marks
  const setSaveScore = normalizeRatio(stats.savedSets / 10) * 100;
  const momentSaveScore = normalizeRatio(stats.savedMoments / 15) * 100;

  return weightedScore([
    {
      value: setSaveScore,
      weight: TRAIT_WEIGHTS.collector.savedSetsWeight,
    },
    {
      value: momentSaveScore,
      weight: TRAIT_WEIGHTS.collector.savedMomentsWeight,
    },
  ]);
}

/**
 * Loyalist Score (0–100)
 * Measures commitment to recurring selectors, favorite sounds, and replayed mixes.
 * High: high repeat DJ ratio, replaying the same sets across crates.
 */
export function calculateLoyalist(stats: ListenerStats): number {
  if (stats.totalInteractions === 0 && stats.setsStarted === 0) return 0;

  return weightedScore([
    {
      value: stats.repeatDjRatio * 100,
      weight: TRAIT_WEIGHTS.loyalist.repeatDjWeight,
    },
    {
      value: stats.replaySetRatio * 100,
      weight: TRAIT_WEIGHTS.loyalist.replaySetWeight,
    },
  ]);
}

/**
 * Night Owl Score (0–100)
 * Measures the concentration of listening and digging between 10 PM and 4 AM.
 */
export function calculateNightOwl(stats: ListenerStats): number {
  if (stats.totalInteractions === 0 && stats.setsStarted === 0) return 0;
  return clamp(Math.round(stats.lateNightSessionRatio * 100));
}

/**
 * Track Hunter Score (0–100)
 * Measures behavior focused on extracting individual tracks, IDs, and highlight moments.
 * High: high moment count, moments pinned across diverse sets, moments found throughout mixes.
 */
export function calculateTrackHunter(stats: ListenerStats): number {
  if (stats.savedMoments === 0) return 0;

  // 10 moments reference standard
  const momentVolumeScore = normalizeRatio(stats.savedMoments / 10) * 100;

  // Spread: saved moments relative to total saved sets
  const spreadCount = Math.max(stats.savedSets, 1);
  const spreadScore =
    normalizeRatio(stats.savedMoments / (spreadCount * 2)) * 100;

  // Depth of moments within sets
  const depthScore = stats.avgMomentTimestampRatio * 100;

  return weightedScore([
    {
      value: momentVolumeScore,
      weight: TRAIT_WEIGHTS.trackHunter.momentVolumeWeight,
    },
    {
      value: spreadScore,
      weight: TRAIT_WEIGHTS.trackHunter.setSpreadWeight,
    },
    {
      value: depthScore,
      weight: TRAIT_WEIGHTS.trackHunter.momentDepthWeight,
    },
  ]);
}

/**
 * Computes all 6 deterministic trait scores from listener statistics.
 */
export function calculateListenerTraits(stats: ListenerStats): ListenerTraits {
  return {
    explorer: calculateExplorer(stats),
    deepListener: calculateDeepListener(stats),
    collector: calculateCollector(stats),
    loyalist: calculateLoyalist(stats),
    nightOwl: calculateNightOwl(stats),
    trackHunter: calculateTrackHunter(stats),
  };
}

