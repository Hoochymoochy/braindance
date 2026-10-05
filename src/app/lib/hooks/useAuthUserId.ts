"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/utils/supabaseClient";

/** Resolves the logged-in Supabase user id on public pages (null if logged out). */
export function useAuthUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setUserId(data.session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return userId;
}
