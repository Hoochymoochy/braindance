"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 pb-[env(safe-area-inset-bottom)]"
      style={{
        background: `linear-gradient(
          0deg,
          rgba(255, 255, 255, 0.92) 0%,
          rgba(248, 248, 252, 0.88) 50%,
          rgba(240, 240, 245, 0.85) 100%
        )`,
        backdropFilter: "blur(18px) saturate(1.1)",
        WebkitBackdropFilter: "blur(18px) saturate(1.1)",
        boxShadow: `0 0 40px rgba(0, 204, 255, 0.04),
          inset 0 1px 0 rgba(0, 0, 0, 0.06)`,
      }}
      role="contentinfo"
    >
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 sm:justify-start">
            <Link
              href="/policy"
              className="text-sm text-zinc-600 transition-colors duration-bends-fast ease-bends hover:text-[#00ccff]"
            >
              Policy
            </Link>
            <Link
              href="/feedback"
              className="text-sm text-zinc-600 transition-colors duration-bends-fast ease-bends hover:text-[#ff00f7]"
            >
              Feedback
            </Link>
            <Link
              href="/contact"
              className="text-sm text-zinc-600 transition-colors duration-bends-fast ease-bends hover:text-[#3700ff]"
            >
              Contact
            </Link>
          </div>

          <p className="text-center text-xs text-[#7a7a7a] sm:text-right">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}