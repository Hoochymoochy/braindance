"use client";

import Link from "next/link";
import { useHomeBrandMerge } from "@/app/components/home/HomeBrandMerge";
import { cn } from "@/lib/utils";

type BraindanceBrandLinkProps = {
  className?: string;
};

export default function BraindanceBrandLink({ className }: BraindanceBrandLinkProps) {
  const { docked } = useHomeBrandMerge();

  return (
    <Link
      href="/"
      className={cn(
        "transition-opacity duration-bends-fast ease-bends hover:opacity-90",
        className
      )}
    >
      <span
        data-header-brand-text
        className={cn(
          "text-gradient-bends text-sm font-semibold uppercase tracking-wide transition-opacity duration-bends-fast ease-bends",
          docked ? "opacity-100" : "opacity-0"
        )}
      >
        Braindance
      </span>
    </Link>
  );
}
