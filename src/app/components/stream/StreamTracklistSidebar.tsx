"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AudioLines,
  Check,
  ChevronDown,
  Music2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent, type SetAnalyticsMeta } from "@/app/lib/analytics";
import {
  addMoment,
  deleteMoment,
  listMomentsForVideo,
} from "@/app/lib/profile/moments";
import { useAuthUserId } from "@/app/lib/hooks/useAuthUserId";
import { timestampToSeconds } from "@/app/lib/utils/timestamp";
import { reportVaultEvent } from "@/app/lib/vault/client";
import { vaultTrackKey } from "@/app/lib/vault/week";

export type TrackRow = {
  id: string;
  timestamp: string;
  artist: string;
  title: string;
  spotify_url: string | null;
  soundcloud_url: string | null;
};

const scrollbarSubtle =
  "[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 dark:[&::-webkit-scrollbar-thumb]:bg-brand-from/25";

const scrollbarHidden =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Horizontal swipe/drag to read the full title — scrollbar visually hidden. */
function ScrollableLine({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      title={text}
      className={cn(
        "min-w-0 touch-pan-x overflow-x-auto whitespace-nowrap",
        scrollbarHidden,
        className
      )}
    >
      {text}
    </div>
  );
}

/** Track whose start is the latest at or before `seconds` (playback-driven active row). */
function activeTrackIdAt(
  tracks: TrackRow[],
  seconds: number | null
): string | null {
  if (seconds == null || !Number.isFinite(seconds) || tracks.length === 0) {
    return null;
  }
  let bestId: string | null = null;
  let bestStart = -Infinity;
  for (const t of tracks) {
    if (t.timestamp === "—") continue;
    const start = timestampToSeconds(t.timestamp);
    if (!Number.isFinite(start) || start > seconds) continue;
    if (start >= bestStart) {
      bestStart = start;
      bestId = t.id;
    }
  }
  return bestId;
}

const lgQuery = "(min-width: 1024px)";

