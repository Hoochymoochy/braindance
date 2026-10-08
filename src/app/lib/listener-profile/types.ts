export type ListenerArchetypeId =
  | "track_hunter"
  | "collector"
  | "explorer"
  | "deep_listener";

export type ListenerTraitKey =
  | "explorer"
  | "deepListener"
  | "collector"
  | "loyalist"
  | "nightOwl"
  | "trackHunter";

export type ListenerTraits = {
  explorer: number;
  deepListener: number;
  collector: number;
  loyalist: number;
  nightOwl: number;
  trackHunter: number;
};

export type ListenerStats = {
  totalListeningMinutes: number;
  setsStarted: number;
  setsCompleted: number;
  avgCompletionRate: number; // 0 to 1

  uniqueDjs: number;
  newDjListenRatio: number; // 0 to 1
  repeatDjRatio: number; // 0 to 1
  replaySetRatio: number; // 0 to 1

  savedSets: number;
  savedMoments: number;

  lateNightSessionRatio: number; // 0 to 1 (between 10 PM and 4 AM)
  avgMomentTimestampRatio: number; // 0 to 1 (relative point in set where moment occurs)

  topDjs?: Array<{
    id: string;
    name: string;
    listeningMinutes: number;
    count: number;
  }>;

  topGenres?: Array<{
    genre: string;
    weight: number;
  }>;

  totalInteractions: number;
  lastActivityAt?: string | null;
};

export type ListenerArchetypeDefinition = {
  id: ListenerArchetypeId;
  name: string;
  displayTitle: string;
  description: string;
};

export type ListenerArchetypeResult = {
  archetype: ListenerArchetypeId;
  displayTitle: string;
  /** Kept for cache/DB compatibility; mirrors the archetype’s primary trait. */
  secondaryTrait: ListenerTraitKey;
  description: string;
  evidence: string[];
  source?: "fallback";
  model?: string;
};

export type CachedArchetypeProfile = {
  userId: string;
  archetype: ListenerArchetypeId;
  displayTitle: string;
  secondaryTrait: ListenerTraitKey;
  description: string;
  evidence: string[];
  traitScores: ListenerTraits;
  statsSnapshot: ListenerStats;
  calculatedAt: string;
  model: string;
  version: string;
};

export type ListenerProfileResponse =
  | {
      status: "collecting";
      message: string;
      stats: ListenerStats;
      version: string;
    }
  | {
      status: "ready";
      archetype: ListenerArchetypeId;
      displayTitle: string;
      secondaryTrait: ListenerTraitKey;
      description: string;
      evidence: string[];
      traits: ListenerTraits;
      stats: ListenerStats;
      source: "fallback" | "cache";
      cached: boolean;
      calculatedAt: string;
      version: string;
    };

export type ListenerHeaderStat = {
  /** Display value, e.g. "4" or "2h 50m". */
  value: string;
  label: string;
};
