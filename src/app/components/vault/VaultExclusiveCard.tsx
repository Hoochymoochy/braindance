"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { VaultWeek } from "@/app/lib/vault/types";
import {
  upgradeYoutubeThumbnail,
  youtubeThumbnailFallbackUrl,
  youtubeThumbnailUrl,
} from "@/app/lib/utils/youtube";

export function VaultExclusiveCard({
  week,
  unlocked,
  points,
  goal,
  compact = false,
}: {
  week: VaultWeek | null;
  unlocked: boolean;
  points?: number;
  goal?: number;
  compact?: boolean;
}) {
  const hiRes =
    week && !week.hidden && unlocked
      ? upgradeYoutubeThumbnail(week.thumbnail, week.video_id) ||
        youtubeThumbnailUrl(week.video_id, "maxresdefault")
      : null;
  const [thumbSrc, setThumbSrc] = useState(hiRes);

  useEffect(() => {
    setThumbSrc(hiRes);
  }, [hiRes]);

  if (!week) {
    return (
      <div className="glass-bends-card rounded-none p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          This week
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Exclusive set not posted yet. Keep grinding — the meter still counts.
        </p>
      </div>
    );
  }

  const hidden = Boolean(week.hidden) || !unlocked;

  if (hidden) {
    return (
      <div className="glass-bends-card overflow-hidden rounded-none">
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-zinc-950">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse at 30% 20%, rgba(120,120,120,0.35), transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(60,60,60,0.5), transparent 50%)",
            }}
          />
          <div className="relative z-10 space-y-2 px-6 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/70">
              Locked
            </p>
            <p className="text-sm text-white/55">
              Identity hidden until you unlock
            </p>
          </div>
        </div>
        <div className={compact ? "space-y-1 p-3" : "space-y-2 p-4"}>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
            Vault exclusive
          </p>
          <h3 className="text-base font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-100">
            ???
          </h3>
          <p className="text-sm text-zinc-500">Hidden set · this week</p>
          {points != null && goal != null ? (
            <p className="text-xs text-zinc-500">
              Reach {goal} to reveal · {points} now
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/stream/${week.video_id}?src=vault`}
      className="glass-bends-card block overflow-hidden rounded-none transition-opacity duration-bends-fast ease-bends hover:opacity-90"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        {thumbSrc ? (
          <Image
            src={thumbSrc}
            alt={week.title || "Vault exclusive"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 720px, 960px"
            quality={95}
            priority
            className="object-cover object-center scale-[1.12]"
            onError={() => {
              if (!thumbSrc) return;
              const fallback = youtubeThumbnailFallbackUrl(thumbSrc);
              if (fallback !== thumbSrc) setThumbSrc(fallback);
            }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
        )}
      </div>
      <div className={compact ? "space-y-1 p-3" : "space-y-2 p-4"}>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          Vault exclusive
        </p>
        <h3 className="text-base font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-100">
          {week.title || "Untitled set"}
        </h3>
        {week.channel ? (
          <p className="text-sm text-zinc-500">{week.channel}</p>
        ) : null}
        <p className="text-xs text-zinc-500">Unlocked — play anytime</p>
      </div>
    </Link>
  );
}
