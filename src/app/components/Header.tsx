"use client";

import { usePathname } from "next/navigation";
import BraindanceBrandLink from "@/app/components/BraindanceBrandLink";
import ProfileNavLink from "@/app/components/ProfileNavLink";
import { SetsSearchField } from "@/app/components/dj-sets/SetsSearchField";
import {
  scrollToCurrentDjSets,
  useHomeSearch,
} from "@/app/components/dj-sets/HomeSearchContext";
import { RandomSetButton } from "@/app/components/dj-sets/RandomSetButton";
import {
  homeHeaderChromeClass,
  useHomeHeaderSolid,
} from "@/app/lib/hooks/useHomeHeaderSolid";
import { cn } from "@/lib/utils";

function isStreamWatchPath(pathname: string): boolean {
  return /^\/stream\/[^/]+\/?$/.test(pathname);
}

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isStreamWatch = isStreamWatchPath(pathname);
  const { query, setQuery } = useHomeSearch();
  const solid = useHomeHeaderSolid();

  return (
    <header
      className={cn(homeHeaderChromeClass(solid), "hidden md:block")}
      role="banner"
      data-header-solid={solid ? "true" : "false"}
    >
      <div className="container mx-auto grid h-[4.25rem] grid-cols-[9.5rem_minmax(0,1fr)_auto] items-center gap-4 px-4 md:h-[4.75rem]">
        <div className="flex justify-start">
          <BraindanceBrandLink className="shrink-0" />
        </div>

        <div className="flex min-w-0 justify-center">
          {isHome ? (
            <div className="w-full max-w-md">
              <SetsSearchField
                value={query}
                onChange={setQuery}
                onClear={() => setQuery("")}
                onSubmit={scrollToCurrentDjSets}
                className="max-w-none"
              />
            </div>
          ) : isStreamWatch ? (
            <RandomSetButton size="header" />
          ) : (
            <div className="w-full max-w-md" aria-hidden />
          )}
        </div>

        <div className="flex items-center justify-end gap-5">
          <ProfileNavLink placement="header" className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
