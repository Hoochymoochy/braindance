"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminFetch } from "@/app/lib/shop/admin-client";
import type {
  FulfillmentStatus,
  ShopOrder,
  ShopProduct,
} from "@/app/lib/shop/types";

type ShopContextValue = {
  ready: boolean;
  products: ShopProduct[];
  orders: ShopOrder[];
  /** Public catalog refresh (active only) */
  refreshCatalog: () => Promise<void>;
  /** Admin: load all products + orders */
  refreshAdmin: () => Promise<void>;
  upsertProduct: (product: ShopProduct) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateFulfillment: (
    orderId: string,
    input: {
      fulfillmentStatus: FulfillmentStatus;
      trackingNumber?: string;
      shippingCarrier?: string;
    }
  ) => Promise<ShopOrder>;
  retryShippingEmail: (orderId: string) => Promise<ShopOrder>;
  createTestOrder: (productId?: string) => Promise<void>;
  resetDemoData: () => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({
  children,
  mode = "catalog",
}: {
  children: ReactNode;
  mode?: "catalog" | "admin";
}) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);

  const refreshCatalog = useCallback(async () => {
    const res = await fetch("/api/shop/products");
    if (!res.ok) throw new Error("Failed to load products");
    const data = (await res.json()) as { products: ShopProduct[] };
    setProducts(data.products);
  }, []);

  const refreshAdmin = useCallback(async () => {
    const [prodRes, orderRes] = await Promise.all([
      adminFetch("/api/admin/shop/products"),
      adminFetch("/api/admin/shop/orders"),
    ]);
    if (!prodRes.ok || !orderRes.ok) {
      throw new Error("Failed to load admin shop data");
    }
    const prodData = (await prodRes.json()) as { products: ShopProduct[] };
    const orderData = (await orderRes.json()) as { orders: ShopOrder[] };
    setProducts(prodData.products);
    setOrders(orderData.orders);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (mode === "admin") {
          await refreshAdmin();
        } else {
          await refreshCatalog();
        }
      } catch (err) {
        console.error("[ShopProvider]", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, refreshAdmin, refreshCatalog]);

  const upsertProduct = useCallback(
    async (product: ShopProduct) => {
      const res = await adminFetch("/api/admin/shop/products", {
        method: "POST",
        body: JSON.stringify({
          id: product.id.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          )
            ? product.id
            : undefined,
          slug: product.slug,
          name: product.name,
          tagline: product.tagline,
          description: product.description,
          priceCents: product.priceCents,
          currency: product.currency,
          sizes: product.sizes,
          accentFrom: product.accentFrom,
          accentTo: product.accentTo,
          coverImageUrl: product.coverImageUrl,
          galleryImageUrls: product.galleryImageUrls,
          status: product.status,
          inventoryBySize: product.inventoryBySize,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }
      await refreshAdmin();
    },
    [refreshAdmin]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      const res = await adminFetch(`/api/admin/shop/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      await refreshAdmin();
    },
    [refreshAdmin]
  );

  const updateFulfillment = useCallback(
    async (
      orderId: string,
      input: {
        fulfillmentStatus: FulfillmentStatus;
        trackingNumber?: string;
        shippingCarrier?: string;
      }
    ) => {
      const res = await adminFetch("/api/admin/shop/orders", {
        method: "PATCH",
        body: JSON.stringify({ id: orderId, ...input }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Update failed");
      }
      const data = (await res.json()) as { order: ShopOrder };
      await refreshAdmin();
      return data.order;
    },
    [refreshAdmin]
  );

  const retryShippingEmail = useCallback(
    async (orderId: string) => {
      const res = await adminFetch("/api/admin/shop/orders", {
        method: "PATCH",
        body: JSON.stringify({ id: orderId, action: "retry_shipping_email" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not resend shipping email");
      }
      const data = (await res.json()) as { order: ShopOrder };
      await refreshAdmin();
      return data.order;
    },
    [refreshAdmin]
  );

  const createTestOrder = useCallback(
    async (productId?: string) => {
      const res = await adminFetch("/api/admin/shop/orders", {
        method: "POST",
        body: JSON.stringify(productId ? { productId } : {}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create test order");
      }
      await refreshAdmin();
    },
    [refreshAdmin]
  );

  const resetDemoData = useCallback(() => {
    window.alert(
      "Demo reset is disabled — products and orders now live in Supabase. Edit them in admin or the SQL editor."
    );
  }, []);

  const value = useMemo(
    () => ({
      ready,
      products,
      orders,
      refreshCatalog,
      refreshAdmin,
      upsertProduct,
      deleteProduct,
      updateFulfillment,
      retryShippingEmail,
      createTestOrder,
      resetDemoData,
    }),
    [
      ready,
      products,
      orders,
      refreshCatalog,
      refreshAdmin,
      upsertProduct,
      deleteProduct,
      updateFulfillment,
      retryShippingEmail,
      createTestOrder,
      resetDemoData,
    ]
  );

  return (
    <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
  );
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return ctx;
}
