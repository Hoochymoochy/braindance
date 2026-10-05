"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { trackEvent } from "@/app/lib/analytics";
import {
  upgradeYoutubeThumbnail,
  youtubeThumbnailFallbackUrl,
} from "@/app/lib/utils/youtube";
import { AddToCrateDialog } from "@/app/components/profile/AddToCrateDialog";
import { useAuthUserId } from "@/app/lib/hooks/useAuthUserId";

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
  showAddToCrate = true,
}: {
  set: StreamCardSet;
  index: number;
  source?: string;
  showAddToCrate?: boolean;
}) {
  const rootRef = useRef<HTMLAnchorElement | null>(null);
  const impressedRef = useRef(false);
  const [inView, setInView] = useState(false);
  const [enterDelay, setEnterDelay] = useState("0ms");
  const [crateOpen, setCrateOpen] = useState(false);
  const userId = useAuthUserId();
  const hiResThumb =
    upgradeYoutubeThumbnail(set.thumbnail, set.video_id) ?? set.thumbnail;
  const [thumbSrc, setThumbSrc] = useState(hiResThumb);

  useEffect(() => {
    setThumbSrc(hiResThumb);
  }, [hiResThumb]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        setEnterDelay(`${(index % 3) * 70}ms`);
        setInView(true);

        if (!impressedRef.current) {
          impressedRef.current = true;
          trackEvent("set_impression", {
            set_id: set.video_id,
            set_title: set.title,
            artist: set.channel,
            position: index,
            source,
          });
        }

        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [set.video_id, set.title, set.channel, index, source]);

  const href = `/stream/${set.video_id}?src=${encodeURIComponent(source)}`;

  return (
    <>
      <div className="relative">
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
          onTransitionEnd={(e) => {
            if (e.propertyName === "opacity" && inView) {
              setEnterDelay("0ms");
            }
          }}
          className={`group hover-glow-brand glass-bends-card motion-enter-float relative flex cursor-pointer flex-col overflow-hidden rounded-none text-zinc-900 hover:border-brand-from/35${
            inView ? " is-inview" : ""
          }`}
          style={
            {
              "--float-delay": enterDelay,
            } as CSSProperties
          }
        >
          <div className="relative w-full aspect-video overflow-hidden bg-black">
            {thumbSrc ? (
              <Image
                src={thumbSrc}
                alt={set.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={90}
                className="object-cover"
                onError={() => {
                  const fallback = youtubeThumbnailFallbackUrl(thumbSrc);
                  if (fallback !== thumbSrc) setThumbSrc(fallback);
                }}
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

        {showAddToCrate ? (
          <button
            type="button"
            aria-label={`Add ${set.title} to a crate`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCrateOpen(true);
            }}
            className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-brand-to/90 hover:text-zinc-950"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <AddToCrateDialog
        open={crateOpen}
        onClose={() => setCrateOpen(false)}
        userId={userId}
        set={{
          video_id: set.video_id,
          title: set.title,
          channel: set.channel,
          thumbnail: set.thumbnail,
        }}
      />
    </>
  );
}
