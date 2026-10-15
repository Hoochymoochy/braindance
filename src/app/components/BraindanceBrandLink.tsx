"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

type BraindanceBrandLinkProps = {
  className?: string;
  /** `label` = “Braindance” wordmark; `icon` = brain mark for compact chrome. */
  variant?: "label" | "icon";
};

export default function BraindanceBrandLink({
  className,
  variant = "label",
}: BraindanceBrandLinkProps) {
  if (variant === "icon") {
    return (
      <Link
        href="/"
        aria-label="Braindance home"
        title="Braindance"
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center text-zinc-400 transition-colors duration-bends-fast ease-bends hover:text-zinc-700 dark:hover:text-brand-from",
          className
        )}
      >
        <Brain className="h-4 w-4" aria-hidden />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={cn(
        "transition-opacity duration-bends-fast ease-bends hover:opacity-90",
        className
      )}
    >
      <span className="text-gradient-bends text-sm font-semibold uppercase tracking-wide">
        Braindance
      </span>
    </Link>
  );
}
