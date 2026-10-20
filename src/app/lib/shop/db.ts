import { getDbClient } from "@/app/lib/listener-profile/db";
import type {
  OrderStatus,
  ProductSize,
  ProductStatus,
  ShopOrder,
  ShopOrderItem,
  ShopProduct,
} from "./types";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price_cents: number;
  currency: string;
  sizes: string[];
  accent_from: string;
  accent_to: string;
  status: ProductStatus;
  inventory_by_size: Record<string, number>;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  status: OrderStatus;
  email: string;
  shipping_name: string;
  shipping_line1: string;
  shipping_city: string;
  shipping_region: string;
  shipping_postal: string;
  shipping_country: string;
  total_cents: number;
  tracking_number: string | null;
  created_at: string;
  stripe_checkout_session_id: string | null;
};

type OrderItemRow = {
  product_id: string | null;
  product_name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
};

export function mapProduct(row: ProductRow): ShopProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    priceCents: row.price_cents,
    currency: (row.currency as "usd") || "usd",
    sizes: (row.sizes || []) as ProductSize[],
    accentFrom: row.accent_from,
    accentTo: row.accent_to,
    status: row.status,
    inventoryBySize: (row.inventory_by_size || {}) as Partial<
      Record<ProductSize, number>
    >,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stripeProductId: row.stripe_product_id,
    stripePriceId: row.stripe_price_id,
  };
}

export async function listProducts(opts?: {
  activeOnly?: boolean;
}): Promise<ShopProduct[]> {
  const db = getDbClient();
  let query = db.from("shop_products").select("*").order("created_at", {
    ascending: true,
  });
  if (opts?.activeOnly) {
    query = query.eq("status", "active");
  }
  const { data, error } = await query;
  if (error) throw error;
  return ((data || []) as ProductRow[]).map(mapProduct);
}

export async function getProductBySlug(
  slug: string
): Promise<ShopProduct | null> {
  const db = getDbClient();
  const { data, error } = await db
    .from("shop_products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as ProductRow) : null;
}

export async function getProductById(
  id: string
): Promise<ShopProduct | null> {
  const db = getDbClient();
  const { data, error } = await db
    .from("shop_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as ProductRow) : null;
}

export async function upsertProductRecord(input: {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  currency?: string;
  sizes: ProductSize[];
  accentFrom: string;
  accentTo: string;
  status: ProductStatus;
  inventoryBySize: Partial<Record<ProductSize, number>>;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
}): Promise<ShopProduct> {
  const db = getDbClient();
  const now = new Date().toISOString();
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    slug: input.slug,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    price_cents: input.priceCents,
    currency: input.currency ?? "usd",
    sizes: input.sizes,
    accent_from: input.accentFrom,
    accent_to: input.accentTo,
    status: input.status,
    inventory_by_size: input.inventoryBySize,
    stripe_product_id: input.stripeProductId ?? null,
    stripe_price_id: input.stripePriceId ?? null,
    updated_at: now,
  };

  const { data, error } = await db
    .from("shop_products")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return mapProduct(data as ProductRow);
}

export async function deleteProductRecord(id: string): Promise<void> {
  const db = getDbClient();
  const { error } = await db.from("shop_products").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProductStripeIds(
  id: string,
  stripeProductId: string,
  stripePriceId: string
): Promise<void> {
  const db = getDbClient();
  const { error } = await db
    .from("shop_products")
    .update({
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function listOrders(): Promise<ShopOrder[]> {
  const db = getDbClient();
  const { data: orders, error } = await db
    .from("shop_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const orderRows = (orders || []) as OrderRow[];
  if (orderRows.length === 0) return [];

  const ids = orderRows.map((o) => o.id);
  const { data: items, error: itemsError } = await db
    .from("shop_order_items")
    .select("*")
    .in("order_id", ids);
  if (itemsError) throw itemsError;

  const byOrder = new Map<string, ShopOrderItem[]>();
  for (const row of (items || []) as (OrderItemRow & { order_id: string })[]) {
    const list = byOrder.get(row.order_id) ?? [];
    list.push({
      productId: row.product_id ?? "",
      productName: row.product_name,
      size: row.size as ProductSize,
      quantity: row.quantity,
      unitPriceCents: row.unit_price_cents,
    });
    byOrder.set(row.order_id, list);
  }

  return orderRows.map((row) => ({
    id: row.id,
    status: row.status,
    email: row.email,
    items: byOrder.get(row.id) ?? [],
    shippingName: row.shipping_name,
    shippingLine1: row.shipping_line1,
    shippingCity: row.shipping_city,
    shippingRegion: row.shipping_region,
    shippingPostal: row.shipping_postal,
    shippingCountry: row.shipping_country,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    trackingNumber: row.tracking_number ?? undefined,
  }));
}

export async function updateOrderRecord(
  id: string,
  patch: { status?: OrderStatus; trackingNumber?: string }
): Promise<ShopOrder | null> {
  const db = getDbClient();
  const { error } = await db
    .from("shop_orders")
    .update({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.trackingNumber !== undefined
        ? { tracking_number: patch.trackingNumber }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  const all = await listOrders();
  return all.find((o) => o.id === id) ?? null;
}

export async function findOrderByCheckoutSession(
  sessionId: string
): Promise<{ id: string } | null> {
  const db = getDbClient();
  const { data, error } = await db
    .from("shop_orders")
    .select("id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string } | null;
}

export async function createPaidOrderFromCheckout(input: {
  sessionId: string;
  paymentIntentId: string | null;
  email: string;
  totalCents: number;
  currency: string;
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostal: string;
  shippingCountry: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
}): Promise<string> {
  const db = getDbClient();
  const existing = await findOrderByCheckoutSession(input.sessionId);
  if (existing) return existing.id;

  const { data: order, error } = await db
    .from("shop_orders")
    .insert({
      status: "paid",
      email: input.email,
      shipping_name: input.shippingName,
      shipping_line1: input.shippingLine1,
      shipping_city: input.shippingCity,
      shipping_region: input.shippingRegion,
      shipping_postal: input.shippingPostal,
      shipping_country: input.shippingCountry,
      total_cents: input.totalCents,
      currency: input.currency,
      stripe_checkout_session_id: input.sessionId,
      stripe_payment_intent_id: input.paymentIntentId,
    })
    .select("id")
    .single();
  if (error) throw error;

  const orderId = (order as { id: string }).id;
  const { error: itemError } = await db.from("shop_order_items").insert({
    order_id: orderId,
    product_id: input.productId || null,
    product_name: input.productName,
    size: input.size,
    quantity: input.quantity,
    unit_price_cents: input.unitPriceCents,
  });
  if (itemError) throw itemError;

  // Decrement inventory for size
  const product = await getProductById(input.productId);
  if (product) {
    const nextInv = { ...product.inventoryBySize };
    const current = nextInv[input.size as ProductSize] ?? 0;
    nextInv[input.size as ProductSize] = Math.max(0, current - input.quantity);
    await db
      .from("shop_products")
      .update({
        inventory_by_size: nextInv,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.productId);
  }

  return orderId;
}
