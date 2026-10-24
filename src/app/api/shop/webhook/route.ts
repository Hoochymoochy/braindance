import { NextRequest, NextResponse } from "next/server";
import { handleShopStripeEvent } from "@/app/lib/shop/stripe-sync";
import { getStripe } from "@/app/lib/shop/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[shop/webhook] signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleShopStripeEvent(event);
  } catch (error) {
    console.error("[shop/webhook] sync", error);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
