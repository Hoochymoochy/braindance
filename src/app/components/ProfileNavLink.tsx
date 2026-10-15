"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

function isProfilePath(pathname: string): boolean {
  return pathname === "/profile" || pathname.startsWith("/profile/");
}

export default function ProfileNavLink({
  className,
  placement,
  variant = "label",
}: ProfileNavLinkProps) {
  const pathname = usePathname();
  const userId = useAuthUserId();
  const href = userId ? "/profile" : "/login";
  const label = userId ? "Profile" : "Log in";
  const isActive =
    variant === "icon" &&
    (userId ? isProfilePath(pathname) : pathname === "/login");

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      title={label}
      onClick={() => {
        if (userId) trackEvent("profile_clicked", { placement });
      }}
      className={cn(
        "shrink-0 transition-opacity duration-bends-fast ease-bends hover:opacity-90",
        variant === "icon" &&
          "inline-flex h-9 w-9 items-center justify-center hover:opacity-100",
        variant === "icon" &&
          (isActive
            ? "text-zinc-900 dark:text-brand-from"
            : "text-zinc-400 hover:text-zinc-700 dark:hover:text-brand-from"),
        className
      )}
    >
      {variant === "icon" ? (
        <User
          className="h-4 w-4"
          fill={isActive ? "currentColor" : "none"}
          aria-hidden
        />
      ) : (
        <span className="text-gradient-bends text-sm font-semibold uppercase tracking-wide">
          {label}
        </span>
      )}
    </Link>
  );
}
