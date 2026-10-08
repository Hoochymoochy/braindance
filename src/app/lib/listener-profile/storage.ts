import { getDbClient } from "./db";
import { CACHE_CONFIG, LISTENER_PROFILE_VERSION } from "./config";
import type { CachedArchetypeProfile, ListenerStats } from "./types";

/** Fallback memory cache for development or when database migration has not been applied yet. */
const memoryCache = new Map<string, CachedArchetypeProfile>();

export async function getCachedArchetype(
  userId: string
): Promise<CachedArchetypeProfile | null> {
  const client = getDbClient();
  try {
    const { data, error } = await client
      .from("listener_archetypes")
      .select(
        "user_id, archetype, display_title, secondary_trait, description, evidence, trait_scores, stats_snapshot, model, version, calculated_at"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      return {
        userId: data.user_id,
        archetype: data.archetype,
        displayTitle: data.display_title,
        secondaryTrait: data.secondary_trait,
        description: data.description,
        evidence: Array.isArray(data.evidence) ? data.evidence : [],
        traitScores: data.trait_scores,
        statsSnapshot: data.stats_snapshot,
        calculatedAt: data.calculated_at,
        model: data.model,
        version: data.version,
      };
    }
  } catch {
    // Database table missing or query failed — check memory cache
  }

  return memoryCache.get(userId) ?? null;
}

export async function saveCachedArchetype(
  item: CachedArchetypeProfile
): Promise<void> {
  memoryCache.set(item.userId, item);

  const client = getDbClient();
  try {
    await client.from("listener_archetypes").upsert(
      {
        user_id: item.userId,
        archetype: item.archetype,
        display_title: item.displayTitle,
        secondary_trait: item.secondaryTrait,
        description: item.description,
        evidence: item.evidence,
        trait_scores: item.traitScores,
        stats_snapshot: item.statsSnapshot,
        model: item.model,
        version: item.version,
        calculated_at: item.calculatedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch {
    // Graceful fallback to memoryCache if table not yet created
  }
}

/**
 * Determines whether the cached archetype should be recalculated based on:
 * - Version bump (e.g. v1 -> v2)
 * - Cache TTL (e.g. 7 days old)
 * - Volume of new meaningful user interactions (e.g. 5+ new sets/moments)
 */
export function shouldRegenerate({
  cached,
  currentStats,
}: {
  cached: CachedArchetypeProfile | null;
  currentStats: ListenerStats;
}): boolean {
  if (!cached) return true;

  // 1. Version mismatch
  if (cached.version !== LISTENER_PROFILE_VERSION) {
    return true;
  }

  // 2. Cache age exceeds TTL
  const calculatedTime = new Date(cached.calculatedAt).getTime();
  if (Number.isNaN(calculatedTime)) return true;
  const ageDays = (Date.now() - calculatedTime) / (1000 * 60 * 60 * 24);
  if (ageDays >= CACHE_CONFIG.maxAgeDays) {
    return true;
  }

  // 3. New activity threshold
  const prevCount = cached.statsSnapshot?.totalInteractions ?? 0;
  const newActivityCount = currentStats.totalInteractions - prevCount;
  if (newActivityCount >= CACHE_CONFIG.minNewActivityCount) {
    return true;
  }

  return false;
}
