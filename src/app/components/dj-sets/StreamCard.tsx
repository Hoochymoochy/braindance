"use client";

import Link from "next/link";
import Image from "next/image";

export type StreamCardSet = {
  video_id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  view_count?: number;
};

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}

export function StreamCard({
  set,
  index,
}: {
  set: StreamCardSet;
  index: number;
}) {
  return (
    <Link
      href={`/stream/${set.video_id}`}
      className="group glass-bends-card relative flex cursor-pointer flex-col overflow-hidden rounded-2xl text-white transition-[transform,box-shadow,border-color] duration-bends ease-bends motion-reduce:transition-none hover:-translate-y-1 hover:border-[#00ccff]/35 hover:shadow-[0_0_28px_rgba(0,204,255,0.12)] motion-enter"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="relative w-full aspect-video overflow-hidden bg-black">
        {set.thumbnail ? (
          <Image
            src={set.thumbnail}
            alt={set.title}
            width={640}
            height={360}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#3700ff]/30 to-black" />
        )}

        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        <p className="line-clamp-2 text-sm font-semibold text-white/95">
          {set.title}
        </p>

        <div className="flex items-center gap-2 text-xs text-[#00ccff]/75">
          <span className="truncate">{set.channel}</span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-[#ff00f7]/50" />
          <span>{formatViews(set.view_count ?? 0)} views</span>
        </div>
      </div>
    </Link>
  );
}
