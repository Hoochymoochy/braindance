import { supabase } from "@/app/lib/utils/supabaseClient";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  created_at: string;
};

function usernameFromUser(user: {
  id: string;
  email?: string | null;
}): { username: string; display_name: string } {
  const local =
    user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "_") || "user";
  // Suffix keeps username unique even if email local-part collides.
  const username = `${local}_${user.id.replace(/-/g, "").slice(0, 8)}`;
  return { username, display_name: local };
}

/**
 * Ensures a `profiles` row exists for the signed-in Auth user.
 * Moments/crates FK `user_id` → `profiles.id`, so Auth alone is not enough.
 */
export async function ensureProfileForCurrentUser(): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw userError ?? new Error("Not signed in");
  }

  const existing = await getProfile(user.id);
  if (existing) return user.id;

  const { username, display_name } = usernameFromUser(user);

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
      display_name,
    },
    { onConflict: "id" }
  );

  if (error) throw new Error(error.message);
  return user.id;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, created_at")
    .eq("username", username)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export function profileSharePath(username: string): string {
  return `/u/${encodeURIComponent(username)}`;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, "display_name" | "bio">>
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);

  if (error) throw new Error(error.message);
}
