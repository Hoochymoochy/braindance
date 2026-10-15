/**
 * Display cleanup for scraped tracklists:
 * - setlist indexes (`01. James Hype` → `James Hype`)
 * - range end-times left in labels (`- 2:08 Lukas & Frank` → `Lukas & Frank`)
 */

/** Leading `1.`, `01.`, `1)`, `1]` style indexes. */
const LEADING_TRACK_INDEX = /^\s*\d{1,3}[.)\]]\s+/;

/** Leading range leftovers: `- 2:08 …`, `2:08 …`, `- 01:00:57 …`. */
const LEADING_TIMESTAMP_RESIDUE =
  /^\s*-?\s*(?:\d{1,2}:\d{2}:\d{2}|\d{1,3}:\d{2})\s+/;

/** Orphan leading dash/pipe after a stripped range marker. */
const LEADING_SEPARATOR = /^\s*[-–—|]\s+/;

export function stripLeadingTrackIndex(text: string): string {
  const trimmed = (text || "").trim();
  if (!trimmed) return trimmed;
  return trimmed.replace(LEADING_TRACK_INDEX, "").trim();
}

/** Remove leaked cue/range timestamps from artist or title text. */
export function stripLeadingTimestampResidue(text: string): string {
  let out = (text || "").trim();
  if (!out) return out;
  // Ranges sometimes leave more than one marker; strip a couple of times.
  for (let i = 0; i < 2; i += 1) {
    const next = out
      .replace(LEADING_TIMESTAMP_RESIDUE, "")
      .replace(LEADING_SEPARATOR, "")
      .trim();
    if (next === out) break;
    out = next;
  }
  return out;
}

type Labelish = { artist?: string | null; title?: string | null };

function fieldHasTrackIndex(value: string | null | undefined): boolean {
  return LEADING_TRACK_INDEX.test((value || "").trim());
}

/**
 * True when enough rows look like a numbered setlist (`01. Artist`, `2. Title`).
 */
export function isNumberedTracklist(
  tracks: Labelish[],
  opts?: { minTracks?: number; minShare?: number }
): boolean {
  const minTracks = opts?.minTracks ?? 3;
  const minShare = opts?.minShare ?? 0.5;
  if (tracks.length < minTracks) return false;

  let numbered = 0;
  for (const t of tracks) {
    if (fieldHasTrackIndex(t.artist) || fieldHasTrackIndex(t.title)) {
      numbered += 1;
    }
  }
  return numbered / tracks.length >= minShare;
}

function cleanLabel(
  value: string | null | undefined,
  stripIndex: boolean
): string | null | undefined {
  if (value == null) return value;
  let out = stripLeadingTimestampResidue(String(value));
  if (stripIndex) out = stripLeadingTrackIndex(out);
  return out;
}

/**
 * Normalize artist/title for sidebar display.
 * Always strips leaked timestamps; strips setlist indexes when the list looks numbered.
 */
export function cleanTracklistDisplayLabels<T extends Labelish>(
  tracks: T[]
): T[] {
  const stripIndex = isNumberedTracklist(tracks);
  return tracks.map((t) => ({
    ...t,
    artist: cleanLabel(t.artist, stripIndex),
    title: cleanLabel(t.title, stripIndex),
  }));
}

/** @deprecated Prefer {@link cleanTracklistDisplayLabels}. */
export function cleanNumberedTracklistLabels<T extends Labelish>(
  tracks: T[]
): T[] {
  return cleanTracklistDisplayLabels(tracks);
}
