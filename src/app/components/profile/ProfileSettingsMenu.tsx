"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import ThemeToggle from "@/app/components/ThemeToggle";
import { EDIT_PROFILE_EVENT } from "@/app/lib/profile/events";
import { supabase } from "@/app/lib/utils/supabaseClient";
import { cn } from "@/lib/utils";

const iconBtnClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center text-zinc-400 transition-colors duration-bends-fast ease-bends hover:text-zinc-700 dark:hover:text-brand-from";

const menuItemClass =
  "block w-full rounded-md px-2.5 py-2 text-left text-[13px] text-zinc-600 transition-colors duration-bends-fast ease-bends hover:bg-black/[0.04] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100";

/** Minimal owner settings: edit, appearance, log out. Trigger matches share icon. */
export function ProfileSettingsMenu({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) setOpen(false);
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

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    await fetch("/api/auth/token", { method: "DELETE" });
    router.push("/login");
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Settings"
        title="Settings"
        className={iconBtnClass}
      >
        <Settings className="h-3.5 w-3.5" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[10.5rem] rounded-lg border border-black/8 bg-[var(--page-bg)]/95 p-1 shadow-md backdrop-blur-md dark:border-white/10"
        >
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

          <div
            role="menuitem"
            className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5"
          >
            <span className="text-[13px] text-zinc-600 dark:text-zinc-300">
              Appearance
            </span>
            <ThemeToggle variant="ghost" />
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className={cn(
              menuItemClass,
              "text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400"
            )}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
