"use client";

import Link from "next/link";
import { BrainLogo } from "@/app/components/Brain-logo";

export default function Footer() {
  return (
    <footer
      className="glass-nav-footer fixed bottom-0 left-0 right-0 z-50 border-t border-white/15 pb-[env(safe-area-inset-bottom)]"
      role="contentinfo"
    >
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="flex items-center space-x-2">
            <BrainLogo withText={false} className="h-6 w-6 text-[#00ccff]" />
            <span className="bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-sm font-semibold uppercase tracking-wide text-transparent">
              Braindance
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            <Link
              href="/policy"
              className="text-sm text-white/65 transition-colors hover:text-[#00ccff]"
            >
              Policy
            </Link>
            <Link
              href="/feedback"
              className="text-sm text-white/65 transition-colors hover:text-[#ff00f7]"
            >
              Feedback
            </Link>
            <Link
              href="/contact"
              className="text-sm text-white/65 transition-colors hover:text-[#3700ff]"
            >
              Contact
            </Link>
          </div>

          <p className="text-center text-xs text-[#7a7a7a] sm:text-right">
            © {new Date().getFullYear()} Braindance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
