"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-zinc-700 transition-[border-color,color,background-color] duration-[480ms] ease-bends hover:border-brand-from/40 hover:text-brand-from dark:border-brand-from/30 dark:text-brand-from dark:hover:bg-brand-from/10"
    >
      <span className="relative h-4 w-4">
        <Sun
          className={`absolute inset-0 h-4 w-4 transition-opacity duration-[480ms] ease-bends ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        />
        <Moon
          className={`absolute inset-0 h-4 w-4 transition-opacity duration-[480ms] ease-bends ${
            isDark ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden
        />
      </span>
    </button>
  );
}
