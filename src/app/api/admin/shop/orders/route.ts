import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AdminAuthError,
  requireAdminFromRequest,
} from "@/app/lib/shop/admin-auth";
import { listOrders, updateOrderRecord } from "@/app/lib/shop/db";

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "paid", "shipped", "cancelled"]).optional(),
  trackingNumber: z.string().optional(),
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

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const json = await request.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const order = await updateOrderRecord(parsed.data.id, {
      status: parsed.data.status,
      trackingNumber: parsed.data.trackingNumber,
    });
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/shop/orders PATCH]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