export function StreamTracklistSidebar({
  tracks,
  emptyHint,
  className,
  analytics,
  onExpandedChange,
  videoId,
  setTitle,
  onSeek,
  getPlaybackSeconds,
  initialPlaybackSeconds,
}: {
  tracks: TrackRow[];
  emptyHint?: string;
  className?: string;
  analytics?: Partial<SetAnalyticsMeta>;
  /** Fires when mobile expand/collapse changes (`true` = open). Desktop always reports open. */
  onExpandedChange?: (expanded: boolean) => void;
  /** When set, each track can be saved as a profile moment. */
  videoId?: string;
  setTitle?: string;
  /** Jump the stream player to a track timestamp (seconds). */
  onSeek?: (seconds: number) => void;
  /** Live playback clock from the YouTube player API. */
  getPlaybackSeconds?: () => number | null;
  /** Fallback offset before the player API reports time (e.g. `?t=` deep link). */
  initialPlaybackSeconds?: number;
}) {
  const router = useRouter();
  const userId = useAuthUserId();
  const [minimized, setMinimized] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  /** track row id → saved moment id (so we can unsave). */
  const [savedByTrackId, setSavedByTrackId] = useState<Map<string, string>>(
    () => new Map()
  );
  const [saveError, setSaveError] = useState("");
  /** Touch: which row shows the save control after a tap. */
  const [revealedId, setRevealedId] = useState<string | null>(null);
  /** After 3s idle, fade out; cleared at 5s. */
  const [revealedFading, setRevealedFading] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const openedTrackedRef = useRef(false);
  const analyticsRef = useRef(analytics);
  analyticsRef.current = analytics;
  const getPlaybackSecondsRef = useRef(getPlaybackSeconds);
  getPlaybackSecondsRef.current = getPlaybackSeconds;

  const [playbackSeconds, setPlaybackSeconds] = useState<number | null>(
    () =>
      typeof initialPlaybackSeconds === "number" &&
      Number.isFinite(initialPlaybackSeconds)
        ? initialPlaybackSeconds
        : null
  );
  const activeId = activeTrackIdAt(tracks, playbackSeconds);
  const activeIndex = activeId
    ? tracks.findIndex((t) => t.id === activeId)
    : -1;

  useEffect(() => {
    if (
      typeof initialPlaybackSeconds === "number" &&
      Number.isFinite(initialPlaybackSeconds)
    ) {
      setPlaybackSeconds(initialPlaybackSeconds);
    }
  }, [initialPlaybackSeconds]);

  useEffect(() => {
    if (!getPlaybackSeconds) return;
    const tick = () => {
      const next = getPlaybackSecondsRef.current?.() ?? null;
      if (next == null) return;
      setPlaybackSeconds((prev) =>
        prev != null && Math.abs(prev - next) < 0.2 ? prev : next
      );
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [getPlaybackSeconds]);

  // Apple Music-style: keep now-playing near the top so upcoming tracks stay in view.
  useEffect(() => {
    if (!activeId || minimized) return;
    const scroller = scrollerRef.current;
    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-track-id="${activeId.replace(/"/g, "")}"]`
    );
    if (!scroller || !row) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const targetTop = scroller.scrollTop + (rowRect.top - scrollerRect.top) - 8;
    scroller.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }, [activeId, minimized]);

  useEffect(() => {
    if (!revealedId) {
      setRevealedFading(false);
      return;
    }
    setRevealedFading(false);
    const onPointerDown = (e: PointerEvent) => {
      const list = listRef.current;
      if (!list || !(e.target instanceof Node) || list.contains(e.target)) {
        return;
      }
      setRevealedId(null);
    };
    const fadeTimer = window.setTimeout(() => setRevealedFading(true), 3000);
    const hideTimer = window.setTimeout(() => setRevealedId(null), 5000);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [revealedId]);

  const momentKey = (timestamp: string, title: string, artist: string) =>
    `${timestampToSeconds(timestamp)}|${title.trim().toLowerCase()}|${artist.trim().toLowerCase()}`;

  useEffect(() => {
    if (!userId || !videoId || tracks.length === 0) {
      setSavedByTrackId(new Map());
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const existing = await listMomentsForVideo(userId, videoId);
        if (cancelled) return;
        const byKey = new Map(
          existing.map((m) => [
            `${m.timestamp_seconds}|${m.track_title.trim().toLowerCase()}|${m.track_artist.trim().toLowerCase()}`,
            m.id,
          ])
        );
        const next = new Map<string, string>();
        for (const t of tracks) {
          const momentId = byKey.get(momentKey(t.timestamp, t.title, t.artist));
          if (momentId) next.set(t.id, momentId);
        }
        setSavedByTrackId(next);
      } catch {
        if (!cancelled) setSavedByTrackId(new Map());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, videoId, tracks]);

  const fireTracklistOpened = () => {
    if (openedTrackedRef.current) return;
    openedTrackedRef.current = true;
    trackEvent("tracklist_opened", {
      set_id: analyticsRef.current?.set_id,
      set_title: analyticsRef.current?.set_title,
      artist: analyticsRef.current?.artist,
    });
  };

  useEffect(() => {
    if (window.matchMedia(lgQuery).matches) {
      setMinimized(false);
      fireTracklistOpened();
      onExpandedChange?.(true);
    } else {
      onExpandedChange?.(false);
    }
    // Only sync initial breakpoint state on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onExpandedChange?.(!minimized);
  }, [minimized, onExpandedChange]);

  const toggleMinimized = () => {
    if (window.matchMedia(lgQuery).matches) return;
    setMinimized((prev) => {
      const next = !prev;
      if (prev && !next) fireTracklistOpened();
      return next;
    });
  };

  const trackPayload = (t: TrackRow) => ({
    set_id: analytics?.set_id,
    track_title: t.title,
    track_artist: t.artist,
    timestamp: t.timestamp,
  });

  const handleToggleMoment = async (t: TrackRow) => {
    if (!videoId) return;

    if (!userId) {
      router.push("/login");
      return;
    }

    const existingId = savedByTrackId.get(t.id);
    setSavingId(t.id);
    setSaveError("");
    try {
      const trackKey = vaultTrackKey({
        artist: t.artist,
        title: t.title,
        timestamp: t.timestamp,
      });
      if (existingId) {
        await deleteMoment(existingId);
        setSavedByTrackId((prev) => {
          const next = new Map(prev);
          next.delete(t.id);
          return next;
        });
        trackEvent("moment_removed", trackPayload(t));
        void reportVaultEvent({
          type: "unsave_track",
          videoId,
          trackKey,
          djName: analytics?.artist,
          setTitle: setTitle ?? analytics?.set_title ?? "",
        });
      } else {
        const created = await addMoment({
          video_id: videoId,
          set_title: setTitle ?? analytics?.set_title ?? "",
          track_title: t.title,
          track_artist: t.artist,
          timestamp_label: t.timestamp,
        });
        setSavedByTrackId((prev) => {
          const next = new Map(prev);
          next.set(t.id, created.id);
          return next;
        });
        trackEvent("moment_saved", trackPayload(t));
        void reportVaultEvent({
          type: "save_track",
          videoId,
          momentId: created.id,
          trackKey,
          djName: analytics?.artist,
          setTitle: setTitle ?? analytics?.set_title ?? "",
        });
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not update moment"
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div
      className={cn(
        "relative flex min-h-0 w-full flex-col overflow-hidden rounded-none border border-black/6 bg-black/[0.02] dark:border-white/[0.06] dark:bg-white/[0.02]",
        minimized
          ? "min-h-0 max-h-none"
          : "min-h-[12rem] max-h-[min(72vh,580px)] lg:max-h-none lg:min-h-0",
        className
      )}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 border-b border-black/6 px-4 py-2.5 text-left dark:border-white/[0.06] lg:pointer-events-none lg:cursor-default"
          onClick={toggleMinimized}
          aria-expanded={!minimized}
          aria-controls="stream-tracklist"
        >
          <Music2
            className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-brand-from/70"
            aria-hidden
          />
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-brand-from/70">
            Tracklist
          </span>
          <span className="ml-auto text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
            {tracks.length}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-bends-fast ease-bends lg:hidden",
              !minimized && "rotate-180"
            )}
            aria-hidden
          />
        </button>

        {saveError ? (
          <p className="px-4 py-2 text-xs text-red-400" role="alert">
            {saveError}
          </p>
        ) : null}

        <div
          ref={scrollerRef}
          id="stream-tracklist"
          data-scroll-lock-ignore
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-y-none touch-pan-y px-1.5 py-1.5",
            scrollbarSubtle,
            minimized && "max-lg:hidden"
          )}
        >
          {tracks.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-zinc-500">
              {emptyHint ??
                "No tracks yet. The pipeline may still be linking this set."}
            </p>
          ) : (
            <ul
              ref={listRef}
              className="space-y-0.5 pb-[min(55vh,22rem)] lg:pb-16"
            >
              {tracks.map((t, index) => {
                const saved = savedByTrackId.has(t.id);
                const actionVisible = revealedId === t.id;
                const isActive = activeId === t.id;
                const isPast = activeIndex >= 0 && index < activeIndex;
                const isUpcoming = activeIndex >= 0 && index > activeIndex;
                return (
                  <li
                    key={t.id}
                    data-track-id={t.id}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "group rounded-sm px-2 transition-[background-color,opacity,transform,padding] duration-bends ease-bends",
                      isActive
                        ? "bg-brand-from/10 py-3 dark:bg-[rgb(32_30_20)]"
                        : isPast
                          ? "py-1.5 opacity-40 hover:opacity-70"
                          : "py-2 opacity-80 hover:bg-black/[0.03] hover:opacity-100 dark:hover:bg-white/[0.03]"
                    )}
                    onClick={() => {
                      trackEvent("track_clicked", trackPayload(t));
                      setRevealedId(t.id);
                    }}
                  >
                    <div
                      className={cn(
                        "flex min-w-0 items-start gap-2.5",
                        isActive && "items-center"
                      )}
                    >
                      {onSeek && t.timestamp !== "—" ? (
                        <button
                          type="button"
                          title={`Jump to ${t.timestamp}`}
                          aria-label={`Jump to ${t.timestamp}: ${t.title}`}
                          className={cn(
                            "shrink-0 font-mono tabular-nums underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-brand-from/40",
                            isActive
                              ? "text-sm text-brand-from"
                              : isPast
                                ? "mt-0.5 text-[10px] text-brand-from/40"
                                : "mt-0.5 text-[11px] text-brand-from/55 dark:text-brand-from/50"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            const seconds = timestampToSeconds(t.timestamp);
                            trackEvent("track_clicked", trackPayload(t));
                            onSeek(seconds);
                            setPlaybackSeconds(seconds);
                          }}
                        >
                          {t.timestamp}
                        </button>
                      ) : (
                        <span
                          className={cn(
                            "shrink-0 font-mono tabular-nums",
                            isActive
                              ? "text-sm text-brand-from"
                              : isPast
                                ? "mt-0.5 text-[10px] text-brand-from/40"
                                : "mt-0.5 text-[11px] text-brand-from/55 dark:text-brand-from/50"
                          )}
                        >
                          {t.timestamp}
                        </span>
                      )}
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {isActive ? (
                            <AudioLines
                              className="h-3.5 w-3.5 shrink-0 text-brand-from"
                              aria-hidden
                            />
                          ) : null}
                          <ScrollableLine
                            text={t.title}
                            className={cn(
                              "min-w-0 flex-1 leading-snug",
                              isActive
                                ? "text-base font-semibold text-zinc-900 dark:text-zinc-50 sm:text-lg"
                                : isPast
                                  ? "text-xs text-zinc-500"
                                  : isUpcoming
                                    ? "text-sm text-zinc-600 dark:text-zinc-400"
                                    : "text-sm text-zinc-700 dark:text-zinc-300"
                            )}
                          />
                        </div>
                        {t.artist.trim() && t.artist.trim() !== "—" ? (
                          <ScrollableLine
                            text={t.artist}
                            className={cn(
                              "mt-0.5 w-full",
                              isActive
                                ? "text-sm text-zinc-500 dark:text-zinc-400"
                                : "text-xs text-zinc-500"
                            )}
                          />
                        ) : null}
                        {(t.spotify_url || t.soundcloud_url) && (
                          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] leading-none text-zinc-500">
                            {t.spotify_url && (
                              <a
                                href={t.spotify_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-sm hover:text-[#1ed760] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#1ed760]/50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const payload = trackPayload(t);
                                  trackEvent("track_clicked", payload);
                                  trackEvent("track_external_clicked", payload);
                                }}
                              >
                                Spotify
                              </a>
                            )}
                            {t.spotify_url && t.soundcloud_url && (
                              <span className="text-zinc-400" aria-hidden>
                                ·
                              </span>
                            )}
                            {t.soundcloud_url && (
                              <a
                                href={t.soundcloud_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-sm hover:text-[#ff5500] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#ff5500]/50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const payload = trackPayload(t);
                                  trackEvent("track_clicked", payload);
                                  trackEvent("track_external_clicked", payload);
                                }}
                              >
                                SoundCloud
                              </a>
                            )}
                          </p>
                        )}
                      </div>
                      {videoId && userId ? (
                        <button
                          type="button"
                          title={
                            saved
                              ? "Remove moment from profile"
                              : "Save moment to profile"
                          }
                          aria-label={
                            saved
                              ? `Remove moment: ${t.title}`
                              : `Save moment: ${t.title}`
                          }
                          disabled={savingId === t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRevealedId(t.id);
                            handleToggleMoment(t);
                          }}
                          className={cn(
                            "shrink-0 self-center rounded-md p-1 text-zinc-500 transition-[opacity,color,background-color] ease-bends hover:bg-brand-from/10 hover:text-brand-from disabled:opacity-60 dark:text-zinc-500",
                            saved
                              ? cn(
                                  "pointer-events-auto text-brand-from",
                                  actionVisible && revealedFading
                                    ? "opacity-40 duration-[2000ms]"
                                    : actionVisible
                                      ? "opacity-100 duration-bends-fast"
                                      : "opacity-40 duration-bends-fast group-hover:opacity-100 group-focus-within:opacity-100"
                                )
                              : actionVisible
                                ? cn(
                                    "pointer-events-auto",
                                    revealedFading
                                      ? "opacity-0 duration-[2000ms]"
                                      : "opacity-100 duration-bends-fast"
                                  )
                                : "pointer-events-none opacity-0 duration-bends-fast group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                          )}
                        >
                          {saved ? (
                            <Check
                              className="h-3.5 w-3.5"
                              strokeWidth={2}
                              aria-hidden
                            />
                          ) : (
                            <Plus
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                          )}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
