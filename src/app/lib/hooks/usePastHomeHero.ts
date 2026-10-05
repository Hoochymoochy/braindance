"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** True once `#home-hero` has scrolled out of view; always true off the home page. */
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
        { threshold: 0 }
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
