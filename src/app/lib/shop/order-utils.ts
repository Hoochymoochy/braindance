import type { FulfillmentStatus, PaymentStatus } from "./types";

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
      return "Partial refund";
    default:
      return status.replace(/_/g, " ");
  }
}

export function fulfillmentLabel(status: FulfillmentStatus): string {
  return status.replace(/_/g, " ");
}

/** Valid admin-driven fulfillment transitions. */
export function canTransitionFulfillment(
  from: FulfillmentStatus,
  to: FulfillmentStatus
): boolean {
  if (from === to) return true;
  const allowed: Record<FulfillmentStatus, FulfillmentStatus[]> = {
    unfulfilled: ["processing", "shipped", "cancelled"],
    processing: ["unfulfilled", "shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };
  return allowed[from]?.includes(to) ?? false;
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
  return `https://www.google.com/search?q=${t}+tracking`;
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
