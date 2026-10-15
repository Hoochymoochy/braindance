"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/app/lib/utils/supabaseClient";
import {
  clearAuthCookie,
  syncAuthCookie,
} from "@/app/lib/auth/syncAuthCookie";

/** Re-mint the httpOnly app JWT while the Supabase session is still valid. */
const REEXCHANGE_INTERVAL_MS = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Keeps `auth_token` in sync with the Supabase session so API routes that
 * read the cookie stay authorized until the Supabase refresh token expires.
 */
export default function AuthSessionSync() {
  const syncingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const exchange = async (accessToken?: string | null) => {
      if (cancelled || syncingRef.current) return;
      syncingRef.current = true;
      try {
        await syncAuthCookie(accessToken);
      } catch {
        /* never block the app on cookie sync */
      } finally {
        syncingRef.current = false;
      }
    };

    void exchange();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        void clearAuthCookie();
        return;
      }
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "INITIAL_SESSION" ||
        event === "USER_UPDATED"
      ) {
        void exchange(session?.access_token);
      }
    });

    const intervalId = setInterval(() => {
      void exchange();
    }, REEXCHANGE_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void exchange();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
