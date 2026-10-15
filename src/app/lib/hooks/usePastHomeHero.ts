"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * True once `#home-hero` has mostly scrolled away (header can show).
 * Always true off the home page.
 *
 * Uses a shortened observer root so the header appears before the full
 * hero leaves the viewport — roughly once you've cleared the upper half.
 */
export function usePastHomeHero(): boolean {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [pastHero, setPastHero] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setPastHero(true);
      return;
    }

    setPastHero(false);
    let observer: IntersectionObserver | null = null;
    let raf = 0;

    const attach = () => {
      const hero = document.getElementById("home-hero");
      if (!hero) {
        raf = requestAnimationFrame(attach);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          setPastHero(!entry.isIntersecting);
        },
        {
          threshold: 0,
          // Only the top ~40% of the viewport counts — header shows sooner.
          rootMargin: "0px 0px -60% 0px",
        }
      );
      observer.observe(hero);
    };

    attach();

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [isHome]);

  return pastHero;
}
