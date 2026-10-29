"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { trackEvent } from "@/app/lib/analytics";
import { CATALOG_REVALIDATE_SECONDS } from "@/app/lib/cache/http";
import { ttlGet, ttlSet } from "@/app/lib/cache/ttl";
import { cn } from "@/lib/utils";

type DjSet = {
  video_id: string;
  title: string;
  channel: string;
};

type DjSetsResponse = {
  currentSets?: DjSet[];
  allSets?: DjSet[];
};

const CACHE_KEY = "random-set:dj-sets";
const CLIENT_CACHE_MS = CATALOG_REVALIDATE_SECONDS * 1000;

function streamVideoIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/stream\/([^/]+)\/?$/);
  return m?.[1] ?? null;
}

async function loadPool(): Promise<DjSet[]> {
  const cached = ttlGet<DjSetsResponse>(CACHE_KEY);
  if (cached) {
    return Array.isArray(cached.allSets)
      ? cached.allSets
      : Array.isArray(cached.currentSets)
        ? cached.currentSets
        : [];
  }

  const res = await fetch("/api/dj-sets", { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as DjSetsResponse;
  ttlSet(CACHE_KEY, data, CLIENT_CACHE_MS);
  return Array.isArray(data.allSets)
    ? data.allSets
    : Array.isArray(data.currentSets)
      ? data.currentSets
      : [];
}

export function RandomSetButton({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "header";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const goRandomSet = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const pool = await loadPool();
      const exclude = streamVideoIdFromPath(pathname);
      const candidates =
        exclude && pool.length > 1
          ? pool.filter((s) => s.video_id !== exclude)
          : pool;
      if (candidates.length === 0) return;

      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      trackEvent("random_set_clicked", {
        set_id: pick.video_id,
        set_title: pick.title,
        artist: pick.channel,
      });
      router.push(`/stream/${pick.video_id}?src=random`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void goRandomSet()}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full bg-zinc-900 font-medium text-white transition-[background-color,transform,box-shadow,opacity] duration-bends-fast ease-bends hover:cursor-pointer hover:bg-zinc-800 hover:shadow-[0_10px_28px_rgba(0,0,0,0.22)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 dark:bg-brand-from dark:text-zinc-950 dark:hover:bg-brand-via",
        size === "header"
          ? "px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm"
          : "px-6 py-3 text-sm",
        className
      )}
    >
      <Shuffle className={size === "header" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      Random set
    </button>
  );
}
