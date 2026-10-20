import { NextRequest, NextResponse } from "next/server";
import {
  AdminAuthError,
  requireAdminFromRequest,
} from "@/app/lib/shop/admin-auth";
import { deleteProductRecord } from "@/app/lib/shop/db";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    await deleteProductRecord(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/shop/products DELETE]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
