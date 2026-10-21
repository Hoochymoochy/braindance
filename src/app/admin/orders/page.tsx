"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useShop } from "@/app/components/shop/ShopProvider";
import { formatPrice } from "@/app/lib/shop/mock-data";
import {
  formatOrderDate,
  fulfillmentBadgeClass,
  fulfillmentLabel,
  paymentBadgeClass,
  paymentLabel,
  shortOrderId,
} from "@/app/lib/shop/order-utils";
import type { FulfillmentStatus } from "@/app/lib/shop/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | FulfillmentStatus;
type SortOrder = "newest" | "oldest";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unfulfilled", label: "Unfulfilled" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "cancelled", label: "Cancelled" },
];

const SORTS: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

function emptyMessage(filter: StatusFilter): string {
  switch (filter) {
    case "unfulfilled":
      return "No unfulfilled orders. You're all caught up.";
    case "processing":
      return "No orders in processing.";
    case "shipped":
      return "No shipped orders yet.";
    case "cancelled":
      return "No cancelled orders.";
    default:
      return "No orders yet.";
  }
}

export default function AdminOrdersPage() {
  const { ready, orders } = useShop();
  const [filter, setFilter] = useState<StatusFilter>("unfulfilled");
  const [sort, setSort] = useState<SortOrder>("newest");

  const counts = useMemo(() => {
    return {
      total: orders.length,
      unfulfilled: orders.filter((o) => o.fulfillmentStatus === "unfulfilled")
        .length,
      shipped: orders.filter((o) => o.fulfillmentStatus === "shipped").length,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const byStatus =
      filter === "all"
        ? [...orders]
        : orders.filter((order) => order.fulfillmentStatus === filter);

    return byStatus.sort((a, b) => {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "newest" ? -diff : diff;
    });
  }, [orders, filter, sort]);

  if (!ready) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>
          <span className="tabular-nums text-zinc-800 dark:text-zinc-200">
            {counts.total}
          </span>{" "}
          total
        </span>
        <span>
          <span className="tabular-nums text-zinc-800 dark:text-zinc-200">
            {counts.unfulfilled}
          </span>{" "}
          unfulfilled
        </span>
        <span>
          <span className="tabular-nums text-zinc-800 dark:text-zinc-200">
            {counts.shipped}
          </span>{" "}
          shipped
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((option) => {
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1 sm:border-l sm:border-zinc-200 sm:pl-3 dark:sm:border-zinc-700">
          {SORTS.map((option) => {
            const active = sort === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">No orders yet.</p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          {emptyMessage(filter)}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {filtered.map((order) => {
            const itemSummary = order.items
              .map((i) => `${i.productName} · ${i.size}`)
              .join(", ");
            return (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-900/40"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {order.shippingName}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-400">
                        #{shortOrderId(order.id)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {itemSummary || "No items"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-medium uppercase tracking-[0.12em]">
                      <span className={paymentBadgeClass(order.paymentStatus)}>
                        {paymentLabel(order.paymentStatus)}
                      </span>
                      <span
                        className={fulfillmentBadgeClass(
                          order.fulfillmentStatus
                        )}
                      >
                        {fulfillmentLabel(order.fulfillmentStatus)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-6 sm:flex-col sm:items-end sm:text-right">
                    <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatPrice(order.totalCents)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
