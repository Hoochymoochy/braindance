"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-3 text-sm font-medium transition-colors duration-bends-fast ease-bends",
              active
                ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-brand-from dark:text-brand-from"
                : "border-b-2 border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            {link.label}
          </Link>
        );
      })}
      <div className="ml-auto flex items-center gap-4 pb-1 pr-1">
        <Link
          href="/shop"
          className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          View shop
        </Link>
      </div>
    </nav>
  );
}
