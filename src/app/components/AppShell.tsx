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

function isProfilePath(pathname: string): boolean {
  return pathname === "/profile" || pathname.startsWith("/profile/");
}

/** Public stream watch page (`/stream/:id`), not photo-upload etc. */
function isStreamWatchPath(pathname: string): boolean {
  return /^\/stream\/[^/]+\/?$/.test(pathname);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showMobileFooter = isProfilePath(pathname);
  const isHome = pathname === "/";
  const isStreamWatch = isStreamWatchPath(pathname);
  const pastHero = usePastHomeHero();
  const hideMobileSettings = isHome && !pastHero;

  // Match header chrome breakpoint (`md` = 768px), not `lg`.
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
          "min-h-svh",
          isHome
            ? "pt-0"
            : "pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px)+1.25rem)] md:pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px))]",
          showMobileFooter
            ? "pb-[calc(var(--nav-footer-h)+env(safe-area-inset-bottom,0px))]"
            : "pb-[env(safe-area-inset-bottom,0px)] md:pb-[calc(var(--nav-footer-h)+env(safe-area-inset-bottom,0px))]",
          // Stream mobile: contain overscroll without a fixed fullscreen shell (that broke layout).
          isStreamWatch &&
            "max-md:overflow-x-hidden max-md:overscroll-none"
        )}
      >
        {children}
      </main>
      <Footer showOnMobile={showMobileFooter} />
    </>
  );
}
