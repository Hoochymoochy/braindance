"use client";

import Link from "next/link";
import { BrainLogo } from "@/app/components/Brain-logo";

export default function Header() {
  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/15 pt-[env(safe-area-inset-top)]"
      style={{
        background: `linear-gradient(
          180deg,
          rgba(0, 0, 0, 0.28) 0%,
          rgba(55, 0, 255, 0.1) 45%,
          rgba(0, 204, 255, 0.07) 100%
        )`,
        backdropFilter: "blur(18px) saturate(1.1)",
        WebkitBackdropFilter: "blur(18px) saturate(1.1)",
        boxShadow: `0 0 40px rgba(55, 0, 255, 0.06),
          inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
      }}
      role="banner"
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-3 md:flex-row md:gap-0 md:py-4">
        <Link
          href="/"
          className="flex items-center space-x-2 transition-opacity duration-bends-fast ease-bends hover:opacity-90"
        >
          <BrainLogo withText={false} className="h-6 w-6 text-[#00ccff]" />
          <span className="bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-sm font-semibold uppercase tracking-wide text-transparent">
            Braindance
          </span>
        </Link>

        <nav className="flex items-center space-x-8 text-sm" aria-label="Primary">
          <Link
            href="/"
            className="text-white/90 transition-colors duration-bends-fast ease-bends hover:text-[#00ccff]"
          >
            Home
          </Link>
          <Link
            href="/events"
            className="text-white/90 transition-colors duration-bends-fast ease-bends hover:text-[#ff00f7]"
          >
            Events
          </Link>
        </nav>
      </div>
    </header>
  );
}