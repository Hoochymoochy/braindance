"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isActive = pathname === "/";

  if (variant === "icon") {
    return (
      <Link
        href="/"
        aria-label="Braindance home"
        aria-current={isActive ? "page" : undefined}
        title="Braindance"
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center transition-colors duration-bends-fast ease-bends",
          isActive
            ? "text-zinc-900 dark:text-brand-from"
            : "text-zinc-400 hover:text-zinc-700 dark:hover:text-brand-from",
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
      aria-current={isActive ? "page" : undefined}
      className={cn("inline-block", className)}
    >
      <span className="relative inline-block text-sm font-semibold uppercase tracking-wide">
        <span className="invisible" aria-hidden>
          Braindance
        </span>
        <span
          className={cn(
            "absolute inset-0 transition-opacity duration-bends-fast ease-bends",
            isActive
              ? "text-gradient-bends"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          Braindance
        </span>
      </span>
    </Link>
  );
}
