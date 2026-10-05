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

export async function listMoments(userId: string): Promise<Moment[]> {
  const { data, error } = await supabase
    .from("moments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
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
  return data;
}

export async function deleteMoment(momentId: string): Promise<void> {
  const { error } = await supabase.from("moments").delete().eq("id", momentId);
  if (error) throw new Error(error.message);
}
