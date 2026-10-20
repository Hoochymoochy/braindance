import Link from "next/link";
import { formatPrice } from "@/app/lib/shop/mock-data";
import type { ShopProduct } from "@/app/lib/shop/types";
import { ProductMedia } from "./ProductMedia";

export function ProductCard({ product }: { product: ShopProduct }) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-from/50"
    >
      <div className="overflow-hidden transition-transform duration-bends-fast ease-bends group-hover:scale-[1.01] group-active:scale-[0.99]">
        <ProductMedia product={product} />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {product.name}
          </h2>
          <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
            {product.tagline}
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
          {formatPrice(product.priceCents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
