import { NextRequest, NextResponse } from "next/server";

import { routeError, routeLog } from "@/app/lib/routeLog";

/** Ensure route runs on each request; logs appear in `next dev` terminal. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

class BackendConfigError extends Error {}
class BackendRequestError extends Error {
  statusCode?: number;
}

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

/** Normalize env base URL to origin (optional trailing /dj-sets stripped). */
function normalizeBackendBase(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  let base = raw.trim().replace(/\/+$/, "");
  if (base.endsWith("/dj-sets")) {
    base = base.slice(0, -"/dj-sets".length);
  }
  base = base.replace(/\/+$/, "");
  try {
    const parsed = new URL(base);
    if (!parsed.protocol || !parsed.host) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function getPrimaryBackendUrl(): string {
  const base = normalizeBackendBase(process.env.BACKEND_URL);
  if (!base) {
    throw new BackendConfigError(
      "Missing or invalid BACKEND_URL env var (expected https://host)"
    );
  }
  return base;
}

function getBackupBackendUrl(): string | null {
  const raw = process.env.BACKEND_URL_BACKUP;
  if (!raw?.trim()) return null;
  const base = normalizeBackendBase(raw);
  if (!base) {
    routeLog("api/dj-sets", "BACKEND_URL_BACKUP ignored (invalid URL)", {
      preview: raw.slice(0, 120),
    });
    return null;
  }
  return base;
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
  const backup = getBackupBackendUrl();

  const tryList = async (base: string) => {
    const upstream = `${base}/dj-sets`;
    const backendPayload = (await fetchJsonWithTimeout(
      upstream,
      timeoutMs
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
      backendPayload: primaryResult.backendPayload,
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
  const backup = getBackupBackendUrl();

  const tryOne = async (base: string) => {
    const upstream = `${base}/dj-sets/${encodeURIComponent(videoId)}`;
    return fetchJsonWithTimeout(upstream, timeoutMs);
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

/** Node/undici often wraps failures as "fetch failed"; the real reason is in `cause`. */
function formatNodeErrorExtras(err: Error): string {
  const e = err as NodeJS.ErrnoException & {
    syscall?: string;
    address?: string;
    port?: number;
  };
  const bits: string[] = [];
  if (e.code) bits.push(`code=${e.code}`);
  if (e.syscall) bits.push(`syscall=${e.syscall}`);
  if (e.address) bits.push(`address=${e.address}`);
  if (e.port != null) bits.push(`port=${String(e.port)}`);
  return bits.join(" ");
}

function explainFetchFailure(error: unknown): string {
  if (error instanceof BackendRequestError) return error.message;
  if (error instanceof BackendConfigError) return error.message;
  const lines: string[] = [];
  let cur: unknown = error;
  let depth = 0;
  while (cur != null && depth < 10) {
    if (cur instanceof Error) {
      const extra = formatNodeErrorExtras(cur);
      lines.push(extra ? `${cur.message} (${extra})` : cur.message);
      cur = (cur as Error & { cause?: unknown }).cause;
    } else {
      lines.push(typeof cur === "string" ? cur : JSON.stringify(cur));
      break;
    }
    depth++;
  }
  return lines.join(" → ");
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // For HTTPS with self-signed certs, use node-fetch or disable verification differently
    const nodeUrl = new URL(url);
    const isHttps = nodeUrl.protocol === 'https:';
    
    const fetchOptions: RequestInit = {
      method: "GET",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      signal: controller.signal,
    };

    // Add NODE_TLS_REJECT_UNAUTHORIZED for development
    if (isHttps && process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const res = await fetch(url, fetchOptions);
    
    const text = await res.text();
    if (!res.ok) {
      routeError(
        "api/dj-sets",
        `backend HTTP ${res.status} ${url}`,
        text.slice(0, 2000)
      );
      const err = new BackendRequestError(
        `Backend ${res.status}: ${text.slice(0, 500)}`
      );
      err.statusCode = res.status;
      throw err;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      routeError(
        "api/dj-sets",
        `backend invalid JSON ${url}`,
        text.slice(0, 2000)
      );
      throw new BackendRequestError("Backend returned invalid JSON");
    }
    logBackendResponse(url, res.status, parsed);
    return parsed;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new BackendRequestError(
        `Backend request timed out after ${timeoutMs}ms`
      );
    }
    if (error instanceof BackendRequestError) throw error;
    const detail = explainFetchFailure(error);
    routeError("api/dj-sets", `fetch failed ${url}`, error);
    throw new BackendRequestError(`Upstream fetch failed: ${detail}`);
  } finally {
    clearTimeout(timeout);
    // Reset for production
    if (process.env.NODE_ENV === 'development') {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }
  }
}

function classifyBackendError(error: unknown): string {
  if (error instanceof BackendConfigError) return error.message;
  if (error instanceof BackendRequestError) return error.message;
  if (error instanceof Error) return explainFetchFailure(error);
  return String(error);
}

const BACKEND_LOG_MAX_CHARS = 12_000;

function logBackendResponse(url: string, status: number, data: unknown) {
  try {
    const raw = JSON.stringify(data);
    const preview =
      raw.length > BACKEND_LOG_MAX_CHARS
        ? `${raw.slice(0, BACKEND_LOG_MAX_CHARS)}…(truncated, ${raw.length} chars total)`
        : raw;
    routeLog("api/dj-sets", `backend OK ${status}`, { url, bodyPreview: preview });
  } catch {
    routeLog("api/dj-sets", `backend OK ${status} (unserializable body)`, { url });
  }
}

export async function GET(request: NextRequest) {
  routeLog("api/dj-sets", "GET /api/dj-sets", { incomingUrl: request.url });
  try {
    const primary = getPrimaryBackendUrl();
    const backup = getBackupBackendUrl();
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
      BACKEND_URL_BACKUP: getBackupBackendUrl() ?? "(not set)",
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