"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useAuthUserId } from "@/app/lib/hooks/useAuthUserId";
import { trackEvent } from "@/app/lib/analytics";
import { cn } from "@/lib/utils";

type ProfileNavLinkProps = {
  className?: string;
  /** Umami metadata: where the control lives. */
  placement?: "header" | "mobile";
  /** `label` = “Profile” text; `icon` = user mark for compact chrome. */
  variant?: "label" | "icon";
};

export default function ProfileNavLink({
  className,
  placement,
  variant = "label",
}: ProfileNavLinkProps) {
  const userId = useAuthUserId();
  const href = userId ? "/profile" : "/login";
  const label = userId ? "Profile" : "Log in";

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      onClick={() => {
        if (userId) trackEvent("profile_clicked", { placement });
      }}
      className={cn(
        "shrink-0 transition-opacity duration-bends-fast ease-bends hover:opacity-90",
        variant === "icon" &&
          "inline-flex h-9 w-9 items-center justify-center text-zinc-400 hover:text-zinc-700 hover:opacity-100 dark:hover:text-brand-from",
        className
      )}
    >
      {variant === "icon" ? (
        <User className="h-4 w-4" aria-hidden />
      ) : (
        <span className="text-gradient-bends text-sm font-semibold uppercase tracking-wide">
          {label}
        </span>
      )}
    </Link>
  );
}
