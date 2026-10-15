"use client";

import Link from "next/link";
import type { VaultWeek } from "@/app/lib/vault/types";
import { VAULT_GOAL } from "@/app/lib/vault/types";
import { VaultMeter } from "@/app/components/vault/VaultMeter";

export function VaultLockedTeaser({
  week,
  points = 0,
  reason,
}: {
  week: VaultWeek;
  points?: number;
  reason?: string | null;
}) {
  return (
    <div className="glass-bends-card overflow-hidden rounded-none">
      <div className="relative flex aspect-video w-full items-center justify-center bg-zinc-950">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 25% 30%, rgba(140,140,140,0.28), transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(40,40,40,0.65), transparent 50%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/80">
            Vault
          </p>
          <h2 className="max-w-md text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Hidden exclusive
          </h2>
          <p className="max-w-sm text-sm text-white/65">
            Reach {VAULT_GOAL} this week to reveal and play it. The set stays
            secret until then — no title, no link.
          </p>
          {week.week_start ? (
            <p className="text-xs text-white/45">Week of {week.week_start}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 p-5">
        {reason === "auth" ? (
          <p className="text-sm text-zinc-500">
            Sign in to track progress and unlock this exclusive.
          </p>
        ) : (
          <VaultMeter points={points} goal={VAULT_GOAL} />
        )}
        <div className="flex flex-wrap gap-3">
          {reason === "auth" ? (
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-brand-from dark:text-zinc-950"
            >
              Sign in
            </Link>
          ) : (
            <Link
              href="/profile"
              className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-brand-from dark:text-zinc-950"
            >
              Open vault
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-black/10 px-5 py-2.5 text-sm text-zinc-700 transition-colors hover:border-black/20 dark:border-white/15 dark:text-zinc-200"
          >
            Discover sets
          </Link>
        </div>
      </div>
    </div>
  );
}
