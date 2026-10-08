import { getDbClient } from "./db";
import { clamp, TRAIT_WEIGHTS } from "./config";
import type { ListenerStats } from "./types";

type CrateSetRow = {
  video_id: string;
  title: string;
  channel: string;
  added_at: string;
};

type MomentRow = {
  video_id: string;
  set_title: string;
  track_title: string;
  track_artist: string;
  timestamp_seconds: number;
  created_at: string;
};

type SessionRow = {
  video_id: string;
  dj_name?: string | null;
  set_title?: string | null;
  duration_seconds?: number | null;
  listened_seconds?: number | null;
  completed?: boolean | null;
  started_at: string;
};

type YoutubeVideoMeta = {
  video_id: string;
  channel: string | null;
  duration_seconds: number | null;
  genres: string[] | string | null;
};

function isLateNight(isoTimestamp: string): boolean {
  try {
    const d = new Date(isoTimestamp);
    if (Number.isNaN(d.getTime())) return false;
    // Check hour: 22:00 (10 PM) through 03:59 (4 AM)
    const hour = d.getHours();
    return (
      hour >= TRAIT_WEIGHTS.nightOwl.startHour ||
      hour < TRAIT_WEIGHTS.nightOwl.endHour
    );
  } catch {
    return false;
  }
}

