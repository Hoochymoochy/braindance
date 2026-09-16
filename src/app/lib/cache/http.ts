export const CATALOG_REVALIDATE_SECONDS = 60;
export const TRACKLIST_REVALIDATE_SECONDS = 300;

export function cacheControlHeader(ttlSeconds: number): string {
  const stale = Math.max(ttlSeconds * 5, ttlSeconds);
  return `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${stale}`;
}
