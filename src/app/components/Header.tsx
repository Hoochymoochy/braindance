"use client";

import { usePathname } from "next/navigation";
import BraindanceBrandLink from "@/app/components/BraindanceBrandLink";
import ProfileNavLink from "@/app/components/ProfileNavLink";
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
      <div className="container mx-auto grid h-[4.25rem] grid-cols-[9.5rem_minmax(0,1fr)_9.5rem] items-center gap-4 px-4 md:h-[4.75rem]">
        <div className="flex justify-start">
          <BraindanceBrandLink className="shrink-0" />
        </div>

        <div className="flex min-w-0 justify-center">
          <div
            className={cn("w-full max-w-md", !isHome && "invisible")}
            aria-hidden={!isHome}
          >
            <SetsSearchField
              value={query}
              onChange={setQuery}
              onClear={() => setQuery("")}
              onSubmit={scrollToCurrentDjSets}
              className="max-w-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <ProfileNavLink placement="header" className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
