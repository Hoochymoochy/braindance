import { NextRequest, NextResponse } from "next/server";
import { listUserUnlocks } from "@/app/lib/vault/queries";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")?.trim();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    const unlocks = await listUserUnlocks(userId);
    return NextResponse.json(
      { unlocks },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unlocks failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
