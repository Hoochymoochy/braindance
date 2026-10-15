import { ensureProfileForCurrentUser } from "@/app/lib/profile/profile";
import { syncAuthCookie } from "@/app/lib/auth/syncAuthCookie";

/** After Supabase sign-in/up, ensure profile row + mint httpOnly app JWT cookie. */
export async function establishAuthCookie(): Promise<void> {
  await ensureProfileForCurrentUser();

  const ok = await syncAuthCookie();
  if (!ok) {
    throw new Error("Failed to create auth token");
  }
}
