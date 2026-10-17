"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import AuthSessionSync from "@/app/components/AuthSessionSync";
import BraindanceBrandLink from "@/app/components/BraindanceBrandLink";
import ProfileNavLink from "@/app/components/ProfileNavLink";
import {
  HomeSearchProvider,
  scrollToCurrentDjSets,
  useHomeSearch,
} from "@/app/components/dj-sets/HomeSearchContext";
import { SetsSearchField } from "@/app/components/dj-sets/SetsSearchField";
import {
  StreamPageChromeProvider,
  useStreamPageTitle,
} from "@/app/components/stream/StreamPageChrome";
import { useLockBodyScroll } from "@/app/lib/hooks/useLockBodyScroll";
import {
  homeHeaderChromeClass,
  useHomeHeaderSolid,
} from "@/app/lib/hooks/useHomeHeaderSolid";
import { cn } from "@/lib/utils";

function isProfilePath(pathname: string): boolean {
  return pathname === "/profile" || pathname.startsWith("/profile/");
}

/** Public stream watch page (`/stream/:id`), not photo-upload etc. */
function isStreamWatchPath(pathname: string): boolean {
  return /^\/stream\/[^/]+\/?$/.test(pathname);
}

function MobileHeader({
  isHome,
  isStreamWatch,
}: {
  isHome: boolean;
  isStreamWatch: boolean;
}) {
  const { query, setQuery } = useHomeSearch();
  const solid = useHomeHeaderSolid();
  const streamTitle = useStreamPageTitle();

  return (
    <header
      className={cn(homeHeaderChromeClass(solid), "md:hidden")}
      role="banner"
      data-header-solid={solid ? "true" : "false"}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <BraindanceBrandLink variant="icon" className="size-11" />
        {isHome ? (
          <SetsSearchField
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
            onSubmit={scrollToCurrentDjSets}
            className="max-w-none flex-1"
          />
        ) : isStreamWatch && streamTitle ? (
          <h1 className="min-w-0 flex-1 truncate text-center text-sm font-bold leading-tight tracking-tight text-gradient-bends">
            {streamTitle}
          </h1>
        ) : (
          <div className="min-w-0 flex-1" aria-hidden />
        )}
        <ProfileNavLink
          placement="mobile"
          variant="icon"
          className="size-11"
        />
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isProfile = isProfilePath(pathname);
  const isHome = pathname === "/";
  const isLogin = pathname === "/login";
  const isStreamWatch = isStreamWatchPath(pathname);

  // Match header chrome breakpoint (`md` = 768px), not `lg`.
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLockBodyScroll((isStreamWatch || isLogin) && isMobileViewport);

  return (
    <HomeSearchProvider>
      <StreamPageChromeProvider>
        <AuthSessionSync />
        <Header />
        <MobileHeader isHome={isHome} isStreamWatch={isStreamWatch} />
        <main
          className={cn(
            isLogin ? "flex h-svh flex-col overflow-hidden" : "min-h-svh",
            isHome
              ? "pt-0"
              : "pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px)+1.25rem)] md:pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px))]",
            isProfile
              ? "pb-[env(safe-area-inset-bottom,0px)]"
              : "pb-[env(safe-area-inset-bottom,0px)] md:pb-[calc(var(--nav-footer-h)+env(safe-area-inset-bottom,0px))]",
            // Stream mobile: contain overscroll without a fixed fullscreen shell (that broke layout).
            isStreamWatch &&
              "max-md:overflow-x-hidden max-md:overscroll-none"
          )}
        >
          {children}
        </main>
        {isProfile ? null : <Footer />}
      </StreamPageChromeProvider>
    </HomeSearchProvider>
  );
}