function parseGenres(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((g): g is string => typeof g === "string" && Boolean(g.trim()));
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseGenres(parsed);
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Aggregates all user listening analytics, saved crates, moments, and session history
 * into normalized listener statistics.
 */
export async function getListenerStats(userId: string): Promise<ListenerStats> {
  const client = getDbClient();

  // 1. Fetch crates and sets
  const { data: crates } = await client
    .from("crates")
    .select("id")
    .eq("user_id", userId);

  const crateIds = (crates ?? []).map((c) => c.id as string);

  let crateSets: CrateSetRow[] = [];
  if (crateIds.length > 0) {
    const { data: sets } = await client
      .from("crate_sets")
      .select("video_id, title, channel, added_at")
      .in("crate_id", crateIds);
    crateSets = (sets ?? []) as CrateSetRow[];
  }

  // 2. Fetch moments
  const { data: momentsData } = await client
    .from("moments")
    .select(
      "video_id, set_title, track_title, track_artist, timestamp_seconds, created_at"
    )
    .eq("user_id", userId);

  const moments = (momentsData ?? []) as MomentRow[];

  // 3. Fetch listening sessions (if table exists)
  let sessions: SessionRow[] = [];
  try {
    const { data: sessionData, error: sessionErr } = await client
      .from("listening_sessions")
      .select(
        "video_id, dj_name, set_title, duration_seconds, listened_seconds, completed, started_at"
      )
      .eq("user_id", userId);

    if (!sessionErr && Array.isArray(sessionData)) {
      sessions = sessionData as SessionRow[];
    }
  } catch {
    // Graceful fallback if listening_sessions table is not yet migrated
    sessions = [];
  }

  // 4. Fetch metadata for videos from youtube_videos
  const allVideoIds = Array.from(
    new Set([
      ...crateSets.map((s) => s.video_id),
      ...moments.map((m) => m.video_id),
      ...sessions.map((s) => s.video_id),
    ])
  ).filter(Boolean);

  const videoMetaMap = new Map<string, YoutubeVideoMeta>();
  if (allVideoIds.length > 0) {
    const { data: ytv } = await client
      .from("youtube_videos")
      .select("video_id, channel, duration_seconds, genres")
      .in("video_id", allVideoIds);

    for (const v of (ytv ?? []) as YoutubeVideoMeta[]) {
      videoMetaMap.set(v.video_id, v);
    }
  }

  // 5. Aggregate metrics
  const uniqueSavedSetIds = new Set(crateSets.map((s) => s.video_id));
  const savedSets = uniqueSavedSetIds.size;
  const savedMoments = moments.length;

  // Track counts per DJ
  const djCounts = new Map<string, { count: number; name: string; minutes: number }>();
  const recordDj = (name: string | null | undefined, minutes = 0) => {
    const clean = (name ?? "").trim();
    if (!clean || clean === "—" || clean.toLowerCase() === "unknown") return;
    const key = clean.toLowerCase();
    const curr = djCounts.get(key) ?? { count: 0, name: clean, minutes: 0 };
    curr.count += 1;
    curr.minutes += minutes;
    djCounts.set(key, curr);
  };

  for (const s of crateSets) {
    const meta = videoMetaMap.get(s.video_id);
    const dj = s.channel || meta?.channel;
    recordDj(dj, 20);
  }

  for (const m of moments) {
    const meta = videoMetaMap.get(m.video_id);
    const dj = meta?.channel || m.set_title?.split(/[-–|]/)[0]?.trim();
    recordDj(dj, 10);
  }

  for (const sess of sessions) {
    const meta = videoMetaMap.get(sess.video_id);
    const dj = sess.dj_name || meta?.channel;
    const min = Math.round((sess.listened_seconds ?? 0) / 60);
    recordDj(dj, min);
  }

  const uniqueDjs = djCounts.size;

  // Calculate repeat vs new DJ listens
  let totalDjInteractions = 0;
  let repeatDjInteractions = 0;
  for (const dj of djCounts.values()) {
    totalDjInteractions += dj.count;
    if (dj.count > 1) {
      repeatDjInteractions += dj.count - 1;
    }
  }

  const repeatDjRatio =
    totalDjInteractions > 0
      ? clamp(repeatDjInteractions / totalDjInteractions, 0, 1)
      : 0;
  const newDjListenRatio =
    totalDjInteractions > 0 ? clamp(1 - repeatDjRatio, 0, 1) : 0;

  // Replay set ratio: how many sets appeared in multiple crates or moments
  const setOccurrences = new Map<string, number>();
  for (const s of crateSets) {
    setOccurrences.set(s.video_id, (setOccurrences.get(s.video_id) ?? 0) + 1);
  }
  for (const m of moments) {
    setOccurrences.set(m.video_id, (setOccurrences.get(m.video_id) ?? 0) + 1);
  }
  for (const sess of sessions) {
    setOccurrences.set(sess.video_id, (setOccurrences.get(sess.video_id) ?? 0) + 1);
  }

  let repeatSetCount = 0;
  for (const count of setOccurrences.values()) {
    if (count > 1) repeatSetCount += count - 1;
  }
  const totalSetsTouched = Math.max(setOccurrences.size, 1);
  const replaySetRatio = clamp(repeatSetCount / totalSetsTouched, 0, 1);

  // Late night sessions
  const timestamps: string[] = [
    ...crateSets.map((s) => s.added_at),
    ...moments.map((m) => m.created_at),
    ...sessions.map((s) => s.started_at),
  ];
  let lateNightCount = 0;
  for (const ts of timestamps) {
    if (isLateNight(ts)) lateNightCount += 1;
  }
  const lateNightSessionRatio =
    timestamps.length > 0 ? clamp(lateNightCount / timestamps.length, 0, 1) : 0;

  // Average moment timestamp ratio (how far into sets moments are saved)
  let momentTimestampRatioSum = 0;
  let momentRatioCount = 0;
  for (const m of moments) {
    const meta = videoMetaMap.get(m.video_id);
    const duration = meta?.duration_seconds && meta.duration_seconds > 0
      ? meta.duration_seconds
      : 3600; // default 1 hour if unknown
    const ratio = clamp(m.timestamp_seconds / duration, 0, 1);
    momentTimestampRatioSum += ratio;
    momentRatioCount += 1;
  }
  const avgMomentTimestampRatio =
    momentRatioCount > 0 ? momentTimestampRatioSum / momentRatioCount : 0;

  // Session telemetry completion & minutes
  let totalListeningMinutes = 0;
  let setsStarted = 0;
  let setsCompleted = 0;
  let completionSum = 0;

  if (sessions.length > 0) {
    setsStarted = sessions.length;
    for (const s of sessions) {
      const listenedMin = (s.listened_seconds ?? 0) / 60;
      totalListeningMinutes += listenedMin;
      if (s.completed) {
        setsCompleted += 1;
      }
      const dur = s.duration_seconds ?? 3600;
      if (dur > 0) {
        completionSum += clamp((s.listened_seconds ?? 0) / dur, 0, 1);
      }
    }
  } else {
    // Telemetry proxy when only crates/moments are present
    setsStarted = Math.max(savedSets, Math.min(savedMoments, 5));
    // Estimate listening based on interaction depth
    totalListeningMinutes = savedSets * 30 + savedMoments * 10;
    // Estimated completion proxy
    completionSum = avgMomentTimestampRatio > 0 ? avgMomentTimestampRatio * setsStarted : 0;
  }

  const avgCompletionRate =
    setsStarted > 0 ? clamp(completionSum / setsStarted, 0, 1) : 0;

  // Top DJs
  const topDjs = Array.from(djCounts.entries())
    .map(([id, val]) => ({
      id,
      name: val.name,
      listeningMinutes: val.minutes,
      count: val.count,
    }))
    .sort((a, b) => b.count - a.count || b.listeningMinutes - a.listeningMinutes)
    .slice(0, 5);

  // Top Genres
  const genreWeights = new Map<string, number>();
  for (const meta of videoMetaMap.values()) {
    const parsed = parseGenres(meta.genres);
    for (const g of parsed) {
      const clean = g.toLowerCase().trim();
      if (!clean) continue;
      genreWeights.set(clean, (genreWeights.get(clean) ?? 0) + 1);
    }
  }

  const topGenres = Array.from(genreWeights.entries())
    .map(([genre, weight]) => ({ genre, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  const totalInteractions =
    crateSets.length + moments.length + sessions.length;

  const lastActivityAt =
    timestamps.length > 0
      ? timestamps.sort().reverse()[0]
      : null;

  return {
    totalListeningMinutes: Math.round(totalListeningMinutes),
    setsStarted,
    setsCompleted,
    avgCompletionRate: Number(avgCompletionRate.toFixed(2)),
    uniqueDjs,
    newDjListenRatio: Number(newDjListenRatio.toFixed(2)),
    repeatDjRatio: Number(repeatDjRatio.toFixed(2)),
    replaySetRatio: Number(replaySetRatio.toFixed(2)),
    savedSets,
    savedMoments,
    lateNightSessionRatio: Number(lateNightSessionRatio.toFixed(2)),
    avgMomentTimestampRatio: Number(avgMomentTimestampRatio.toFixed(2)),
    topDjs,
    topGenres,
    totalInteractions,
    lastActivityAt,
  };
}
