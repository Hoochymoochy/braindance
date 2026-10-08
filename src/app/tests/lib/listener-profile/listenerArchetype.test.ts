import {
  calculateListenerTraits,
  calculateExplorer,
  calculateDeepListener,
  calculateCollector,
  calculateTrackHunter,
} from "@/app/lib/listener-profile/traits";
import {
  classifyListenerFallback,
  buildEvidenceList,
  formatHeaderStats,
  formatListeningDuration,
  scoreArchetypes,
} from "@/app/lib/listener-profile/fallback";
import { hasEnoughData } from "@/app/lib/listener-profile/service";
import type { ListenerStats } from "@/app/lib/listener-profile/types";

const ZERO_STATS: ListenerStats = {
  totalListeningMinutes: 0,
  setsStarted: 0,
  setsCompleted: 0,
  avgCompletionRate: 0,
  uniqueDjs: 0,
  newDjListenRatio: 0,
  repeatDjRatio: 0,
  replaySetRatio: 0,
  savedSets: 0,
  savedMoments: 0,
  lateNightSessionRatio: 0,
  avgMomentTimestampRatio: 0,
  totalInteractions: 0,
};

describe("Listener Archetype System", () => {
  describe("Trait calculations", () => {
    it("handles zero analytics safely without division by zero or NaN", () => {
      const traits = calculateListenerTraits(ZERO_STATS);

      expect(traits).toEqual({
        explorer: 0,
        deepListener: 0,
        collector: 0,
        loyalist: 0,
        nightOwl: 0,
        trackHunter: 0,
      });

      for (const val of Object.values(traits)) {
        expect(Number.isFinite(val)).toBe(true);
        expect(Number.isNaN(val)).toBe(false);
      }
    });

    it("calculates explorer score accurately based on new DJs and diversity", () => {
      const explorerStats: ListenerStats = {
        ...ZERO_STATS,
        setsStarted: 10,
        uniqueDjs: 9,
        newDjListenRatio: 0.9,
        repeatDjRatio: 0.1,
        totalInteractions: 10,
      };
      const score = calculateExplorer(explorerStats);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it("calculates deep listener score from completion rate and duration", () => {
      const deepStats: ListenerStats = {
        ...ZERO_STATS,
        setsStarted: 5,
        totalListeningMinutes: 300,
        avgCompletionRate: 0.95,
        totalInteractions: 5,
      };
      const score = calculateDeepListener(deepStats);
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it("calculates collector score from saved sets and moments", () => {
      const collectorStats: ListenerStats = {
        ...ZERO_STATS,
        savedSets: 10,
        savedMoments: 15,
        totalInteractions: 25,
      };
      const score = calculateCollector(collectorStats);
      expect(score).toBeGreaterThan(0);
    });

    it("calculates track hunter score from moments", () => {
      const huntStats: ListenerStats = {
        ...ZERO_STATS,
        setsStarted: 4,
        savedMoments: 20,
        totalInteractions: 24,
      };
      const score = calculateTrackHunter(huntStats);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("Rule-based classification", () => {
    it("classifies high moment-to-set ratio as The Track Hunter", () => {
      const stats: ListenerStats = {
        ...ZERO_STATS,
        setsStarted: 5,
        savedMoments: 20,
        uniqueDjs: 2,
        savedSets: 1,
      };

      const result = classifyListenerFallback({ stats });
      expect(result.archetype).toBe("track_hunter");
      expect(result.displayTitle).toBe("The Track Hunter");
      expect(result.description).toContain("track");
    });

    it("classifies heavy crate saving as The Collector", () => {
      const stats: ListenerStats = {
        ...ZERO_STATS,
        setsStarted: 4,
        savedSets: 12,
        savedMoments: 1,
        uniqueDjs: 2,
      };

      const result = classifyListenerFallback({ stats });
      expect(result.archetype).toBe("collector");
      expect(result.displayTitle).toBe("The Collector");
      expect(result.description).toContain("crates");
    });

    it("classifies wide DJ variety as The Explorer", () => {
      const stats: ListenerStats = {
        ...ZERO_STATS,
        setsStarted: 10,
        uniqueDjs: 14,
        newDjListenRatio: 0.9,
        savedSets: 1,
        savedMoments: 1,
      };

      const result = classifyListenerFallback({ stats });
      expect(result.archetype).toBe("explorer");
      expect(result.displayTitle).toBe("The Explorer");
      expect(result.description).toContain("DJs");
    });

    it("classifies long full-mix listening as The Deep Listener", () => {
      const stats: ListenerStats = {
        ...ZERO_STATS,
        setsStarted: 6,
        setsCompleted: 5,
        avgCompletionRate: 0.95,
        totalListeningMinutes: 400,
        uniqueDjs: 2,
        savedSets: 0,
        savedMoments: 0,
      };

      const result = classifyListenerFallback({ stats });
      expect(result.archetype).toBe("deep_listener");
      expect(result.displayTitle).toBe("The Deep Listener");
      expect(result.description).toContain("full mixes");
    });

    it("scores are finite for zero stats", () => {
      const scores = scoreArchetypes(ZERO_STATS);
      for (const val of Object.values(scores)) {
        expect(Number.isFinite(val)).toBe(true);
      }
    });
  });

  describe("Header stats", () => {
    it("formats listening duration", () => {
      expect(formatListeningDuration(0)).toBe("0m");
      expect(formatListeningDuration(45)).toBe("45m");
      expect(formatListeningDuration(170)).toBe("2h 50m");
      expect(formatListeningDuration(120)).toBe("2h");
    });

    it("returns the five stable header slots", () => {
      const stats: ListenerStats = {
        ...ZERO_STATS,
        uniqueDjs: 4,
        savedSets: 3,
        savedMoments: 8,
        setsStarted: 5,
        totalListeningMinutes: 170,
      };

      const header = formatHeaderStats(stats);
      expect(header).toHaveLength(5);
      expect(header[0]).toEqual({ value: "4", label: "DJs discovered" });
      expect(header[1]).toEqual({ value: "3", label: "Sets in crates" });
      expect(header[2]).toEqual({ value: "8", label: "Tracks saved" });
      expect(header[3]).toEqual({ value: "5", label: "Sets played" });
      expect(header[4]).toEqual({
        value: "2h 50m",
        label: "Time spent listening",
      });
    });

    it("buildEvidenceList stays non-empty for active stats", () => {
      const evidence = buildEvidenceList({
        ...ZERO_STATS,
        uniqueDjs: 4,
        savedSets: 3,
      });
      expect(evidence.length).toBeGreaterThan(0);
    });
  });

  describe("Eligibility", () => {
    it("returns false for zero or tiny listening history", () => {
      expect(hasEnoughData(ZERO_STATS)).toBe(false);

      const tinyStats: ListenerStats = {
        ...ZERO_STATS,
        savedSets: 1,
        totalInteractions: 1,
        totalListeningMinutes: 5,
        setsStarted: 1,
      };
      expect(hasEnoughData(tinyStats)).toBe(false);
    });

    it("returns true once the minimum interaction or listening threshold is met", () => {
      const eligibleByInteractions: ListenerStats = {
        ...ZERO_STATS,
        savedSets: 2,
        savedMoments: 2,
        totalInteractions: 4,
      };
      expect(hasEnoughData(eligibleByInteractions)).toBe(true);

      const eligibleByMinutes: ListenerStats = {
        ...ZERO_STATS,
        totalListeningMinutes: 35,
        totalInteractions: 1,
      };
      expect(hasEnoughData(eligibleByMinutes)).toBe(true);
    });
  });
});
