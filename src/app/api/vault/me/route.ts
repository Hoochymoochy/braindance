import { NextResponse } from "next/server";
import { getVaultUserId } from "@/app/lib/vault/auth";
import { getVaultMe } from "@/app/lib/vault/queries";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getVaultUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const me = await getVaultMe(userId);
    return NextResponse.json(me, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Vault me failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
