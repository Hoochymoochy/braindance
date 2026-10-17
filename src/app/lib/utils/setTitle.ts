/**
 * Display cleanup for YouTube / catalog DJ set titles.
 *
 * Examples:
 *   YOUNA - Melodic Techno &amp; Peak Time DJ Mix @ Gravity - TAP1 I Denmark
 *   → YOUNA at Gravity
 *
 *   Alesso | Tomorrowland 2026 (Mainstage Weekend 1) [Full DJ Live Set]
 *   → Alesso at Tomorrowland 2026
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Genre / mix marketing phrases that usually aren't the set identity. */
const MIX_FLUFF =
  /\b(dj\s*mix|dj\s*live\s*set|live\s*set|full\s*(?:dj\s*)?(?:live\s*)?set|radio\s*mix|guest\s*mix|podcast|melodic|techno|tech\s*house|peak\s*time|progressive|trance|deep\s*house|afro\s*house|organic\s*house|minimal|hardgroove|set\s*mix|mix\s*20\d{2})\b/i;

/** Trailing/inline tags like [Full DJ Live Set], (Official Video). */
const FLUFF_BRACKET =
  /[\[(][^\]")]*(?:full\s*(?:dj\s*)?(?:live\s*)?set|dj\s*live\s*set|live\s*set|official(?:\s*video)?|visualizer|\bhd\b|\b4k\b)[^\]")]*[\])]/gi;

/** Stage / weekend parentheticals: (Mainstage Weekend 1). */
const STAGE_PAREN =
  /\(\s*(?:main\s*stage|mainstage|weekend\s*\d+|stage\s*\d+)[^)]*\)/gi;

export function decodeHtmlEntities(input: string): string {
  return String(input || "").replace(
    /&(#x?[0-9a-fA-F]+|\w+);/g,
    (full, body: string) => {
      if (body[0] === "#") {
        const code =
          body[1] === "x" || body[1] === "X"
            ? parseInt(body.slice(2), 16)
            : parseInt(body.slice(1), 10);
        if (Number.isFinite(code)) {
          try {
            return String.fromCodePoint(code);
          } catch {
            return full;
          }
        }
        return full;
      }
      return NAMED_ENTITIES[body.toLowerCase()] ?? full;
    }
  );
}

function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Turn `@` venue markers into plain “at” (handles ` @ `, `@Venue`, etc.). */
function normalizeAtSymbol(text: string): string {
  return normalizeSpaces(
    text
      .replace(/\s*@\s*/g, " at ")
      .replace(/\bat\s+at\b/gi, "at")
  );
}

function stripDecorators(text: string): string {
  return normalizeSpaces(
    text.replace(FLUFF_BRACKET, " ").replace(STAGE_PAREN, " ")
  );
}

function withVenue(artistOrTitle: string, venue: string): string {
  return venue ? `${artistOrTitle} at ${venue}` : artistOrTitle;
}

/**
 * Prefer a short, human set label:
 * artist (+ venue/event) when the rest is typical YouTube mix marketing copy.
 */
export function cleanSetTitle(raw: string): string {
  let text = stripDecorators(normalizeSpaces(decodeHtmlEntities(raw)));
  if (!text) return text;

  // `… @ Venue - City / Room` (also `@Venue` without spaces)
  let venue = "";
  const atMatch = text.match(/^(.*?)\s*@\s*(.+)$/);
  if (atMatch) {
    text = atMatch[1]!.trim();
    const venuePart = atMatch[2]!.trim();
    venue = venuePart.split(/\s*[-–—|]\s*/)[0]?.trim() || "";
  }

  // `Artist | Tomorrowland 2026`
  const pipe = text.match(/^(.*?)\s+[|｜]\s+(.+)$/);
  if (pipe) {
    const artist = pipe[1]!.trim();
    const event = stripDecorators(pipe[2]!.trim());
    if (artist && event) {
      return normalizeAtSymbol(`${artist} at ${event}`);
    }
    if (artist) return normalizeAtSymbol(withVenue(artist, venue));
  }

  // `Artist - Melodic Techno & Peak Time DJ Mix`
  const dash = text.match(/^(.*?)\s+[-–—]\s+(.+)$/);
  if (dash) {
    const artist = dash[1]!.trim();
    const rest = stripDecorators(dash[2]!.trim());
    if (artist && (!rest || MIX_FLUFF.test(rest))) {
      return normalizeAtSymbol(withVenue(artist, venue));
    }
  }

  // No usable artist/rest split — keep cleaned head, optionally reattach venue.
  if (venue && text) return normalizeAtSymbol(withVenue(text, venue));
  return normalizeAtSymbol(text);
}
