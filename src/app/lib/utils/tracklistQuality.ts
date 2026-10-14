/**
 * Detect meme / spam “tracklists” scraped from YouTube comments
 * (e.g. every cue stamped as the same joke title).
 */

function normalizeTrackTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*\[[^\]]*\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Titleish = { title?: string | null };

/**
 * True when titles are too repetitive to be a real set list.
 * Requires enough rows so short authentic lists are left alone.
 */
export function isLikelySpamTracklist(
  tracks: Titleish[],
  opts?: { minTracks?: number; maxShare?: number }
): boolean {
  const minTracks = opts?.minTracks ?? 5;
  const maxShare = opts?.maxShare ?? 0.5;
  if (tracks.length < minTracks) return false;

  const counts = new Map<string, number>();
  let labeled = 0;
  for (const t of tracks) {
    const key = normalizeTrackTitle(t.title ?? "");
    if (!key) continue;
    labeled += 1;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (labeled < minTracks) return false;

  let max = 0;
  for (const n of counts.values()) {
    if (n > max) max = n;
  }
  return max / labeled >= maxShare;
}
