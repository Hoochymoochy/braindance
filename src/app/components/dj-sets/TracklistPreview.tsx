"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListMusic } from "lucide-react";

export type TracklistTrack = {
  timestamp_label?: string;
  timestamp_seconds?: number;
  artist?: string;
  title?: string;
  raw?: string;
  position?: number;
};

type TracklistsApiItem = {
  payload?: {
    tracks?: TracklistTrack[];
    primary_source?: string;
  };
};

type TracklistsResponse = {
  video_id?: string;
  count?: number;
  items?: TracklistsApiItem[];
  error?: string;
};

function trackBody(t: TracklistTrack): string {
  const named = [t.artist, t.title].filter(Boolean).join(" — ");
  if (named) return named;
  if (t.raw?.trim()) return t.raw.trim();
  return "Track";
}

export function TracklistPreview({
  videoId,
  className = "",
}: {
  videoId: string;
  className?: string;
}) {
  const [state, setState] = useState<{
    loading: boolean;
    tracks: TracklistTrack[];
    source?: string;
    error?: string;
  }>({ loading: true, tracks: [] });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, tracks: [] });

    (async () => {
      try {
        const res = await fetch(
          `/api/dj-sets/${encodeURIComponent(videoId)}/tracklists`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as TracklistsResponse;
        if (cancelled) return;
        const items = data.items ?? [];
        const first = items.find((i) => i.payload?.tracks?.length);
        const tracks = first?.payload?.tracks ?? [];
        const source = first?.payload?.primary_source;
        setState({
          loading: false,
          tracks,
          source,
          error: data.error,
        });
      } catch {
        if (!cancelled) {
          setState({ loading: false, tracks: [], error: "Failed to load" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  if (state.loading) {
    return (
      <div
        className={`glass-bends-card flex min-h-[180px] flex-col rounded-2xl p-4 ${className}`}
        aria-busy
      >
        <div className="mb-3 h-4 w-32 animate-pulse rounded bg-white/10" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-3 animate-pulse rounded bg-white/[0.06]"
              style={{ width: `${72 + (i % 3) * 8}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (state.tracks.length === 0) {
    return (
      <div
        className={`glass-bends-card flex min-h-[180px] flex-col justify-center rounded-2xl p-4 text-sm text-white/45 ${className}`}
      >
        <div className="flex items-center gap-2 text-white/55">
          <ListMusic className="h-4 w-4 shrink-0 text-[#00ccff]/60" />
          <span>No tracklist parsed yet</span>
        </div>
        {state.error && (
          <p className="mt-2 text-xs text-white/35">{state.error}</p>
        )}
        <Link
          href={`/stream/${videoId}`}
          className="mt-3 text-xs text-[#00ccff]/80 underline-offset-2 hover:text-[#00ccff] hover:underline"
        >
          Open stream page
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`glass-bends-card flex min-h-[180px] flex-col rounded-2xl p-4 ${className}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#00ccff]/80">
          <ListMusic className="h-3.5 w-3.5" />
          Tracklist
        </span>
        {state.source && (
          <span className="text-[10px] uppercase text-white/35">
            {state.source.replace(/_/g, " ")}
          </span>
        )}
      </div>
      <ul className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1 text-xs leading-snug text-white/85 [scrollbar-width:thin]">
        {state.tracks.map((t, idx) => (
          <li
            key={`${t.position ?? idx}-${t.raw ?? idx}`}
            className="border-b border-white/[0.04] pb-1.5 last:border-0 last:pb-0"
          >
            <span className="text-[#ff00f7]/75 tabular-nums">
              {t.timestamp_label ?? "—"}
            </span>{" "}
            <span className="text-white/90">{trackBody(t)}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/stream/${videoId}`}
        className="mt-3 text-[11px] text-[#00ccff]/75 transition-colors hover:text-[#00ccff]"
      >
        Full player →
      </Link>
    </div>
  );
}
