"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import AppSettingsMenu from "@/app/components/AppSettingsMenu";
import StreamMobileBack from "@/app/components/StreamMobileBack";
import { usePastHomeHero } from "@/app/lib/hooks/usePastHomeHero";
import { cn } from "@/lib/utils";

function isDashboardPath(pathname: string): boolean {
  return /\/host\/[^/]+\/dashboard(?:\/|$)/.test(pathname);
}

function isStreamSetPath(pathname: string): boolean {
  return /^\/stream\/[^/]+$/.test(pathname);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showMobileFooter = isDashboardPath(pathname);
  const isHome = pathname === "/";
  const showStreamBack = isStreamSetPath(pathname);
  const pastHero = usePastHomeHero();
  const hideMobileSettings = isHome && !pastHero;

  return (
    <>
      <Header />
      {showStreamBack ? <StreamMobileBack /> : null}
      <AppSettingsMenu
        className={cn(
          "fixed right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-50 transition-[transform,opacity] duration-bends ease-bends md:hidden",
          hideMobileSettings
            ? "pointer-events-none -translate-y-3 opacity-0"
            : "translate-y-0 opacity-100"
        )}
        aria-hidden={hideMobileSettings}
        inert={hideMobileSettings ? true : undefined}
      />
      <main
        className={cn(
          "min-h-svh",
          isHome
            ? "pt-0"
            : "pt-0 md:pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px))]",
          showMobileFooter
            ? "pb-[calc(var(--nav-footer-h)+env(safe-area-inset-bottom,0px))]"
            : "pb-[env(safe-area-inset-bottom,0px)] md:pb-[calc(var(--nav-footer-h)+env(safe-area-inset-bottom,0px))]"
        )}
      >
        {children}
      </main>
      <Footer showOnMobile={showMobileFooter} />
    </>
  );
}
