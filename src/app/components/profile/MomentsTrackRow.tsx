"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Star, Trash2 } from "lucide-react";
import type { Moment } from "@/app/lib/profile/moments";
import { youtubeThumbnailUrl } from "@/app/lib/utils/youtube";
import { cn } from "@/lib/utils";

export function MomentsTrackRow({
  moment,
  index,
  nested = false,
  onDelete,
  onToggleFavorite,
  favoriteDisabled,
}: {
  moment: Moment;
  index: number;
  /** Inside a set folder: tracklist-style row (no set name / redundant thumb). */
  nested?: boolean;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  /** True when 3 favorites are already pinned and this row isn't one. */
  favoriteDisabled?: boolean;
}) {
  const href = `/stream/${moment.video_id}?t=${moment.timestamp_seconds}`;
  const thumb = youtubeThumbnailUrl(moment.video_id, "mqdefault");
  const isFavorite = typeof moment.favorite_rank === "number";

  return (
    <div
      className={cn(
        "group grid items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        nested
          ? "grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:grid-cols-[2rem_minmax(0,1fr)_5rem_auto]"
          : "grid-cols-[2.5rem_2.5rem_minmax(0,1fr)_auto] sm:grid-cols-[2rem_2.5rem_minmax(0,1fr)_5rem_auto]"
      )}
    >
      <div className="relative flex h-8 w-8 items-center justify-center">
        {isFavorite ? (
          <span
            className="text-xs font-semibold tabular-nums text-brand-from"
            title={`Favorite #${moment.favorite_rank}`}
          >
            ★{moment.favorite_rank}
          </span>
        ) : (
          <>
            <span className="text-sm tabular-nums text-zinc-400 group-hover:hidden">
              {index + 1}
            </span>
            <Play
              className="absolute hidden h-3.5 w-3.5 fill-current text-zinc-800 group-hover:block dark:text-zinc-100"
              aria-hidden
            />
          </>
        )}
      </div>

      {!nested ? (
        <Link
          href={href}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-zinc-200 dark:bg-zinc-800"
        >
          <Image src={thumb} alt="" fill className="object-cover" sizes="40px" />
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
        {onToggleFavorite ? (
          <button
            type="button"
            aria-label={
              isFavorite
                ? "Remove from top moments"
                : favoriteDisabled
                  ? "Top moments full — unpin one first"
                  : "Add to top moments"
            }
            title={
              isFavorite
                ? "Remove from top 3"
                : favoriteDisabled
                  ? "Top 3 full — unpin one first"
                  : "Pin to top 3"
            }
            disabled={favoriteDisabled && !isFavorite}
            onClick={onToggleFavorite}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              isFavorite
                ? "text-brand-from"
                : "text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-brand-from disabled:cursor-not-allowed disabled:opacity-30"
            )}
          >
            <Star
              className={cn("h-3.5 w-3.5", isFavorite && "fill-current")}
            />
          </button>
        ) : null}

        {onDelete ? (
          <button
            type="button"
            aria-label="Remove moment"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : !onToggleFavorite ? (
          <span className="font-mono text-xs tabular-nums text-zinc-500 sm:hidden">
            {moment.timestamp_label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
