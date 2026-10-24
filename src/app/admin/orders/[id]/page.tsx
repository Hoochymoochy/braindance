"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useShop } from "@/app/components/shop/ShopProvider";
import { formatPrice } from "@/app/lib/shop/mock-data";
import { isPaymentConfirmed } from "@/app/lib/shop/order-policy";
import {
  eventActorLabel,
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
  const { ready, orders, updateFulfillment, retryShippingEmail } = useShop();
  const order = orders.find((o) => o.id === params.id);

  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState<string>("USPS");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [correctTracking, setCorrectTracking] = useState(false);

  useEffect(() => {
    if (!order) return;
    setTracking(order.trackingNumber ?? "");
    setCarrier(order.shippingCarrier || "USPS");
  }, [order]);

  const trackLink = useMemo(
    () => trackingUrl(order?.shippingCarrier, order?.trackingNumber),
    [order?.shippingCarrier, order?.trackingNumber]
  );

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

  const paid = isPaymentConfirmed(order.paymentStatus);
  const emailFailed =
    !order.shippingNotifiedAt &&
    (order.fulfillmentStatus === "shipped" ||
      order.fulfillmentStatus === "delivered");
  const shippingText = formatShippingAddress(order);

  async function runAction(
    key: string,
    next: FulfillmentStatus,
    options?: {
      confirmMsg?: string;
      trackingNumber?: string;
      shippingCarrier?: string;
      success?: string;
    }
  ) {
    if (!order) return;
    if (options?.confirmMsg && !window.confirm(options.confirmMsg)) return;
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateFulfillment(order.id, {
        fulfillmentStatus: next,
        trackingNumber: options?.trackingNumber,
        shippingCarrier: options?.shippingCarrier,
      });
      if (next === "shipped" && !updated.shippingNotifiedAt) {
        setError(
          updated.shippingNotifyError
            ? `Shipment saved, but the shipping email did not send. ${updated.shippingNotifyError}.`
            : "Shipment saved, but the shipping email did not send."
        );
      } else {
        setNotice(options?.success ?? "Updated");
      }
      if (next === "shipped" || next === "delivered") setCorrectTracking(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

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
            <p className="font-mono text-sm text-zinc-500">
              #{shortOrderId(order.id)}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {order.shippingName}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {formatOrderDate(order.createdAt)}
            </p>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatPrice(order.totalCents)}
          </p>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Customer
        </h3>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {order.shippingName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{order.email}</p>
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
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Items purchased
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
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Shipping information
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
        <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300">
          {shippingText}
        </p>
      </section>

      <section className="space-y-3 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Payment
        </h3>
        <p className={`text-sm font-medium ${paymentBadgeClass(order.paymentStatus)}`}>
          {paymentLabel(order.paymentStatus)}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Charged {formatPrice(order.totalCents)}
          {(order.amountRefundedCents ?? 0) > 0
            ? ` · Refunded ${formatPrice(order.amountRefundedCents ?? 0)}`
            : ""}
        </p>
        <p className="text-xs leading-relaxed text-zinc-500">
          Stripe is the source for payment and refunds. Cancelling fulfillment
          does not refund the customer. A cancelled order stays unpaid or paid
          until Stripe reports otherwise.
        </p>
        {order.stripePaymentIntentId ? (
          <p className="font-mono text-[11px] text-zinc-400">
            {order.stripePaymentIntentId}
          </p>
        ) : null}
      </section>

      <section className="space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Fulfillment
          </h3>
          <p
            className={`text-sm font-medium ${fulfillmentBadgeClass(order.fulfillmentStatus)}`}
          >
            {fulfillmentLabel(order.fulfillmentStatus)}
          </p>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Payment verification:{" "}
          {paid ? "Confirmed" : paymentLabel(order.paymentStatus)}
        </p>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        {notice ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>
        ) : null}

        {order.fulfillmentStatus === "unfulfilled" ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== null || !paid}
              onClick={() =>
                void runAction("processing", "processing", {
                  success: "Processing started",
                })
              }
              className="bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
            >
              {busy === "processing" ? "Updating…" : "Start processing"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                void runAction("cancelled", "cancelled", {
                  confirmMsg:
                    "Cancel fulfillment for this order? Payment is not refunded.",
                  success: "Fulfillment cancelled",
                })
              }
              className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-red-600 disabled:opacity-50"
            >
              {busy === "cancelled" ? "Updating…" : "Cancel fulfillment"}
            </button>
          </div>
        ) : null}
        {order.fulfillmentStatus === "unfulfilled" && !paid ? (
          <p className="text-sm text-zinc-500">
            Processing stays locked until Stripe confirms payment.
          </p>
        ) : null}

        {order.fulfillmentStatus === "processing" && paid ? (
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
                  {SHIPPING_CARRIERS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Tracking number
                </span>
                <input
                  className="input-bends"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Required"
                  disabled={busy !== null}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy !== null || !tracking.trim()}
                onClick={() =>
                  void runAction("shipped", "shipped", {
                    trackingNumber: tracking,
                    shippingCarrier: carrier,
                    confirmMsg: `Ship this order via ${carrier} with tracking ${tracking.trim()}?`,
                    success: "Shipment confirmed",
                  })
                }
                className="bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
              >
                {busy === "shipped" ? "Updating…" : "Confirm shipment"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  void runAction("unfulfilled", "unfulfilled", {
                    confirmMsg: "Return this order to unfulfilled?",
                    success: "Returned to unfulfilled",
                  })
                }
                className="border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
              >
                {busy === "unfulfilled" ? "Updating…" : "Return to unfulfilled"}
              </button>
            </div>
          </div>
        ) : null}

        {order.fulfillmentStatus === "shipped" ||
        order.fulfillmentStatus === "delivered" ? (
          <div className="space-y-4">
            <div className="border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
              <p className="text-zinc-800 dark:text-zinc-200">
                {order.shippingCarrier || "Carrier"} · {order.trackingNumber || "No tracking"}
              </p>
              {order.shippedAt ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Shipped {formatOrderDate(order.shippedAt)}
                </p>
              ) : null}
              {order.fulfillmentStatus === "delivered" && order.deliveredAt ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Delivery manually confirmed {formatOrderDate(order.deliveredAt)}
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500">
                  Delivery is not checked with the carrier. Confirm it here only
                  after you know it arrived.
                </p>
              )}
              {trackLink ? (
                <a
                  href={trackLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-zinc-500 underline-offset-2 hover:underline"
                >
                  Track shipment
                </a>
              ) : null}
            </div>

            {emailFailed ? (
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <p>
                  {order.shippingNotifyError
                    ? `The shipping email did not send. ${order.shippingNotifyError}.`
                    : "The shipping email has not been sent."}
                </p>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    setBusy("email");
                    setError(null);
                    void retryShippingEmail(order.id)
                      .then((updated) => {
                        if (!updated.shippingNotifiedAt) {
                          setError(
                            updated.shippingNotifyError
                              ? `The shipping email did not send. ${updated.shippingNotifyError}.`
                              : "The shipping email did not send."
                          );
                          return;
                        }
                        setNotice("Shipping email sent");
                      })
                      .catch((err: unknown) =>
                        setError(
                          err instanceof Error ? err.message : "Email failed"
                        )
                      )
                      .finally(() => setBusy(null));
                  }}
                  className="mt-2 border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
                >
                  {busy === "email" ? "Sending…" : "Retry shipping email"}
                </button>
              </div>
            ) : order.shippingNotifiedAt ? (
              <p className="text-xs text-zinc-500">Shipping email sent.</p>
            ) : null}

            {order.fulfillmentStatus === "shipped" &&
            (paid || order.paymentStatus === "refunded") ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  void runAction("delivered", "delivered", {
                    confirmMsg:
                      "Record a manual delivery confirmation? This does not contact the carrier.",
                    success: "Delivery manually confirmed",
                  })
                }
                className="border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
              >
                {busy === "delivered" ? "Updating…" : "Confirm delivery"}
              </button>
            ) : null}

            {(paid || order.paymentStatus === "refunded") ? (
              <div className="space-y-3">
                {order.fulfillmentStatus === "delivered" && !correctTracking ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Correct the tracking details on this delivered order?"
                        )
                      ) {
                        setCorrectTracking(true);
                      }
                    }}
                    className="text-sm text-zinc-500 underline-offset-2 hover:underline"
                  >
                    Correct tracking
                  </button>
                ) : (
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
                        {SHIPPING_CARRIERS.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                        Tracking number
                      </span>
                      <input
                        className="input-bends"
                        value={tracking}
                        onChange={(e) => setTracking(e.target.value)}
                        disabled={busy !== null}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy !== null || !tracking.trim()}
                      onClick={() =>
                        void runAction("tracking", order.fulfillmentStatus, {
                          trackingNumber: tracking,
                          shippingCarrier: carrier,
                          confirmMsg: `Save tracking ${carrier} ${tracking.trim()}?`,
                          success: "Tracking updated",
                        })
                      }
                      className="border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 sm:col-span-2 dark:border-zinc-600 dark:text-zinc-200"
                    >
                      {busy === "tracking" ? "Saving…" : "Save tracking"}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {order.fulfillmentStatus === "cancelled" ? (
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              Fulfillment was cancelled
              {order.cancelledAt ? ` on ${formatOrderDate(order.cancelledAt)}` : ""}.
            </p>
            <p>
              Payment is still {paymentLabel(order.paymentStatus).toLowerCase()}.
              {order.paymentStatus === "paid"
                ? " This cancellation did not refund the charge."
                : order.paymentStatus === "refunded"
                  ? " Stripe has confirmed a full refund."
                  : order.paymentStatus === "partially_refunded"
                    ? " Stripe has confirmed a partial refund."
                    : " No refund has been confirmed."}
            </p>
          </div>
        ) : null}
      </section>

      <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Activity history
        </h3>
        {(order.events?.length ?? 0) === 0 ? (
          <p className="text-sm text-zinc-500">No activity yet.</p>
        ) : (
          <ol className="space-y-3">
            {[...(order.events ?? [])].reverse().map((event) => (
              <li key={event.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                <div className="min-w-0">
                  <p className="text-zinc-800 dark:text-zinc-200">
                    {event.description}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {new Date(event.createdAt).toLocaleString()} ·{" "}
                    {eventActorLabel(event)}
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
