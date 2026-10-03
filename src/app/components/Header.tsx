"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainLogo } from "@/app/components/Brain-logo";
import ThemeToggle from "@/app/components/ThemeToggle";
import { cn } from "@/lib/utils";

export default function Header() {
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

  const hidden = isHome && !pastHero;

  return (
    <header
      className={cn(
        "glass-nav-header fixed left-0 right-0 top-0 z-50 border-b pt-[env(safe-area-inset-top)] transition-[transform,opacity] duration-bends ease-bends",
        hidden
          ? "pointer-events-none -translate-y-full opacity-0"
          : "translate-y-0 opacity-100"
      )}
      aria-hidden={hidden}
      inert={hidden ? true : undefined}
      role="banner"
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-3 md:flex-row md:gap-0 md:py-4">
        <Link
          href="/"
          className="flex items-center space-x-2 transition-opacity duration-bends-fast ease-bends hover:opacity-90"
        >
          <BrainLogo withText={false} className="h-6 w-6 text-brand-from" />
          <span className="text-gradient-bends text-sm font-semibold uppercase tracking-wide">
            Braindance
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="flex items-center space-x-8 text-sm" aria-label="Primary">
            <Link
              href="/"
              className="text-zinc-700 transition-colors duration-bends-fast ease-bends hover:text-brand-from"
            >
              Home
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
