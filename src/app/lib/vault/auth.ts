import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/app/lib/auth/jwt";

/** Resolve signed-in user from auth_token cookie; null if missing/invalid. */
export async function getVaultUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return verifyAuthToken(token).userId;
  } catch {
    return null;
  }
}
