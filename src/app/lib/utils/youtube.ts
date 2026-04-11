/** Extract YouTube video id from common URL shapes for embeds. */
export function youtubeVideoIdFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id && id.length >= 6 ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && v.length >= 6) return v;
      const embed = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embed?.[1]) return embed[1];
      const short = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (short?.[1]) return short[1];
    }
  } catch {
    return null;
  }
  return null;
}
