"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="container mx-auto px-4 py-20 md:py-28">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500">
          Order
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Thanks — payment received
        </h1>
        <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
          You&apos;ll get a receipt by email.
        </p>
        {sessionId ? (
          <p className="mt-6 break-all border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
            {sessionId}
          </p>
        ) : null}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-brand-from dark:text-zinc-950 dark:hover:bg-brand-via"
          >
            Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ShopSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-28 text-center text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
