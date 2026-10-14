import { NextRequest, NextResponse } from "next/server";
import { getVaultUserId } from "@/app/lib/vault/auth";
import {
  getVaultProgress,
  getVaultWeekByVideoId,
  redactVaultWeek,
} from "@/app/lib/vault/queries";

export const runtime = "nodejs";

/** Check whether a video is vault-gated and whether the caller may play it. */
export async function GET(request: NextRequest) {
  try {
    const videoId = request.nextUrl.searchParams.get("videoId")?.trim();
    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }

    const week = await getVaultWeekByVideoId(videoId);
    if (!week) {
      return NextResponse.json(
        { gated: false, unlocked: true, week: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const userId = await getVaultUserId();
    if (!userId) {
      return NextResponse.json(
        {
          gated: true,
          unlocked: false,
          week: redactVaultWeek(week),
          reason: "auth",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const progress = await getVaultProgress(userId, week.week_start);
    const unlocked = Boolean(progress?.unlocked_at);

    return NextResponse.json(
      {
        gated: true,
        unlocked,
        week: unlocked ? week : redactVaultWeek(week),
        points: progress?.points ?? 0,
        reason: unlocked ? null : "locked",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Access check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
