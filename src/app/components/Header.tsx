"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainLogo } from "@/app/components/Brain-logo";
import AppSettingsMenu from "@/app/components/AppSettingsMenu";
import { usePastHomeHero } from "@/app/lib/hooks/usePastHomeHero";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const pastHero = usePastHomeHero();
  const hidden = isHome && !pastHero;

  return (
    <header
      className={cn(
        "glass-nav-header fixed left-0 right-0 top-0 z-50 hidden border-b pt-[env(safe-area-inset-top)] transition-[transform,opacity] duration-bends ease-bends md:block",
        hidden
          ? "pointer-events-none -translate-y-full opacity-0"
          : "translate-y-0 opacity-100"
      )}
      aria-hidden={hidden}
      inert={hidden ? true : undefined}
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

        <AppSettingsMenu />
      </div>
    </header>
  );
}
