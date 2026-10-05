import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/app/lib/auth/jwt";

/** Reads and verifies the auth JWT cookie. Redirects to /login if missing/invalid. */
export async function requireUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const { userId } = verifyAuthToken(token);
    return userId;
  } catch {
    redirect("/login");
  }
}
