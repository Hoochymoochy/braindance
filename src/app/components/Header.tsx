"use client";

import { usePathname } from "next/navigation";
import AppSettingsMenu from "@/app/components/AppSettingsMenu";
import BraindanceBrandLink from "@/app/components/BraindanceBrandLink";
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
        <BraindanceBrandLink />

        <AppSettingsMenu menuPlacement="header" />
      </div>
    </header>
  );
}
