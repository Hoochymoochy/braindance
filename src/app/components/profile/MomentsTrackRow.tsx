"use client";

import Link from "next/link";
import { Play, Trash2 } from "lucide-react";
import type { Moment } from "@/app/lib/profile/moments";
import { YoutubeThumbImage } from "@/app/components/ui/YoutubeThumbImage";
import { cn } from "@/lib/utils";

export function MomentsTrackRow({
  moment,
  index,
  nested = false,
  onDelete,
}: {
  moment: Moment;
  index: number;
  /** Inside a set folder: tracklist-style row (no set name / redundant thumb). */
  nested?: boolean;
  onDelete?: () => void;
}) {
  const href = `/stream/${moment.video_id}?t=${moment.timestamp_seconds}`;

  return (
    <div
      className={cn(
        "group grid items-center gap-3 rounded-sm px-1 py-2 transition-opacity duration-bends-fast ease-bends hover:opacity-80",
        nested
          ? "grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:grid-cols-[2rem_minmax(0,1fr)_5rem_auto]"
          : "grid-cols-[2.5rem_2.5rem_minmax(0,1fr)_auto] sm:grid-cols-[2rem_2.5rem_minmax(0,1fr)_5rem_auto]"
      )}
    >
      <div className="relative flex h-8 w-8 items-center justify-center">
        <span className="text-sm tabular-nums text-zinc-400 group-hover:hidden">
          {index + 1}
        </span>
        <Play
          className="absolute hidden h-3.5 w-3.5 fill-current text-zinc-800 group-hover:block dark:text-zinc-100"
          aria-hidden
        />
      </div>

      {!nested ? (
        <Link
          href={href}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-zinc-200 dark:bg-zinc-800"
        >
          <YoutubeThumbImage videoId={moment.video_id} sizes="80px" />
        </Link>
      ) : null}

      <Link href={href} className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {moment.track_title || "Untitled track"}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {moment.track_artist || "Unknown artist"}
          {!nested && moment.set_title ? ` · ${moment.set_title}` : ""}
        </p>
      </Link>

      <Link
        href={href}
        className="hidden font-mono text-xs tabular-nums text-zinc-500 sm:block"
      >
        {moment.timestamp_label}
      </Link>

      <div className="flex items-center gap-0.5">
        {onDelete ? (
          <button
            type="button"
            aria-label="Remove moment"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="font-mono text-xs tabular-nums text-zinc-500 sm:hidden">
            {moment.timestamp_label}
          </span>
        )}
      </div>
    </div>
  );
}
