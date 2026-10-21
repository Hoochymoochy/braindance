"use client";

import Link from "next/link";
import { ProductCard } from "@/app/components/shop/ProductCard";
import { useShop } from "@/app/components/shop/ShopProvider";
import { getActiveProducts } from "@/app/lib/shop/store";

export default function ShopPage() {
  const { ready, products } = useShop();
  const active = getActiveProducts(products);

  return (
    <div className="relative text-zinc-900 dark:text-zinc-100">
      <section className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-90"
          aria-hidden
          style={{
            backgroundImage: `
              radial-gradient(ellipse 90% 70% at 10% -10%, rgba(0,204,255,0.18), transparent 55%),
              radial-gradient(ellipse 70% 60% at 100% 20%, rgba(255,0,247,0.12), transparent 50%),
              radial-gradient(ellipse 50% 40% at 50% 100%, rgba(55,0,255,0.1), transparent 55%)
            `,
          }}
        />
        <div className="container relative mx-auto px-4 pb-14 pt-10 md:pb-20 md:pt-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
            Official
          </p>
          <h1 className="mt-3 max-w-xl text-[clamp(2.5rem,8vw,4.5rem)] font-bold leading-[0.92] tracking-[-0.045em] text-zinc-900 dark:text-zinc-50">
            Braindance
            <span className="block text-gradient-bends">Merch</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-zinc-600 dark:text-zinc-400">
            Small drops. Built for the booth and the after. Design preview —
            checkout wires up next.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        {!ready ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-4 h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-1/2 bg-zinc-100 dark:bg-zinc-900" />
              </div>
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="mx-auto max-w-md py-20 text-center">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Nothing live yet
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Publish a product from admin to show it here.
            </p>
            <Link
              href="/admin/products"
              className="mt-6 inline-block text-sm font-medium text-brand-via hover:underline"
            >
              Open admin
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
