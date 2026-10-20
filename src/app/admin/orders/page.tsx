"use client";

import { useState } from "react";
import { useShop } from "@/app/components/shop/ShopProvider";
import { formatPrice } from "@/app/lib/shop/mock-data";
import type { OrderStatus, ShopOrder } from "@/app/lib/shop/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "cancelled",
];

function statusClass(status: OrderStatus): string {
  switch (status) {
    case "paid":
      return "text-amber-600";
    case "shipped":
      return "text-emerald-600";
    case "cancelled":
      return "text-zinc-400";
    default:
      return "text-zinc-500";
  }
}

function OrderRow({
  order,
  onUpdate,
}: {
  order: ShopOrder;
  onUpdate: (
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string
  ) => void | Promise<void>;
}) {
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");

  return (
    <li className="border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-zinc-400">{order.id}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {order.shippingName}
          </p>
          <p className="text-sm text-zinc-500">{order.email}</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            {order.shippingLine1}
            <br />
            {order.shippingCity}, {order.shippingRegion} {order.shippingPostal}
            <br />
            {order.shippingCountry}
          </p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-[11px] font-medium uppercase tracking-[0.16em]",
              statusClass(order.status)
            )}
          >
            {order.status}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatPrice(order.totalCents)}
          </p>
          <p className="text-xs text-zinc-400">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-1 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {order.items.map((item, idx) => (
          <li
            key={`${item.productId}-${idx}`}
            className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300"
          >
            <span>
              {item.productName} · {item.size} × {item.quantity}
            </span>
            <span className="tabular-nums">
              {formatPrice(item.unitPriceCents * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Status
          </span>
          <select
            className="input-bends"
            value={order.status}
            onChange={(e) =>
              onUpdate(order.id, e.target.value as OrderStatus, tracking)
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-[2] text-sm">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Tracking #
          </span>
          <input
            className="input-bends"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <button
          type="button"
          onClick={() => onUpdate(order.id, order.status, tracking)}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-brand-from dark:text-zinc-950"
        >
          Save
        </button>
      </div>
    </li>
  );
}

export default function AdminOrdersPage() {
  const { ready, orders, updateOrderStatus } = useShop();

  if (!ready) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  const sorted = [...orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Demo orders for the fulfillment flow. Mark paid → ship → add tracking.
        Real Stripe webhooks will create these later.
      </p>

      {sorted.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">No orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {sorted.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onUpdate={updateOrderStatus}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
