"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/app/components/shop/ShopProvider";
import { formatPrice } from "@/app/lib/shop/mock-data";
import { summarizeOrders } from "@/app/lib/shop/order-policy";

export default function AdminOverviewPage() {
  const router = useRouter();
  const { ready, products, orders, createTestOrder } = useShop();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  const active = products.filter((p) => p.status === "active").length;
  const drafts = products.filter((p) => p.status === "draft").length;
  const counts = summarizeOrders(orders);
  const revenueCents = orders.reduce((sum, order) => {
    if (order.paymentStatus === "paid" || order.paymentStatus === "partially_refunded") {
      return sum + order.totalCents - (order.amountRefundedCents ?? 0);
    }
    return sum;
  }, 0);

  const stats = [
    { label: "Active products", value: String(active), href: "/admin/products" },
    { label: "Drafts", value: String(drafts), href: "/admin/products" },
    {
      label: "Awaiting fulfillment",
      value: String(counts.awaitingFulfillment),
      href: "/admin/orders",
    },
    { label: "Processing", value: String(counts.processing), href: "/admin/orders" },
    { label: "Shipped", value: String(counts.shipped), href: "/admin/orders" },
    {
      label: "Revenue",
      value: formatPrice(revenueCents),
      href: "/admin/orders",
    },
  ];

  async function handleCreateTestOrder() {
    if (products.length === 0) {
      setError("Add a product first.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await createTestOrder();
      router.push("/admin/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create order");
    } finally {
      setCreating(false);
    }
  }

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

        <button
          type="button"
          onClick={() => void handleCreateTestOrder()}
          disabled={creating || products.length === 0}
          className="border border-dashed border-zinc-300 px-5 py-4 text-left transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:hover:border-zinc-400"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            Testing
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {creating ? "Creating…" : "Create test order"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Drops a paid sample order so you can try shipping / tracking.
          </p>
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
