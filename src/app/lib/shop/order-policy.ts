import type {
  FulfillmentStatus,
  OrderEventType,
  PaymentStatus,
  ShopOrderItem,
} from "./types";
import { SHIPPING_CARRIERS } from "./types";

export class OrderActionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderActionError";
    this.status = status;
  }
}

/** Payment Stripe has confirmed. Partial refunds still count as confirmed. */
export function isPaymentConfirmed(status: PaymentStatus): boolean {
  return status === "paid" || status === "partially_refunded";
}

export function canTransitionFulfillment(
  from: FulfillmentStatus,
  to: FulfillmentStatus
): boolean {
  if (from === to) return from === "shipped" || from === "delivered";
  const allowed: Record<FulfillmentStatus, FulfillmentStatus[]> = {
    unfulfilled: ["processing", "cancelled"],
    processing: ["unfulfilled", "shipped"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

export type FulfillmentEventPlan = {
  type: OrderEventType;
  description: string;
};

export type FulfillmentChangePlan = {
  ok: true;
  noop: boolean;
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber: string;
  shippingCarrier: string;
  events: FulfillmentEventPlan[];
  sendShippingEmail: boolean;
  /** Fulfillment actions never refund. Refunds come from Stripe. */
  issueRefund: false;
  /** A failed shipping email must leave the shipment row in place. */
  rollbackOnEmailFailure: false;
  setShippedAt: boolean;
  setDeliveredAt: boolean;
  setCancelledAt: boolean;
};

export type FulfillmentChangeRejection = {
  ok: false;
  error: string;
};

export function planFulfillmentChange(input: {
  paymentStatus: PaymentStatus;
  from: FulfillmentStatus;
  to: FulfillmentStatus;
  trackingNumber?: string;
  shippingCarrier?: string;
  currentTracking?: string;
  currentCarrier?: string;
  shippingNotifiedAt?: string | null;
}): FulfillmentChangePlan | FulfillmentChangeRejection {
  const editingShipment =
    input.to === "shipped" || input.to === "delivered";
  const trackingNumber = (
    editingShipment && input.trackingNumber !== undefined
      ? input.trackingNumber
      : input.currentTracking ?? ""
  ).trim();
  const shippingCarrier = (
    editingShipment && input.shippingCarrier !== undefined
      ? input.shippingCarrier
      : input.currentCarrier ?? ""
  ).trim();

  const paymentError = fulfillmentPaymentError(
    input.paymentStatus,
    input.from,
    input.to
  );
  if (paymentError) return { ok: false, error: paymentError };

  if (!canTransitionFulfillment(input.from, input.to)) {
    return {
      ok: false,
      error: `Cannot change fulfillment from ${input.from} to ${input.to}`,
    };
  }

  const trackingChanged =
    trackingNumber !== (input.currentTracking ?? "").trim() ||
    shippingCarrier !== (input.currentCarrier ?? "").trim();
  const enteringShipped =
    input.to === "shipped" &&
    input.from !== "shipped" &&
    input.from !== "delivered";

  if (enteringShipped || (trackingChanged && editingShipment)) {
    if (!trackingNumber) {
      return { ok: false, error: "Tracking number is required to mark shipped" };
    }
    if (!shippingCarrier) {
      return { ok: false, error: "Carrier is required to mark shipped" };
    }
    if (!(SHIPPING_CARRIERS as readonly string[]).includes(shippingCarrier)) {
      return { ok: false, error: "Choose a carrier from the list" };
    }
  }

  if (input.from === input.to && !trackingChanged) {
    return {
      ok: true,
      noop: true,
      fulfillmentStatus: input.to,
      trackingNumber,
      shippingCarrier,
      events: [],
      sendShippingEmail: false,
      issueRefund: false,
      rollbackOnEmailFailure: false,
      setShippedAt: false,
      setDeliveredAt: false,
      setCancelledAt: false,
    };
  }

  const events: FulfillmentEventPlan[] = [];
  if (input.from !== input.to && input.to === "processing") {
    events.push({
      type: "fulfillment_started",
      description: "Processing started",
    });
  }
  if (input.from === "processing" && input.to === "unfulfilled") {
    events.push({
      type: "returned_to_unfulfilled",
      description: "Returned to unfulfilled",
    });
  }
  if (input.from !== "shipped" && input.from !== "delivered" && input.to === "shipped") {
    events.push({
      type: "shipment_confirmed",
      description: `Shipment confirmed · ${shippingCarrier} ${trackingNumber}`,
    });
  }
  if (
    trackingChanged &&
    (input.from === "shipped" || input.from === "delivered") &&
    (input.to === "shipped" || input.to === "delivered")
  ) {
    events.push({
      type: "tracking_updated",
      description: `Tracking updated · ${shippingCarrier} ${trackingNumber}`,
    });
  }
  if (input.to === "delivered" && input.from !== "delivered") {
    events.push({
      type: "delivery_manually_confirmed",
      description: "Delivery manually confirmed",
    });
  }
  if (input.to === "cancelled" && input.from !== "cancelled") {
    events.push({
      type: "fulfillment_cancelled",
      description: "Fulfillment cancelled",
    });
  }

  return {
    ok: true,
    noop: false,
    fulfillmentStatus: input.to,
    trackingNumber,
    shippingCarrier,
    events,
    sendShippingEmail: enteringShipped && !input.shippingNotifiedAt,
    issueRefund: false,
    rollbackOnEmailFailure: false,
    setShippedAt: enteringShipped,
    setDeliveredAt: input.to === "delivered" && input.from !== "delivered",
    setCancelledAt: input.to === "cancelled" && input.from !== "cancelled",
  };
}

function fulfillmentPaymentError(
  payment: PaymentStatus,
  from: FulfillmentStatus,
  to: FulfillmentStatus
): string | null {
  const message = "Payment must be confirmed before fulfillment updates";
  const startingWork =
    to === "processing" || (to === "shipped" && from !== "shipped");
  if (startingWork && !isPaymentConfirmed(payment)) return message;

  const recordingDelivery = to === "delivered";
  const editingTracking =
    from === to && (from === "shipped" || from === "delivered");
  const paidOrRefunded = isPaymentConfirmed(payment) || payment === "refunded";
  if ((recordingDelivery || editingTracking) && !paidOrRefunded) return message;
  return null;
}

/** Succeeded Stripe refunds are the only amounts that change payment status. */
export function paymentStatusAfterRefunds(input: {
  current: PaymentStatus;
  totalCents: number;
  succeededRefundCents: number;
}): PaymentStatus {
  if (input.current === "pending" || input.current === "failed") {
    return input.current;
  }
  const refunded = Math.max(0, input.succeededRefundCents);
  if (refunded <= 0) return "paid";
  if (input.totalCents > 0 && refunded >= input.totalCents) return "refunded";
  return "partially_refunded";
}

export function planRefundActivity(
  previousStatus: string | null,
  nextStatus: string
): "refund_initiated" | "refund_confirmed" | null {
  const open = (status: string | null) =>
    status === "pending" || status === "requires_action";
  if (nextStatus === "succeeded" && previousStatus !== "succeeded") {
    return "refund_confirmed";
  }
  if (open(nextStatus) && !open(previousStatus)) {
    return "refund_initiated";
  }
  return null;
}

export type StripeEffect =
  | { kind: "duplicate" }
  | { kind: "ignore" }
  | { kind: "checkout"; outcome: "pending" | "paid" | "failed" }
  | { kind: "payment_failed" }
  | { kind: "refund" };

/**
 * Map a Stripe event onto a local effect.
 * `checkout.session.completed` is paid only when payment_status says so.
 */
export function planStripeEvent(input: {
  alreadyProcessed: boolean;
  type: string;
  paymentStatus?: string | null;
}): StripeEffect {
  if (input.alreadyProcessed) return { kind: "duplicate" };

  switch (input.type) {
    case "checkout.session.completed": {
      if (
        input.paymentStatus === "paid" ||
        input.paymentStatus === "no_payment_required"
      ) {
        return { kind: "checkout", outcome: "paid" };
      }
      if (input.paymentStatus === "unpaid") {
        return { kind: "checkout", outcome: "pending" };
      }
      return { kind: "checkout", outcome: "pending" };
    }
    case "checkout.session.async_payment_succeeded": {
      if (input.paymentStatus === "unpaid") {
        return { kind: "checkout", outcome: "pending" };
      }
      return { kind: "checkout", outcome: "paid" };
    }
    case "checkout.session.async_payment_failed":
      return { kind: "checkout", outcome: "failed" };
    case "payment_intent.payment_failed":
      return { kind: "payment_failed" };
    case "refund.created":
    case "refund.updated":
      return { kind: "refund" };
    default:
      return { kind: "ignore" };
  }
}

export function paymentFailureStatus(current: PaymentStatus): PaymentStatus {
  return current === "pending" ? "failed" : current;
}

export type OrderMetricSource = {
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  shippingNotifiedAt?: string | null;
  shippingNotifyError?: string | null;
};

export function isAwaitingFulfillment(order: OrderMetricSource): boolean {
  return (
    isPaymentConfirmed(order.paymentStatus) &&
    order.fulfillmentStatus === "unfulfilled"
  );
}

export function requiresAttention(order: OrderMetricSource): boolean {
  if (order.fulfillmentStatus === "cancelled") return false;
  if (isAwaitingFulfillment(order)) return true;
  if (
    order.fulfillmentStatus === "processing" &&
    isPaymentConfirmed(order.paymentStatus)
  ) {
    return true;
  }
  if (
    (order.fulfillmentStatus === "shipped" ||
      order.fulfillmentStatus === "delivered") &&
    !order.shippingNotifiedAt &&
    Boolean(order.shippingNotifyError)
  ) {
    return true;
  }
  return false;
}

export function summarizeOrders(orders: OrderMetricSource[]) {
  return {
    total: orders.length,
    awaitingFulfillment: orders.filter(isAwaitingFulfillment).length,
    processing: orders.filter((order) => order.fulfillmentStatus === "processing")
      .length,
    shipped: orders.filter((order) => order.fulfillmentStatus === "shipped")
      .length,
    delivered: orders.filter((order) => order.fulfillmentStatus === "delivered")
      .length,
    attention: orders.filter(requiresAttention).length,
  };
}

export function productSummary(
  items: Pick<ShopOrderItem, "productName" | "size" | "quantity">[]
): string {
  return items
    .map((item) => `${item.productName} · ${item.size} × ${item.quantity}`)
    .join(", ");
}

export function orderMatchesFilters(
  order: { paymentStatus: PaymentStatus; fulfillmentStatus: FulfillmentStatus },
  fulfillment: "all" | FulfillmentStatus,
  payment: "all" | PaymentStatus
): boolean {
  if (fulfillment !== "all" && order.fulfillmentStatus !== fulfillment) {
    return false;
  }
  if (payment !== "all" && order.paymentStatus !== payment) return false;
  return true;
}

/** Legacy rows without the newer timestamp columns still have a list presentation. */
export function presentStoredOrder(order: {
  id: string;
  shippingName: string;
  items: Pick<ShopOrderItem, "productName" | "size" | "quantity">[];
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  totalCents: number;
  createdAt: string;
  shippedAt?: string | null;
  amountRefundedCents?: number;
}) {
  return {
    id: order.id,
    customerName: order.shippingName,
    summary: productSummary(order.items),
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    totalCents: order.totalCents,
    createdAt: order.createdAt,
    shippedAt: order.shippedAt ?? null,
    amountRefundedCents: order.amountRefundedCents ?? 0,
  };
}
