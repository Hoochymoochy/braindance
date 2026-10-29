"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { trackEvent, type SetAnalyticsMeta } from "@/app/lib/analytics";
import { reportListeningProgress } from "@/app/lib/listening/client";
import {
  LISTENING_HEARTBEAT_SECONDS,
  shouldPersistListeningProgress,
} from "@/app/lib/listening/rules";
import { reportVaultEvent } from "@/app/lib/vault/client";

const MILESTONES: { seconds: number; event: string }[] = [
  { seconds: 30, event: "listen_30_seconds" },
  { seconds: 5 * 60, event: "listen_5_minutes" },
  { seconds: 15 * 60, event: "listen_15_minutes" },
  { seconds: 30 * 60, event: "listen_30_minutes" },
  { seconds: 60 * 60, event: "listen_60_minutes" },
];

/** Vault reward chunk size (independent of analytics heartbeat). */
const VAULT_LISTEN_CHUNK_SECONDS = 600;
const FINISH_RATIO = 0.95;

const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_API_SRC = "https://www.youtube.com/iframe_api";

export type YoutubePlayerApi = {
  seekTo: (seconds: number) => void;
  /** Current playback position in seconds, or null if the player is not ready. */
  getCurrentTime: () => number | null;
};

type YtPlayer = {
  destroy: () => void;
  getPlayerState: () => number;
  getDuration?: () => number;
  getCurrentTime?: () => number;
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo?: () => void;
};

type YtNamespace = {
  Player: new (
    elementId: string,
    options: {
      events?: {
        onReady?: (event: { target: YtPlayer }) => void;
        onStateChange?: (event: { data: number }) => void;
      };
    }
  ) => YtPlayer;
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<YtNamespace> | null = null;

function loadYoutubeApi(): Promise<YtNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        try {
          previous?.();
        } catch {
          /* ignore prior callback errors */
        }
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error("YT API missing Player"));
      };

      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${YT_API_SRC}"]`
      );
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = YT_API_SRC;
        tag.async = true;
        tag.onerror = () => {
          ytApiPromise = null;
          reject(new Error("YT API failed to load"));
        };
        document.head.appendChild(tag);
      }

      if (window.YT?.Player) resolve(window.YT);
    });
  }

  return ytApiPromise;
}

function newClientSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ls_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Tracks play_started + listening milestones from real YouTube player state.
 * Accumulates monotonic time only while YT state is PLAYING (pause/buffer do not count).
 * Persists listening analytics via a 5-minute heartbeat + flush (independent of Vault).
 * Also reports vault listen chunks (+5 / 10 min) and finish_set for rewards only.
 */
