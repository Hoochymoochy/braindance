"use client";

import { usePathname } from "next/navigation";
import AppSettingsMenu from "@/app/components/AppSettingsMenu";
import BraindanceBrandLink from "@/app/components/BraindanceBrandLink";
import { SetsSearchField } from "@/app/components/dj-sets/SetsSearchField";
import { useHomeSearch } from "@/app/components/dj-sets/HomeSearchContext";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { query, setQuery } = useHomeSearch();

  return (
    <header
      className="glass-nav-header fixed left-0 right-0 top-0 z-50 hidden border-b pt-[env(safe-area-inset-top)] md:block"
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
