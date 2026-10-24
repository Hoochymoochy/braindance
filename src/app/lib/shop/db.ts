import { getDbClient } from "@/app/lib/listener-profile/db";
import { notifyOrderConfirmation, sendShippingNotification } from "./notify";
import {
  OrderActionError,
  paymentFailureStatus,
  paymentStatusAfterRefunds,
  planFulfillmentChange,
  planRefundActivity,
} from "./order-policy";
import type {
  FulfillmentStatus,
  OrderActor,
  OrderEventType,
  PaymentStatus,
  ProductSize,
  ProductStatus,
  ShopOrder,
  ShopOrderEvent,
  ShopOrderItem,
  ShopProduct,
} from "./types";

export { OrderActionError };

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
  currency: string;
  created_at: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  amount_refunded_cents: number | null;
  shipping_notified_at: string | null;
  shipping_notify_error: string | null;
  inventory_adjusted: boolean | null;
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
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" || /duplicate key/i.test(error.message || "");
}

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
  actor: OrderActor | string;
  metadata?: Record<string, unknown>;
  /** Skip insert if this event type already exists for the order (webhook retries). */
  uniqueByType?: boolean;
  /** Ignore unique-index conflicts (refund ids, retried webhooks). */
  ignoreUnique?: boolean;
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
    metadata: input.metadata ?? {},
  });
  if (error) {
    if (input.ignoreUnique && isUniqueViolation(error)) return;
    throw error;
  }
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
      metadata: row.metadata ?? {},
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
    currency: row.currency || "usd",
    createdAt: row.created_at,
    trackingNumber: row.tracking_number ?? undefined,
    shippingCarrier: row.shipping_carrier ?? undefined,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    amountRefundedCents: row.amount_refunded_cents ?? 0,
    shippingNotifiedAt: row.shipping_notified_at,
    shippingNotifyError: row.shipping_notify_error,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    events,
  };
}

