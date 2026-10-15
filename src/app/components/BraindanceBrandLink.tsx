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
