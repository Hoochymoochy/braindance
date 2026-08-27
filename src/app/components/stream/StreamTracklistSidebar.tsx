"use client";

import { useState } from "react";
import { ChevronDown, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
}: {
  tracks: TrackRow[];
  emptyHint?: string;
  className?: string;
}) {
  const [minimized, setMinimized] = useState(false);

  const toggleMinimized = () => {
    if (window.matchMedia(lgQuery).matches) return;
    setMinimized((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "glass-bends-card relative flex min-h-0 w-full flex-col overflow-hidden rounded-lg",
        minimized
          ? "min-h-0 max-h-none"
          : "min-h-[10rem] max-h-[min(65vh,520px)] lg:max-h-none lg:min-h-0",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#00ccff]/[0.14] via-[#ff00f7]/[0.06] to-[#3700ff]/[0.14]"
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
          <Music2 className="h-3.5 w-3.5 shrink-0 text-[#00ccff]" aria-hidden />
          <span className="bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-[11px] font-semibold uppercase tracking-[0.2em] text-transparent">
            Tracklist
          </span>
          <span className="ml-auto bg-gradient-to-r from-[#00ccff]/80 to-[#ff00f7]/80 bg-clip-text text-xs tabular-nums text-transparent">
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

        <div
          id="stream-tracklist"
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2",
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
              >
                <div className="flex gap-2">
                  <span className="shrink-0 bg-gradient-to-b from-[#00ccff] to-[#3700ff] bg-clip-text font-mono text-xs tabular-nums text-transparent">
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
                          >
                            SoundCloud
                          </a>
                        )}
                      </p>
                    )}
                  </div>
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
