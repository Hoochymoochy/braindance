import { NextRequest, NextResponse } from "next/server";
import {
  classifyBackendError,
  fetchJsonWithTimeout,
  getBackupBackendUrl,
  getPrimaryBackendUrl,
} from "@/app/lib/backend/http";
import { routeError, routeLog } from "@/app/lib/routeLog";

export const runtime = "nodejs";

const LOG = "api/vault/weeks";

/**
 * Proxy to backend POST /vault/weeks — ingest + set this week's vault exclusive.
 * Body: { "url" | "video_link" | "videoId": "..." }
 */
export async function POST(request: NextRequest) {
  routeLog(LOG, "POST /api/vault/weeks", { incomingUrl: request.url });
  try {
    const body = (await request.json()) as {
      url?: string;
      video_link?: string;
      videoId?: string;
      video_id?: string;
    };
    const raw = (
      body.url ??
      body.video_link ??
      body.videoId ??
      body.video_id ??
      ""
    ).trim();
    if (!raw) {
      return NextResponse.json(
        { error: "Provide url or videoId" },
        { status: 400 }
      );
    }

    const primary = getPrimaryBackendUrl();
    const backup = getBackupBackendUrl(LOG);
    const path = "/vault/weeks";
    const payload = JSON.stringify({ url: raw, video_link: raw });

    const tryPost = async (base: string) =>
      fetchJsonWithTimeout(`${base}${path}`, 60_000, LOG, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

    let data: unknown;
    try {
      data = await tryPost(primary);
    } catch (e) {
      if (!backup) throw e;
      routeLog(LOG, "primary failed, trying backup", {
        error: classifyBackendError(e),
      });
      data = await tryPost(backup);
    }

    routeLog(LOG, "POST OK", {
      week_start: (data as { week?: { week_start?: string } })?.week
        ?.week_start,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const detail = classifyBackendError(error);
    routeError(LOG, `POST failed: ${detail}`, error);
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}
