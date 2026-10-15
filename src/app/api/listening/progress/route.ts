import { NextRequest, NextResponse } from "next/server";
import { getVaultUserId } from "@/app/lib/vault/auth";
import {
  persistListeningProgress,
  validateListeningProgressPayload,
} from "@/app/lib/listening/progress";

export const runtime = "nodejs";

async function readBody(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return request.json();
  }
  // sendBeacon may omit content-type or use text/plain
  const text = await request.text();
  if (!text) return null;
  return JSON.parse(text) as unknown;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getVaultUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await readBody(request);
    const payload = validateListeningProgressPayload(raw);
    const result = await persistListeningProgress(userId, payload);

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Listening progress failed";
    const status =
      message.startsWith("Invalid") ||
      message.startsWith("Missing") ||
      message.includes("sessionId") ||
      message.includes("videoId") ||
      message.includes("listenedSeconds")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
