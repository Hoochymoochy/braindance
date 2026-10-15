/**
 * Client-safe listening progress helpers (no DB / server imports).
 */

/** Persist every N seconds of newly accumulated active playback. */
export const LISTENING_HEARTBEAT_SECONDS = 300;

/** Hard cap per client session (12 hours). */
export const MAX_SESSION_LISTENED_SECONDS = 12 * 60 * 60;

/**
 * Whether the client should send a progress write.
 * Heartbeat: every HEARTBEAT seconds of new listening since last accept.
 * Force flush: any positive leftover (pause / end / unmount).
 */
export function shouldPersistListeningProgress({
  cumulativeSeconds,
  lastPersistedSeconds,
  force = false,
  heartbeatSeconds = LISTENING_HEARTBEAT_SECONDS,
}: {
  cumulativeSeconds: number;
  lastPersistedSeconds: number;
  force?: boolean;
  heartbeatSeconds?: number;
}): boolean {
  const cumulative = Math.max(0, Math.floor(cumulativeSeconds));
  const last = Math.max(0, Math.floor(lastPersistedSeconds));
  const delta = cumulative - last;
  if (delta <= 0) return false;
  if (force) return true;
  return delta >= heartbeatSeconds;
}

/** Cap reported seconds using known set duration when available. */
export function capListenedSeconds(
  reported: number,
  durationSeconds?: number
): number {
  const raw = Math.max(0, Math.floor(reported));
  const capped = Math.min(raw, MAX_SESSION_LISTENED_SECONDS);
  const duration = Math.max(0, Math.floor(durationSeconds ?? 0));
  if (duration > 0) {
    // Small buffer for clock skew; never credit a full set from a short listen.
    return Math.min(capped, duration + 120);
  }
  return capped;
}

/** Idempotent merge: never decrease; never exceed cap. */
export function mergeListenedSeconds(
  existingSeconds: number,
  reportedSeconds: number,
  durationSeconds?: number
): number {
  const next = capListenedSeconds(reportedSeconds, durationSeconds);
  return Math.max(Math.max(0, Math.floor(existingSeconds)), next);
}
