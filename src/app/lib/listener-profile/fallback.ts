import { ALL_ARCHETYPE_IDS, ARCHETYPE_CATALOG } from "./archetypes";
import type {
  ListenerArchetypeId,
  ListenerArchetypeResult,
  ListenerHeaderStat,
  ListenerStats,
  ListenerTraitKey,
  ListenerTraits,
} from "./types";

const PRIMARY_TRAIT: Record<ListenerArchetypeId, ListenerTraitKey> = {
  track_hunter: "trackHunter",
  collector: "collector",
  explorer: "explorer",
  deep_listener: "deepListener",
};

/** Formats listening minutes as "2h 50m" / "45m" / "0m". */
export function formatListeningDuration(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Four header stats for the profile listening-style block.
 * Always returns the same four slots (zeros included) for a stable layout.
 */
export function formatHeaderStats(stats: ListenerStats): ListenerHeaderStat[] {
  return [
    {
      value: String(stats.uniqueDjs),
      label: "DJs discovered",
    },
    {
      value: String(stats.savedSets),
      label: "Sets in crates",
    },
    {
      value: String(stats.savedMoments),
      label: "Tracks saved",
    },
    {
      value: String(stats.setsStarted),
      label: "Sets played",
    },
    {
      value: formatListeningDuration(stats.totalListeningMinutes),
      label: "Time spent listening",
    },
  ];
}

/** @deprecated Use formatHeaderStats — kept for older imports/tests. */
export function formatRawListenerStats(stats: ListenerStats): ListenerHeaderStat[] {
  return formatHeaderStats(stats);
}

/** Simple rule scores from raw stats — no LLM. */
export function scoreArchetypes(
  stats: ListenerStats
): Record<ListenerArchetypeId, number> {
  const setsPlayed = Math.max(stats.setsStarted, 1);
  const momentRatio = stats.savedMoments / setsPlayed;
  const crateRatio = stats.savedSets / setsPlayed;
  const djBreadth = stats.uniqueDjs / setsPlayed;

  return {
    // Saves lots of individual track moments relative to sets played
    track_hunter: stats.savedMoments * 2.5 + momentRatio * 30,
    // Builds crates and saves sets regularly
    collector: stats.savedSets * 3 + crateRatio * 25,
    // Listens to a wide variety of DJs
    explorer: stats.uniqueDjs * 3 + stats.newDjListenRatio * 30 + djBreadth * 15,
    // Spends long sessions listening to full mixes
    deep_listener:
      stats.avgCompletionRate * 50 +
      Math.min(stats.totalListeningMinutes / 30, 25) +
      (stats.setsCompleted / setsPlayed) * 25,
  };
}

/**
 * Deterministically classifies a listener into one of four archetypes.
 */
export function classifyListenerFallback({
  stats,
  traits: _traits,
}: {
  stats: ListenerStats;
  traits?: ListenerTraits;
}): ListenerArchetypeResult {
  const scores = scoreArchetypes(stats);

  let chosen: ListenerArchetypeId = "explorer";
  let best = -Infinity;
  for (const id of ALL_ARCHETYPE_IDS) {
    if (scores[id] > best) {
      best = scores[id];
      chosen = id;
    }
  }

  const def = ARCHETYPE_CATALOG[chosen];

  return {
    archetype: chosen,
    displayTitle: def.displayTitle,
    secondaryTrait: PRIMARY_TRAIT[chosen],
    description: def.description,
    evidence: formatHeaderStats(stats).map((s) => `${s.value} ${s.label}`),
    source: "fallback",
    model: "rule-classifier",
  };
}

/** @deprecated Evidence is now the header stats; kept for test compatibility. */
export function buildEvidenceList(
  stats: ListenerStats,
  _archetype: ListenerArchetypeId
): string[] {
  return formatHeaderStats(stats)
    .filter((s) => s.value !== "0" && s.value !== "0m")
    .slice(0, 3)
    .map((s) => `${s.value} ${s.label}`);
}
