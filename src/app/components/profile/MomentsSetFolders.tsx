"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  groupMomentsBySet,
  type Moment,
} from "@/app/lib/profile/moments";
import { youtubeThumbnailUrl } from "@/app/lib/utils/youtube";
import { MomentsTrackRow } from "@/app/components/profile/MomentsTrackRow";
import { cn } from "@/lib/utils";

function defaultOpenIds(moments: Moment[]): Set<string> {
  const groups = groupMomentsBySet(moments);
  const initial = new Set<string>();
  if (groups[0]) initial.add(groups[0].video_id);
  return initial;
}

export function MomentsSetFolders({
  moments,
  favoriteCount = 0,
  maxFavorites,
  onToggleFavorite,
  onDelete,
}: {
  moments: Moment[];
  favoriteCount?: number;
  maxFavorites?: number;
  onToggleFavorite?: (moment: Moment) => void | Promise<void>;
  onDelete?: (moment: Moment) => void | Promise<void>;
}) {
  const groups = groupMomentsBySet(moments);
  const [openIds, setOpenIds] = useState<Set<string>>(() =>
    defaultOpenIds(moments)
  );
  const [didInitOpen, setDidInitOpen] = useState(moments.length > 0);

  useEffect(() => {
    if (didInitOpen || moments.length === 0) return;
    setOpenIds(defaultOpenIds(moments));
    setDidInitOpen(true);
  }, [moments, didInitOpen]);

  const toggle = (videoId: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  };

  if (groups.length === 0) return null;

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const open = openIds.has(group.video_id);
        const thumb = youtubeThumbnailUrl(group.video_id, "mqdefault");
        const panelId = `moments-set-${group.video_id}`;

        return (
          <div
            key={group.video_id}
            className="overflow-hidden rounded-xl border border-black/8 bg-white/40 dark:border-brand-from/15 dark:bg-black/20"
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={() => toggle(group.video_id)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-bends-fast ease-bends",
                    open && "rotate-90"
                  )}
                  aria-hidden
                />
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {group.set_title}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {group.moments.length}{" "}
                    {group.moments.length === 1 ? "moment" : "moments"}
                  </span>
                </span>
              </button>
              <Link
                href={`/stream/${group.video_id}`}
                className="shrink-0 rounded-full border border-black/8 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-brand-from/35 hover:text-brand-from dark:border-brand-from/20 dark:text-zinc-300"
              >
                Open set
              </Link>
            </div>

            {open ? (
              <div
                id={panelId}
                className="border-t border-black/6 px-1 py-1 dark:border-brand-from/10"
              >
                {group.moments.map((moment, i) => (
                  <MomentsTrackRow
                    key={moment.id}
                    moment={moment}
                    index={i}
                    nested
                    favoriteDisabled={
                      typeof maxFavorites === "number" &&
                      favoriteCount >= maxFavorites &&
                      typeof moment.favorite_rank !== "number"
                    }
                    onToggleFavorite={
                      onToggleFavorite
                        ? () => onToggleFavorite(moment)
                        : undefined
                    }
                    onDelete={onDelete ? () => onDelete(moment) : undefined}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
