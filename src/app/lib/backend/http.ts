import { routeError, routeLog } from "@/app/lib/routeLog";

export class BackendConfigError extends Error {}
export class BackendRequestError extends Error {
  statusCode?: number;
}

function isLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]";
}

/**
 * Normalize env base URL to origin (optional trailing /dj-sets stripped).
 * `https://localhost` / `https://127.0.0.1` are rewritten to `http://…` — local
 * APIs (uvicorn, etc.) almost always speak HTTP; using HTTPS causes TLS errors
 * like ERR_SSL_PACKET_LENGTH_TOO_LONG.
 */
export function normalizeBackendBase(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  let base = raw.trim().replace(/\/+$/, "");
  if (base.endsWith("/dj-sets")) {
    base = base.slice(0, -"/dj-sets".length);
  }
  base = base.replace(/\/+$/, "");
  try {
    const parsed = new URL(base);
    if (!parsed.protocol || !parsed.host) return null;
    if (parsed.protocol === "https:" && isLoopbackHost(parsed.hostname)) {
      routeLog(
        "backend",
        "BACKEND_URL uses https for loopback; using http for local dev",
        { original: parsed.origin }
      );
      parsed.protocol = "http:";
      return parsed.origin;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function getPrimaryBackendUrl(): string {
  const base = normalizeBackendBase(process.env.BACKEND_URL);
  if (!base) {
    throw new BackendConfigError(
      "Missing or invalid BACKEND_URL env var (expected http(s)://host)"
    );
  }
  return base;
}

export function getBackupBackendUrl(logTag = "backend"): string | null {
  const raw = process.env.BACKEND_URL_BACKUP;
  if (!raw?.trim()) return null;
  const base = normalizeBackendBase(raw);
  if (!base) {
    routeLog(logTag, "BACKEND_URL_BACKUP ignored (invalid URL)", {
      preview: raw.slice(0, 120),
    });
    return null;
  }
  return base;
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

const BACKEND_LOG_MAX_CHARS = 12_000;

function logBackendResponse(
  logTag: string,
  url: string,
  status: number,
  data: unknown
) {
  try {
    const raw = JSON.stringify(data);
    const preview =
      raw.length > BACKEND_LOG_MAX_CHARS
        ? `${raw.slice(0, BACKEND_LOG_MAX_CHARS)}…(truncated, ${raw.length} chars total)`
        : raw;
    routeLog(logTag, `backend OK ${status}`, { url, bodyPreview: preview });
  } catch {
    routeLog(logTag, `backend OK ${status} (unserializable body)`, { url });
  }
}

export async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
  logTag: string
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const nodeUrl = new URL(url);
    const isHttps = nodeUrl.protocol === "https:";

    const fetchOptions: RequestInit = {
      method: "GET",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      signal: controller.signal,
    };

    if (isHttps && process.env.NODE_ENV === "development") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    const res = await fetch(url, fetchOptions);

    const text = await res.text();
    if (!res.ok) {
      routeError(
        logTag,
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
      routeError(logTag, `backend invalid JSON ${url}`, text.slice(0, 2000));
      throw new BackendRequestError("Backend returned invalid JSON");
    }
    logBackendResponse(logTag, url, res.status, parsed);
    return parsed;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new BackendRequestError(
        `Backend request timed out after ${timeoutMs}ms`
      );
    }
    if (error instanceof BackendRequestError) throw error;
    const detail = explainFetchFailure(error);
    routeError(logTag, `fetch failed ${url}`, error);
    throw new BackendRequestError(`Upstream fetch failed: ${detail}`);
  } finally {
    clearTimeout(timeout);
    if (process.env.NODE_ENV === "development") {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }
  }
}

export function classifyBackendError(error: unknown): string {
  if (error instanceof BackendConfigError) return error.message;
  if (error instanceof BackendRequestError) return error.message;
  if (error instanceof Error) return explainFetchFailure(error);
  return String(error);
}

/**
 * Tries primary then optional backup origin for the same path (e.g. `/streams/:id`).
 */
export async function fetchJsonFromBackendWithFallback(
  path: string,
  timeoutMs: number,
  logTag: string
): Promise<{ data: unknown; source: "primary" | "backup" }> {
  const primary = getPrimaryBackendUrl();
  const backup = getBackupBackendUrl(logTag);
  const pathPart = path.startsWith("/") ? path : `/${path}`;
  const bases: { url: string; source: "primary" | "backup" }[] = [
    { url: `${primary}${pathPart}`, source: "primary" },
  ];
  if (backup) {
    bases.push({ url: `${backup}${pathPart}`, source: "backup" });
  }

  let lastError: unknown = null;
  for (const { url, source } of bases) {
    try {
      const data = await fetchJsonWithTimeout(url, timeoutMs, logTag);
      return { data, source };
    } catch (e) {
      lastError = e;
      if (bases.length > 1 && source === "primary") {
        routeLog(logTag, "primary failed, trying backup", {
          error: classifyBackendError(e),
        });
      }
    }
  }
  throw lastError ?? new BackendRequestError("No backend responded");
}
