"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import ThemeToggle from "@/app/components/ThemeToggle";
import { useAuthUserId } from "@/app/lib/hooks/useAuthUserId";
import { EDIT_PROFILE_EVENT } from "@/app/lib/profile/events";
import { trackEvent } from "@/app/lib/analytics";
import { supabase } from "@/app/lib/utils/supabaseClient";
import { cn } from "@/lib/utils";

type AppSettingsMenuProps = {
  className?: string;
  /** When true, menu opens upward (e.g. fixed bottom-right on mobile). */
  openUp?: boolean;
  /** Umami metadata: where the settings control lives (header vs mobile FAB). */
  menuPlacement?: "header" | "mobile";
  "aria-hidden"?: boolean;
  inert?: boolean;
};

export default function AppSettingsMenu({
  className,
  openUp = false,
  menuPlacement,
  "aria-hidden": ariaHidden,
  inert,
}: AppSettingsMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const userId = useAuthUserId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (inert) setOpen(false);
  }, [inert]);

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    await fetch("/api/auth/token", { method: "DELETE" });
    router.push("/login");
  };

  const menuItemClass =
    "block w-full rounded-lg px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors duration-bends-fast ease-bends hover:bg-black/[0.04] hover:text-brand-from dark:text-zinc-200 dark:hover:bg-brand-from/10";
  const isOnProfilePage = pathname === "/profile";

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      aria-hidden={ariaHidden}
      inert={inert ? true : undefined}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Settings"
        className="glass-bends-card inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-zinc-700 shadow-sm transition-[border-color,color,background-color,box-shadow] duration-bends-fast ease-bends hover:border-brand-from/40 hover:text-brand-from dark:border-brand-from/30 dark:text-brand-from dark:hover:bg-brand-from/10"
      >
        <Settings className="h-[1.125rem] w-[1.125rem]" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "glass-bends-card absolute right-0 z-50 min-w-[11rem] rounded-xl border border-black/10 p-2 shadow-lg dark:border-brand-from/20",
            openUp ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          {isOnProfilePage && userId ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event(EDIT_PROFILE_EVENT));
              }}
              className={menuItemClass}
            >
              Edit profile
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                trackEvent("profile_clicked", { placement: menuPlacement });
                setOpen(false);
                router.push("/profile");
              }}
              className={menuItemClass}
            >
              Profile
            </button>
          )}

          <div
            role="menuitem"
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
          >
            <span className="text-sm text-zinc-700 dark:text-zinc-200">Appearance</span>
            <ThemeToggle />
          </div>

          {userId ? (
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className={cn(
                menuItemClass,
                "text-red-500 hover:text-red-500 dark:text-red-400 dark:hover:text-red-400"
              )}
            >
              Log out
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
