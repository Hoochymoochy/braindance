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
      className="group relative flex flex-col rounded-2xl overflow-hidden text-white bg-black/50 backdrop-blur-sm border border-purple-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/30 hover:shadow-[0_0_24px_rgba(236,72,153,0.12)] cursor-pointer"
      style={{ animation: `fs-card-in 0.45s ${index * 60}ms both` }}
    >
      <div className="relative w-full aspect-video overflow-hidden bg-black">
        {set.thumbnail ? (
          <Image
            src={set.thumbnail}
            alt={set.title}
            width={640}
            height={360}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-black" />
        )}

        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        <p className="text-sm font-semibold line-clamp-2 text-purple-100">
          {set.title}
        </p>

        <div className="flex items-center gap-2 text-xs text-purple-300/70">
          <span className="truncate">{set.channel}</span>
          <span className="w-1 h-1 shrink-0 bg-purple-400/40 rounded-full" />
          <span>{formatViews(set.view_count ?? 0)} views</span>
        </div>
      </div>
    </Link>
  );
}
