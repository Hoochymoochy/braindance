"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { cn } from "@/lib/utils";

function isDashboardPath(pathname: string): boolean {
  return /\/host\/[^/]+\/dashboard(?:\/|$)/.test(pathname);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showMobileFooter = isDashboardPath(pathname);

  return (
    <>
      <Header />
      <main
        className={cn(
          "min-h-svh pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px))]",
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
