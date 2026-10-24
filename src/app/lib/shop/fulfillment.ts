import type Stripe from "stripe";
import { syncCheckoutOrder } from "./db";

type ShippingBits = {
  name?: string | null;
  address?: {
    line1?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
};

function readShipping(session: Stripe.Checkout.Session): ShippingBits {
  const collected = session.collected_information?.shipping_details;
  if (collected) return collected;

  const legacy = (
    session as Stripe.Checkout.Session & { shipping_details?: ShippingBits | null }
  ).shipping_details;
  return legacy ?? {};
}

export async function ingestCheckoutSession(
  session: Stripe.Checkout.Session,
  outcome: "pending" | "paid" | "failed"
): Promise<void> {
  const meta = session.metadata || {};
  const productId = meta.shop_product_id || "";
  const productName = meta.product_name || "Merch";
  const size = meta.size || "M";
  const quantity = Number.parseInt(meta.quantity || "1", 10) || 1;
  const unitPriceCents = Number.parseInt(meta.unit_price_cents || "0", 10) || 0;

  const shipping = readShipping(session);
  const address = shipping.address;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  await syncCheckoutOrder({
    outcome,
    sessionId: session.id,
    paymentIntentId,
    email:
      session.customer_details?.email ||
      session.customer_email ||
      "unknown@example.com",
    totalCents: session.amount_total ?? unitPriceCents * quantity,
    currency: session.currency || "usd",
    shippingName: shipping.name || "",
    shippingLine1: address?.line1 || "",
    shippingCity: address?.city || "",
    shippingRegion: address?.state || "",
    shippingPostal: address?.postal_code || "",
    shippingCountry: address?.country || "",
    productId,
    productName,
    size,
    quantity,
    unitPriceCents,
  });
}

/** @deprecated Prefer ingestCheckoutSession with an explicit outcome. */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required"
  ) {
    await ingestCheckoutSession(session, "paid");
    return;
  }
  if (session.payment_status === "unpaid") {
    await ingestCheckoutSession(session, "pending");
  }
}