async function hydrateOrderRows(orderRows: OrderRow[]): Promise<ShopOrder[]> {
  if (orderRows.length === 0) return [];
  const db = getDbClient();
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

export async function listOrders(): Promise<ShopOrder[]> {
  const db = getDbClient();
  const { data: orders, error } = await db
    .from("shop_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return hydrateOrderRows((orders || []) as OrderRow[]);
}

export async function getOrderById(id: string): Promise<ShopOrder | null> {
  const db = getDbClient();
  const { data, error } = await db
    .from("shop_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [order] = await hydrateOrderRows([data as OrderRow]);
  return order ?? null;
}

async function loadOrderOrThrow(id: string): Promise<ShopOrder> {
  const order = await getOrderById(id);
  if (!order) throw new OrderActionError("Order not found", 404);
  return order;
}

async function deliverShippingEmail(
  orderId: string,
  order: ShopOrder,
  metadata: Record<string, unknown> = {}
): Promise<ShopOrder> {
  const latest = await getOrderById(orderId);
  if (latest?.shippingNotifiedAt) return latest;

  const result = await sendShippingNotification(latest ?? order);
  const db = getDbClient();
  if (result.ok) {
    const { error } = await db
      .from("shop_orders")
      .update({
        shipping_notified_at: new Date().toISOString(),
        shipping_notify_error: null,
      })
      .eq("id", orderId)
      .is("shipping_notified_at", null);
    if (error) throw error;
    await recordOrderEvent({
      orderId,
      eventType: "shipping_notification_sent",
      description: "Shipping notification sent",
      actor: "system",
      metadata,
      uniqueByType: true,
    });
    return (await getOrderById(orderId)) ?? order;
  }

  await db
    .from("shop_orders")
    .update({ shipping_notify_error: result.error })
    .eq("id", orderId);
  await recordOrderEvent({
    orderId,
    eventType: "shipping_notification_failed",
    description: "Shipping notification failed",
    actor: "system",
    metadata: { ...metadata, error: result.error },
  });
  return (await getOrderById(orderId)) ?? order;
}

export async function updateFulfillmentRecord(
  id: string,
  patch: {
    fulfillmentStatus: FulfillmentStatus;
    trackingNumber?: string;
    shippingCarrier?: string;
    actor?: OrderActor;
    adminEmail?: string;
  }
): Promise<ShopOrder> {
  const current = await loadOrderOrThrow(id);
  const plan = planFulfillmentChange({
    paymentStatus: current.paymentStatus,
    from: current.fulfillmentStatus,
    to: patch.fulfillmentStatus,
    trackingNumber: patch.trackingNumber,
    shippingCarrier: patch.shippingCarrier,
    currentTracking: current.trackingNumber,
    currentCarrier: current.shippingCarrier,
    shippingNotifiedAt: current.shippingNotifiedAt,
  });
  if (!plan.ok) throw new OrderActionError(plan.error);
  if (plan.noop) return current;

  const now = new Date().toISOString();
  const db = getDbClient();
  const { data: updatedRows, error } = await db
    .from("shop_orders")
    .update({
      fulfillment_status: plan.fulfillmentStatus,
      tracking_number: plan.trackingNumber || null,
      shipping_carrier: plan.shippingCarrier || null,
      updated_at: now,
      ...(plan.setShippedAt ? { shipped_at: now } : {}),
      ...(plan.setDeliveredAt ? { delivered_at: now } : {}),
      ...(plan.setCancelledAt ? { cancelled_at: now } : {}),
    })
    .eq("id", id)
    .eq("fulfillment_status", current.fulfillmentStatus)
    .select("id");
  if (error) throw error;
  if (!updatedRows || updatedRows.length === 0) {
    throw new OrderActionError(
      "This order changed while you were editing. Refresh and try again.",
      409
    );
  }

  const actor = patch.actor ?? "admin";
  const metadata = patch.adminEmail ? { adminEmail: patch.adminEmail } : {};
  for (const event of plan.events) {
    await recordOrderEvent({
      orderId: id,
      eventType: event.type,
      description: event.description,
      actor,
      metadata: {
        ...metadata,
        ...(event.type === "delivery_manually_confirmed" ? { manual: true } : {}),
      },
    });
  }

  let updated = await loadOrderOrThrow(id);
  if (plan.sendShippingEmail) {
    updated = await deliverShippingEmail(id, updated);
  }
  return updated;
}

export async function retryShippingNotification(
  id: string,
  adminEmail: string
): Promise<ShopOrder> {
  const current = await loadOrderOrThrow(id);
  if (
    current.fulfillmentStatus !== "shipped" &&
    current.fulfillmentStatus !== "delivered"
  ) {
    throw new OrderActionError("Shipping email is sent after the order ships");
  }
  if (current.shippingNotifiedAt) {
    throw new OrderActionError("Shipping email was already sent");
  }
  return deliverShippingEmail(id, current, { adminEmail, retry: true });
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

type CheckoutOrderInput = {
  outcome: "pending" | "paid" | "failed";
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
};

async function findOrderRowBySession(
  sessionId: string
): Promise<OrderRow | null> {
  const db = getDbClient();
  const { data, error } = await db
    .from("shop_orders")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return (data as OrderRow | null) ?? null;
}

async function ensureOrderItem(
  orderId: string,
  input: CheckoutOrderInput
): Promise<void> {
  const db = getDbClient();
  const { data, error } = await db
    .from("shop_order_items")
    .select("id")
    .eq("order_id", orderId)
    .limit(1);
  if (error) throw error;
  if (data && data.length > 0) return;
  const { error: itemError } = await db.from("shop_order_items").insert({
    order_id: orderId,
    product_id: input.productId || null,
    product_name: input.productName,
    size: input.size,
    quantity: input.quantity,
    unit_price_cents: input.unitPriceCents,
  });
  if (itemError) throw itemError;
}

async function adjustInventoryOnce(
  orderId: string,
  productId: string,
  size: string,
  quantity: number
): Promise<void> {
  const db = getDbClient();
  const { data, error } = await db
    .from("shop_orders")
    .update({ inventory_adjusted: true })
    .eq("id", orderId)
    .eq("inventory_adjusted", false)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0 || !productId) return;

  try {
    const product = await getProductById(productId);
    if (!product) return;
    const nextInv = { ...product.inventoryBySize };
    const current = nextInv[size as ProductSize] ?? 0;
    nextInv[size as ProductSize] = Math.max(0, current - quantity);
    const { error: invError } = await db
      .from("shop_products")
      .update({
        inventory_by_size: nextInv,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);
    if (invError) throw invError;
  } catch (err) {
    await db
      .from("shop_orders")
      .update({ inventory_adjusted: false })
      .eq("id", orderId);
    throw err;
  }
}

async function recomputeRefundState(orderId: string): Promise<void> {
  const db = getDbClient();
  const { data: order, error } = await db
    .from("shop_orders")
    .select("payment_status, total_cents")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!order) return;
  const row = order as { payment_status: PaymentStatus; total_cents: number };
  const { data: refunds, error: refundError } = await db
    .from("shop_order_refunds")
    .select("amount_cents, status")
    .eq("order_id", orderId);
  if (refundError) throw refundError;
  const succeeded = ((refunds || []) as { amount_cents: number; status: string }[])
    .filter((refund) => refund.status === "succeeded")
    .reduce((sum, refund) => sum + refund.amount_cents, 0);
  const nextStatus = paymentStatusAfterRefunds({
    current: row.payment_status,
    totalCents: row.total_cents,
    succeededRefundCents: succeeded,
  });
  const { error: updateError } = await db
    .from("shop_orders")
    .update({
      payment_status: nextStatus,
      amount_refunded_cents: succeeded,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (updateError) throw updateError;
}

async function attachRefunds(
  orderId: string,
  paymentIntentId: string
): Promise<void> {
  const db = getDbClient();
  const { error } = await db
    .from("shop_order_refunds")
    .update({ order_id: orderId })
    .eq("payment_intent_id", paymentIntentId)
    .is("order_id", null);
  if (error) throw error;
  await recomputeRefundState(orderId);
}

export async function hasStripeEvent(eventId: string): Promise<boolean> {
  const db = getDbClient();
  const { data, error } = await db
    .from("shop_stripe_events")
    .select("event_id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function rememberStripeEvent(
  eventId: string,
  eventType: string
): Promise<void> {
  const db = getDbClient();
  const { error } = await db.from("shop_stripe_events").insert({
    event_id: eventId,
    event_type: eventType,
  });
  if (error && isUniqueViolation(error)) return;
  if (error) throw error;
}

export async function markPaymentFailedByIntent(
  paymentIntentId: string
): Promise<void> {
  const db = getDbClient();
  const { data, error } = await db
    .from("shop_orders")
    .select("id, payment_status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return;
  const row = data as { id: string; payment_status: PaymentStatus };
  if (paymentFailureStatus(row.payment_status) === row.payment_status) return;
  const { data: updated, error: updateError } = await db
    .from("shop_orders")
    .update({
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("payment_status", "pending")
    .select("id");
  if (updateError) throw updateError;
  if (!updated || updated.length === 0) return;
  await recordOrderEvent({
    orderId: row.id,
    eventType: "payment_failed",
    description: "Payment failed",
    actor: "stripe",
    uniqueByType: true,
  });
}

export async function applyStripeRefund(input: {
  refundId: string;
  amountCents: number;
  status: string;
  paymentIntentId: string | null;
  currency: string;
}): Promise<void> {
  if (!input.paymentIntentId) return;
  const db = getDbClient();
  const { data: existing, error: readError } = await db
    .from("shop_order_refunds")
    .select("status, order_id")
    .eq("stripe_refund_id", input.refundId)
    .maybeSingle();
  if (readError) throw readError;
  const previous = (existing as { status: string } | null)?.status ?? null;

  const { data: matched, error: matchError } = await db
    .from("shop_orders")
    .select("id")
    .eq("stripe_payment_intent_id", input.paymentIntentId)
    .maybeSingle();
  if (matchError) throw matchError;
  const orderId =
    (matched as { id: string } | null)?.id ??
    (existing as { order_id: string | null } | null)?.order_id ??
    null;

  const { error } = await db.from("shop_order_refunds").upsert({
    stripe_refund_id: input.refundId,
    order_id: orderId,
    payment_intent_id: input.paymentIntentId,
    amount_cents: input.amountCents,
    currency: input.currency || "usd",
    status: input.status,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  if (!orderId) return;

  await recomputeRefundState(orderId);
  const activity = planRefundActivity(previous, input.status);
  if (!activity) return;
  const amount = (input.amountCents / 100).toFixed(2);
  await recordOrderEvent({
    orderId,
    eventType: activity,
    description:
      activity === "refund_confirmed"
        ? `Refund confirmed · $${amount}`
        : `Refund initiated · $${amount}`,
    actor: "stripe",
    metadata: {
      stripeRefundId: input.refundId,
      amountCents: input.amountCents,
      status: input.status,
    },
    ignoreUnique: true,
  });
}

export async function syncCheckoutOrder(
  input: CheckoutOrderInput
): Promise<string> {
  const db = getDbClient();
  let existing = await findOrderRowBySession(input.sessionId);
  let created = false;

  if (!existing) {
    const initialStatus =
      input.outcome === "paid"
        ? "paid"
        : input.outcome === "failed"
          ? "failed"
          : "pending";
    const { data, error } = await db
      .from("shop_orders")
      .insert({
        payment_status: initialStatus,
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
        inventory_adjusted: false,
      })
      .select("*")
      .single();
    if (error && isUniqueViolation(error)) {
      existing = await findOrderRowBySession(input.sessionId);
      if (!existing) throw error;
    } else if (error) {
      throw error;
    } else {
      existing = data as OrderRow;
      created = true;
    }
  }

  const orderId = existing.id;
  await ensureOrderItem(orderId, input);
  await recordOrderEvent({
    orderId,
    eventType: "order_created",
    description: "Order created",
    actor: "stripe",
    uniqueByType: true,
  });

  let becamePaid = created && existing.payment_status === "paid";
  const now = new Date().toISOString();
  const shippingPatch = {
    ...(input.email ? { email: input.email } : {}),
    ...(input.shippingName ? { shipping_name: input.shippingName } : {}),
    ...(input.shippingLine1 ? { shipping_line1: input.shippingLine1 } : {}),
    ...(input.shippingCity ? { shipping_city: input.shippingCity } : {}),
    ...(input.shippingRegion ? { shipping_region: input.shippingRegion } : {}),
    ...(input.shippingPostal ? { shipping_postal: input.shippingPostal } : {}),
    ...(input.shippingCountry ? { shipping_country: input.shippingCountry } : {}),
    ...(input.paymentIntentId
      ? { stripe_payment_intent_id: input.paymentIntentId }
      : {}),
    updated_at: now,
  };

  if (!created && input.outcome === "paid") {
    const { data, error } = await db
      .from("shop_orders")
      .update({
        payment_status: "paid",
        total_cents: input.totalCents,
        currency: input.currency,
        ...shippingPatch,
      })
      .eq("id", orderId)
      .in("payment_status", ["pending", "failed"])
      .select("id");
    if (error) throw error;
    becamePaid = Boolean(data && data.length > 0);
    if (!becamePaid && input.paymentIntentId) {
      await db
        .from("shop_orders")
        .update({ stripe_payment_intent_id: input.paymentIntentId })
        .eq("id", orderId)
        .is("stripe_payment_intent_id", null);
    }
  } else if (input.outcome === "failed") {
    if (created) {
      await recordOrderEvent({
        orderId,
        eventType: "payment_failed",
        description: "Payment failed",
        actor: "stripe",
        uniqueByType: true,
      });
    } else {
      const { data, error } = await db
        .from("shop_orders")
        .update({ payment_status: "failed", ...shippingPatch })
        .eq("id", orderId)
        .eq("payment_status", "pending")
        .select("id");
      if (error) throw error;
      if (data && data.length > 0) {
        await recordOrderEvent({
          orderId,
          eventType: "payment_failed",
          description: "Payment failed",
          actor: "stripe",
          uniqueByType: true,
        });
      }
    }
  }

  if (input.outcome === "paid") {
    await recordOrderEvent({
      orderId,
      eventType: "payment_confirmed",
      description: "Payment confirmed",
      actor: "stripe",
      uniqueByType: true,
    });
    await adjustInventoryOnce(
      orderId,
      input.productId,
      input.size,
      input.quantity
    );
  }

  if (input.paymentIntentId) {
    await attachRefunds(orderId, input.paymentIntentId);
  }

  if (becamePaid) {
    const createdOrder = await getOrderById(orderId);
    if (
      createdOrder &&
      (createdOrder.paymentStatus === "paid" ||
        createdOrder.paymentStatus === "partially_refunded")
    ) {
      notifyOrderConfirmation(createdOrder);
    }
  }

  return orderId;
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
  return syncCheckoutOrder({ ...input, outcome: "paid" });
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
      inventory_adjusted: true,
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
