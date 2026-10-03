"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { trackEvent } from "@/app/lib/analytics";

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
  source = "homepage",
}: {
  set: StreamCardSet;
  index: number;
  source?: string;
}) {
  const rootRef = useRef<HTMLAnchorElement | null>(null);
  const impressedRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || impressedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || impressedRef.current) return;
        impressedRef.current = true;
        trackEvent("set_impression", {
          set_id: set.video_id,
          set_title: set.title,
          artist: set.channel,
          position: index,
          source,
        });
        observer.disconnect();
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [set.video_id, set.title, set.channel, index, source]);

  const href = `/stream/${set.video_id}?src=${encodeURIComponent(source)}`;

  return (
    <Link
      ref={rootRef}
      href={href}
      onClick={() => {
        trackEvent("set_opened", {
          set_id: set.video_id,
          set_title: set.title,
          artist: set.channel,
          position: index,
          source,
        });
      }}
      className="group hover-glow-brand glass-bends-card relative flex cursor-pointer flex-col overflow-hidden rounded-2xl text-zinc-900 transition-[transform,box-shadow,border-color] duration-bends ease-bends motion-reduce:transition-none hover:-translate-y-1 hover:border-brand-from/35 motion-enter"
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
          <div className="h-full w-full bg-gradient-to-br from-brand-to/30 to-black" />
        )}

        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        <p className="line-clamp-2 text-sm font-semibold text-zinc-900">
          {set.title}
        </p>

        <div className="flex items-center gap-2 text-xs text-brand-from/75">
          <span className="truncate">{set.channel}</span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-brand-via/50" />
          <span>{formatViews(set.view_count ?? 0)} views</span>
        </div>
      </div>
    </Link>
  );
}
