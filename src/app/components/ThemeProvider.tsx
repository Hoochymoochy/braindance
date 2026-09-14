"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "theme";
const THEME_FADE_MS = 480;

const ThemeContext = createContext<ThemeContextValue | null>(null);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function fadeToTheme(theme: Theme) {
  const root = document.documentElement;
  const apply = () => applyThemeClass(theme);

  if (prefersReducedMotion()) {
    apply();
    return;
  }

  const doc = document as Document & {
    startViewTransition?: (update: () => void) => { finished: Promise<void> };
  };

  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(apply);
    return;
  }

  root.classList.add("theme-animating");
  apply();
  window.setTimeout(() => {
    root.classList.remove("theme-animating");
  }, THEME_FADE_MS);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next: Theme =
      stored === "dark" || stored === "light"
        ? stored
        : document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";
    setThemeState(next);
    applyThemeClass(next);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      if (next === theme) return;
      setThemeState(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      fadeToTheme(next);
    },
    [theme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  return (
    ctx ?? {
      theme: "light" as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    }
  );
}
