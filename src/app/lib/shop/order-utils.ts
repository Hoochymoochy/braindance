import { canTransitionFulfillment } from "./order-policy";
import type { FulfillmentStatus, PaymentStatus, ShopOrderEvent } from "./types";

export { canTransitionFulfillment };

export function shortOrderId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatOrderDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function paymentBadgeClass(status: PaymentStatus): string {
  switch (status) {
    case "paid":
      return "text-emerald-600 dark:text-emerald-400";
    case "pending":
      return "text-amber-600 dark:text-amber-400";
    case "failed":
      return "text-red-600 dark:text-red-400";
    case "refunded":
    case "partially_refunded":
      return "text-zinc-400";
    default:
      return "text-zinc-500";
  }
}

export function fulfillmentBadgeClass(status: FulfillmentStatus): string {
  switch (status) {
    case "unfulfilled":
      return "text-amber-600 dark:text-amber-400";
    case "processing":
      return "text-sky-600 dark:text-sky-400";
    case "shipped":
    case "delivered":
      return "text-emerald-600 dark:text-emerald-400";
    case "cancelled":
      return "text-zinc-400";
    default:
      return "text-zinc-500";
  }
}

export function paymentLabel(status: PaymentStatus): string {
  switch (status) {
    case "partially_refunded":
      return "Partially refunded";
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

export function fulfillmentLabel(status: FulfillmentStatus): string {
  switch (status) {
    case "unfulfilled":
      return "Unfulfilled";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function eventActorLabel(event: ShopOrderEvent): string {
  const email = event.metadata?.adminEmail;
  if (event.actor === "admin" && typeof email === "string" && email) return email;
  if (event.actor.startsWith("admin:")) return event.actor.slice("admin:".length);
  return event.actor;
}

export function trackingUrl(
  carrier: string | undefined,
  trackingNumber: string | undefined
): string | null {
  if (!trackingNumber?.trim()) return null;
  const t = encodeURIComponent(trackingNumber.trim());
  const c = (carrier || "").toLowerCase();
  if (c.includes("usps")) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
  }
  if (c.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${t}`;
  }
  if (c.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
  }
  if (c.includes("dhl")) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${t}`;
  }
  return null;
}

export function formatShippingAddress(order: {
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostal: string;
  shippingCountry: string;
}): string {
  return [
    order.shippingName,
    order.shippingLine1,
    `${order.shippingCity}, ${order.shippingRegion} ${order.shippingPostal}`,
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join("\n");
}
