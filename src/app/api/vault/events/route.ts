import { NextRequest, NextResponse } from "next/server";
import { awardVaultFromClientEvent } from "@/app/lib/vault/award";
import { getVaultUserId } from "@/app/lib/vault/auth";
import type { VaultClientEvent } from "@/app/lib/vault/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const userId = await getVaultUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as VaultClientEvent;
    const result = await awardVaultFromClientEvent(userId, body);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Vault award failed";
    const status =
      message.startsWith("Missing") || message.startsWith("Invalid")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
