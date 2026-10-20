"use client";

import Image from "next/image";
import { useState } from "react";
import type { ShopProduct } from "@/app/lib/shop/types";
import { cn } from "@/lib/utils";
import { MerchPlaceholder } from "./MerchPlaceholder";

type ProductMediaProps = {
  product: ShopProduct;
  featured?: boolean;
  className?: string;
  aspectClassName?: string;
  /** Show gallery thumbnails under the main image */
  showGallery?: boolean;
};

export function ProductMedia({
  product,
  featured,
  className,
  aspectClassName = "aspect-[4/5]",
  showGallery = false,
}: ProductMediaProps) {
  const images = [
    ...(product.coverImageUrl ? [product.coverImageUrl] : []),
    ...(product.galleryImageUrls ?? []).filter(
      (url) => url && url !== product.coverImageUrl
    ),
  ];
  const [active, setActive] = useState(0);
  const main = images[active] ?? null;

  if (!main) {
    return (
      <MerchPlaceholder
        name={product.name}
        accentFrom={product.accentFrom}
        accentTo={product.accentTo}
        featured={featured}
        className={cn(aspectClassName, className)}
      />
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative overflow-hidden bg-zinc-100 dark:bg-zinc-900",
          aspectClassName
        )}
      >
        <Image
          src={main}
          alt={product.name}
          fill
          sizes={
            featured
              ? "(max-width: 1024px) 100vw, 50vw"
              : "(max-width: 640px) 100vw, 33vw"
          }
          className="object-cover"
          priority={featured}
        />
      </div>
      {showGallery && images.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 overflow-hidden border transition-opacity",
                i === active
                  ? "border-zinc-900 opacity-100 dark:border-brand-from"
                  : "border-zinc-200 opacity-70 hover:opacity-100 dark:border-zinc-700"
              )}
              aria-label={`View photo ${i + 1}`}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
