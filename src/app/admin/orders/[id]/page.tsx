"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useShop } from "@/app/components/shop/ShopProvider";
import { formatPrice } from "@/app/lib/shop/mock-data";
import {
  formatOrderDate,
  formatShippingAddress,
  fulfillmentBadgeClass,
  fulfillmentLabel,
  paymentBadgeClass,
  paymentLabel,
  shortOrderId,
  trackingUrl,
} from "@/app/lib/shop/order-utils";
import type { FulfillmentStatus } from "@/app/lib/shop/types";
import { SHIPPING_CARRIERS } from "@/app/lib/shop/types";
import { cn } from "@/lib/utils";

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, orders, updateFulfillment } = useShop();
  const order = orders.find((o) => o.id === params.id);

  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("USPS");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setTracking(order.trackingNumber ?? "");
      setCarrier(order.shippingCarrier || "USPS");
    }
  }, [order]);

  const trackLink = useMemo(
    () => trackingUrl(order?.shippingCarrier, order?.trackingNumber),
    [order?.shippingCarrier, order?.trackingNumber]
  );

  const paid = order?.paymentStatus === "paid";
  const canAct =
    paid &&
    order?.fulfillmentStatus !== "cancelled" &&
    order?.fulfillmentStatus !== "delivered";

  if (!ready) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (!order) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-sm text-zinc-500">Order not found.</p>
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  async function runAction(
    key: string,
    next: FulfillmentStatus,
    confirmMsg?: string
  ) {
    if (!order) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await updateFulfillment(order.id, {
        fulfillmentStatus: next,
        trackingNumber: tracking,
        shippingCarrier: carrier,
      });
      setNotice(
        next === "shipped"
          ? "Marked as shipped"
          : next === "processing"
            ? "Marked as processing"
            : next === "delivered"
              ? "Marked as delivered"
              : next === "cancelled"
                ? "Fulfillment cancelled"
                : "Updated"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  const shippingText = formatShippingAddress(order);

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <button
          type="button"
          onClick={() => router.push("/admin/orders")}
          className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Orders
        </button>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {order.shippingName}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Order #{shortOrderId(order.id)} · {formatOrderDate(order.createdAt)}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.14em]">
              <span className={paymentBadgeClass(order.paymentStatus)}>
                {paymentLabel(order.paymentStatus)}
              </span>
              <span className={fulfillmentBadgeClass(order.fulfillmentStatus)}>
                {fulfillmentLabel(order.fulfillmentStatus)}
              </span>
            </div>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatPrice(order.totalCents)}
          </p>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Items
        </h3>
        <ul className="divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {order.items.map((item, idx) => (
            <li
              key={`${item.productId}-${idx}`}
              className="flex items-center gap-3 px-3 py-3"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.productName}
                </p>
                <p className="text-xs text-zinc-500">
                  Size {item.size} · Qty {item.quantity}
                </p>
              </div>
              <div className="shrink-0 text-right text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                <p>{formatPrice(item.unitPriceCents * item.quantity)}</p>
                {item.quantity > 1 ? (
                  <p className="text-xs text-zinc-400">
                    {formatPrice(item.unitPriceCents)} each
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Customer
          </h3>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {order.shippingName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {order.email}
            </p>
            <button
              type="button"
              onClick={async () => {
                const ok = await copyText(order.email);
                setNotice(ok ? "Email copied" : "Could not copy");
              }}
              className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Copy
            </button>
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Shipping
            </h3>
            <button
              type="button"
              onClick={async () => {
                const ok = await copyText(shippingText);
                setNotice(ok ? "Address copied" : "Could not copy");
              }}
              className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Copy
            </button>
          </div>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {order.shippingName}
            <br />
            {order.shippingLine1}
            <br />
            {order.shippingCity}, {order.shippingRegion} {order.shippingPostal}
            <br />
            {order.shippingCountry}
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Fulfillment
          </h3>
          <p
            className={cn(
              "text-[11px] font-medium uppercase tracking-[0.14em]",
              fulfillmentBadgeClass(order.fulfillmentStatus)
            )}
          >
            {fulfillmentLabel(order.fulfillmentStatus)}
          </p>
        </div>

        {!paid ? (
          <p className="text-sm text-zinc-500">
            Shipping actions unlock after payment is confirmed.
          </p>
        ) : null}

        {(order.fulfillmentStatus === "shipped" ||
          order.fulfillmentStatus === "delivered") &&
        order.trackingNumber ? (
          <div className="border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
            <p className="text-zinc-700 dark:text-zinc-300">
              {order.shippingCarrier || "Carrier"} · {order.trackingNumber}
            </p>
            {trackLink ? (
              <a
                href={trackLink}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-medium text-zinc-500 underline-offset-2 hover:underline"
              >
                Track shipment
              </a>
            ) : null}
          </div>
        ) : null}

        {canAct &&
        (order.fulfillmentStatus === "unfulfilled" ||
          order.fulfillmentStatus === "processing") ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Carrier
                </span>
                <select
                  className="input-bends"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  disabled={busy !== null}
                >
                  {SHIPPING_CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Tracking #
                </span>
                <input
                  className="input-bends"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Required to ship"
                  disabled={busy !== null}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {order.fulfillmentStatus === "unfulfilled" ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void runAction("processing", "processing")}
                  className="border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
                >
                  {busy === "processing" ? "Updating…" : "Mark processing"}
                </button>
              ) : null}

              <button
                type="button"
                disabled={busy !== null || !tracking.trim()}
                onClick={() =>
                  void runAction(
                    "shipped",
                    "shipped",
                    `Ship this order via ${carrier} with tracking ${tracking.trim()}?`
                  )
                }
                className="bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
              >
                {busy === "shipped" ? "Updating…" : "Mark shipped"}
              </button>

              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  void runAction(
                    "cancelled",
                    "cancelled",
                    "Cancel fulfillment for this order? Payment is unchanged."
                  )
                }
                className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-red-600 disabled:opacity-50"
              >
                {busy === "cancelled" ? "Updating…" : "Cancel fulfillment"}
              </button>
            </div>
          </div>
        ) : null}

        {paid && order.fulfillmentStatus === "shipped" ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void runAction("delivered", "delivered")}
            className="border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
          >
            {busy === "delivered" ? "Updating…" : "Mark delivered"}
          </button>
        ) : null}

        {notice ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </section>

      <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Activity
        </h3>
        {(order.events?.length ?? 0) === 0 ? (
          <p className="text-sm text-zinc-500">No activity yet.</p>
        ) : (
          <ol className="space-y-3">
            {[...(order.events ?? [])]
              .slice()
              .reverse()
              .map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                  <div className="min-w-0">
                    <p className="text-zinc-800 dark:text-zinc-200">
                      {event.description}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {new Date(event.createdAt).toLocaleString()}
                      {event.actor ? ` · ${event.actor}` : ""}
                    </p>
                  </div>
                </li>
              ))}
          </ol>
        )}
      </section>
    </div>
  );
}
