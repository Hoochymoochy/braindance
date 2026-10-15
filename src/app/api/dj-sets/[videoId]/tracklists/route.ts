import { NextRequest, NextResponse } from "next/server";

import {
  classifyBackendError,
  fetchJsonFromBackendWithFallback,
} from "@/app/lib/backend/http";
import {
  TRACKLIST_REVALIDATE_SECONDS,
  cacheControlHeader,
} from "@/app/lib/cache/http";
import { routeError, routeLog } from "@/app/lib/routeLog";

export const revalidate = 300;
export const runtime = "nodejs";

const LOG = "api/dj-sets/tracklists";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  const { videoId: rawId } = await context.params;
  const videoId = rawId?.trim();
  if (!videoId) {
    return NextResponse.json(
      { error: "Missing video id", video_id: "", count: 0, items: [] },
      { status: 400 }
    );
  }

  routeLog(LOG, "GET tracklists", { videoId });
  try {
    const path = `/dj-sets/${encodeURIComponent(videoId)}/tracklists`;
    // Dev: always hit the backend so re-ingests show up immediately.
    // Prod: keep a short CDN/data cache.
    const revalidateSeconds =
      process.env.NODE_ENV === "development"
        ? false
        : TRACKLIST_REVALIDATE_SECONDS;
    const { data, source } = await fetchJsonFromBackendWithFallback(
      path,
      25_000,
      LOG,
      { revalidateSeconds }
    );
    routeLog(LOG, "GET OK", { videoId, backendSource: source });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          revalidateSeconds === false
            ? "no-store"
            : cacheControlHeader(revalidateSeconds),
      },
    });
  } catch (error) {
    const detail = classifyBackendError(error);
    routeError(LOG, `GET failed: ${detail}`, error);
    return NextResponse.json(
      {
        video_id: videoId,
        count: 0,
        items: [],
        error: detail,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
