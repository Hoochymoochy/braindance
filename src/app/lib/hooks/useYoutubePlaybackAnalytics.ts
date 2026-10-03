"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type SetAnalyticsMeta } from "@/app/lib/analytics";

const MILESTONES: { seconds: number; event: string }[] = [
  { seconds: 30, event: "listen_30_seconds" },
  { seconds: 5 * 60, event: "listen_5_minutes" },
  { seconds: 15 * 60, event: "listen_15_minutes" },
  { seconds: 30 * 60, event: "listen_30_minutes" },
  { seconds: 60 * 60, event: "listen_60_minutes" },
];

const YT_PLAYING = 1;
const YT_API_SRC = "https://www.youtube.com/iframe_api";

type YtPlayer = {
  destroy: () => void;
  getPlayerState: () => number;
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

      // Already loading / loaded but callback missed
      if (window.YT?.Player) resolve(window.YT);
    });
  }

  return ytApiPromise;
}

/**
 * Tracks play_started + listening milestones from real YouTube player state.
 * Accumulates wall time only while YT state is PLAYING (pauses/seeks do not inflate).
 */
export function useYoutubePlaybackAnalytics({
  enabled,
  iframeId,
  meta,
  source,
}: {
  enabled: boolean;
  iframeId: string;
  meta: Partial<SetAnalyticsMeta>;
  source?: string;
}) {
  const metaRef = useRef(meta);
  const sourceRef = useRef(source);
  metaRef.current = meta;
  sourceRef.current = source;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let player: YtPlayer | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let playingSince: number | null = null;
    let listenedMs = 0;
    let playStartedFired = false;
    const firedMilestones = new Set<string>();

    const flushListen = () => {
      if (playingSince == null) return;
      listenedMs += Date.now() - playingSince;
      playingSince = null;
    };

    const checkMilestones = () => {
      const total =
        listenedMs + (playingSince != null ? Date.now() - playingSince : 0);
      const seconds = total / 1000;
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
        // Wait a tick so the iframe exists in the DOM after activation.
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
        if (cancelled) return;
        if (!document.getElementById(iframeId)) return;

        const YT = await loadYoutubeApi();
        if (cancelled) return;

        player = new YT.Player(iframeId, {
          events: {
            onReady: (event) => {
              if (cancelled) return;
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
              setPlaying(event.data === YT_PLAYING);
            },
          },
        });

        // Lightweight poll while playing to hit milestones without depending on seeks.
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
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [enabled, iframeId]);
}
