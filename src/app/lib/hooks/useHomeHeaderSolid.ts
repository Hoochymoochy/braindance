"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const SCROLL_SOLID_PX = 12;

/**
 * Home: transparent / blended with the hero until the user scrolls.
 * Other routes: always solid chrome.
 */
export function useHomeHeaderSolid(): boolean {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }

    const sync = () => {
      setScrolled(window.scrollY > SCROLL_SOLID_PX);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [isHome]);

  return !isHome || scrolled;
}

/** Shared fixed-header chrome classes for desktop + mobile. */
export function homeHeaderChromeClass(solid: boolean): string {
  return [
    "fixed left-0 right-0 top-0 z-50 pt-[env(safe-area-inset-top)]",
    "transition-[background,border-color,box-shadow,backdrop-filter] duration-bends ease-bends",
    solid
      ? "glass-nav-header border-b"
      : "border-b border-transparent bg-transparent shadow-none backdrop-blur-none",
  ].join(" ");
}
