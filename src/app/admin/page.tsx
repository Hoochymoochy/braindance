"use client";

import Link from "next/link";
import { useShop } from "@/app/components/shop/ShopProvider";
import { formatPrice } from "@/app/lib/shop/mock-data";

export default function AdminOverviewPage() {
  const { ready, products, orders } = useShop();

  if (!ready) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  const active = products.filter((p) => p.status === "active").length;
  const drafts = products.filter((p) => p.status === "draft").length;
  const paid = orders.filter((o) => o.status === "paid").length;
  const shipped = orders.filter((o) => o.status === "shipped").length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const revenueCents = orders
    .filter((o) => o.status === "paid" || o.status === "shipped")
    .reduce((sum, o) => sum + o.totalCents, 0);

  const stats = [
    { label: "Active products", value: String(active), href: "/admin/products" },
    { label: "Drafts", value: String(drafts), href: "/admin/products" },
    { label: "Paid to ship", value: String(paid), href: "/admin/orders" },
    { label: "Shipped", value: String(shipped), href: "/admin/orders" },
    { label: "Pending", value: String(pending), href: "/admin/orders" },
    {
      label: "Revenue",
      value: formatPrice(revenueCents),
      href: "/admin/orders",
    },
  ];

  return (
    <div className="space-y-10">
      <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        Your merch dashboard. Add products, mark them active for the shop, and
        track orders from Stripe Checkout.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border border-zinc-200 px-5 py-4 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
