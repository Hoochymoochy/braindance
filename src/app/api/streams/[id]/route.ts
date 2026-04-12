import { NextResponse } from "next/server";

import {
  BackendRequestError,
  classifyBackendError,
  fetchJsonFromBackendWithFallback,
} from "@/app/lib/backend/http";
import { getMockStream, isStreamUiMocksEnabled } from "@/app/lib/mocks/streamMocks";
import { routeLog } from "@/app/lib/routeLog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOG = "api/streams/[id]";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing stream id" }, { status: 400 });
  }

  if (isStreamUiMocksEnabled()) {
    const stream = getMockStream(id.trim());
    routeLog(LOG, "GET OK (STREAM_UI_MOCKS)", { id: id.trim() });
    return NextResponse.json({ ...stream, backendSource: "mock" as const });
  }

  try {
    const { data, source } = await fetchJsonFromBackendWithFallback(
      `/streams/${encodeURIComponent(id.trim())}`,
      30_000,
      LOG
    );
    routeLog(LOG, "GET OK", { id, backendSource: source });
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return NextResponse.json({
        ...(data as Record<string, unknown>),
        backendSource: source,
      });
    }
    return NextResponse.json({ stream: data, backendSource: source });
  } catch (error) {
    const status =
      error instanceof BackendRequestError && error.statusCode === 404
        ? 404
        : 502;
    const detail = classifyBackendError(error);
    routeLog(LOG, "GET failed", { id, detail, status });
    return NextResponse.json({ error: detail }, { status });
  }
}
