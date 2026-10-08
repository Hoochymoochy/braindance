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
    <div className="space-y-1">
      {groups.map((group) => {
        const open = openIds.has(group.video_id);
        const panelId = `moments-set-${group.video_id}`;

        return (
          <div key={group.video_id}>
            <div className="flex items-center gap-1 rounded-xl px-1 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
              <button
                type="button"
                onClick={() => toggle(group.video_id)}
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={open ? "Collapse set" : "Expand set"}
                className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
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
                className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pr-2"
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
                  <YoutubeThumbImage
                    videoId={group.video_id}
                    sizes="88px"
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
              </Link>
            </div>

            {open ? (
              <div
                id={panelId}
                className="border-t border-black/5 py-1 dark:border-white/10"
              >
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
