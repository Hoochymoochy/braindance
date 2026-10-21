import { NextResponse } from "next/server";
import { listProducts } from "@/app/lib/shop/db";

export async function GET() {
  try {
    const products = await listProducts({ activeOnly: true });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[shop/products]", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}
