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

type HomeSearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
};

const HomeSearchContext = createContext<HomeSearchContextValue | null>(null);

export function scrollToCurrentDjSets() {
  document
    .getElementById("current-dj-sets")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HomeSearchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (pathname !== "/") setQuery("");
  }, [pathname]);

  const value = useMemo(() => ({ query, setQuery }), [query]);

  return (
    <HomeSearchContext.Provider value={value}>
      {children}
    </HomeSearchContext.Provider>
  );
}

export function useHomeSearch(): HomeSearchContextValue {
  const ctx = useContext(HomeSearchContext);
  if (!ctx) {
    return { query: "", setQuery: () => {} };
  }
  return ctx;
}
