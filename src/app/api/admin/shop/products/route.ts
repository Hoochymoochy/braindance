import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AdminAuthError,
  requireAdminFromRequest,
} from "@/app/lib/shop/admin-auth";
import {
  listProducts,
  upsertProductRecord,
  updateProductStripeIds,
} from "@/app/lib/shop/db";
import { ensureStripePrice } from "@/app/lib/shop/stripe";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().default(""),
  description: z.string().default(""),
  priceCents: z.number().int().min(0),
  currency: z.literal("usd").default("usd"),
  sizes: z.array(z.string()).min(1),
  accentFrom: z.string().min(1),
  accentTo: z.string().min(1),
  coverImageUrl: z.union([z.string().url(), z.null()]).optional(),
  galleryImageUrls: z.array(z.string().url()).max(8).optional().default([]),
  status: z.enum(["draft", "active", "archived"]),
  inventoryBySize: z.record(z.number().int().min(0)),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const products = await listProducts();
    return NextResponse.json({ products });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/shop/products GET]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const json = await request.json();
    const parsed = productSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid product", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;
    let product = await upsertProductRecord({
      ...input,
      sizes: input.sizes as never,
      inventoryBySize: input.inventoryBySize as never,
    });

    if (process.env.STRIPE_SECRET_KEY && product.status !== "archived") {
      try {
        const synced = await ensureStripePrice({
          id: product.id,
          name: product.name,
          description: product.description,
          priceCents: product.priceCents,
          currency: product.currency,
          stripeProductId: product.stripeProductId ?? null,
          stripePriceId: product.stripePriceId ?? null,
        });
        await updateProductStripeIds(
          product.id,
          synced.stripeProductId,
          synced.stripePriceId
        );
        product = {
          ...product,
          stripeProductId: synced.stripeProductId,
          stripePriceId: synced.stripePriceId,
        };
      } catch (stripeErr) {
        console.error("[admin/shop/products] stripe sync", stripeErr);
      }
    }

    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/shop/products POST]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
