"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function StreamMobileBack() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="glass-bends-card fixed left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-zinc-700 shadow-sm transition-[border-color,color,background-color] duration-bends-fast ease-bends hover:border-brand-from/40 hover:text-brand-from md:hidden dark:border-brand-from/30 dark:text-brand-from dark:hover:bg-brand-from/10"
    >
      <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden />
    </Link>
  );
}
