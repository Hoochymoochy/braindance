import { supabase } from "@/app/lib/utils/supabaseClient";
import { timestampToSeconds } from "@/app/lib/utils/timestamp";
import { ensureProfileForCurrentUser } from "@/app/lib/profile/profile";

export const MAX_FAVORITE_MOMENTS = 3;

export type Moment = {
  id: string;
  user_id: string;
  video_id: string;
  set_title: string;
  track_title: string;
  track_artist: string;
  timestamp_label: string;
  timestamp_seconds: number;
  note: string;
  /** 1–3 when pinned to the profile card; null otherwise. */
  favorite_rank: number | null;
  created_at: string;
};

export type MomentInput = {
  video_id: string;
  set_title?: string;
  track_title: string;
  track_artist: string;
  timestamp_label: string;
  note?: string;
};

function normalizeMoment(row: Moment): Moment {
  return {
    ...row,
    favorite_rank:
      typeof row.favorite_rank === "number" ? row.favorite_rank : null,
  };
}

/** Pinned favorites first (by rank), then the rest newest-first. */
export function sortMomentsForProfile(moments: Moment[]): Moment[] {
  return [...moments].sort((a, b) => {
    const aRank = a.favorite_rank ?? Number.POSITIVE_INFINITY;
    const bRank = b.favorite_rank ?? Number.POSITIVE_INFINITY;
    if (aRank !== bRank) return aRank - bRank;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

/**
 * Moments shown on the profile card: explicit favorites by rank.
 * If none are pinned yet, fall back to the 3 most recent.
 */
export function pickTopMoments(moments: Moment[]): Moment[] {
  const favorites = moments
    .filter(
      (m) =>
        typeof m.favorite_rank === "number" &&
        m.favorite_rank >= 1 &&
        m.favorite_rank <= MAX_FAVORITE_MOMENTS
    )
    .sort((a, b) => (a.favorite_rank ?? 0) - (b.favorite_rank ?? 0));

  if (favorites.length > 0) return favorites.slice(0, MAX_FAVORITE_MOMENTS);

  return [...moments]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, MAX_FAVORITE_MOMENTS);
}

export type MomentSetGroup = {
  video_id: string;
  set_title: string;
  moments: Moment[];
  favorite_count: number;
  latest_created_at: string;
};

/** Folder/file grouping: one folder per set (video), moments as the tracklist inside. */
export function groupMomentsBySet(moments: Moment[]): MomentSetGroup[] {
  const byVideo = new Map<string, Moment[]>();
  for (const moment of moments) {
    const list = byVideo.get(moment.video_id) ?? [];
    list.push(moment);
    byVideo.set(moment.video_id, list);
  }

  const groups: MomentSetGroup[] = [];
  for (const [video_id, rows] of byVideo) {
    // Tracklist order inside each set (by timestamp), not by favorite rank.
    const sorted = [...rows].sort(
      (a, b) => a.timestamp_seconds - b.timestamp_seconds
    );

    const titled = sorted.find((m) => m.set_title.trim());
    const latest = sorted.reduce((acc, m) =>
      new Date(m.created_at) > new Date(acc.created_at) ? m : acc
    );

    groups.push({
      video_id,
      set_title: titled?.set_title.trim() || "Untitled set",
      moments: sorted,
      favorite_count: sorted.filter(
        (m) => typeof m.favorite_rank === "number"
      ).length,
      latest_created_at: latest.created_at,
    });
  }

  // Most recently saved set first — favorites stay in the header / top strip.
  return groups.sort(
    (a, b) =>
      new Date(b.latest_created_at).getTime() -
      new Date(a.latest_created_at).getTime()
  );
}

export async function listMoments(userId: string): Promise<Moment[]> {
  const { data, error } = await supabase
    .from("moments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeMoment(row as Moment));
}

/** Moments the current user already saved from a specific set/clip. */
export async function listMomentsForVideo(
  userId: string,
  videoId: string
): Promise<Moment[]> {
  const { data, error } = await supabase
    .from("moments")
    .select("*")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .order("timestamp_seconds", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeMoment(row as Moment));
}

export async function addMoment(input: MomentInput): Promise<Moment> {
  // Always use Auth user id + ensure profiles row exists (FK + RLS).
  const userId = await ensureProfileForCurrentUser();

  const { data, error } = await supabase
    .from("moments")
    .insert([
      {
        user_id: userId,
        video_id: input.video_id,
        set_title: input.set_title ?? "",
        track_title: input.track_title,
        track_artist: input.track_artist,
        timestamp_label: input.timestamp_label,
        timestamp_seconds: timestampToSeconds(input.timestamp_label),
        note: input.note ?? "",
      },
    ])
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeMoment(data as Moment);
}

export async function deleteMoment(momentId: string): Promise<void> {
  const { error } = await supabase.from("moments").delete().eq("id", momentId);
  if (error) throw new Error(error.message);
}

/** Max length for favorite spotlight notes on the profile card. */
export const MAX_MOMENT_NOTE_LENGTH = 40;

export async function updateMomentNote(
  momentId: string,
  note: string
): Promise<Moment> {
  const userId = await ensureProfileForCurrentUser();
  const trimmed = note.trim().slice(0, MAX_MOMENT_NOTE_LENGTH);

  const { data, error } = await supabase
    .from("moments")
    .update({ note: trimmed })
    .eq("id", momentId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeMoment(data as Moment);
}

/**
 * Pin or unpin a moment as a profile favorite.
 * When pinning, assigns the next free rank (1–3). Max 3 favorites.
 */
export async function setMomentFavorite(
  momentId: string,
  favorite: boolean
): Promise<Moment> {
  const userId = await ensureProfileForCurrentUser();

  if (!favorite) {
    const { data, error } = await supabase
      .from("moments")
      .update({ favorite_rank: null })
      .eq("id", momentId)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeMoment(data as Moment);
  }

  const { data: existing, error: listError } = await supabase
    .from("moments")
    .select("id, favorite_rank")
    .eq("user_id", userId)
    .not("favorite_rank", "is", null);

  if (listError) throw new Error(listError.message);

  const used = new Set(
    (existing ?? [])
      .map((row) => row.favorite_rank as number | null)
      .filter((rank): rank is number => typeof rank === "number")
  );

  const already = (existing ?? []).find((row) => row.id === momentId);
  if (already && typeof already.favorite_rank === "number") {
    const { data, error } = await supabase
      .from("moments")
      .select("*")
      .eq("id", momentId)
      .single();
    if (error) throw new Error(error.message);
    return normalizeMoment(data as Moment);
  }

  if (used.size >= MAX_FAVORITE_MOMENTS) {
    throw new Error("You can pin up to 3 favorite moments. Unpin one first.");
  }

  let nextRank = 1;
  while (used.has(nextRank) && nextRank <= MAX_FAVORITE_MOMENTS) {
    nextRank += 1;
  }

  const { data, error } = await supabase
    .from("moments")
    .update({ favorite_rank: nextRank })
    .eq("id", momentId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeMoment(data as Moment);
}
