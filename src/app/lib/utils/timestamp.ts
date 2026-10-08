/** Parse tracklist labels like `1:23:45` or `12:34` into seconds. */
export function timestampToSeconds(label: string): number {
  const parts = label
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.length === 0 || parts.some((n) => Number.isNaN(n))) {
    return 0;
  }

  if (parts.length === 3) {
    return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  }

  if (parts.length === 2) {
    return parts[0]! * 60 + parts[1]!;
  }

  return parts[0] ?? 0;
}

export function secondsToTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
