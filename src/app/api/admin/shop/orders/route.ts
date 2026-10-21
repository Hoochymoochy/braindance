import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AdminAuthError,
  requireAdminFromRequest,
} from "@/app/lib/shop/admin-auth";
import {
  createTestOrder,
  listOrders,
  updateFulfillmentRecord,
} from "@/app/lib/shop/db";

const patchSchema = z.object({
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

const createTestSchema = z.object({
  productId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/shop/orders GET]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
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
    const message =
      error instanceof Error ? error.message : "Failed to create test order";
    console.error("[admin/shop/orders POST]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);
    const json = await request.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const order = await updateFulfillmentRecord(parsed.data.id, {
      fulfillmentStatus: parsed.data.fulfillmentStatus,
      trackingNumber: parsed.data.trackingNumber,
      shippingCarrier: parsed.data.shippingCarrier,
      actor: `admin:${admin.email}`,
    });
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message =
      error instanceof Error ? error.message : "Failed to update order";
    console.error("[admin/shop/orders PATCH]", error);
    const status =
      message.includes("must be confirmed") ||
      message.includes("Cannot change") ||
      message.includes("required")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
