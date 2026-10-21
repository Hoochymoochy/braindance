import { shortOrderId, trackingUrl } from "@/app/lib/shop/order-utils";
import type { ShopOrder } from "@/app/lib/shop/types";

/**
 * Server-only client for braindance_shop.
 * Uses SHOP_BACKEND_URL + SHOP_SERVICE_SECRET — never expose to the browser.
 */

function shopBackendConfig(): { baseUrl: string; secret: string } | null {
  const baseUrl = (process.env.SHOP_BACKEND_URL || "").replace(/\/$/, "");
  const secret = process.env.SHOP_SERVICE_SECRET || "";
  if (!baseUrl || !secret) return null;
  return { baseUrl, secret };
}

async function postShopEmail(
  path: string,
  body: Record<string, unknown>
): Promise<void> {
  const cfg = shopBackendConfig();
  if (!cfg) {
    console.warn(
      "[shop/notify] SHOP_BACKEND_URL or SHOP_SERVICE_SECRET missing — skip email"
    );
    return;
  }

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.secret}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shop email ${path} failed (${res.status}): ${text}`);
  }
}

/** Fire-and-forget wrapper so email never blocks checkout/fulfillment. */
function safeNotify(label: string, fn: () => Promise<void>): void {
  void fn().catch((err) => {
    console.error(`[shop/notify] ${label}`, err);
  });
}

export function notifyOrderConfirmation(order: ShopOrder): void {
  safeNotify("order-confirmation", () =>
    postShopEmail("/emails/order-confirmation", {
      to: order.email,
      orderNumber: shortOrderId(order.id),
      totalCents: order.totalCents,
      currency: "usd",
      shippingName: order.shippingName,
      shippingLines: [
        order.shippingLine1,
        `${order.shippingCity}, ${order.shippingRegion} ${order.shippingPostal}`,
        order.shippingCountry,
      ].filter(Boolean),
      items: order.items.map((item) => ({
        name: item.productName,
        size: item.size,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })),
    })
  );
}

export function notifyOrderShipped(order: ShopOrder): void {
  safeNotify("order-shipped", () =>
    postShopEmail("/emails/order-shipped", {
      to: order.email,
      orderNumber: shortOrderId(order.id),
      carrier: order.shippingCarrier || "",
      trackingNumber: order.trackingNumber || "",
      trackingUrl:
        trackingUrl(order.shippingCarrier, order.trackingNumber) || "",
    })
  );
}
