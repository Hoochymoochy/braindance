"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ListMusic, Play } from "lucide-react";
import {
  getCrate,
  listCrateSets,
  type Crate,
  type CrateSet,
} from "@/app/lib/profile/crates";
import {
  upgradeYoutubeThumbnail,
  youtubeThumbnailUrl,
} from "@/app/lib/utils/youtube";
import { cn } from "@/lib/utils";

export function streamHrefWithCrate(videoId: string, crateId: string): string {
  return `/stream/${encodeURIComponent(videoId)}?src=crate&crate=${encodeURIComponent(crateId)}`;
}

export function StreamCrateQueue({
  crateId,
  currentVideoId,
  className,
}: {
  crateId: string;
  currentVideoId: string;
  className?: string;
}) {
  const [crate, setCrate] = useState<Crate | null>(null);
  const [sets, setSets] = useState<CrateSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([getCrate(crateId), listCrateSets(crateId)])
      .then(([row, rows]) => {
        if (cancelled) return;
        if (!row) {
          setError("Crate not found");
          setCrate(null);
          setSets([]);
          return;
        }
        setCrate(row);
        // Play order: oldest added first (matches cover / Play button).
        setSets(
          [...rows].sort(
            (a, b) =>
              new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
          )
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load crate");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [crateId]);

  if (loading) {
    return (
      <section
        className={cn(
          "glass-bends-card rounded-none p-4 text-sm text-zinc-500",
          className
        )}
      >
        Loading crate…
      </section>
    );
  }

  if (error || !crate || sets.length === 0) {
    return null;
  }

  const currentIndex = sets.findIndex((s) => s.video_id === currentVideoId);

  return (
    <section
      className={cn("glass-bends-card relative overflow-hidden rounded-none", className)}
      aria-label={`Queue from crate ${crate.name}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-from/[0.14] via-brand-via/[0.06] to-brand-to/[0.14]"
        aria-hidden
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2 border-b border-black/8 px-4 py-3">
          <ListMusic className="h-3.5 w-3.5 shrink-0 text-brand-from" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="bg-gradient-to-r from-brand-from via-brand-via to-brand-to bg-clip-text text-[11px] font-semibold uppercase tracking-[0.2em] text-transparent">
              From crate
            </p>
            <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {crate.name}
            </p>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-zinc-500">
            {sets.length} {sets.length === 1 ? "set" : "sets"}
          </span>
        </div>

        <ul className="max-h-[min(40vh,320px)] space-y-0.5 overflow-y-auto overscroll-y-none px-2 py-2">
          {sets.map((set, i) => {
            const active = set.video_id === currentVideoId;
            const thumb =
              upgradeYoutubeThumbnail(set.thumbnail, set.video_id) ??
              set.thumbnail ??
              youtubeThumbnailUrl(set.video_id, "hqdefault");
            const href = streamHrefWithCrate(set.video_id, crateId);

            return (
              <li key={set.id}>
                <Link
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors",
                    active
                      ? "bg-brand-from/15"
                      : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  )}
                  aria-current={active ? "true" : undefined}
                >
                  <span
                    className={cn(
                      "flex h-8 w-6 shrink-0 items-center justify-center text-xs tabular-nums",
                      active ? "text-brand-from" : "text-zinc-400"
                    )}
                  >
                    {active ? (
                      <Play className="h-3 w-3 fill-current" aria-hidden />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-zinc-200 dark:bg-zinc-800">
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="40px"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium",
                        active
                          ? "text-brand-from"
                          : "text-zinc-900 dark:text-zinc-50"
                      )}
                    >
                      {set.title || "Untitled set"}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {set.channel}
                      {currentIndex >= 0 && i === currentIndex + 1
                        ? " · Up next"
                        : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
