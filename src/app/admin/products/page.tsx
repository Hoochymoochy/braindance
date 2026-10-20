"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductForm } from "@/app/components/admin/ProductForm";
import { MerchPlaceholder } from "@/app/components/shop/MerchPlaceholder";
import { useShop } from "@/app/components/shop/ShopProvider";
import { formatPrice } from "@/app/lib/shop/mock-data";
import type { ShopProduct } from "@/app/lib/shop/types";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const { ready, products, upsertProduct, deleteProduct } = useShop();
  const [editing, setEditing] = useState<ShopProduct | null | "new">(null);

  if (!ready) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (editing !== null) {
    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {editing === "new" ? "New product" : `Edit · ${editing.name}`}
        </h2>
        <ProductForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={async (product) => {
            await upsertProduct(product);
            setEditing(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {products.length} product{products.length === 1 ? "" : "s"}. Only{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            active
          </span>{" "}
          items show on{" "}
          <Link href="/shop" className="text-brand-via hover:underline">
            /shop
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-brand-from dark:text-zinc-950"
        >
          Add product
        </button>
      </div>

      <ul className="divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
          >
            <div className="w-full shrink-0 sm:w-24">
              <MerchPlaceholder
                name={product.name}
                accentFrom={product.accentFrom}
                accentTo={product.accentTo}
                className="aspect-square"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {product.name}
                </h3>
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-[0.14em]",
                    product.status === "active" && "text-emerald-600",
                    product.status === "draft" && "text-amber-600",
                    product.status === "archived" && "text-zinc-400"
                  )}
                >
                  {product.status}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">
                /shop/{product.slug} ·{" "}
                {formatPrice(product.priceCents, product.currency)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Sizes: {product.sizes.join(", ")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEditing(product)}
                className="border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete “${product.name}”?`)) {
                    void deleteProduct(product.id);
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
