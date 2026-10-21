"use client";

import type { ProductSize } from "@/app/lib/shop/types";
import { cn } from "@/lib/utils";

type SizePickerProps = {
  sizes: ProductSize[];
  inventoryBySize: Partial<Record<ProductSize, number>>;
  value: ProductSize | null;
  onChange: (size: ProductSize) => void;
};

export function SizePicker({
  sizes,
  inventoryBySize,
  value,
  onChange,
}: SizePickerProps) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        Size
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {sizes.map((size) => {
          const stock = inventoryBySize[size] ?? 0;
          const soldOut = stock <= 0;
          const selected = value === size;
          return (
            <button
              key={size}
              type="button"
              disabled={soldOut}
              onClick={() => onChange(size)}
              className={cn(
                "min-w-[3rem] border px-3 py-2 text-sm font-medium transition-colors duration-bends-fast ease-bends",
                soldOut &&
                  "cursor-not-allowed border-zinc-200 text-zinc-300 line-through dark:border-zinc-800 dark:text-zinc-600",
                !soldOut &&
                  selected &&
                  "border-zinc-900 bg-zinc-900 text-white dark:border-brand-from dark:bg-brand-from/20 dark:text-brand-from",
                !soldOut &&
                  !selected &&
                  "border-zinc-300 text-zinc-800 hover:border-zinc-900 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-brand-from"
              )}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
