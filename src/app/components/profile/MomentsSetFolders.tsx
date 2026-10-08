"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  groupMomentsBySet,
  type Moment,
} from "@/app/lib/profile/moments";
import { MomentsTrackRow } from "@/app/components/profile/MomentsTrackRow";
import { YoutubeThumbImage } from "@/app/components/ui/YoutubeThumbImage";
import { cn } from "@/lib/utils";

function defaultOpenIds(moments: Moment[]): Set<string> {
  const groups = groupMomentsBySet(moments);
  const initial = new Set<string>();
  if (groups[0]) initial.add(groups[0].video_id);
  return initial;
}

export function MomentsSetFolders({
  moments,
  onDelete,
}: {
  moments: Moment[];
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
    <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
      {groups.map((group, gi) => {
        const open = openIds.has(group.video_id);
        const panelId = `moments-set-${group.video_id}`;

        return (
          <div
            key={group.video_id}
            className="motion-enter py-1 first:pt-0"
            style={{ animationDelay: `${gi * 40}ms` }}
          >
            <div className="flex items-center gap-1 transition-opacity duration-bends-fast ease-bends hover:opacity-90">
              <button
                type="button"
                onClick={() => toggle(group.video_id)}
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={open ? "Collapse set" : "Expand set"}
                className="shrink-0 rounded-sm p-2 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-bends-fast ease-bends",
                    open && "rotate-90"
                  )}
                  aria-hidden
                />
              </button>
              <Link
                href={`/stream/${group.video_id}`}
                className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-1"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-zinc-200 shadow-sm dark:bg-zinc-900 sm:h-14 sm:w-20">
                  <YoutubeThumbImage
                    videoId={group.video_id}
                    sizes="160px"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                    {group.set_title}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {group.moments.length}{" "}
                    {group.moments.length === 1 ? "moment" : "moments"}
                  </span>
                </span>
              </Link>
            </div>

            {open ? (
              <div id={panelId} className="pb-2 pl-2 sm:pl-10">
                {group.moments.map((moment, i) => (
                  <MomentsTrackRow
                    key={moment.id}
                    moment={moment}
                    index={i}
                    nested
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
