"use client";

import Link from "next/link";
import { BrainLogo } from "@/app/components/Brain-logo";

export default function Header() {
  return (
    <header
      className="glass-nav fixed left-0 right-0 top-0 z-50 border-b border-white/15 pt-[env(safe-area-inset-top)]"
      role="banner"
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-3 md:flex-row md:gap-0 md:py-4">
        <Link
          href="/"
          className="flex items-center space-x-2 transition-opacity hover:opacity-90"
        >
          <BrainLogo withText={false} className="h-6 w-6 text-[#00ccff]" />
          <span className="bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-sm font-semibold uppercase tracking-wide text-transparent">
            Braindance
          </span>
        </Link>

        <nav className="flex items-center space-x-8 text-sm" aria-label="Primary">
          <Link
            href="/"
            className="text-white/90 transition-colors hover:text-[#00ccff]"
          >
            Home
          </Link>
          <Link
            href="/events"
            className="text-white/90 transition-colors hover:text-[#ff00f7]"
          >
            Events
          </Link>
        </nav>
      </div>
    </header>
  );
}
