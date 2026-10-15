"use client";

import { VAULT_GOAL } from "@/app/lib/vault/types";

export function VaultMeter({
  points,
  goal = VAULT_GOAL,
}: {
  points: number;
  goal?: number;
}) {
  const clamped = Math.max(0, Math.min(goal, points));
  const pct = goal > 0 ? (clamped / goal) * 100 : 0;
  const full = clamped >= goal;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Weekly progress
        </p>
        <p className="font-mono text-sm tabular-nums text-zinc-900 dark:text-zinc-100">
          {clamped}
          <span className="text-zinc-400"> / {goal}</span>
        </p>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-black/8 dark:bg-white/10"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-label="Vault progress"
      >
        <div
          className="h-full rounded-full bg-zinc-900 transition-[width] duration-500 ease-bends dark:bg-brand-from"
          style={{ width: `${pct}%` }}
        />
      </div>
      {full ? (
        <p className="text-xs text-zinc-500">
          Full for this week — resets Monday UTC.
        </p>
      ) : null}
    </div>
  );
}
