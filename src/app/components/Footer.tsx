"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Footer({ showOnMobile = false }: { showOnMobile?: boolean }) {
  return (
    <footer
      className={cn(
        "glass-nav-footer fixed bottom-0 left-0 right-0 z-50 border-t pb-[env(safe-area-inset-bottom)]",
        showOnMobile ? "block" : "hidden md:block"
      )}
      role="contentinfo"
    >
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 sm:justify-start">
            <Link
              href="/feedback"
              className="text-sm text-zinc-600 transition-colors duration-bends-fast ease-bends hover:text-brand-via"
            >
              Feedback
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
