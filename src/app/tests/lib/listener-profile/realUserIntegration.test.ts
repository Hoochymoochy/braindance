import {
  getListenerStats,
  calculateListenerTraits,
  classifyListenerFallback,
  getOrGenerateListenerProfile,
} from "@/app/lib/listener-profile";
import { ALL_ARCHETYPE_IDS } from "@/app/lib/listener-profile/archetypes";

describe("Live Database User Archetype Integration", () => {
  const userId = "1d02b474-2935-4c82-9402-cf6970c39f50";

  it("fetches real user stats, traits, and produces a valid archetype response", async () => {
    const stats = await getListenerStats(userId);
    expect(stats).toBeDefined();
    expect(stats.totalInteractions).toBeGreaterThan(0);
    expect(stats.savedSets).toBe(3);
    expect(stats.savedMoments).toBe(8);

    const traits = calculateListenerTraits(stats);
    expect(traits.collector).toBeGreaterThan(0);
    expect(traits.trackHunter).toBeGreaterThan(0);

    const fallback = classifyListenerFallback({ stats, traits });
    expect(ALL_ARCHETYPE_IDS).toContain(fallback.archetype);
    expect(fallback.evidence.length).toBeGreaterThan(0);

    const profile = await getOrGenerateListenerProfile({ userId });

    expect(profile.status).toBe("ready");
    if (profile.status === "ready") {
      expect(profile.displayTitle).toBeDefined();
      expect(profile.description).toBeDefined();
      expect(profile.evidence.length).toBeGreaterThan(0);
      expect(profile.traits).toEqual(traits);
    }
  });
});
