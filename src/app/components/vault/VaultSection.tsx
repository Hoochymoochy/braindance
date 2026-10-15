"use client";

import { useEffect, useState } from "react";
import { fetchVaultMe, fetchVaultUnlocks } from "@/app/lib/vault/client";
import type { VaultMeResponse, VaultUnlock } from "@/app/lib/vault/types";
import { VaultExclusiveCard } from "@/app/components/vault/VaultExclusiveCard";
import { VaultMeter } from "@/app/components/vault/VaultMeter";
import { VaultShelf } from "@/app/components/vault/VaultShelf";

/** Owner profile: meter + this week + collectible shelf. */
export function VaultSectionOwner() {
  const [data, setData] = useState<VaultMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const me = await fetchVaultMe();
      if (!cancelled) {
        setData(me);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        className="animate-pulse space-y-6"
        aria-busy="true"
        aria-label="Loading vault"
      >
        <div className="space-y-2">
          <div className="flex justify-between gap-3">
            <div className="h-4 w-28 rounded bg-zinc-300/50 dark:bg-white/[0.06]" />
            <div className="h-4 w-16 rounded bg-zinc-300/50 dark:bg-white/[0.06]" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-300/40 dark:bg-white/[0.06]" />
        </div>
        <div className="aspect-video w-full rounded bg-zinc-300/40 dark:bg-white/[0.06]" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-zinc-500">
        Sign in to track vault progress this week.
      </p>
    );
  }

  // Current week is already the big exclusive card — don't repeat it on the shelf.
  const currentWeekKey = data.weekStart.slice(0, 10);
  const pastUnlocks = data.unlocks.filter((u) => {
    if (!u.week) return false;
    return String(u.week_start).slice(0, 10) !== currentWeekKey;
  });

  return (
    <div className="space-y-6">
      <VaultMeter points={data.points} goal={data.goal} />
      <VaultExclusiveCard
        week={data.currentWeek}
        unlocked={data.unlocked}
        points={data.points}
        goal={data.goal}
      />

      {pastUnlocks.length > 0 ? (
        <VaultShelf unlocks={pastUnlocks} emptyLabel="" playable />
      ) : null}
    </div>
  );
}

/** Public flex shelf only. */
export function VaultSectionPublic({ userId }: { userId: string }) {
  const [unlocks, setUnlocks] = useState<VaultUnlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await fetchVaultUnlocks(userId);
      if (!cancelled) {
        setUnlocks(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading vault…</p>;
  }

  return (
    <VaultShelf
      unlocks={unlocks}
      emptyLabel="No vaulted sets to show yet."
      playable={false}
    />
  );
}
