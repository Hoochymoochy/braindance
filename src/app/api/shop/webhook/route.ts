import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfillCheckoutSession } from "@/app/lib/shop/fulfillment";
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

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[shop/webhook] signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillCheckoutSession(session);
        break;
      }
      case "checkout.session.async_payment_failed": {
        console.warn(
          "[shop/webhook] async payment failed",
          (event.data.object as Stripe.Checkout.Session).id
        );
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[shop/webhook] fulfill", error);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
