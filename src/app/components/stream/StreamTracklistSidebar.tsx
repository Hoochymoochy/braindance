"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Music2, BookmarkPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent, type SetAnalyticsMeta } from "@/app/lib/analytics";
import { addMoment } from "@/app/lib/profile/moments";
import { useAuthUserId } from "@/app/lib/hooks/useAuthUserId";

export type TrackRow = {
  id: string;
  timestamp: string;
  artist: string;
  title: string;
  spotify_url: string | null;
  soundcloud_url: string | null;
};

const scrollbarHidden =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Horizontal scroll, scrollbar visually hidden (still swipe / drag / shift+wheel). */
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
        "touch-pan-x cursor-default overflow-x-auto whitespace-nowrap",
        scrollbarHidden,
        className
      )}
    >
      {text}
    </div>
  );
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
}) {
  const router = useRouter();
  const userId = useAuthUserId();
  const [minimized, setMinimized] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const openedTrackedRef = useRef(false);
  const analyticsRef = useRef(analytics);
  analyticsRef.current = analytics;

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

  const handleSaveMoment = async (t: TrackRow) => {
    if (!videoId) return;

    if (!userId) {
      router.push("/login");
      return;
    }

    setSavingId(t.id);
    setSaveError("");
    try {
      await addMoment({
        video_id: videoId,
        set_title: setTitle ?? analytics?.set_title ?? "",
        track_title: t.title,
        track_artist: t.artist,
        timestamp_label: t.timestamp,
      });
      setSavedId(t.id);
      trackEvent("moment_saved", trackPayload(t));
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save moment"
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div
      className={cn(
        "glass-bends-card relative flex min-h-0 w-full flex-col overflow-hidden rounded-none",
        minimized
          ? "min-h-0 max-h-none"
          : "min-h-[10rem] max-h-[min(65vh,520px)] lg:max-h-none lg:min-h-0",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-from/[0.14] via-brand-via/[0.06] to-brand-to/[0.14]"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 border-b border-black/8 px-4 py-3 text-left lg:pointer-events-none lg:cursor-default"
          onClick={toggleMinimized}
          aria-expanded={!minimized}
          aria-controls="stream-tracklist"
        >
          <Music2 className="h-3.5 w-3.5 shrink-0 text-brand-from" aria-hidden />
          <span className="bg-gradient-to-r from-brand-from via-brand-via to-brand-to bg-clip-text text-[11px] font-semibold uppercase tracking-[0.2em] text-transparent">
            Tracklist
          </span>
          <span className="ml-auto bg-gradient-to-r from-brand-from/80 to-brand-via/80 bg-clip-text text-xs tabular-nums text-transparent">
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
          id="stream-tracklist"
          data-scroll-lock-ignore
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-y-none touch-pan-y px-2 py-2",
            scrollbarHidden,
            minimized && "max-lg:hidden"
          )}
        >
          {tracks.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-zinc-500">
              {emptyHint ??
                "No tracks yet. The pipeline may still be linking this set."}
            </p>
          ) : (
            <ul className="space-y-1">
              {tracks.map((t) => (
                <li
                  key={t.id}
                  className="group rounded-md border border-transparent px-2 py-2 transition-[border-color,background-color] duration-bends-fast ease-bends hover:border-black/8 hover:bg-black/[0.03]"
                  onClick={() => {
                    trackEvent("track_clicked", trackPayload(t));
                  }}
                >
                  <div className="flex gap-2">
                    <span className="shrink-0 bg-gradient-to-b from-brand-from to-brand-to bg-clip-text font-mono text-xs tabular-nums text-transparent">
                      {t.timestamp}
                    </span>
                    <div className="min-w-0 flex-1">
                      <ScrollableLine
                        text={t.title}
                        className="text-sm font-medium text-zinc-900"
                      />
                      <ScrollableLine
                        text={t.artist}
                        className="text-xs text-zinc-500"
                      />
                      {(t.spotify_url || t.soundcloud_url) && (
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px] leading-none text-zinc-500">
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
                    {videoId ? (
                      <button
                        type="button"
                        title="Save moment to profile"
                        aria-label={`Save moment: ${t.title}`}
                        disabled={savingId === t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveMoment(t);
                        }}
                        className={cn(
                          "shrink-0 self-start rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-brand-from/10 hover:text-brand-from",
                          savedId === t.id && "text-brand-from"
                        )}
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
