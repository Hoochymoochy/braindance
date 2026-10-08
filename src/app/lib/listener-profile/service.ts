import { ELIGIBILITY_CONFIG, LISTENER_PROFILE_VERSION } from "./config";
import { classifyListenerFallback } from "./fallback";
import { getListenerStats } from "./stats";
import {
  getCachedArchetype,
  saveCachedArchetype,
  shouldRegenerate,
} from "./storage";
import { calculateListenerTraits } from "./traits";
import type { ListenerProfileResponse, ListenerStats } from "./types";

function logServer(event: string, meta?: Record<string, unknown>) {
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`[listener-profile] ${event}${metaStr}`);
}

/**
 * Checks whether the user has sufficient listening history to unlock a meaningful archetype.
 */
export function hasEnoughData(stats: ListenerStats): boolean {
  if (stats.totalInteractions >= ELIGIBILITY_CONFIG.minInteractions) {
    return true;
  }
  if (stats.totalListeningMinutes >= ELIGIBILITY_CONFIG.minListeningMinutes) {
    return true;
  }
  if (stats.setsStarted >= ELIGIBILITY_CONFIG.minSessions) {
    return true;
  }
  return false;
}

/**
 * Main service orchestrator for retrieving or generating a user's listener archetype.
 * Classification is rule-based only (no LLM).
 */
export async function getOrGenerateListenerProfile({
  userId,
  forceRefresh = false,
}: {
  userId: string;
  forceRefresh?: boolean;
  /** @deprecated Ignored — classification is always rule-based. */
  preferModel?: boolean;
}): Promise<ListenerProfileResponse> {
  logServer("archetype calculation started", { userId });

  const stats = await getListenerStats(userId);

  if (!hasEnoughData(stats)) {
    return {
      status: "collecting",
      message:
        "Keep listening — a few more sets unlocks your listening style.",
      stats,
      version: LISTENER_PROFILE_VERSION,
    };
  }

  const cached = await getCachedArchetype(userId);
  if (!forceRefresh && cached && !shouldRegenerate({ cached, currentStats: stats })) {
    return {
      status: "ready",
      archetype: cached.archetype,
      displayTitle: cached.displayTitle,
      secondaryTrait: cached.secondaryTrait,
      description: cached.description,
      evidence: cached.evidence,
      traits: cached.traitScores,
      stats: cached.statsSnapshot,
      source: "cache",
      cached: true,
      calculatedAt: cached.calculatedAt,
      version: cached.version,
    };
  }

  const traits = calculateListenerTraits(stats);
  logServer("trait scores calculated", { userId, traits });

  const result = classifyListenerFallback({ stats, traits });
  logServer("rule classifier used", {
    userId,
    archetype: result.archetype,
    displayTitle: result.displayTitle,
  });

  const now = new Date().toISOString();
  await saveCachedArchetype({
    userId,
    archetype: result.archetype,
    displayTitle: result.displayTitle,
    secondaryTrait: result.secondaryTrait,
    description: result.description,
    evidence: result.evidence,
    traitScores: traits,
    statsSnapshot: stats,
    model: result.model || "rule-classifier",
    version: LISTENER_PROFILE_VERSION,
    calculatedAt: now,
  });
  logServer("archetype cached", { userId, archetype: result.archetype });

  return {
    status: "ready",
    archetype: result.archetype,
    displayTitle: result.displayTitle,
    secondaryTrait: result.secondaryTrait,
    description: result.description,
    evidence: result.evidence,
    traits,
    stats,
    source: "fallback",
    cached: false,
    calculatedAt: now,
    version: LISTENER_PROFILE_VERSION,
  };
}
