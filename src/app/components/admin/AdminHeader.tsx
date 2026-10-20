"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function AdminHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showAdd =
    pathname === "/admin/products" && searchParams.get("new") !== "1";

  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        Merch admin
      </h1>
      {showAdd ? (
        <Link
          href="/admin/products?new=1"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-brand-from dark:text-zinc-950"
        >
          Add product
        </Link>
      ) : null}
    </div>
  );
}
