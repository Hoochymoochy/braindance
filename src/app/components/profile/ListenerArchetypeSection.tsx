"use client";

import { useCallback, useEffect, useState } from "react";
import { formatHeaderStats } from "@/app/lib/listener-profile/fallback";
import type { ListenerProfileResponse } from "@/app/lib/listener-profile/types";

export function ListenerArchetypeSection({ userId }: { userId: string }) {
  const [data, setData] = useState<ListenerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const url = `/api/listener-profile?userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load archetype: ${res.statusText}`);
      }
      const json = (await res.json()) as ListenerProfileResponse;
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not fetch listener archetype"
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <section className="space-y-5">
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-36 rounded bg-zinc-300/60 dark:bg-zinc-800" />
          <div className="h-8 w-56 rounded bg-zinc-300/60 dark:bg-zinc-800" />
          <div className="h-4 w-full max-w-md rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-black/8 pt-5 sm:grid-cols-5 dark:border-brand-from/15">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-1.5">
              <div className="h-7 w-10 rounded bg-zinc-300/60 dark:bg-zinc-800" />
              <div className="h-3 w-20 rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return null;
  }

  if (data.status === "collecting") {
    return (
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Your listening style
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{data.message}</p>
        <p className="text-xs tabular-nums text-zinc-500">
          {data.stats.totalInteractions} / 3 interactions
        </p>
      </section>
    );
  }

  const headerStats = formatHeaderStats(data.stats);

  return (
    <section className="space-y-5">
      <div className="space-y-2 motion-enter">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Your listening style
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          {data.displayTitle}
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {data.description}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-black/8 pt-5 sm:grid-cols-5 dark:border-brand-from/15">
        {headerStats.map((stat, i) => (
          <li
            key={stat.label}
            className="motion-enter space-y-0.5"
            style={{ animationDelay: `${60 + i * 40}ms` }}
          >
            <p className="text-2xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              {stat.value}
            </p>
            <p className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">
              {stat.label}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
