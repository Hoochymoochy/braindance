import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/app/lib/auth/jwt";
import { getOrGenerateListenerProfile } from "@/app/lib/listener-profile";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId")?.trim();
    const forceRefresh =
      searchParams.get("force") === "true" ||
      searchParams.get("refresh") === "true";

    if (!userId) {
      const cookieStore = await cookies();
      const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
      if (token) {
        try {
          const session = verifyAuthToken(token);
          userId = session.userId;
        } catch {
          // Token invalid
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Missing user identity. Sign in or provide a ?userId=<id> parameter.",
        },
        { status: 401 }
      );
    }

    const profile = await getOrGenerateListenerProfile({
      userId,
      forceRefresh,
    });

    return NextResponse.json(profile, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to calculate archetype";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

