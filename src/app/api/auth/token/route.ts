import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  signAuthToken,
} from "@/app/lib/auth/jwt";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase env vars are not configured");
  }
  return createClient(url, anonKey);
}

/** Exchange a Supabase access token for an httpOnly app JWT cookie. */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 401 });
    }

    const supabase = getSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json(
        { error: error?.message || "Invalid session" },
        { status: 401 }
      );
    }

    const token = signAuthToken({ userId: user.id });
    const response = NextResponse.json({ ok: true, userId: user.id });
    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to issue token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Clear the auth JWT cookie (logout). */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...authCookieOptions,
    maxAge: 0,
  });
  return response;
}
