import { NextResponse } from "next/server";

import {
  BackendRequestError,
  classifyBackendError,
  fetchJsonFromBackendWithFallback,
} from "@/app/lib/backend/http";
import {
  CATALOG_REVALIDATE_SECONDS,
  cacheControlHeader,
} from "@/app/lib/cache/http";
import {
  getMockTracksForStream,
  isStreamUiMocksEnabled,
} from "@/app/lib/mocks/streamMocks";
import { routeLog } from "@/app/lib/routeLog";

export const revalidate = 60;
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

  if (isStreamUiMocksEnabled()) {
    const tracks = getMockTracksForStream(sid);
    routeLog(LOG, "GET OK (STREAM_UI_MOCKS)", { id: sid, count: tracks.length });
    return NextResponse.json({ tracks, backendSource: "mock" as const });
  }

  try {
    const { data, source } = await fetchJsonFromBackendWithFallback(
      `/streams/${encodeURIComponent(sid)}/tracks`,
      30_000,
      LOG,
      { revalidateSeconds: CATALOG_REVALIDATE_SECONDS }
    );
    routeLog(LOG, "GET OK", { id: sid, backendSource: source });
    const headers = {
      "Cache-Control": cacheControlHeader(CATALOG_REVALIDATE_SECONDS),
    };
    if (Array.isArray(data)) {
      return NextResponse.json({ tracks: data, backendSource: source }, { headers });
    }
    if (data && typeof data === "object") {
      return NextResponse.json(
        {
          ...(data as Record<string, unknown>),
          backendSource: source,
        },
        { headers }
      );
    }
    return NextResponse.json({ tracks: [], backendSource: source }, { headers });
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
