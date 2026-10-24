import type Stripe from "stripe";
import {
  applyStripeRefund,
  hasStripeEvent,
  markPaymentFailedByIntent,
  rememberStripeEvent,
} from "./db";
import { ingestCheckoutSession } from "./fulfillment";
import { planStripeEvent } from "./order-policy";

function paymentIntentId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }
  return null;
}

export async function handleShopStripeEvent(event: Stripe.Event): Promise<void> {
  const paymentStatus =
    "payment_status" in event.data.object
      ? ((event.data.object as { payment_status?: string | null }).payment_status ??
        null)
      : null;
  const plan = planStripeEvent({
    alreadyProcessed: await hasStripeEvent(event.id),
    type: event.type,
    paymentStatus,
  });

  if (plan.kind === "duplicate") return;

  if (plan.kind === "checkout") {
    await ingestCheckoutSession(
      event.data.object as Stripe.Checkout.Session,
      plan.outcome
    );
  } else if (plan.kind === "payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    if (intent.id) await markPaymentFailedByIntent(intent.id);
  } else if (plan.kind === "refund") {
    const refund = event.data.object as Stripe.Refund;
    await applyStripeRefund({
      refundId: refund.id,
      amountCents: refund.amount,
      status: refund.status ?? "pending",
      paymentIntentId: paymentIntentId(refund.payment_intent),
      currency: refund.currency || "usd",
    });
  }

  await rememberStripeEvent(event.id, event.type);
}
