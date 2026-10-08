"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Trash2 } from "lucide-react";
import type { CrateSet } from "@/app/lib/profile/crates";
import { youtubeThumbnailUrl } from "@/app/lib/utils/youtube";

export function CrateSetRow({
  set,
  index,
  crateId,
  onRemove,
}: {
  set: CrateSet;
  index: number;
  /** When set, stream links keep the crate queue via `?crate=`. */
  crateId?: string;
  onRemove?: () => void;
}) {
  const href = crateId
    ? `/stream/${set.video_id}?src=crate&crate=${encodeURIComponent(crateId)}`
    : `/stream/${set.video_id}?src=crate`;
  const thumb =
    set.thumbnail || youtubeThumbnailUrl(set.video_id, "mqdefault");

  return (
    <div className="group grid grid-cols-[2.5rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-black/[0.04] sm:grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] dark:hover:bg-white/[0.06]">
      <div className="relative flex h-8 w-8 items-center justify-center">
        <span className="text-sm tabular-nums text-zinc-400 group-hover:hidden">
          {index + 1}
        </span>
        <Play
          className="absolute hidden h-3.5 w-3.5 fill-current text-zinc-800 group-hover:block dark:text-zinc-100"
          aria-hidden
        />
      </div>

      <Link
        href={href}
        className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-zinc-200 dark:bg-zinc-800"
      >
        <Image src={thumb} alt="" fill className="object-cover" sizes="40px" />
      </Link>

      <Link href={href} className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {set.title || "Untitled set"}
        </p>
        <p className="truncate text-xs text-zinc-500">{set.channel}</p>
      </Link>

      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${set.title}`}
          onClick={onRemove}
          className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
