"use client";

import { usePathname } from "next/navigation";
import AppSettingsMenu from "@/app/components/AppSettingsMenu";
import BraindanceBrandLink from "@/app/components/BraindanceBrandLink";
import { SetsSearchField } from "@/app/components/dj-sets/SetsSearchField";
import {
  scrollToCurrentDjSets,
  useHomeSearch,
} from "@/app/components/dj-sets/HomeSearchContext";
import {
  homeHeaderChromeClass,
  useHomeHeaderSolid,
} from "@/app/lib/hooks/useHomeHeaderSolid";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { query, setQuery } = useHomeSearch();
  const solid = useHomeHeaderSolid();

  return (
    <header
      className={cn(homeHeaderChromeClass(solid), "hidden md:block")}
      role="banner"
      data-header-solid={solid ? "true" : "false"}
    >
      <div className="container mx-auto flex items-center gap-4 px-4 py-3 md:py-4">
        <BraindanceBrandLink className="shrink-0" />

        {isHome ? (
          <div className="mx-auto min-w-0 max-w-md flex-1">
            <SetsSearchField
              value={query}
              onChange={setQuery}
              onClear={() => setQuery("")}
              onSubmit={scrollToCurrentDjSets}
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
