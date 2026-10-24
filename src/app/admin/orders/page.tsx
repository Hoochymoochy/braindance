"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useShop } from "@/app/components/shop/ShopProvider";
import { formatPrice } from "@/app/lib/shop/mock-data";
import {
  orderMatchesFilters,
  productSummary,
  summarizeOrders,
} from "@/app/lib/shop/order-policy";
import {
  formatOrderDateShort,
  fulfillmentBadgeClass,
  fulfillmentLabel,
  paymentBadgeClass,
  paymentLabel,
  shortOrderId,
} from "@/app/lib/shop/order-utils";
import type { FulfillmentStatus, PaymentStatus } from "@/app/lib/shop/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | FulfillmentStatus;
type PaymentFilter = "all" | PaymentStatus;
type SortOrder = "newest" | "oldest";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unfulfilled", label: "Unfulfilled" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_FILTERS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "Any payment" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "partially_refunded", label: "Partial refund" },
  { value: "refunded", label: "Refunded" },
];

const SORTS: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

export default function AdminOrdersPage() {
  const { ready, orders } = useShop();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");

  const counts = useMemo(() => summarizeOrders(orders), [orders]);

  const filtered = useMemo(() => {
    return orders
      .filter((order) => orderMatchesFilters(order, filter, paymentFilter))
      .sort((a, b) => {
        const diff =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sort === "newest" ? -diff : diff;
      });
  }, [orders, filter, paymentFilter, sort]);

  if (!ready) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Total orders" value={counts.total} />
        <Metric label="Awaiting fulfillment" value={counts.awaitingFulfillment} />
        <Metric label="Processing" value={counts.processing} />
        <Metric label="Shipped" value={counts.shipped} />
        <Metric label="Delivered" value={counts.delivered} />
        <Metric label="Needs attention" value={counts.attention} />
      </div>
      <p className="max-w-3xl text-xs leading-relaxed text-zinc-500">
        Counts are every stored order, not the current filter. Awaiting
        fulfillment is paid or partially refunded and still unfulfilled.
        Cancelled orders and unpaid orders are left out of that count. Needs
        attention is awaiting fulfillment, paid orders in processing, and
        shipments whose email failed.
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((option) => (
            <FilterButton
              key={option.value}
              active={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {PAYMENT_FILTERS.map((option) => (
              <FilterButton
                key={option.value}
                active={paymentFilter === option.value}
                onClick={() => setPaymentFilter(option.value)}
              >
                {option.label}
              </FilterButton>
            ))}
          </div>
          <div className="flex gap-1 sm:border-l sm:border-zinc-200 sm:pl-3 dark:sm:border-zinc-700">
            {SORTS.map((option) => (
              <FilterButton
                key={option.value}
                active={sort === option.value}
                onClick={() => setSort(option.value)}
              >
                {option.label}
              </FilterButton>
            ))}
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">No orders yet.</p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          No orders match these filters.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {filtered.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-900/40"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    #{shortOrderId(order.id)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {order.shippingName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {productSummary(order.items) || "No items"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span>
                      <span className="text-zinc-500">Payment </span>
                      <span className={paymentBadgeClass(order.paymentStatus)}>
                        {paymentLabel(order.paymentStatus)}
                      </span>
                    </span>
                    <span>
                      <span className="text-zinc-500">Fulfillment </span>
                      <span
                        className={fulfillmentBadgeClass(order.fulfillmentStatus)}
                      >
                        {fulfillmentLabel(order.fulfillmentStatus)}
                      </span>
                    </span>
                  </div>
                </div>
                <p className="shrink-0 text-sm text-zinc-500 sm:text-right">
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatPrice(order.totalCents)}
                  </span>
                  <span> · {formatOrderDateShort(order.createdAt)}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-zinc-200 px-3 py-3 dark:border-zinc-800">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      )}
    >
      {children}
    </button>
  );
}
