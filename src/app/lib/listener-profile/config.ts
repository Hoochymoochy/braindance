export const LISTENER_PROFILE_VERSION = "v2";

export const CACHE_CONFIG = {
  /** Maximum number of days a cached profile remains valid before recalculating. */
  maxAgeDays: 7,
  /** Minimum number of new interactions since last calculation to trigger recalculation. */
  minNewActivityCount: 5,
};

export const ELIGIBILITY_CONFIG = {
  /** Minimum number of interactions (saved sets, moments, sessions) needed to compute an archetype. */
  minInteractions: 3,
  /** Minimum estimated listening minutes required. */
  minListeningMinutes: 15,
  /** Minimum listening sessions if session telemetry exists. */
  minSessions: 3,
};

export const TRAIT_WEIGHTS = {
  explorer: {
    newDjWeight: 0.6,
    diversityWeight: 0.4,
    repeatPenalty: 0.3,
  },
  deepListener: {
    completionRateWeight: 0.65,
    relativeListeningWeight: 0.35,
  },
  collector: {
    savedSetsWeight: 0.5,
    savedMomentsWeight: 0.5,
  },
  loyalist: {
    repeatDjWeight: 0.6,
    replaySetWeight: 0.4,
  },
  nightOwl: {
    startHour: 22, // 10 PM
    endHour: 4, // 4 AM
  },
  trackHunter: {
    momentVolumeWeight: 0.45,
    setSpreadWeight: 0.35,
    momentDepthWeight: 0.2,
  },
};

/** Clamps a number between min and max. */
export function clamp(val: number, min = 0, max = 100): number {
  if (Number.isNaN(val) || !Number.isFinite(val)) return min;
  return Math.min(Math.max(val, min), max);
}

/** Normalizes a ratio (0 to 1) or caps relative to a target max. */
export function normalizeRatio(val: number, maxVal = 1): number {
  if (maxVal <= 0 || Number.isNaN(val) || !Number.isFinite(val)) return 0;
  return clamp(val / maxVal, 0, 1);
}

/** Calculates a weighted sum score normalized to 0-100. */
export function weightedScore(
  components: Array<{ value: number; weight: number }>
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const { value, weight } of components) {
    if (Number.isFinite(value) && Number.isFinite(weight)) {
      totalScore += value * weight;
      totalWeight += Math.abs(weight);
    }
  }

  if (totalWeight === 0) return 0;
  return clamp(Math.round(totalScore / totalWeight));
}
