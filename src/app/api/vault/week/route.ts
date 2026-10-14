import { NextResponse } from "next/server";
import { getVaultUserId } from "@/app/lib/vault/auth";
import {
  getVaultProgress,
  getVaultWeekByStart,
  redactVaultWeek,
} from "@/app/lib/vault/queries";
import { vaultWeekStart } from "@/app/lib/vault/week";

export const runtime = "nodejs";

/** Current week exclusive + optional signed-in progress. Identity redacted until unlock. */
export async function GET() {
  try {
    const weekStart = vaultWeekStart();
    const currentWeek = await getVaultWeekByStart(weekStart);
    const userId = await getVaultUserId();
    let points: number | null = null;
    let unlocked: boolean | null = null;
    if (userId) {
      const progress = await getVaultProgress(userId, weekStart);
      points = progress?.points ?? 0;
      unlocked = Boolean(progress?.unlocked_at);
    } else {
      unlocked = false;
    }

    const safeWeek =
      currentWeek == null
        ? null
        : unlocked
          ? currentWeek
          : redactVaultWeek(currentWeek);

    return NextResponse.json(
      { weekStart, currentWeek: safeWeek, points, unlocked },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Vault week failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
