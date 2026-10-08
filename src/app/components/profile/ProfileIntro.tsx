"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { formatHeaderStats } from "@/app/lib/listener-profile/fallback";
import type { ListenerProfileResponse } from "@/app/lib/listener-profile/types";

/** Brand gradient panel — reserved for Hoochymoochy’s profile. */
const INTRO_GRADIENT_USER_IDS = new Set([
  "1d02b474-2935-4c82-9402-cf6970c39f50",
]);

/**
 * Top-of-profile bento: wide identity column + compact stats rail.
 * Archetype sits quietly under the header; numbers stay raw and understated.
 */
export function ProfileIntro({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const showGradient = INTRO_GRADIENT_USER_IDS.has(userId);
  const [data, setData] = useState<ListenerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const url = `/api/listener-profile?userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setData(null);
        return;
      }
      setData((await res.json()) as ListenerProfileResponse);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const ready = data?.status === "ready";
  const collecting = data?.status === "collecting";
  const headerStats = ready ? formatHeaderStats(data.stats) : null;

  const body = (
    <div
      className={
        showGradient
          ? "relative grid gap-10 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_9.5rem] lg:items-start lg:gap-14"
          : "grid gap-10 lg:grid-cols-[minmax(0,1fr)_9.5rem] lg:items-start lg:gap-14"
      }
    >
      <div className="min-w-0 space-y-6">
        {children}

        {loading ? (
          <div
            className="max-w-lg rounded-xl bg-[var(--page-bg)] p-4 sm:p-5"
            aria-hidden
          >
            <div className="animate-pulse space-y-2">
              <div className="h-3 w-28 rounded bg-zinc-300/50 dark:bg-white/[0.06]" />
              <div className="h-7 w-48 rounded bg-zinc-300/50 dark:bg-white/[0.06]" />
              <div className="h-4 w-full max-w-sm rounded bg-zinc-200/50 dark:bg-white/[0.04]" />
            </div>
          </div>
        ) : ready ? (
          <div className="motion-enter max-w-lg space-y-1.5 rounded-xl bg-[var(--page-bg)] p-4 sm:p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-brand-from/70">
              Listening style
            </p>
            <p className="text-[1.875rem] font-medium leading-tight tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-[2.25rem]">
              {data.displayTitle}
            </p>
            <p className="text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              {data.description}
            </p>
          </div>
        ) : collecting ? (
          <div className="max-w-md space-y-1 rounded-xl bg-[var(--page-bg)] p-4 sm:p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Listening style
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {data.message}
            </p>
            <p className="text-xs tabular-nums text-zinc-400">
              {data.stats.totalInteractions} / 3 interactions
            </p>
          </div>
        ) : null}
      </div>

      <aside
        className={
          showGradient
            ? "border-t border-black/8 pt-6 lg:border-t-0 lg:border-l lg:border-black/10 lg:pt-0 lg:pl-8 dark:border-brand-from/15"
            : "border-t border-black/8 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 dark:border-white/[0.08]"
        }
        aria-label="Listening stats"
      >
        {loading ? (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="animate-pulse space-y-1.5">
                <div className="h-6 w-10 rounded bg-zinc-300/50 dark:bg-white/[0.06]" />
                <div className="h-3 w-16 rounded bg-zinc-200/50 dark:bg-white/[0.04]" />
              </li>
            ))}
          </ul>
        ) : headerStats ? (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-y-6">
            {headerStats.map((stat, i) => (
              <li
                key={stat.label}
                className="motion-enter space-y-0.5"
                style={{ animationDelay: `${40 + i * 35}ms` }}
              >
                <p className="text-xl font-medium tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                  {stat.value}
                </p>
                <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        ) : collecting && data ? (
          <div className="space-y-0.5">
            <p className="text-xl font-medium tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              {data.stats.totalInteractions}
            </p>
            <p className="text-[11px] text-zinc-500">Interactions so far</p>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">Stats appear as you listen.</p>
        )}
      </aside>
    </div>
  );

  if (!showGradient) return body;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-from/35 via-brand-via/20 to-brand-to/30"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[var(--page-bg)] via-transparent to-transparent"
        aria-hidden
      />
      {body}
    </div>
  );
}
