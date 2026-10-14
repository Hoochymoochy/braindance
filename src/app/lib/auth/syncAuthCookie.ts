import { supabase } from "@/app/lib/utils/supabaseClient";

/** Exchange the current Supabase access token for a fresh httpOnly app JWT cookie. */
export async function syncAuthCookie(
  accessToken?: string | null
): Promise<boolean> {
  let token = accessToken?.trim() || null;

  if (!token) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session?.access_token) return false;
    token = session.access_token;
  }

  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.ok;
}

/** Clear the app JWT cookie. */
export async function clearAuthCookie(): Promise<void> {
  await fetch("/api/auth/token", { method: "DELETE" });
}
