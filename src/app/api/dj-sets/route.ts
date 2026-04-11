import { NextRequest, NextResponse } from "next/server";

import {
  classifyBackendError,
  fetchJsonWithTimeout,
  getBackupBackendUrl,
  getPrimaryBackendUrl,
} from "@/app/lib/backend/http";
import { routeError, routeLog } from "@/app/lib/routeLog";

/** Ensure route runs on each request; logs appear in `next dev` terminal. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOG = "api/dj-sets";

type DjSet = {
  video_id: string;
  title: string;
  channel: string;
  published_at: string;
  thumbnail?: string;
  url: string;
  fetched_at: string;
  view_count?: number;
  duration_seconds?: number;
};

/** Shape returned by GET ${BACKEND_URL}/dj-sets */
type BackendDjSetsListResponse =
  | DjSet[]
  | {
      updated_at?: string;
      updatedAt?: string;
      updated?: string;
      count?: number;
      items?: DjSet[];
      currentSets?: DjSet[];
    };

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_DURATION_SECONDS = 30 * 60;

/** Keep legacy rows that never got duration_seconds; only drop known-short videos. */
function passesDurationFilter(item: DjSet): boolean {
  const d = item.duration_seconds;
  if (d == null || Number.isNaN(d)) return true;
  return d >= MIN_DURATION_SECONDS;
}

function withinDays(isoDate: string, days: number): boolean {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= days * DAY_MS;
}

function sortByViewsDesc(items: DjSet[]): DjSet[] {
  return [...items].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
}

function topViewed(items: DjSet[], days: number, limit = 6): DjSet[] {
  const scoped = items.filter((item) => withinDays(item.published_at, days));
  if (scoped.length === 0) {
    return sortByViewsDesc(items).slice(0, limit);
  }
  return sortByViewsDesc(scoped).slice(0, limit);
}

function extractItemsFromListPayload(
  backendPayload: BackendDjSetsListResponse
): DjSet[] {
  return Array.isArray(backendPayload)
    ? backendPayload
    : (backendPayload.items ?? backendPayload.currentSets ?? []);
}

async function fetchDjSetsListWithFallback(timeoutMs: number): Promise<{
  backendPayload: BackendDjSetsListResponse;
  source: "primary" | "backup";
}> {
  const primary = getPrimaryBackendUrl();
  const backup = getBackupBackendUrl(LOG);

  const tryList = async (base: string) => {
    const upstream = `${base}/dj-sets`;
    const backendPayload = (await fetchJsonWithTimeout(
      upstream,
      timeoutMs,
      LOG
    )) as BackendDjSetsListResponse;
    const items = extractItemsFromListPayload(backendPayload);
    return { backendPayload, items };
  };

  let primaryResult: {
    backendPayload: BackendDjSetsListResponse;
    items: DjSet[];
  } | null = null;

  try {
    primaryResult = await tryList(primary);
    if (primaryResult.items.length > 0 || !backup) {
      return {
        backendPayload: primaryResult.backendPayload,
        source: "primary",
      };
    }
    routeLog("api/dj-sets", "primary returned empty list, trying backup", {
      backup,
    });
  } catch (e) {
    routeLog("api/dj-sets", "primary /dj-sets failed", {
      error: classifyBackendError(e),
    });
    if (!backup) throw e;
    routeLog("api/dj-sets", "trying BACKEND_URL_BACKUP", { backup });
    const r = await tryList(backup);
    return { backendPayload: r.backendPayload, source: "backup" };
  }

  try {
    const r = await tryList(backup!);
    return { backendPayload: r.backendPayload, source: "backup" };
  } catch (e) {
    routeLog("api/dj-sets", "backup failed; using primary response", {
      error: classifyBackendError(e),
    });
    return {
      backendPayload: primaryResult!.backendPayload,
      source: "primary",
    };
  }
}

function parseDjSetPayload(raw: unknown): DjSet | null {
  const payload = raw as { item?: DjSet } | DjSet | null;
  if (!payload || typeof payload !== "object") return null;
  if ("item" in payload && payload.item) return payload.item;
  if ("video_id" in payload) return payload as DjSet;
  return null;
}

