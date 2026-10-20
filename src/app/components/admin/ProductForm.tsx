"use client";

import { useState } from "react";
import type { ProductSize, ProductStatus, ShopProduct } from "@/app/lib/shop/types";
import { newProductId, slugify } from "@/app/lib/shop/store";

const ALL_SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

type ProductFormProps = {
  initial?: ShopProduct | null;
  onSave: (product: ShopProduct) => void | Promise<void>;
  onCancel: () => void;
};

export function ProductForm({ initial, onSave, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceDollars, setPriceDollars] = useState(
    initial ? (initial.priceCents / 100).toFixed(2) : "36.00"
  );
  const [status, setStatus] = useState<ProductStatus>(initial?.status ?? "draft");
  const [sizes, setSizes] = useState<ProductSize[]>(
    initial?.sizes ?? ["S", "M", "L", "XL"]
  );
  const [inventory, setInventory] = useState<Partial<Record<ProductSize, number>>>(
    initial?.inventoryBySize ?? { S: 10, M: 20, L: 20, XL: 10 }
  );
  const [accentFrom, setAccentFrom] = useState(initial?.accentFrom ?? "#00ccff");
  const [accentTo, setAccentTo] = useState(initial?.accentTo ?? "#3700ff");

  function toggleSize(size: ProductSize) {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number.parseFloat(priceDollars);
    if (!name.trim() || Number.isNaN(parsed) || sizes.length === 0) return;

    const now = new Date().toISOString();
    const product: ShopProduct = {
      id: initial?.id ?? newProductId(),
      slug: (slug.trim() || slugify(name)) || `item-${Date.now()}`,
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      priceCents: Math.round(parsed * 100),
      currency: "usd",
      sizes: ALL_SIZES.filter((s) => sizes.includes(s)),
      accentFrom,
      accentTo,
      status,
      inventoryBySize: Object.fromEntries(
        sizes.map((s) => [s, inventory[s] ?? 0])
      ),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    await onSave(product);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Name
          </span>
          <input
            className="input-bends"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!initial) setSlug(slugify(e.target.value));
            }}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Slug
          </span>
          <input
            className="input-bends"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            required
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Tagline
        </span>
        <input
          className="input-bends"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Description
        </span>
        <textarea
          className="input-bends min-h-[100px] resize-y py-3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Price (USD)
          </span>
          <input
            className="input-bends"
            type="number"
            min="0"
            step="0.01"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Status
          </span>
          <select
            className="input-bends"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductStatus)}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Accent A
            </span>
            <input
              type="color"
              className="h-10 w-full cursor-pointer rounded border border-zinc-300 bg-transparent dark:border-zinc-600"
              value={accentFrom}
              onChange={(e) => setAccentFrom(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Accent B
            </span>
            <input
              type="color"
              className="h-10 w-full cursor-pointer rounded border border-zinc-300 bg-transparent dark:border-zinc-600"
              value={accentTo}
              onChange={(e) => setAccentTo(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Sizes & stock
        </p>
        <div className="flex flex-wrap gap-3">
          {ALL_SIZES.map((size) => {
            const on = sizes.includes(size);
            return (
              <div
                key={size}
                className="flex items-center gap-2 border border-zinc-200 px-2 py-1.5 dark:border-zinc-700"
              >
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleSize(size)}
                  />
                  {size}
                </label>
                {on ? (
                  <input
                    type="number"
                    min={0}
                    className="input-bends w-16 px-2 py-1 text-sm"
                    value={inventory[size] ?? 0}
                    onChange={(e) =>
                      setInventory((prev) => ({
                        ...prev,
                        [size]: Number.parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-brand-to px-5 py-2 text-sm font-semibold text-white hover:bg-brand-via/90"
        >
          {initial ? "Save product" : "Add product"}
        </button>
      </div>
    </form>
  );
}
