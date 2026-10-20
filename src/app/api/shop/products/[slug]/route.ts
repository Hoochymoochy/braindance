import { NextResponse } from "next/server";
import { getProductBySlug } from "@/app/lib/shop/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug);
    if (!product || product.status !== "active") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[shop/products/slug]", error);
    return NextResponse.json(
      { error: "Failed to load product" },
      { status: 500 }
    );
  }
}
