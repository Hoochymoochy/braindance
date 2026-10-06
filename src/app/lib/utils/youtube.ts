/** Feature policy string Google recommends for embedded YouTube players. */
export const YOUTUBE_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

type YoutubeEmbedOptions = {
  autoplay?: boolean;
  mute?: boolean;
};

/**
 * Build an embed URL that plays reliably across browsers:
 * configurable autoplay, `playsinline` (iOS), `enablejsapi`, modest branding.
 *
 * **Production:** set `NEXT_PUBLIC_SITE_URL` (e.g. `https://braindance.live`) so the
 * `origin` query param is included consistently; YouTube uses this for embed security.
 *
 * **Privacy / blocked cookies:** set `NEXT_PUBLIC_YOUTUBE_EMBED_HOST=nocookie` to use
 * `youtube-nocookie.com` instead of `youtube.com`.
 */
export function buildYoutubeEmbedSrc(
  rawVideoIdOrUrl: string,
  options: YoutubeEmbedOptions = {}
): string {
  const trimmed = rawVideoIdOrUrl.trim();
  if (!trimmed) return "";
  const { autoplay = false, mute = false } = options;

  let id = trimmed;
  if (
    trimmed.includes("youtube") ||
    trimmed.includes("youtu.be") ||
    trimmed.includes("/embed/")
  ) {
    id = youtubeVideoIdFromUrl(trimmed) ?? trimmed;
  }

  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: mute ? "1" : "0",
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
  } else if (typeof window !== "undefined") {
    params.set("origin", window.location.origin);
  }

  const host =
    process.env.NEXT_PUBLIC_YOUTUBE_EMBED_HOST === "nocookie"
      ? "www.youtube-nocookie.com"
      : "www.youtube.com";

  return `https://${host}/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

/** YouTube still image sizes (largest → smallest). `maxresdefault` is 1280×720 when present. */
export type YoutubeThumbnailQuality =
  | "maxresdefault"
  | "sddefault"
  | "hqdefault"
  | "mqdefault"
  | "default";

const THUMB_QUALITY_FALLBACK: YoutubeThumbnailQuality[] = [
  "maxresdefault",
  "sddefault",
  "hqdefault",
  "mqdefault",
];

export function youtubeThumbnailUrl(
  videoId: string,
  quality: YoutubeThumbnailQuality = "maxresdefault"
): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${quality}.jpg`;
}

/**
 * Prefer a higher-res YouTube still when the backend returns `hqdefault` / `mqdefault`.
 * Non-YouTube URLs are returned unchanged.
 */
export function upgradeYoutubeThumbnail(
  url: string | null | undefined,
  videoId?: string | null
): string | undefined {
  const fromUrl = url ? youtubeVideoIdFromThumbnailUrl(url) : null;
  const id =
    fromUrl ||
    (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : null);
  if (id) return youtubeThumbnailUrl(id, "maxresdefault");

  // Keep custom / hosted covers as-is.
  if (url) return url;
  return undefined;
}

/** Next lower YouTube still when maxres is missing or is YouTube’s tiny placeholder. */
export function youtubeThumbnailFallbackUrl(url: string): string {
  const id = youtubeVideoIdFromThumbnailUrl(url);
  if (id) {
    const match = url.match(
      /\/(maxresdefault|sddefault|hqdefault|mqdefault|default)\./i
    );
    const current = (match?.[1]?.toLowerCase() ??
      "maxresdefault") as YoutubeThumbnailQuality;
    const idx = THUMB_QUALITY_FALLBACK.indexOf(current);
    const next =
      idx >= 0 && idx < THUMB_QUALITY_FALLBACK.length - 1
        ? THUMB_QUALITY_FALLBACK[idx + 1]
        : "hqdefault";
    return youtubeThumbnailUrl(id, next);
  }

  return url.replace(
    /\/(maxresdefault|sddefault|hqdefault|mqdefault|default)\.(jpg|webp|jpeg)(\?.*)?$/i,
    "/hqdefault.jpg"
  );
}

function youtubeVideoIdFromThumbnailUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "i.ytimg.com" && host !== "img.youtube.com") return null;
    const match = u.pathname.match(
      /^\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})\//
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
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
