"use client";

import { SHOP_STORAGE_KEY } from "./config";
import { MOCK_ORDERS, MOCK_PRODUCTS } from "./mock-data";
import type { OrderStatus, ShopOrder, ShopProduct } from "./types";

export type ShopState = {
  products: ShopProduct[];
  orders: ShopOrder[];
};

function defaultState(): ShopState {
  return {
    products: structuredClone(MOCK_PRODUCTS),
    orders: structuredClone(MOCK_ORDERS),
  };
}

export function loadShopState(): ShopState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(SHOP_STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as ShopState;
    if (!Array.isArray(parsed.products) || !Array.isArray(parsed.orders)) {
      return defaultState();
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

export function saveShopState(state: ShopState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(state));
}

export function resetShopState(): ShopState {
  const next = defaultState();
  saveShopState(next);
  return next;
}

export function upsertProduct(
  state: ShopState,
  product: ShopProduct
): ShopState {
  const idx = state.products.findIndex((p) => p.id === product.id);
  const products =
    idx === -1
      ? [...state.products, product]
      : state.products.map((p, i) => (i === idx ? product : p));
  const next = { ...state, products };
  saveShopState(next);
  return next;
}

export function deleteProduct(state: ShopState, productId: string): ShopState {
  const next = {
    ...state,
    products: state.products.filter((p) => p.id !== productId),
  };
  saveShopState(next);
  return next;
}

export function updateOrderStatus(
  state: ShopState,
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string
): ShopState {
  const next = {
    ...state,
    orders: state.orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status,
            ...(trackingNumber !== undefined ? { trackingNumber } : {}),
          }
        : order
    ),
  };
  saveShopState(next);
  return next;
}

export function getActiveProducts(products: ShopProduct[]): ShopProduct[] {
  return products.filter((p) => p.status === "active");
}

export function getProductBySlug(
  products: ShopProduct[],
  slug: string
): ShopProduct | undefined {
  return products.find((p) => p.slug === slug);
}

export function newProductId(): string {
  return `prod_${Math.random().toString(36).slice(2, 10)}`;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