export function useYoutubePlaybackAnalytics({
  enabled,
  iframeId,
  meta,
  source,
  playerApiRef,
  /** Bump when the embed iframe remounts so we re-bind YT.Player. */
  playerMountKey,
}: {
  enabled: boolean;
  iframeId: string;
  meta: Partial<SetAnalyticsMeta>;
  source?: string;
  /** Optional bridge so UI (tracklist / moments) can seek the same player instance. */
  playerApiRef?: MutableRefObject<YoutubePlayerApi | null>;
  playerMountKey?: string | number;
}) {
  const metaRef = useRef(meta);
  const sourceRef = useRef(source);
  metaRef.current = meta;
  sourceRef.current = source;

  useEffect(() => {
    if (!enabled) {
      if (playerApiRef) playerApiRef.current = null;
      return;
    }

    let cancelled = false;
    let player: YtPlayer | null = null;
    let queuedSeek: number | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    /** Monotonic clock start while PLAYING; null when paused/buffering/ended. */
    let playingSince: number | null = null;
    let listenedMs = 0;
    let playStartedFired = false;
    let finishReported = false;
    const firedMilestones = new Set<string>();
    const reportedChunks = new Set<number>();

    const sessionId = newClientSessionId();
    let lastPersistedSeconds = 0;
    let completedPersisted = false;
    let persistChain: Promise<void> = Promise.resolve();
    let pageHideFlushDone = false;

    const applySeek = (seconds: number) => {
      const s = Math.max(0, Math.floor(seconds));
      if (!player?.seekTo) {
        queuedSeek = s;
        return;
      }
      try {
        player.seekTo(s, true);
        player.playVideo?.();
      } catch {
        queuedSeek = s;
      }
    };

    if (playerApiRef) {
      playerApiRef.current = {
        seekTo: applySeek,
        getCurrentTime: () => {
          try {
            const t = player?.getCurrentTime?.();
            return typeof t === "number" && Number.isFinite(t) ? t : null;
          } catch {
            return null;
          }
        },
      };
    }

    const flushListenClock = () => {
      if (playingSince == null) return;
      listenedMs += performance.now() - playingSince;
      playingSince = null;
    };

    const listenedSeconds = () =>
      (listenedMs +
        (playingSince != null ? performance.now() - playingSince : 0)) /
      1000;

    const sessionMeta = () => {
      const videoId = String(metaRef.current.set_id ?? "").trim();
      return {
        videoId,
        djName: metaRef.current.artist ?? "",
        setTitle: metaRef.current.set_title ?? "",
      };
    };

    const readDurationSeconds = () => {
      try {
        return Math.floor(player?.getDuration?.() ?? 0);
      } catch {
        return 0;
      }
    };

    const persistProgress = (opts: {
      force?: boolean;
      completed?: boolean;
      keepalive?: boolean;
    }) => {
      const { videoId, djName, setTitle } = sessionMeta();
      if (!videoId) return;

      const force = Boolean(opts.force) || Boolean(opts.completed);
      const keepalive = Boolean(opts.keepalive);
      const completed = Boolean(opts.completed);
      // Always allow a completed write even when seconds already flushed (pause then end).
      const needsCompletedWrite = completed && !completedPersisted;

      // Unload path: fire immediately (beacon/keepalive) without waiting on the chain.
      if (keepalive) {
        const cumulative = Math.floor(listenedSeconds());
        if (
          !needsCompletedWrite &&
          !shouldPersistListeningProgress({
            cumulativeSeconds: cumulative,
            lastPersistedSeconds,
            force: true,
          })
        ) {
          return;
        }
        void reportListeningProgress(
          {
            sessionId,
            videoId,
            djName,
            setTitle,
            durationSeconds: readDurationSeconds(),
            listenedSeconds: cumulative,
            completed,
          },
          { keepalive: true }
        );
        lastPersistedSeconds = Math.max(lastPersistedSeconds, cumulative);
        if (completed) completedPersisted = true;
        return;
      }

      persistChain = persistChain
        .then(async () => {
          if (cancelled) return;
          const cumulative = Math.floor(listenedSeconds());
          const stillNeedsCompleted = completed && !completedPersisted;
          if (
            !stillNeedsCompleted &&
            !shouldPersistListeningProgress({
              cumulativeSeconds: cumulative,
              lastPersistedSeconds,
              force,
            })
          ) {
            return;
          }

          const result = await reportListeningProgress({
            sessionId,
            videoId,
            djName,
            setTitle,
            durationSeconds: readDurationSeconds(),
            listenedSeconds: cumulative,
            completed: stillNeedsCompleted || completed,
          });

          if (result && Number.isFinite(result.listenedSeconds)) {
            lastPersistedSeconds = Math.max(
              lastPersistedSeconds,
              Math.floor(result.listenedSeconds)
            );
            if (result.completed) completedPersisted = true;
          }
          // On failure, leave lastPersisted unchanged so the next heartbeat/flush retries.
        })
        .catch(() => {
          /* analytics must never break playback */
        });
    };

    const reportVaultChunks = () => {
      const seconds = listenedSeconds();
      const chunks = Math.floor(seconds / VAULT_LISTEN_CHUNK_SECONDS);
      if (chunks < 1) return;
      const { videoId, djName, setTitle } = sessionMeta();
      if (!videoId) return;

      const durationSeconds = readDurationSeconds();

      for (let i = 1; i <= chunks; i++) {
        if (reportedChunks.has(i)) continue;
        reportedChunks.add(i);
        void reportVaultEvent({
          type: "listen_chunk",
          videoId,
          chunkIndex: i,
          djName,
          setTitle,
          durationSeconds,
          listenedSeconds: Math.floor(seconds),
        });
      }
    };

    const reportVaultFinish = () => {
      if (finishReported) return;
      const { videoId, djName, setTitle } = sessionMeta();
      if (!videoId) return;
      finishReported = true;

      void reportVaultEvent({
        type: "finish_set",
        videoId,
        djName,
        setTitle,
        durationSeconds: readDurationSeconds(),
        listenedSeconds: Math.floor(listenedSeconds()),
      });
    };

    const checkFinishByProgress = () => {
      if (finishReported || !player) return;
      try {
        const duration = player.getDuration?.() ?? 0;
        const current = player.getCurrentTime?.() ?? 0;
        if (duration > 60 && current / duration >= FINISH_RATIO) {
          persistProgress({ force: true, completed: true });
          reportVaultFinish();
        }
      } catch {
        /* ignore */
      }
    };

    const checkMilestones = () => {
      const seconds = listenedSeconds();
      const payload = {
        set_id: metaRef.current.set_id,
        set_title: metaRef.current.set_title,
        artist: metaRef.current.artist,
      };
      for (const m of MILESTONES) {
        if (seconds >= m.seconds && !firedMilestones.has(m.event)) {
          firedMilestones.add(m.event);
          trackEvent(m.event, payload);
        }
      }
      // Analytics heartbeat (5 min) — independent of Vault 10-min chunks.
      if (
        shouldPersistListeningProgress({
          cumulativeSeconds: seconds,
          lastPersistedSeconds,
        })
      ) {
        persistProgress({ force: false });
      }
      reportVaultChunks();
      checkFinishByProgress();
    };

    const setPlaying = (isPlaying: boolean) => {
      if (isPlaying) {
        if (!playStartedFired) {
          playStartedFired = true;
          trackEvent("play_started", {
            set_id: metaRef.current.set_id,
            set_title: metaRef.current.set_title,
            artist: metaRef.current.artist,
            source: sourceRef.current,
          });
        }
        if (playingSince == null) playingSince = performance.now();
      } else {
        flushListenClock();
        // Pause / non-playing: flush leftover so short sessions count.
        persistProgress({ force: true });
      }
      checkMilestones();
    };

    const onPageHide = () => {
      if (pageHideFlushDone) return;
      pageHideFlushDone = true;
      flushListenClock();
      persistProgress({ force: true, keepalive: true });
    };

    const start = async () => {
      try {
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
        if (cancelled) return;
        if (!document.getElementById(iframeId)) return;

        const YT = await loadYoutubeApi();
        if (cancelled) return;

        player = new YT.Player(iframeId, {
          events: {
            onReady: (event) => {
              if (cancelled) return;
              player = event.target;
              // Apply any queued seek only — do not autoplay; user clicks the embed to start.
              if (queuedSeek != null) {
                const s = queuedSeek;
                queuedSeek = null;
                applySeek(s);
              }
              try {
                if (event.target.getPlayerState() === YT_PLAYING) {
                  setPlaying(true);
                }
              } catch {
                /* ignore */
              }
            },
            onStateChange: (event) => {
              if (cancelled) return;
              if (event.data === YT_ENDED) {
                setPlaying(false);
                persistProgress({ force: true, completed: true });
                reportVaultFinish();
                return;
              }
              // Only PLAYING advances the clock; BUFFERING/PAUSED/CUED do not.
              setPlaying(event.data === YT_PLAYING);
            },
          },
        });

        pollId = setInterval(() => {
          if (cancelled) return;
          if (playingSince != null) checkMilestones();
        }, 1000);

        window.addEventListener("pagehide", onPageHide);
        window.addEventListener("beforeunload", onPageHide);
      } catch {
        /* analytics must never break playback */
      }
    };

    void start();

    return () => {
      cancelled = true;
      flushListenClock();
      persistProgress({ force: true, keepalive: true });
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
      if (pollId) clearInterval(pollId);
      if (playerApiRef) playerApiRef.current = null;
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [enabled, iframeId, playerApiRef, playerMountKey]);
}

export { LISTENING_HEARTBEAT_SECONDS };
