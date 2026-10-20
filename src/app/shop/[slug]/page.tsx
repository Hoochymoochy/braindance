"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MerchPlaceholder } from "@/app/components/shop/MerchPlaceholder";
import { SizePicker } from "@/app/components/shop/SizePicker";
import { formatPrice } from "@/app/lib/shop/mock-data";
import type { ProductSize, ShopProduct } from "@/app/lib/shop/types";

function ProductDetailInner() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";

  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState<ProductSize | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/shop/products/${params.slug}`);
        if (!res.ok) {
          if (!cancelled) setProduct(null);
          return;
        }
        const data = (await res.json()) as { product: ShopProduct };
        if (!cancelled) setProduct(data.product);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (!ready) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto grid max-w-5xl animate-pulse gap-10 lg:grid-cols-2">
          <div className="aspect-[4/5] bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-4 pt-4">
            <div className="h-8 w-2/3 bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-1/3 bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-24 w-full bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Product not found
        </h1>
        <Link
          href="/shop"
          className="mt-4 inline-block text-sm font-medium text-brand-via hover:underline"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const canBuy = size !== null && (product.inventoryBySize[size] ?? 0) > 0;

  async function startCheckout() {
    if (!product || !size || !canBuy) return;
    setBusy(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, size }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setCheckoutError(data.error || "Checkout unavailable");
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Checkout failed — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Link
          href="/shop"
          className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Shop
        </Link>

        {canceled ? (
          <p className="mt-4 border border-amber-300/60 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100">
            Checkout canceled — nothing was charged.
          </p>
        ) : null}

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <MerchPlaceholder
            name={product.name}
            accentFrom={product.accentFrom}
            accentTo={product.accentTo}
            featured
            className="w-full"
          />

          <div className="flex flex-col lg:pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
              Braindance Merch
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-2 text-lg font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
              {formatPrice(product.priceCents, product.currency)}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>

            <div className="mt-8">
              <SizePicker
                sizes={product.sizes}
                inventoryBySize={product.inventoryBySize}
                value={size}
                onChange={setSize}
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={!canBuy || busy}
                onClick={() => void startCheckout()}
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white transition-[background-color,transform,box-shadow] duration-bends-fast ease-bends hover:bg-zinc-800 hover:shadow-[0_10px_28px_rgba(0,0,0,0.22)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-from dark:text-zinc-950 dark:hover:bg-brand-via"
              >
                {busy
                  ? "Redirecting…"
                  : size
                    ? "Checkout with Stripe"
                    : "Select a size"}
              </button>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Test mode: use card{" "}
                <span className="font-mono">4242 4242 4242 4242</span>
              </p>
            </div>
            {checkoutError ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {checkoutError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <ProductDetailInner />
    </Suspense>
  );
}
