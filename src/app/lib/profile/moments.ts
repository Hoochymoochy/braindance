import { supabase } from "@/app/lib/utils/supabaseClient";
import { timestampToSeconds } from "@/app/lib/utils/timestamp";
import { ensureProfileForCurrentUser } from "@/app/lib/profile/profile";

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

export type MomentSetGroup = {
  video_id: string;
  set_title: string;
  moments: Moment[];
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
      latest_created_at: latest.created_at,
    });
  }

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
  return (data ?? []) as Moment[];
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
  return (data ?? []) as Moment[];
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
  return data as Moment;
}

export async function deleteMoment(momentId: string): Promise<void> {
  const { error } = await supabase.from("moments").delete().eq("id", momentId);
  if (error) throw new Error(error.message);
}
