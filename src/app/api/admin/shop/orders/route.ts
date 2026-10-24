import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AdminAuthError,
  requireAdminFromRequest,
} from "@/app/lib/shop/admin-auth";
import {
  createTestOrder,
  listOrders,
  OrderActionError,
  retryShippingNotification,
  updateFulfillmentRecord,
} from "@/app/lib/shop/db";

const fulfillmentSchema = z.object({
  id: z.string().uuid(),
  fulfillmentStatus: z.enum([
    "unfulfilled",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  trackingNumber: z.string().optional(),
  shippingCarrier: z.string().optional(),
});

const retrySchema = z.object({
  id: z.string().uuid(),
  action: z.literal("retry_shipping_email"),
});

const createTestSchema = z.object({
  productId: z.string().uuid().optional(),
});

function adminError(error: unknown, fallback: string) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof OrderActionError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[admin/shop/orders]", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    return adminError(error, "Failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const json = await request.json().catch(() => ({}));
    const parsed = createTestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const order = await createTestOrder(parsed.data.productId);
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof OrderActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "";
    if (message === "Add a product first") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("[admin/shop/orders POST]", error);
    return NextResponse.json({ error: "Failed to create test order" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);
    const json = await request.json();
    const retry = retrySchema.safeParse(json);
    if (retry.success) {
      const order = await retryShippingNotification(retry.data.id, admin.email);
      return NextResponse.json({ order });
    }
    const parsed = fulfillmentSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const order = await updateFulfillmentRecord(parsed.data.id, {
      fulfillmentStatus: parsed.data.fulfillmentStatus,
      trackingNumber: parsed.data.trackingNumber,
      shippingCarrier: parsed.data.shippingCarrier,
      actor: "admin",
      adminEmail: admin.email,
    });
    return NextResponse.json({ order });
  } catch (error) {
    return adminError(error, "Failed to update order");
  }
}
