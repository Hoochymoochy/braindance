"use client";

import Image from "next/image";
import Link from "next/link";
import type { Moment } from "@/app/lib/profile/moments";
import { youtubeThumbnailUrl } from "@/app/lib/utils/youtube";

export function ProfileMomentSpotlight({
  moments,
}: {
  moments: Moment[];
}) {
  if (moments.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        Top moments
      </p>
      <ul className="space-y-1.5">
        {moments.map((moment, i) => {
          const href = `/stream/${moment.video_id}?t=${moment.timestamp_seconds}`;
          const thumb = youtubeThumbnailUrl(moment.video_id, "mqdefault");
          return (
            <li key={moment.id}>
              <Link
                href={href}
                className="motion-enter group flex items-center gap-2.5 rounded-xl border border-black/8 bg-white/55 px-2 py-1.5 backdrop-blur-sm transition-[border-color,background-color,transform] ease-bends hover:border-brand-from/35 hover:bg-white/80 dark:border-brand-from/15 dark:bg-black/35 dark:hover:bg-black/50"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="w-4 shrink-0 text-center text-[11px] tabular-nums text-zinc-400">
                  {i + 1}
                </span>
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 ease-bends group-hover:scale-105"
                    sizes="40px"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {moment.track_title || "Untitled track"}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">
                    {moment.track_artist || "Unknown artist"}
                    <span className="text-zinc-400">
                      {" "}
                      · {moment.timestamp_label}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
