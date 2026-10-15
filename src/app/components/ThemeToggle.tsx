"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";
import { cn } from "@/lib/utils";

export default function ThemeToggle({
  variant = "default",
  className,
}: {
  variant?: "default" | "ghost";
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";
  const isGhost = variant === "ghost";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex items-center justify-center transition-[border-color,color,background-color] ease-bends",
        isGhost
          ? "h-7 w-7 text-zinc-400 duration-bends-fast hover:text-zinc-700 dark:hover:text-brand-from"
          : "h-9 w-9 rounded-full border border-black/10 text-zinc-700 duration-[480ms] hover:border-brand-from/40 hover:text-brand-from dark:border-brand-from/30 dark:text-brand-from dark:hover:bg-brand-from/10",
        className
      )}
    >
      <span className={cn("relative", isGhost ? "h-3.5 w-3.5" : "h-4 w-4")}>
        <Sun
          className={cn(
            "absolute inset-0 transition-opacity ease-bends",
            isGhost ? "h-3.5 w-3.5 duration-bends-fast" : "h-4 w-4 duration-[480ms]",
            isDark ? "opacity-100" : "opacity-0"
          )}
          aria-hidden
        />
        <Moon
          className={cn(
            "absolute inset-0 transition-opacity ease-bends",
            isGhost ? "h-3.5 w-3.5 duration-bends-fast" : "h-4 w-4 duration-[480ms]",
            isDark ? "opacity-0" : "opacity-100"
          )}
          aria-hidden
        />
      </span>
    </button>
  );
}
