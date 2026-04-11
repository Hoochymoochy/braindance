import { NextResponse } from "next/server";

import {
  BackendRequestError,
  classifyBackendError,
  fetchJsonFromBackendWithFallback,
} from "@/app/lib/backend/http";
import { routeLog } from "@/app/lib/routeLog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOG = "api/streams/[id]/tracks";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing stream id" }, { status: 400 });
  }

  const sid = id.trim();

  try {
    const { data, source } = await fetchJsonFromBackendWithFallback(
      `/streams/${encodeURIComponent(sid)}/tracks`,
      30_000,
      LOG
    );
    routeLog(LOG, "GET OK", { id: sid, backendSource: source });
    if (Array.isArray(data)) {
      return NextResponse.json({ tracks: data, backendSource: source });
    }
    if (data && typeof data === "object") {
      return NextResponse.json({
        ...(data as Record<string, unknown>),
        backendSource: source,
      });
    }
    return NextResponse.json({ tracks: [], backendSource: source });
  } catch (error) {
    const status =
      error instanceof BackendRequestError && error.statusCode === 404
        ? 404
        : 502;
    const detail = classifyBackendError(error);
    routeLog(LOG, "GET failed", { id: sid, detail, status });
    return NextResponse.json({ error: detail }, { status });
  }
}
