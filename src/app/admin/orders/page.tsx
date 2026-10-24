"use client";

import Link from "next/link";
import { Filter } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  { value: "all", label: "Any" },
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const filtersActive =
    filter !== "all" || paymentFilter !== "all" || sort !== "newest";
  const filterRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!filterRootRef.current?.contains(target)) setFiltersOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersOpen]);

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

      <div ref={filterRootRef} className="relative flex justify-end">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-haspopup="dialog"
          aria-label={filtersOpen ? "Close filters" : "Open filters"}
          onClick={() => setFiltersOpen((open) => !open)}
          className={cn(
            "relative inline-flex h-8 w-8 items-center justify-center text-zinc-400 transition-colors duration-bends-fast ease-bends hover:text-zinc-800 dark:hover:text-zinc-100",
            filtersOpen && "text-zinc-900 dark:text-zinc-50"
          )}
        >
          <Filter className="h-4 w-4" aria-hidden />
          {filtersActive ? (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
          ) : null}
        </button>

        {filtersOpen ? (
          <div className="absolute right-0 top-full z-20 mt-1.5 w-64 rounded-lg border border-black/8 bg-[var(--page-bg)]/95 p-3 shadow-md backdrop-blur-md dark:border-white/10">
            <div className="space-y-3">
              <FilterSelect
                label="Fulfillment"
                value={filter}
                options={FILTERS}
                onChange={setFilter}
              />
              <FilterSelect
                label="Payment"
                value={paymentFilter}
                options={PAYMENT_FILTERS}
                onChange={setPaymentFilter}
              />
              <FilterSelect
                label="Sort"
                value={sort}
                options={SORTS}
                onChange={setSort}
              />
            </div>
          </div>
        ) : null}
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

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <select
        className="input-bends !py-2 !text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
