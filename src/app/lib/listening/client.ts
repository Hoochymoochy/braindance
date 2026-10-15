import type {
  ListeningProgressPayload,
  ListeningProgressResult,
} from "@/app/lib/listening/types";

const PROGRESS_PATH = "/api/listening/progress";

/**
 * Persist listening progress. Uses keepalive fetch on unload when possible;
 * falls back to sendBeacon so navigation is never blocked.
 */
export async function reportListeningProgress(
  payload: ListeningProgressPayload,
  options?: { keepalive?: boolean }
): Promise<ListeningProgressResult | null> {
  const body = JSON.stringify(payload);

  if (options?.keepalive && typeof navigator !== "undefined") {
    try {
      if (typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        const queued = navigator.sendBeacon(PROGRESS_PATH, blob);
        if (queued) {
          return {
            sessionId: payload.sessionId,
            listenedSeconds: payload.listenedSeconds,
            completed: Boolean(payload.completed),
          };
        }
      }
    } catch {
      /* fall through to fetch */
    }
  }

  try {
    const res = await fetch(PROGRESS_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "same-origin",
      keepalive: Boolean(options?.keepalive),
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return (await res.json()) as ListeningProgressResult;
  } catch {
    return null;
  }
}
