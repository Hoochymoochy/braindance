"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type BraindanceBrandLinkProps = {
  className?: string;
};

export default function BraindanceBrandLink({
  className,
}: BraindanceBrandLinkProps) {
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
