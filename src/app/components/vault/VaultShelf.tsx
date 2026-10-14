"use client";

import Image from "next/image";
import Link from "next/link";
import type { VaultUnlock } from "@/app/lib/vault/types";
import {
  upgradeYoutubeThumbnail,
  youtubeThumbnailUrl,
} from "@/app/lib/utils/youtube";

export function VaultShelf({
  unlocks,
  emptyLabel = "No vaulted sets yet.",
  playable = true,
}: {
  unlocks: VaultUnlock[];
  emptyLabel?: string;
  /** When false (public flex), show collectibles without implying strangers can play. */
  playable?: boolean;
}) {
  const items = unlocks.filter((u) => u.week);

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyLabel}</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((u) => {
        const week = u.week!;
        const thumb =
          upgradeYoutubeThumbnail(week.thumbnail, week.video_id) ||
          youtubeThumbnailUrl(week.video_id, "maxresdefault");
        const content = (
          <>
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
              <Image
                src={thumb}
                alt={week.title || "Vault set"}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                quality={90}
                className="object-cover object-center scale-[1.12]"
              />
            </div>
            <div className="space-y-1 p-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                Week of {week.week_start}
              </p>
              <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                {week.title || "Vault set"}
              </p>
              {week.channel ? (
                <p className="truncate text-xs text-zinc-500">{week.channel}</p>
              ) : null}
            </div>
          </>
        );

        return (
          <li key={week.week_start}>
            {playable ? (
              <Link
                href={`/stream/${week.video_id}?src=vault`}
                className="glass-bends-card block overflow-hidden rounded-none transition-opacity duration-bends-fast ease-bends hover:opacity-90"
              >
                {content}
              </Link>
            ) : (
              <div className="glass-bends-card overflow-hidden rounded-none">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
