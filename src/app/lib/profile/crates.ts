import { supabase } from "@/app/lib/utils/supabaseClient";
import { ensureProfileForCurrentUser } from "@/app/lib/profile/profile";

export type Crate = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type CrateSet = {
  id: string;
  crate_id: string;
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string | null;
  added_at: string;
};

export type CrateSetInput = {
  video_id: string;
  title: string;
  channel: string;
  thumbnail?: string | null;
};

export async function listCrates(userId: string): Promise<Crate[]> {
  const { data, error } = await supabase
    .from("crates")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export type CratePreview = Crate & {
  set_count: number;
  thumbnails: string[];
};

export async function listCratesWithPreviews(
  userId: string
): Promise<CratePreview[]> {
  const { data, error } = await supabase
    .from("crates")
    .select("*, crate_sets(thumbnail, video_id)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const { crate_sets: sets, ...crate } = row as Crate & {
      crate_sets: { thumbnail: string | null; video_id: string }[] | null;
    };
    const thumbnails = (sets ?? [])
      .map((s) => s.thumbnail)
      .filter((t): t is string => Boolean(t))
      .slice(0, 4);

    return {
      ...(crate as Crate),
      set_count: sets?.length ?? 0,
      thumbnails,
    };
  });
}


export async function getCrate(crateId: string): Promise<Crate | null> {
  const { data, error } = await supabase
    .from("crates")
    .select("*")
    .eq("id", crateId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createCrate(
  name: string,
  description = ""
): Promise<Crate> {
  const userId = await ensureProfileForCurrentUser();

  const { data, error } = await supabase
    .from("crates")
    .insert([{ user_id: userId, name, description }])
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCrate(
  crateId: string,
  patch: Partial<Pick<Crate, "name" | "description">>
): Promise<void> {
  const { error } = await supabase
    .from("crates")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", crateId);

  if (error) throw new Error(error.message);
}

export async function deleteCrate(crateId: string): Promise<void> {
  const { error } = await supabase.from("crates").delete().eq("id", crateId);
  if (error) throw new Error(error.message);
}

export async function listCrateSets(crateId: string): Promise<CrateSet[]> {
  const { data, error } = await supabase
    .from("crate_sets")
    .select("*")
    .eq("crate_id", crateId)
    .order("added_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addSetToCrate(
  crateId: string,
  set: CrateSetInput
): Promise<CrateSet> {
  const { data, error } = await supabase
    .from("crate_sets")
    .upsert(
      [
        {
          crate_id: crateId,
          video_id: set.video_id,
          title: set.title,
          channel: set.channel,
          thumbnail: set.thumbnail ?? null,
        },
      ],
      { onConflict: "crate_id,video_id" }
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("crates")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", crateId);

  return data;
}

export async function removeSetFromCrate(
  crateId: string,
  videoId: string
): Promise<void> {
  const { error } = await supabase
    .from("crate_sets")
    .delete()
    .eq("crate_id", crateId)
    .eq("video_id", videoId);

  if (error) throw new Error(error.message);
}
