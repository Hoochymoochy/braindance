import {
  isPaymentConfirmed,
  orderMatchesFilters,
  paymentStatusAfterRefunds,
  planFulfillmentChange,
  planRefundActivity,
  planStripeEvent,
  presentStoredOrder,
  productSummary,
  summarizeOrders,
} from "@/app/lib/shop/order-policy";
import {
  fulfillmentLabel,
  paymentLabel,
  shortOrderId,
} from "@/app/lib/shop/order-utils";
import type { ShopOrder } from "@/app/lib/shop/types";

const tracking = {
  trackingNumber: "9400111899223344556677",
  shippingCarrier: "USPS",
  currentTracking: "",
  currentCarrier: "",
  shippingNotifiedAt: null,
};

describe("1. paid order moves from unfulfilled to processing", () => {
  it("plans processing without a refund or shipping email", () => {
    const plan = planFulfillmentChange({
      paymentStatus: "paid",
      from: "unfulfilled",
      to: "processing",
      ...tracking,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.fulfillmentStatus).toBe("processing");
    expect(plan.events.map((event) => event.type)).toEqual(["fulfillment_started"]);
    expect(plan.sendShippingEmail).toBe(false);
    expect(plan.issueRefund).toBe(false);
  });
});

describe("2. pending payment cannot be processed or shipped", () => {
  it("rejects processing and shipping", () => {
    const processing = planFulfillmentChange({
      paymentStatus: "pending",
      from: "unfulfilled",
      to: "processing",
      ...tracking,
    });
    const shipped = planFulfillmentChange({
      paymentStatus: "pending",
      from: "processing",
      to: "shipped",
      ...tracking,
    });
    expect(processing.ok).toBe(false);
    expect(shipped.ok).toBe(false);
    if (!processing.ok) {
      expect(processing.error).toMatch(/confirmed/i);
    }
    expect(isPaymentConfirmed("pending")).toBe(false);
  });
});

describe("3. processing order can be shipped with tracking", () => {
  it("requires carrier and tracking, then confirms shipment", () => {
    const missing = planFulfillmentChange({
      paymentStatus: "paid",
      from: "processing",
      to: "shipped",
      trackingNumber: " ",
      shippingCarrier: "UPS",
      currentTracking: "",
      currentCarrier: "",
      shippingNotifiedAt: null,
    });
    expect(missing.ok).toBe(false);

    const plan = planFulfillmentChange({
      paymentStatus: "paid",
      from: "processing",
      to: "shipped",
      trackingNumber: "1Z999",
      shippingCarrier: "UPS",
      currentTracking: "",
      currentCarrier: "",
      shippingNotifiedAt: null,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.events.map((event) => event.description).join(" ")).toMatch(
      /Shipment confirmed/
    );
    expect(plan.setShippedAt).toBe(true);
    expect(plan.sendShippingEmail).toBe(true);
    expect(plan.trackingNumber).toBe("1Z999");
    expect(plan.shippingCarrier).toBe("UPS");
  });
});

describe("4. shipped order can be marked delivered", () => {
  it("records a manual delivery and does not email again", () => {
    const plan = planFulfillmentChange({
      paymentStatus: "paid",
      from: "shipped",
      to: "delivered",
      currentTracking: "1Z999",
      currentCarrier: "UPS",
      shippingNotifiedAt: "2026-10-23T00:00:00.000Z",
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.events.map((event) => event.type)).toEqual([
      "delivery_manually_confirmed",
    ]);
    expect(plan.setDeliveredAt).toBe(true);
    expect(plan.sendShippingEmail).toBe(false);
  });
});

describe("5. duplicate shipment requests do not send another email", () => {
  it("treats a repeated shipped update as a no-op", () => {
    const plan = planFulfillmentChange({
      paymentStatus: "paid",
      from: "shipped",
      to: "shipped",
      trackingNumber: "1Z999",
      shippingCarrier: "UPS",
      currentTracking: "1Z999",
      currentCarrier: "UPS",
      shippingNotifiedAt: "2026-10-23T00:00:00.000Z",
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.noop).toBe(true);
    expect(plan.sendShippingEmail).toBe(false);
    expect(plan.events).toEqual([]);
  });
});

describe("6. invalid status transitions are rejected", () => {
  it("blocks skipping processing and moving backwards from shipped", () => {
    const skip = planFulfillmentChange({
      paymentStatus: "paid",
      from: "unfulfilled",
      to: "shipped",
      ...tracking,
    });
    const backward = planFulfillmentChange({
      paymentStatus: "paid",
      from: "shipped",
      to: "processing",
      currentTracking: "1Z999",
      currentCarrier: "UPS",
      shippingNotifiedAt: "2026-10-23T00:00:00.000Z",
    });
    expect(skip.ok).toBe(false);
    expect(backward.ok).toBe(false);
    if (!skip.ok) expect(skip.error).toMatch(/Cannot change fulfillment/);
  });
});

describe("7. fulfillment cancellation does not refund payment", () => {
  it("cancels fulfillment and leaves refund issuance off", () => {
    const plan = planFulfillmentChange({
      paymentStatus: "paid",
      from: "unfulfilled",
      to: "cancelled",
      ...tracking,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.issueRefund).toBe(false);
    expect(plan.events.map((event) => event.type)).toEqual([
      "fulfillment_cancelled",
    ]);
    expect(plan.setCancelledAt).toBe(true);
  });
});

describe("8. partial and full refunds", () => {
  it("keeps fulfillment untouched and sets payment from succeeded amounts", () => {
    expect(
      paymentStatusAfterRefunds({
        current: "paid",
        totalCents: 3600,
        succeededRefundCents: 1000,
      })
    ).toBe("partially_refunded");
    expect(
      paymentStatusAfterRefunds({
        current: "paid",
        totalCents: 3600,
        succeededRefundCents: 3600,
      })
    ).toBe("refunded");
    expect(
      paymentStatusAfterRefunds({
        current: "paid",
        totalCents: 3600,
        succeededRefundCents: 0,
      })
    ).toBe("paid");
    expect(planRefundActivity(null, "pending")).toBe("refund_initiated");
    expect(planRefundActivity("pending", "succeeded")).toBe("refund_confirmed");
    expect(planRefundActivity("succeeded", "succeeded")).toBeNull();

    const stillShipped = planFulfillmentChange({
      paymentStatus: "refunded",
      from: "shipped",
      to: "delivered",
      currentTracking: "1Z999",
      currentCarrier: "UPS",
      shippingNotifiedAt: "2026-10-23T00:00:00.000Z",
    });
    expect(stillShipped.ok).toBe(true);
  });
});

describe("9. duplicate Stripe webhook events", () => {
  it("ignores an event that was already processed", () => {
    expect(
      planStripeEvent({
        alreadyProcessed: true,
        type: "checkout.session.completed",
        paymentStatus: "paid",
      })
    ).toEqual({ kind: "duplicate" });
  });

  it("does not treat an unpaid completed session as paid", () => {
    expect(
      planStripeEvent({
        alreadyProcessed: false,
        type: "checkout.session.completed",
        paymentStatus: "unpaid",
      })
    ).toEqual({ kind: "checkout", outcome: "pending" });
    expect(
      planStripeEvent({
        alreadyProcessed: false,
        type: "checkout.session.completed",
        paymentStatus: "paid",
      })
    ).toEqual({ kind: "checkout", outcome: "paid" });
    expect(
      planStripeEvent({
        alreadyProcessed: false,
        type: "checkout.session.async_payment_failed",
      })
    ).toEqual({ kind: "checkout", outcome: "failed" });
    expect(
      planStripeEvent({
        alreadyProcessed: false,
        type: "payment_intent.payment_failed",
      })
    ).toEqual({ kind: "payment_failed" });
    expect(
      planStripeEvent({
        alreadyProcessed: false,
        type: "refund.updated",
      })
    ).toEqual({ kind: "refund" });
  });
});

describe("10. failed shipment email does not roll back shipment", () => {
  it("keeps the shipped plan when email delivery fails", () => {
    const plan = planFulfillmentChange({
      paymentStatus: "paid",
      from: "processing",
      to: "shipped",
      trackingNumber: "1Z999",
      shippingCarrier: "UPS",
      currentTracking: "",
      currentCarrier: "",
      shippingNotifiedAt: null,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.rollbackOnEmailFailure).toBe(false);
    expect(plan.fulfillmentStatus).toBe("shipped");
    expect(plan.trackingNumber).toBe("1Z999");
  });
});

describe("11. existing orders still display", () => {
  it("presents a legacy order that has no new timestamp fields", () => {
    const legacy: Pick<
      ShopOrder,
      | "id"
      | "shippingName"
      | "items"
      | "paymentStatus"
      | "fulfillmentStatus"
      | "totalCents"
      | "createdAt"
    > = {
      id: "5cc9e4f3-1111-4111-8111-111111111111",
      shippingName: "Listener",
      items: [
        {
          productId: "p",
          productName: "cool shirt",
          size: "M",
          quantity: 1,
          unitPriceCents: 3600,
        },
      ],
      paymentStatus: "paid",
      fulfillmentStatus: "unfulfilled",
      totalCents: 3600,
      createdAt: "2026-10-22T18:00:00.000Z",
    };
    const view = presentStoredOrder(legacy);
    expect(shortOrderId(view.id)).toBe("5CC9E4F3");
    expect(view.summary).toBe(productSummary(legacy.items));
    expect(view.summary).toBe("cool shirt · M × 1");
    expect(paymentLabel(view.paymentStatus)).toBe("Paid");
    expect(fulfillmentLabel(view.fulfillmentStatus)).toBe("Unfulfilled");
    expect(view.shippedAt).toBeNull();
    expect(view.amountRefundedCents).toBe(0);
    expect(
      orderMatchesFilters(view, "unfulfilled", "paid")
    ).toBe(true);
    expect(summarizeOrders([view]).awaitingFulfillment).toBe(1);
    expect(summarizeOrders([view]).total).toBe(1);
  });
});
