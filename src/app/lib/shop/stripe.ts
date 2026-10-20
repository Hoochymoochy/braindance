import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      typescript: true,
    });
  }
  return stripeClient;
}

export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.VERCEL_URL;
  if (fromEnv) {
    return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
  }
  return "http://localhost:3000";
}

/** Ensure a Stripe Product + Price exist for this catalog row; return price id. */
export async function ensureStripePrice(product: {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
}): Promise<{ stripeProductId: string; stripePriceId: string }> {
  const stripe = getStripe();
  let stripeProductId = product.stripeProductId;
  let stripePriceId = product.stripePriceId;

  if (!stripeProductId) {
    const created = await stripe.products.create({
      name: product.name,
      description: product.description || undefined,
      metadata: { shop_product_id: product.id },
    });
    stripeProductId = created.id;
  } else {
    await stripe.products.update(stripeProductId, {
      name: product.name,
      description: product.description || undefined,
      metadata: { shop_product_id: product.id },
    });
  }

  let needsNewPrice = !stripePriceId;
  if (stripePriceId) {
    const existing = await stripe.prices.retrieve(stripePriceId);
    if (
      existing.unit_amount !== product.priceCents ||
      existing.currency !== product.currency.toLowerCase() ||
      existing.product !== stripeProductId
    ) {
      needsNewPrice = true;
      if (existing.active) {
        await stripe.prices.update(stripePriceId, { active: false });
      }
    }
  }

  if (needsNewPrice) {
    const price = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: product.priceCents,
      currency: product.currency.toLowerCase(),
      metadata: { shop_product_id: product.id },
    });
    stripePriceId = price.id;
  }

  return { stripeProductId, stripePriceId: stripePriceId! };
}
