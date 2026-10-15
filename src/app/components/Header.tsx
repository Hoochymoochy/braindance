"use client";

import { usePathname } from "next/navigation";
import AppSettingsMenu from "@/app/components/AppSettingsMenu";
import BraindanceBrandLink from "@/app/components/BraindanceBrandLink";
import { SetsSearchField } from "@/app/components/dj-sets/SetsSearchField";
import { useHomeSearch } from "@/app/components/dj-sets/HomeSearchContext";
import { usePastHomeHero } from "@/app/lib/hooks/usePastHomeHero";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const pastHero = usePastHomeHero();
  const hidden = isHome && !pastHero;
  const { query, setQuery } = useHomeSearch();

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
      <div className="container mx-auto flex items-center gap-4 px-4 py-3 md:py-4">
        <BraindanceBrandLink className="shrink-0" />

        {isHome ? (
          <div className="mx-auto min-w-0 flex-1 max-w-md">
            <SetsSearchField
              value={query}
              onChange={setQuery}
              onClear={() => setQuery("")}
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <AppSettingsMenu menuPlacement="header" className="shrink-0" />
      </div>
    </header>
  );
}
