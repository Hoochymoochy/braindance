"use client";

import { ExternalLink, Music2 } from "lucide-react";

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
    <div className="glass-bends-card flex max-h-[min(70vh,720px)] min-h-[200px] flex-col rounded-lg border border-white/10 bg-white/5 backdrop-blur-lg">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3">
        <Music2 className="h-4 w-4 text-[#00ccff]" aria-hidden />
        <h3 className="bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-base font-bold text-transparent">
          Tracklist
        </h3>
        <span className="ml-auto text-xs text-gray-500">{tracks.length} tracks</span>
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
                    <div className="mt-1 flex flex-wrap gap-2">
                      {t.spotify_url && (
                        <a
                          href={t.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#1ed760] transition-opacity hover:opacity-80"
                        >
                          Spotify
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                      {t.soundcloud_url && (
                        <a
                          href={t.soundcloud_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#ff5500] transition-opacity hover:opacity-80"
                        >
                          SoundCloud
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </div>
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
