"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { isAdminEmail } from "@/app/lib/shop/config";
import { supabase } from "@/app/lib/utils/supabaseClient";

type GateState = "loading" | "need-login" | "forbidden" | "ok";

export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;

      if (error || !data.user) {
        setState("need-login");
        return;
      }

      const userEmail = data.user.email ?? null;
      setEmail(userEmail);
      setState(isAdminEmail(userEmail) ? "ok" : "forbidden");
    }

    void check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void check();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="container mx-auto px-4 py-24 text-center text-sm text-zinc-500">
        Checking access…
      </div>
    );
  }

  if (state === "need-login") {
    return (
      <div className="container mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Admin sign-in
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Log in with your admin email to manage merch.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white dark:bg-brand-from dark:text-zinc-950"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="container mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          No access
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {email ?? "This account"} isn&apos;t on the admin allowlist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm font-medium text-brand-via hover:underline"
        >
          Back home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
