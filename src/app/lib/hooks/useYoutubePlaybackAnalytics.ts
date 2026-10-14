"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { trackEvent, type SetAnalyticsMeta } from "@/app/lib/analytics";
import { reportVaultEvent } from "@/app/lib/vault/client";

const MILESTONES: { seconds: number; event: string }[] = [
  { seconds: 30, event: "listen_30_seconds" },
  { seconds: 5 * 60, event: "listen_5_minutes" },
  { seconds: 15 * 60, event: "listen_15_minutes" },
  { seconds: 30 * 60, event: "listen_30_minutes" },
  { seconds: 60 * 60, event: "listen_60_minutes" },
];

const LISTEN_CHUNK_SECONDS = 600;
const FINISH_RATIO = 0.95;

const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_API_SRC = "https://www.youtube.com/iframe_api";

export type YoutubePlayerApi = {
  seekTo: (seconds: number) => void;
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

/**
 * Tracks play_started + listening milestones from real YouTube player state.
 * Accumulates wall time only while YT state is PLAYING (pauses/seeks do not inflate).
 * Also reports vault listen chunks (+5 / 10 min) and finish_set.
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
    let playingSince: number | null = null;
    let listenedMs = 0;
    let playStartedFired = false;
    let finishReported = false;
    const firedMilestones = new Set<string>();
    const reportedChunks = new Set<number>();

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
      playerApiRef.current = { seekTo: applySeek };
    }

    const flushListen = () => {
      if (playingSince == null) return;
      listenedMs += Date.now() - playingSince;
      playingSince = null;
    };

    const listenedSeconds = () =>
      (listenedMs + (playingSince != null ? Date.now() - playingSince : 0)) /
      1000;

    const vaultPayload = () => {
      const videoId = String(metaRef.current.set_id ?? "").trim();
      return {
        videoId,
        djName: metaRef.current.artist ?? "",
        setTitle: metaRef.current.set_title ?? "",
      };
    };

    const reportChunks = () => {
      const seconds = listenedSeconds();
      const chunks = Math.floor(seconds / LISTEN_CHUNK_SECONDS);
      if (chunks < 1) return;
      const { videoId, djName, setTitle } = vaultPayload();
      if (!videoId) return;

      let durationSeconds = 0;
      try {
        durationSeconds = Math.floor(player?.getDuration?.() ?? 0);
      } catch {
        /* ignore */
      }

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

    const reportFinish = () => {
      if (finishReported) return;
      const { videoId, djName, setTitle } = vaultPayload();
      if (!videoId) return;
      finishReported = true;

      let durationSeconds = 0;
      try {
        durationSeconds = Math.floor(player?.getDuration?.() ?? 0);
      } catch {
        /* ignore */
      }

      void reportVaultEvent({
        type: "finish_set",
        videoId,
        djName,
        setTitle,
        durationSeconds,
        listenedSeconds: Math.floor(listenedSeconds()),
      });
    };

    const checkFinishByProgress = () => {
      if (finishReported || !player) return;
      try {
        const duration = player.getDuration?.() ?? 0;
        const current = player.getCurrentTime?.() ?? 0;
        if (duration > 60 && current / duration >= FINISH_RATIO) {
          reportFinish();
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
      reportChunks();
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
        if (playingSince == null) playingSince = Date.now();
      } else {
        flushListen();
      }
      checkMilestones();
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
                reportFinish();
                return;
              }
              setPlaying(event.data === YT_PLAYING);
            },
          },
        });

        pollId = setInterval(() => {
          if (cancelled) return;
          if (playingSince != null) checkMilestones();
        }, 1000);
      } catch {
        /* analytics must never break playback */
      }
    };

    void start();

    return () => {
      cancelled = true;
      flushListen();
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