async function fetchDjSetByIdWithFallback(
  videoId: string,
  timeoutMs: number
): Promise<{ raw: unknown; source: "primary" | "backup" }> {
  const primary = getPrimaryBackendUrl();
  const backup = getBackupBackendUrl(LOG);

  const tryOne = async (base: string) => {
    const upstream = `${base}/dj-sets/${encodeURIComponent(videoId)}`;
    return fetchJsonWithTimeout(upstream, timeoutMs, LOG);
  };

  let primaryRaw: unknown;

  try {
    primaryRaw = await tryOne(primary);
    const item = parseDjSetPayload(primaryRaw);
    if (item || !backup) {
      return { raw: primaryRaw, source: "primary" };
    }
    routeLog("api/dj-sets", "primary had no item for video, trying backup", {
      videoId,
      backup,
    });
  } catch (e) {
    routeLog("api/dj-sets", "primary video lookup failed", {
      videoId,
      error: classifyBackendError(e),
    });
    if (!backup) throw e;
    routeLog("api/dj-sets", "trying BACKEND_URL_BACKUP", { backup });
    const raw = await tryOne(backup);
    return { raw, source: "backup" };
  }

  try {
    const raw = await tryOne(backup!);
    return { raw, source: "backup" };
  } catch (e) {
    routeLog("api/dj-sets", "backup video lookup failed", {
      videoId,
      error: classifyBackendError(e),
    });
    return { raw: primaryRaw, source: "primary" };
  }
}

export async function GET(request: NextRequest) {
  routeLog("api/dj-sets", "GET /api/dj-sets", { incomingUrl: request.url });
  try {
    const primary = getPrimaryBackendUrl();
    const backup = getBackupBackendUrl(LOG);
    routeLog("api/dj-sets", "backend targets", {
      BACKEND_URL: primary,
      BACKEND_URL_BACKUP: backup ?? "(not set)",
    });

    const { backendPayload, source } =
      await fetchDjSetsListWithFallback(30_000);

    const items = extractItemsFromListPayload(backendPayload);

    const updatedAt = Array.isArray(backendPayload)
      ? null
      : (backendPayload.updated_at ??
        backendPayload.updatedAt ??
        backendPayload.updated ??
        null);

    const filtered = items.filter(
      (item) => Boolean(item.video_id) && passesDurationFilter(item)
    );

    const payload = {
      updatedAt,
      count: Array.isArray(backendPayload)
        ? filtered.length
        : (backendPayload.count ?? filtered.length),
      currentSets: filtered,
      featured: {
        daily: topViewed(filtered, 1, 4),
        weekly: topViewed(filtered, 7, 6),
      },
      backendSource: source,
    };

    routeLog("api/dj-sets", "GET OK", {
      backendSource: source,
      itemsRaw: items.length,
      itemsAfterDurationFilter: filtered.length,
      count: payload.count,
    });
    return NextResponse.json(payload);
  } catch (error) {
    const detail = classifyBackendError(error);
    routeError("api/dj-sets", `GET failed: ${detail}`, error);
    return NextResponse.json(
      {
        updatedAt: null,
        count: 0,
        currentSets: [],
        featured: { daily: [], weekly: [] },
        error: detail,
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  routeLog("api/dj-sets", "POST /api/dj-sets", { incomingUrl: request.url });
  try {
    const body = (await request.json()) as { videoId?: string };
    const videoId = body.videoId?.trim();
    if (!videoId) {
      routeLog("api/dj-sets", "POST rejected: missing videoId");
      return NextResponse.json({ item: null }, { status: 400 });
    }

    routeLog("api/dj-sets", "backend targets", {
      BACKEND_URL: getPrimaryBackendUrl(),
      BACKEND_URL_BACKUP: getBackupBackendUrl(LOG) ?? "(not set)",
    });

    const { raw, source } = await fetchDjSetByIdWithFallback(videoId, 30_000);
    const item = parseDjSetPayload(raw);
    const safeItem = item && passesDurationFilter(item) ? item : null;

    routeLog("api/dj-sets", "POST OK", {
      videoId,
      backendSource: source,
      found: Boolean(item),
      returned: Boolean(safeItem),
    });
    return NextResponse.json({ item: safeItem, backendSource: source });
  } catch (error) {
    const detail = classifyBackendError(error);
    routeError("api/dj-sets", `POST failed: ${detail}`, error);
    return NextResponse.json({ item: null, error: detail }, { status: 200 });
  }
}
