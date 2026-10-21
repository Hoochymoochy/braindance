import { getDbClient } from "@/app/lib/listener-profile/db";
import { notifyOrderConfirmation, notifyOrderShipped } from "./notify";
import { canTransitionFulfillment } from "./order-utils";
import type {
  FulfillmentStatus,
  OrderEventType,
  PaymentStatus,
  ProductSize,
  ProductStatus,
  ShopOrder,
  ShopOrderEvent,
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
  cover_image_url: string | null;
  gallery_image_urls: string[] | null;
  status: ProductStatus;
  inventory_by_size: Record<string, number>;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  email: string;
  shipping_name: string;
  shipping_line1: string;
  shipping_city: string;
  shipping_region: string;
  shipping_postal: string;
  shipping_country: string;
  total_cents: number;
  tracking_number: string | null;
  shipping_carrier: string | null;
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

type OrderEventRow = {
  id: string;
  order_id: string;
  event_type: string;
  description: string;
  actor: string;
  created_at: string;
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
    coverImageUrl: row.cover_image_url ?? null,
    galleryImageUrls: row.gallery_image_urls ?? [],
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
  coverImageUrl?: string | null;
  galleryImageUrls?: string[];
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
    cover_image_url: input.coverImageUrl ?? null,
    gallery_image_urls: input.galleryImageUrls ?? [],
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

async function recordOrderEvent(input: {
  orderId: string;
  eventType: OrderEventType;
  description: string;
  actor: string;
  /** Skip insert if this event type already exists for the order (webhook retries). */
  uniqueByType?: boolean;
}): Promise<void> {
  const db = getDbClient();
  if (input.uniqueByType) {
    const { data: existing } = await db
      .from("shop_order_events")
      .select("id")
      .eq("order_id", input.orderId)
      .eq("event_type", input.eventType)
      .maybeSingle();
    if (existing) return;
  }
  const { error } = await db.from("shop_order_events").insert({
    order_id: input.orderId,
    event_type: input.eventType,
    description: input.description,
    actor: input.actor,
  });
  if (error) throw error;
}

async function listOrderEvents(
  orderIds: string[]
): Promise<Map<string, ShopOrderEvent[]>> {
  const map = new Map<string, ShopOrderEvent[]>();
  if (orderIds.length === 0) return map;
  const db = getDbClient();
  const { data, error } = await db
    .from("shop_order_events")
    .select("*")
    .in("order_id", orderIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  for (const row of (data || []) as OrderEventRow[]) {
    const list = map.get(row.order_id) ?? [];
    list.push({
      id: row.id,
      orderId: row.order_id,
      eventType: row.event_type,
      description: row.description,
      actor: row.actor,
      createdAt: row.created_at,
    });
    map.set(row.order_id, list);
  }
  return map;
}

function mapOrderRow(
  row: OrderRow,
  items: ShopOrderItem[],
  events: ShopOrderEvent[]
): ShopOrder {
  return {
    id: row.id,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    email: row.email,
    items,
    shippingName: row.shipping_name,
    shippingLine1: row.shipping_line1,
    shippingCity: row.shipping_city,
    shippingRegion: row.shipping_region,
    shippingPostal: row.shipping_postal,
    shippingCountry: row.shipping_country,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    trackingNumber: row.tracking_number ?? undefined,
    shippingCarrier: row.shipping_carrier ?? undefined,
    events,
  };
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

  const productIds = [
    ...new Set(
      ((items || []) as OrderItemRow[])
        .map((i) => i.product_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const coverByProduct = new Map<string, string | null>();
  if (productIds.length > 0) {
    const { data: products } = await db
      .from("shop_products")
      .select("id, cover_image_url")
      .in("id", productIds);
    for (const p of (products || []) as {
      id: string;
      cover_image_url: string | null;
    }[]) {
      coverByProduct.set(p.id, p.cover_image_url);
    }
  }

  const byOrder = new Map<string, ShopOrderItem[]>();
  for (const row of (items || []) as (OrderItemRow & { order_id: string })[]) {
    const list = byOrder.get(row.order_id) ?? [];
    list.push({
      productId: row.product_id ?? "",
      productName: row.product_name,
      size: row.size as ProductSize,
      quantity: row.quantity,
      unitPriceCents: row.unit_price_cents,
      imageUrl: row.product_id
        ? coverByProduct.get(row.product_id) ?? null
        : null,
    });
    byOrder.set(row.order_id, list);
  }

  const eventsByOrder = await listOrderEvents(ids);

  return orderRows.map((row) =>
    mapOrderRow(row, byOrder.get(row.id) ?? [], eventsByOrder.get(row.id) ?? [])
  );
}

export async function getOrderById(id: string): Promise<ShopOrder | null> {
  const all = await listOrders();
  return all.find((o) => o.id === id) ?? null;
}

export async function updateFulfillmentRecord(
  id: string,
  patch: {
    fulfillmentStatus: FulfillmentStatus;
    trackingNumber?: string;
    shippingCarrier?: string;
    actor?: string;
  }
): Promise<ShopOrder> {
  const current = await getOrderById(id);
  if (!current) throw new Error("Order not found");

  if (current.paymentStatus !== "paid") {
    throw new Error("Payment must be confirmed before fulfillment updates");
  }

  const nextStatus = patch.fulfillmentStatus;
  if (!canTransitionFulfillment(current.fulfillmentStatus, nextStatus)) {
    throw new Error(
      `Cannot change fulfillment from ${current.fulfillmentStatus} to ${nextStatus}`
    );
  }

  const trackingNumber =
    patch.trackingNumber !== undefined
      ? patch.trackingNumber.trim()
      : current.trackingNumber ?? "";
  const shippingCarrier =
    patch.shippingCarrier !== undefined
      ? patch.shippingCarrier.trim()
      : current.shippingCarrier ?? "";

  if (nextStatus === "shipped") {
    if (!trackingNumber) {
      throw new Error("Tracking number is required to mark shipped");
    }
    if (!shippingCarrier) {
      throw new Error("Carrier is required to mark shipped");
    }
  }

  const db = getDbClient();
  const { error } = await db
    .from("shop_orders")
    .update({
      fulfillment_status: nextStatus,
      tracking_number: trackingNumber || null,
      shipping_carrier: shippingCarrier || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;

  const actor = patch.actor ?? "admin";
  const statusChanged = nextStatus !== current.fulfillmentStatus;
  const trackingChanged =
    trackingNumber !== (current.trackingNumber ?? "") ||
    shippingCarrier !== (current.shippingCarrier ?? "");

  if (statusChanged && nextStatus === "processing") {
    await recordOrderEvent({
      orderId: id,
      eventType: "fulfillment_started",
      description: "Fulfillment started",
      actor,
    });
  }
  if (
    trackingChanged &&
    trackingNumber &&
    (nextStatus === "shipped" || nextStatus === "processing")
  ) {
    await recordOrderEvent({
      orderId: id,
      eventType: "tracking_added",
      description: shippingCarrier
        ? `Tracking added · ${shippingCarrier} ${trackingNumber}`
        : `Tracking added · ${trackingNumber}`,
      actor,
    });
  }
  if (statusChanged && nextStatus === "shipped") {
    await recordOrderEvent({
      orderId: id,
      eventType: "order_shipped",
      description: `Order shipped via ${shippingCarrier}`,
      actor,
    });
  }
  if (statusChanged && nextStatus === "delivered") {
    await recordOrderEvent({
      orderId: id,
      eventType: "order_delivered",
      description: "Order delivered",
      actor,
    });
  }
  if (statusChanged && nextStatus === "cancelled") {
    await recordOrderEvent({
      orderId: id,
      eventType: "order_cancelled",
      description: "Fulfillment cancelled",
      actor,
    });
  }

  const updated = await getOrderById(id);
  if (!updated) throw new Error("Order updated but could not be loaded");

  if (statusChanged && nextStatus === "shipped") {
    notifyOrderShipped(updated);
  }

  return updated;
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
  if (existing) {
    // Idempotent retry: ensure payment confirmed event exists
    await recordOrderEvent({
      orderId: existing.id,
      eventType: "payment_confirmed",
      description: "Payment confirmed",
      actor: "stripe",
      uniqueByType: true,
    });
    return existing.id;
  }

  const { data: order, error } = await db
    .from("shop_orders")
    .insert({
      payment_status: "paid",
      fulfillment_status: "unfulfilled",
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

  // Decrement inventory once per successful payment (session-idempotent above)
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

  await recordOrderEvent({
    orderId,
    eventType: "order_created",
    description: "Order created",
    actor: "stripe",
    uniqueByType: true,
  });
  await recordOrderEvent({
    orderId,
    eventType: "payment_confirmed",
    description: "Payment confirmed",
    actor: "stripe",
    uniqueByType: true,
  });

  const created = await getOrderById(orderId);
  if (created) {
    notifyOrderConfirmation(created);
  }

  return orderId;
}

/** Admin-only: seed a paid unfulfilled order for fulfillment UI testing. */
export async function createTestOrder(productId?: string): Promise<ShopOrder> {
  const products = await listProducts();
  if (products.length === 0) {
    throw new Error("Add a product first");
  }

  const product =
    (productId ? products.find((p) => p.id === productId) : null) ??
    products.find((p) => p.status === "active") ??
    products[0];

  const size =
    product.sizes.find((s) => (product.inventoryBySize[s] ?? 0) > 0) ??
    product.sizes[0] ??
    ("M" as ProductSize);

  const db = getDbClient();
  const { data: order, error } = await db
    .from("shop_orders")
    .insert({
      payment_status: "paid",
      fulfillment_status: "unfulfilled",
      email: "test@braindance.local",
      shipping_name: "Test Listener",
      shipping_line1: "123 Warehouse Ave",
      shipping_city: "Denver",
      shipping_region: "CO",
      shipping_postal: "80202",
      shipping_country: "US",
      total_cents: product.priceCents,
      currency: product.currency,
      stripe_checkout_session_id: null,
      stripe_payment_intent_id: null,
    })
    .select("*")
    .single();
  if (error) throw error;

  const orderId = (order as OrderRow).id;
  const { error: itemError } = await db.from("shop_order_items").insert({
    order_id: orderId,
    product_id: product.id,
    product_name: product.name,
    size,
    quantity: 1,
    unit_price_cents: product.priceCents,
  });
  if (itemError) throw itemError;

  await recordOrderEvent({
    orderId,
    eventType: "order_created",
    description: "Order created",
    actor: "admin",
    uniqueByType: true,
  });
  await recordOrderEvent({
    orderId,
    eventType: "payment_confirmed",
    description: "Payment confirmed (test order)",
    actor: "admin",
    uniqueByType: true,
  });

  const created = await getOrderById(orderId);
  if (!created) throw new Error("Order created but could not be loaded");
  notifyOrderConfirmation(created);
  return created;
}
