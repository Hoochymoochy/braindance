"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { trackEvent } from "@/app/lib/analytics";
import {
  upgradeYoutubeThumbnail,
  youtubeThumbnailFallbackUrl,
} from "@/app/lib/utils/youtube";
import { AddToCrateDialog } from "@/app/components/profile/AddToCrateDialog";
import { useAuthUserId } from "@/app/lib/hooks/useAuthUserId";
import {
  listCrateIdsContainingVideo,
  removeSetFromAllUserCrates,
} from "@/app/lib/profile/crates";
import { cn } from "@/lib/utils";

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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const impressedRef = useRef(false);
  const [inView, setInView] = useState(false);
  const [enterDelay, setEnterDelay] = useState("0ms");
  const [crateOpen, setCrateOpen] = useState(false);
  const [inCrate, setInCrate] = useState(false);
  const [crateBusy, setCrateBusy] = useState(false);
  const userId = useAuthUserId();
  const hiResThumb =
    upgradeYoutubeThumbnail(set.thumbnail, set.video_id) ?? set.thumbnail;
  const [thumbSrc, setThumbSrc] = useState(hiResThumb);

  useEffect(() => {
    setThumbSrc(hiResThumb);
  }, [hiResThumb]);

  useEffect(() => {
    if (!userId || !showAddToCrate) {
      setInCrate(false);
      return;
    }

    let cancelled = false;
    listCrateIdsContainingVideo(userId, set.video_id)
      .then((ids) => {
        if (!cancelled) setInCrate(ids.length > 0);
      })
      .catch(() => {
        if (!cancelled) setInCrate(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, set.video_id, showAddToCrate]);

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

  const handleCrateButton = async () => {
    if (!userId) {
      setCrateOpen(true);
      return;
    }

    if (inCrate) {
      setCrateBusy(true);
      try {
        await removeSetFromAllUserCrates(userId, set.video_id);
        setInCrate(false);
      } catch {
        setCrateOpen(true);
      } finally {
        setCrateBusy(false);
      }
      return;
    }

    setCrateOpen(true);
  };

  return (
    <>
      <div
        ref={rootRef}
        onTransitionEnd={(e) => {
          if (e.propertyName === "opacity" && inView) {
            setEnterDelay("0ms");
          }
        }}
        className={`group hover-glow-brand glass-bends-card motion-enter-float relative flex flex-col overflow-hidden rounded-none text-zinc-900 hover:border-brand-from/35${
          inView ? " is-inview" : ""
        }`}
        style={
          {
            "--float-delay": enterDelay,
          } as CSSProperties
        }
      >
        <Link
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
          className="flex flex-1 cursor-pointer flex-col"
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

          <div className="flex flex-col gap-2 px-4 pt-3">
            <p className="line-clamp-2 text-sm font-semibold text-zinc-900">
              {set.title}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 px-4 pb-3 pt-2">
          <Link
            href={href}
            className="flex min-w-0 flex-1 items-center gap-2 text-xs text-brand-from/75"
            tabIndex={-1}
          >
            <span className="truncate">{set.channel}</span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-brand-via/50" />
            <span className="shrink-0">
              {formatViews(set.view_count ?? 0)} views
            </span>
          </Link>

          {showAddToCrate && userId ? (
            <button
              type="button"
              disabled={crateBusy}
              aria-label={
                inCrate
                  ? `Remove ${set.title} from crates`
                  : `Add ${set.title} to a crate`
              }
              aria-pressed={inCrate}
              onClick={handleCrateButton}
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-60",
                inCrate
                  ? "border-brand-from bg-brand-from text-white hover:bg-brand-from/90"
                  : "border-black/10 text-zinc-600 hover:border-brand-from/40 hover:bg-brand-from/10 hover:text-brand-from dark:border-brand-from/25 dark:text-zinc-300"
              )}
            >
              {inCrate ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              ) : (
                <Plus className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {showAddToCrate && userId ? (
        <AddToCrateDialog
          open={crateOpen}
          onClose={() => setCrateOpen(false)}
          userId={userId}
          set={{
            video_id: set.video_id,
            title: set.title,
            channel: set.channel,
            thumbnail:
              upgradeYoutubeThumbnail(set.thumbnail, set.video_id) ??
              set.thumbnail,
          }}
          onMembershipChange={setInCrate}
        />
      ) : null}
    </>
  );
}
