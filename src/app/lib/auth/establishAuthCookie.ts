import { supabase } from "@/app/lib/utils/supabaseClient";
import { ensureProfileForCurrentUser } from "@/app/lib/profile/profile";

/** After Supabase sign-in/up, ensure profile row + mint httpOnly app JWT cookie. */
export async function establishAuthCookie(): Promise<void> {
  await ensureProfileForCurrentUser();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error(error?.message || "No active session to authorize");
  }

  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Failed to create auth token");
  }
}
