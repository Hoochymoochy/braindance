"use client";

import { Music2 } from "lucide-react";

export type TrackRow = {
  id: string;
  timestamp: string;
  artist: string;
  title: string;
  spotify_url: string | null;
  soundcloud_url: string | null;
};

export function StreamTracklistSidebar({
  tracks,
  emptyHint,
}: {
  tracks: TrackRow[];
  emptyHint?: string;
}) {
  return (
    <div className="glass-bends-card flex max-h-[min(70vh,720px)] min-h-[200px] flex-col rounded-lg">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3">
        <Music2 className="h-3.5 w-3.5 text-[#00ccff]/80" aria-hidden />
        <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500">
          Tracklist
        </h3>
        <span className="ml-auto text-xs tabular-nums text-gray-600">
          {tracks.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {tracks.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-gray-500">
            {emptyHint ??
              "No tracks yet. The pipeline may still be linking this set."}
          </p>
        ) : (
          <ul className="space-y-1">
            {tracks.map((t) => (
              <li
                key={t.id}
                className="group rounded-md border border-transparent px-2 py-2 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className="flex gap-2">
                  <span className="shrink-0 font-mono text-xs tabular-nums text-[#00ccff]/80">
                    {t.timestamp}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/95">
                      {t.title}
                    </p>
                    <p className="truncate text-xs text-gray-400">{t.artist}</p>
                    {(t.spotify_url || t.soundcloud_url) && (
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px] leading-none text-gray-500">
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
                          <span className="text-gray-600" aria-hidden>
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
  );
}
