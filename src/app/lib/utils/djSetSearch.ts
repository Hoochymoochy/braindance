import { youtubeVideoIdFromUrl } from "@/app/lib/utils/youtube";

export type SearchableDjSet = {
  video_id: string;
  title: string;
  channel: string;
};

export function matchesDjSetQuery(
  set: SearchableDjSet,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    set.title.toLowerCase().includes(q) ||
    set.channel.toLowerCase().includes(q) ||
    set.video_id.toLowerCase().includes(q)
  );
}

/**
 * Pick the set to open from a search submit.
 * Prefers exact id / YouTube URL, then exact title, then strongest text match.
 * Returns a video id even when the URL/id is not in the local catalog.
 */
export function resolveSearchNavigation(
  sets: SearchableDjSet[],
  query: string
): { videoId: string; set: SearchableDjSet | null } | null {
  const raw = query.trim();
  if (!raw) return null;

  const q = raw.toLowerCase();
  const fromUrl = youtubeVideoIdFromUrl(raw);
  if (fromUrl) {
    const hit =
      sets.find((s) => s.video_id.toLowerCase() === fromUrl.toLowerCase()) ??
      null;
    return { videoId: fromUrl, set: hit };
  }

  const exactId = sets.find((s) => s.video_id.toLowerCase() === q);
  if (exactId) return { videoId: exactId.video_id, set: exactId };

  const matches = sets.filter((s) => matchesDjSetQuery(s, raw));
  if (matches.length === 0) return null;

  const exactTitle = matches.find((s) => s.title.toLowerCase() === q);
  if (exactTitle) return { videoId: exactTitle.video_id, set: exactTitle };

  const titleStarts = matches.find((s) =>
    s.title.toLowerCase().startsWith(q)
  );
  if (titleStarts) return { videoId: titleStarts.video_id, set: titleStarts };

  return { videoId: matches[0].video_id, set: matches[0] };
}
