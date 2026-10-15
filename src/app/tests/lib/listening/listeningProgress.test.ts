import {
  capListenedSeconds,
  LISTENING_HEARTBEAT_SECONDS,
  mergeListenedSeconds,
  MAX_SESSION_LISTENED_SECONDS,
  shouldPersistListeningProgress,
} from "@/app/lib/listening/rules";
import { validateListeningProgressPayload } from "@/app/lib/listening/progress";
import { shouldRegenerate } from "@/app/lib/listener-profile/storage";
import { LISTENER_PROFILE_VERSION } from "@/app/lib/listener-profile/config";
import type {
  CachedArchetypeProfile,
  ListenerStats,
} from "@/app/lib/listener-profile/types";

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

describe("Listening progress rules", () => {
  describe("shouldPersistListeningProgress", () => {
    it("does not write when no new listening time exists", () => {
      expect(
        shouldPersistListeningProgress({
          cumulativeSeconds: 100,
          lastPersistedSeconds: 100,
          force: true,
        })
      ).toBe(false);
      expect(
        shouldPersistListeningProgress({
          cumulativeSeconds: 50,
          lastPersistedSeconds: 100,
        })
      ).toBe(false);
    });

    it("heartbeats every 5 minutes of newly accumulated playback", () => {
      expect(LISTENING_HEARTBEAT_SECONDS).toBe(300);
      expect(
        shouldPersistListeningProgress({
          cumulativeSeconds: 299,
          lastPersistedSeconds: 0,
        })
      ).toBe(false);
      expect(
        shouldPersistListeningProgress({
          cumulativeSeconds: 300,
          lastPersistedSeconds: 0,
        })
      ).toBe(true);
      expect(
        shouldPersistListeningProgress({
          cumulativeSeconds: 600,
          lastPersistedSeconds: 300,
        })
      ).toBe(true);
      expect(
        shouldPersistListeningProgress({
          cumulativeSeconds: 450,
          lastPersistedSeconds: 300,
        })
      ).toBe(false);
    });

    it("force-flushes leftover under 5 minutes (pause / navigate)", () => {
      expect(
        shouldPersistListeningProgress({
          cumulativeSeconds: 30,
          lastPersistedSeconds: 0,
          force: true,
        })
      ).toBe(true);
      expect(
        shouldPersistListeningProgress({
          cumulativeSeconds: 4 * 60,
          lastPersistedSeconds: 0,
          force: true,
        })
      ).toBe(true);
      expect(
        shouldPersistListeningProgress({
          cumulativeSeconds: 757,
          lastPersistedSeconds: 600,
          force: true,
        })
      ).toBe(true);
    });

    it("models the 12m37s example: 300, 600, then 157 leftover", () => {
      let last = 0;
      const at300 = shouldPersistListeningProgress({
        cumulativeSeconds: 300,
        lastPersistedSeconds: last,
      });
      expect(at300).toBe(true);
      last = 300;

      const at600 = shouldPersistListeningProgress({
        cumulativeSeconds: 600,
        lastPersistedSeconds: last,
      });
      expect(at600).toBe(true);
      last = 600;

      const mid = shouldPersistListeningProgress({
        cumulativeSeconds: 700,
        lastPersistedSeconds: last,
      });
      expect(mid).toBe(false);

      const onPause = shouldPersistListeningProgress({
        cumulativeSeconds: 757,
        lastPersistedSeconds: last,
        force: true,
      });
      expect(onPause).toBe(true);
    });
  });

  describe("idempotent merge / caps", () => {
    it("never decreases accepted listening seconds on retry", () => {
      expect(mergeListenedSeconds(400, 200)).toBe(400);
      expect(mergeListenedSeconds(400, 400)).toBe(400);
      expect(mergeListenedSeconds(400, 500)).toBe(500);
    });

    it("caps reported time by set duration and hard session max", () => {
      expect(capListenedSeconds(99999)).toBe(MAX_SESSION_LISTENED_SECONDS);
      expect(capListenedSeconds(500, 300)).toBe(420); // 300 + 120 buffer
      expect(capListenedSeconds(200, 300)).toBe(200);
    });

    it("duplicate flush of the same cumulative does not inflate", () => {
      const once = mergeListenedSeconds(0, 757);
      const twice = mergeListenedSeconds(once, 757);
      expect(twice).toBe(757);
    });
  });

  describe("validateListeningProgressPayload", () => {
    it("accepts a well-formed payload", () => {
      const payload = validateListeningProgressPayload({
        sessionId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        videoId: "abc123",
        listenedSeconds: 157,
        durationSeconds: 3600,
        completed: false,
      });
      expect(payload.listenedSeconds).toBe(157);
      expect(payload.videoId).toBe("abc123");
    });

    it("rejects missing session or negative seconds", () => {
      expect(() =>
        validateListeningProgressPayload({
          sessionId: "short",
          videoId: "x",
          listenedSeconds: 1,
        })
      ).toThrow(/sessionId/);
      expect(() =>
        validateListeningProgressPayload({
          sessionId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          videoId: "x",
          listenedSeconds: -1,
        })
      ).toThrow(/listenedSeconds/);
    });
  });
});

describe("Profile cache regeneration for listening growth", () => {
  const baseCached = (): CachedArchetypeProfile => ({
    userId: "u1",
    archetype: "explorer",
    displayTitle: "The Explorer",
    secondaryTrait: "explorer",
    description: "desc",
    evidence: [],
    traitScores: {
      explorer: 50,
      deepListener: 20,
      collector: 20,
      loyalist: 10,
      nightOwl: 0,
      trackHunter: 10,
    },
    statsSnapshot: {
      ...ZERO_STATS,
      totalListeningMinutes: 40,
      setsStarted: 2,
      totalInteractions: 5,
    },
    calculatedAt: new Date().toISOString(),
    model: "rule-classifier",
    version: LISTENER_PROFILE_VERSION,
  });

  it("regenerates after meaningful listening minutes growth", () => {
    const cached = baseCached();
    expect(
      shouldRegenerate({
        cached,
        currentStats: {
          ...cached.statsSnapshot,
          totalListeningMinutes: 40 + 15,
        },
      })
    ).toBe(true);
  });

  it("regenerates when a new unique set is played", () => {
    const cached = baseCached();
    expect(
      shouldRegenerate({
        cached,
        currentStats: {
          ...cached.statsSnapshot,
          setsStarted: 3,
        },
      })
    ).toBe(true);
  });

  it("does not regenerate for tiny listening bumps alone", () => {
    const cached = baseCached();
    expect(
      shouldRegenerate({
        cached,
        currentStats: {
          ...cached.statsSnapshot,
          totalListeningMinutes: 44,
        },
      })
    ).toBe(false);
  });
});
