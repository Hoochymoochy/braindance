"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SetsSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
};

export function SetsSearchField({
  value,
  onChange,
  onClear,
  className,
}: SetsSearchFieldProps) {
  return (
    <label
      className={cn(
        "search-shine relative block w-full min-w-0 max-w-md",
        className
      )}
    >
      <span className="search-shine-ring" aria-hidden />
      <span className="sr-only">Search DJ sets</span>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-500"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search all sets…"
        className="relative z-[1] w-full rounded-full border border-white/10 bg-black py-2.5 pl-11 pr-11 text-sm text-zinc-100 outline-none transition-[border-color,box-shadow] ease-bends placeholder:text-zinc-500 focus:border-transparent"
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:text-zinc-200"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </label>
  );
}
