"use client";

import Link from "next/link";
import { BrainLogo } from "@/app/components/Brain-logo";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function Header() {
  return (
    <header
      className="glass-nav-header fixed left-0 right-0 top-0 z-50 border-b pt-[env(safe-area-inset-top)]"
      role="banner"
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-3 md:flex-row md:gap-0 md:py-4">
        <Link
          href="/"
          className="flex items-center space-x-2 transition-opacity duration-bends-fast ease-bends hover:opacity-90"
        >
          <BrainLogo withText={false} className="h-6 w-6 text-brand-from" />
          <span className="text-gradient-bends text-sm font-semibold uppercase tracking-wide">
            Braindance
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="flex items-center space-x-8 text-sm" aria-label="Primary">
            <Link
              href="/"
              className="text-zinc-700 transition-colors duration-bends-fast ease-bends hover:text-brand-from"
            >
              Home
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
