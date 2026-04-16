import { NextRequest, NextResponse } from "next/server";

import {
  classifyBackendError,
  fetchJsonFromBackendWithFallback,
} from "@/app/lib/backend/http";
import { routeError, routeLog } from "@/app/lib/routeLog";

export const dynamic = "force-dynamic";
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
    const { data, source } = await fetchJsonFromBackendWithFallback(
      path,
      25_000,
      LOG
    );
    routeLog(LOG, "GET OK", { videoId, backendSource: source });
    return NextResponse.json(data);
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
      { status: 200 }
    );
  }
}
