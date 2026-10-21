import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import {
  getProductById,
  updateProductStripeIds,
} from "@/app/lib/shop/db";
import { ensureStripePrice, getSiteUrl, getStripe } from "@/app/lib/shop/stripe";
import type { ProductSize } from "@/app/lib/shop/types";

const bodySchema = z.object({
  productId: z.string().uuid(),
  size: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured (STRIPE_SECRET_KEY)" },
        { status: 503 }
      );
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { productId, size } = parsed.data;
    const product = await getProductById(productId);
    if (!product || product.status !== "active") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.sizes.includes(size as ProductSize)) {
      return NextResponse.json({ error: "Invalid size" }, { status: 400 });
    }

    const stock = product.inventoryBySize[size as ProductSize] ?? 0;
    if (stock <= 0) {
      return NextResponse.json({ error: "Sold out" }, { status: 409 });
    }

    const { stripeProductId, stripePriceId } = await ensureStripePrice({
      id: product.id,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      currency: product.currency,
      stripeProductId: product.stripeProductId ?? null,
      stripePriceId: product.stripePriceId ?? null,
    });

    if (
      stripeProductId !== product.stripeProductId ||
      stripePriceId !== product.stripePriceId
    ) {
      await updateProductStripeIds(product.id, stripeProductId, stripePriceId);
    }

    const siteUrl = getSiteUrl();
    const stripe = getStripe();
    const integrationSuffix = Math.random().toString(36).slice(2, 10);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${siteUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop/${product.slug}?canceled=1`,
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      metadata: {
        shop_product_id: product.id,
        product_name: product.name,
        size,
        quantity: "1",
        unit_price_cents: String(product.priceCents),
      },
      integration_identifier: `braindance_merch_${integrationSuffix}`,
    } as Stripe.Checkout.SessionCreateParams & {
      integration_identifier?: string;
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session missing URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("[shop/checkout]", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 }
    );
  }
}
