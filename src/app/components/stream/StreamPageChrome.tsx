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

type StreamPageChromeValue = {
  title: string | null;
  setTitle: (title: string | null) => void;
};

const StreamPageChromeContext = createContext<StreamPageChromeValue | null>(
  null
);

export function StreamPageChromeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [title, setTitleState] = useState<string | null>(null);
  const setTitle = useCallback((next: string | null) => {
    setTitleState(next);
  }, []);

  const value = useMemo(
    () => ({
      title,
      setTitle,
    }),
    [title, setTitle]
  );

  return (
    <StreamPageChromeContext.Provider value={value}>
      {children}
    </StreamPageChromeContext.Provider>
  );
}

export function useStreamPageTitle(): string | null {
  return useContext(StreamPageChromeContext)?.title ?? null;
}

/** Registers the set title in the app header while the stream page is mounted. */
export function useRegisterStreamPageTitle(title: string | null) {
  const chrome = useContext(StreamPageChromeContext);

  useEffect(() => {
    if (!chrome) return;
    chrome.setTitle(title);
    return () => chrome.setTitle(null);
  }, [chrome, title]);
}
