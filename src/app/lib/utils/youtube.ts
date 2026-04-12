/** Feature policy string Google recommends for embedded YouTube players. */
export const YOUTUBE_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

/**
 * Build an embed URL that plays reliably across browsers:
 * muted autoplay, `playsinline` (iOS), `enablejsapi`, modest branding.
 *
 * **Production:** set `NEXT_PUBLIC_SITE_URL` (e.g. `https://braindance.live`) so the
 * `origin` query param is included consistently; YouTube uses this for embed security.
 *
 * **Privacy / blocked cookies:** set `NEXT_PUBLIC_YOUTUBE_EMBED_HOST=nocookie` to use
 * `youtube-nocookie.com` instead of `youtube.com`.
 */
export function buildYoutubeEmbedSrc(rawVideoIdOrUrl: string): string {
  const trimmed = rawVideoIdOrUrl.trim();
  if (!trimmed) return "";

  let id = trimmed;
  if (
    trimmed.includes("youtube") ||
    trimmed.includes("youtu.be") ||
    trimmed.includes("/embed/")
  ) {
    id = youtubeVideoIdFromUrl(trimmed) ?? trimmed;
  }

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) {
    try {
      const originUrl = site.startsWith("http") ? site : `https://${site}`;
      params.set("origin", new URL(originUrl).origin);
    } catch {
      /* ignore invalid env */
    }
  }

  const host =
    process.env.NEXT_PUBLIC_YOUTUBE_EMBED_HOST === "nocookie"
      ? "www.youtube-nocookie.com"
      : "www.youtube.com";

  return `https://${host}/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

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
