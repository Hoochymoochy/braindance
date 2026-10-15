"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type HomeBrandMergeContextValue = {
  /** True once the hero word has scrolled up to the header brand slot. */
  docked: boolean;
};

const HomeBrandMergeContext = createContext<HomeBrandMergeContextValue>({
  docked: true,
});

export function useHomeBrandMerge() {
  return useContext(HomeBrandMergeContext);
}

function visibleHeaderBrandSlot(): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>("[data-header-brand-text]");
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
}

export function HomeBrandMergeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [docked, setDocked] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setDocked(true);
      return;
    }

    setDocked(false);
    let raf = 0;
    let alive = true;

    const measure = () => {
      if (!alive) return;

      const heroBrand = document.getElementById("home-brand-placeholder");
      const slot = visibleHeaderBrandSlot();
      if (!heroBrand || !slot) return;

      // Natural page scroll only — dock the moment the hero word meets the header slot.
      const heroTop = heroBrand.getBoundingClientRect().top;
      const slotTop = slot.getBoundingClientRect().top;
      setDocked(heroTop <= slotTop + 0.5);
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [isHome]);

  const value = useMemo(
    () => ({ docked: !isHome || docked }),
    [docked, isHome]
  );

  return (
    <HomeBrandMergeContext.Provider value={value}>
      {children}
    </HomeBrandMergeContext.Provider>
  );
}

/** In-flow hero brand — scrolls with the page, then lands in the header. */
export function HomeBrandPlaceholder({ className }: { className?: string }) {
  const { docked } = useHomeBrandMerge();

  return (
    <p
      id="home-brand-placeholder"
      className={cn(
        "mb-8 text-[0.7rem] font-medium uppercase tracking-[0.42em] transition-opacity duration-bends-fast ease-bends",
        docked ? "text-transparent" : "text-zinc-500",
        className
      )}
      aria-hidden={docked}
    >
      Braindance
    </p>
  );
}
