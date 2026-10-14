/**
 * Vault weeks are keyed by Monday 00:00 UTC (ISO date YYYY-MM-DD).
 */

/** Monday UTC date string for the week containing `at`. */
export function vaultWeekStart(at: Date = new Date()): string {
  const d = new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate())
  );
  const day = d.getUTCDay(); // 0 = Sun … 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

/** UTC calendar day YYYY-MM-DD. */
export function utcDayKey(at: Date = new Date()): string {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate())
  )
    .toISOString()
    .slice(0, 10);
}

export function normalizeDjName(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Stable key for a tracklist row (same week like/unlike ledger). */
export function vaultTrackKey(input: {
  artist?: string | null;
  title?: string | null;
  timestamp?: string | null;
}): string {
  const artist = (input.artist ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const title = (input.title ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const timestamp = (input.timestamp ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  return `${artist}|${title}|${timestamp}`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}
