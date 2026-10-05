"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import AppSettingsMenu from "@/app/components/AppSettingsMenu";
import BraindanceBrandLink from "@/app/components/BraindanceBrandLink";
import { usePastHomeHero } from "@/app/lib/hooks/usePastHomeHero";
import { useLockBodyScroll } from "@/app/lib/hooks/useLockBodyScroll";
import { cn } from "@/lib/utils";

function isDashboardPath(pathname: string): boolean {
  return /\/host\/[^/]+\/dashboard(?:\/|$)/.test(pathname);
}

/** Public stream watch page (`/stream/:id`), not photo-upload etc. */
function isStreamWatchPath(pathname: string): boolean {
  return /^\/stream\/[^/]+\/?$/.test(pathname);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showMobileFooter = isDashboardPath(pathname);
  const isHome = pathname === "/";
  const isStreamWatch = isStreamWatchPath(pathname);
  const pastHero = usePastHomeHero();
  const hideMobileSettings = isHome && !pastHero;

  const [isMobileViewport, setIsMobileViewport] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobileViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Lock document on mobile stream — no overflow:auto parent (that still bounces in Safari).
  useLockBodyScroll(isStreamWatch && isMobileViewport);

  return (
    <>
      <Header />
      <header
        className={cn(
          "glass-nav-header fixed left-0 right-0 top-0 z-50 border-b pt-[env(safe-area-inset-top)] transition-[transform,opacity] duration-bends ease-bends md:hidden",
          hideMobileSettings
            ? "pointer-events-none -translate-y-full opacity-0"
            : "translate-y-0 opacity-100"
        )}
        aria-hidden={hideMobileSettings}
        inert={hideMobileSettings ? true : undefined}
        role="banner"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <BraindanceBrandLink className="min-w-0" />
          <AppSettingsMenu menuPlacement="mobile" />
        </div>
      </header>
      <main
        className={cn(
          isStreamWatch
            ? cn(
                // Mobile: true fixed viewport, overflow hidden (not auto — Safari bounces auto).
                "max-lg:fixed max-lg:inset-0 max-lg:z-40 max-lg:flex max-lg:flex-col max-lg:overflow-hidden max-lg:overscroll-none max-lg:touch-none",
                "max-lg:pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px))] max-lg:pb-[env(safe-area-inset-bottom,0px)]",
                "md:min-h-svh md:pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px))] md:pb-[calc(var(--nav-footer-h)+env(safe-area-inset-bottom,0px))]"
              )
            : cn(
                "min-h-svh",
                isHome
                  ? "pt-0"
                  : "pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px)+1.25rem)] md:pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px))]",
                showMobileFooter
                  ? "pb-[calc(var(--nav-footer-h)+env(safe-area-inset-bottom,0px))]"
                  : "pb-[env(safe-area-inset-bottom,0px)] md:pb-[calc(var(--nav-footer-h)+env(safe-area-inset-bottom,0px))]"
              )
        )}
      >
        <div
          className={cn(
            isStreamWatch && "max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col max-lg:overflow-hidden"
          )}
        >
          {children}
        </div>
      </main>
      <Footer showOnMobile={showMobileFooter} />
    </>
  );
}
