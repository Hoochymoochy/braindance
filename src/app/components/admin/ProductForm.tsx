"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductSize, ProductStatus, ShopProduct } from "@/app/lib/shop/types";
import { newProductId, slugify } from "@/app/lib/shop/store";
import { uploadMerchImage } from "@/app/lib/shop/upload";

const ALL_SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "XXL"];
const DEFAULT_ACCENT_FROM = "#00ccff";
const DEFAULT_ACCENT_TO = "#3700ff";
const MAX_GALLERY = 6;

type ProductFormProps = {
  initial?: ShopProduct | null;
  onSave: (product: ShopProduct) => void | Promise<void>;
  onCancel: () => void;
};

export function ProductForm({ initial, onSave, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
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
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initial?.coverImageUrl ?? null
  );
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>(
    initial?.galleryImageUrls ?? []
  );
  const [uploading, setUploading] = useState<"cover" | "gallery" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function toggleSize(size: ProductSize) {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  async function handleCoverChange(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading("cover");
    try {
      const url = await uploadMerchImage(file, "cover");
      setCoverImageUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleGalleryChange(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_GALLERY - galleryImageUrls.length;
    if (remaining <= 0) {
      setUploadError(`You can add up to ${MAX_GALLERY} extra photos.`);
      return;
    }

    setUploadError(null);
    setUploading("gallery");
    try {
      const selected = Array.from(files).slice(0, remaining);
      const urls: string[] = [];
      for (const file of selected) {
        urls.push(await uploadMerchImage(file, "gallery"));
      }
      setGalleryImageUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number.parseFloat(priceDollars);
    if (!name.trim() || Number.isNaN(parsed) || sizes.length === 0) return;

    const now = new Date().toISOString();
    const product: ShopProduct = {
      id: initial?.id ?? newProductId(),
      slug: initial?.slug || slugify(name) || `item-${Date.now()}`,
      name: name.trim(),
      tagline: initial?.tagline ?? "",
      description: initial?.description ?? "",
      priceCents: Math.round(parsed * 100),
      currency: "usd",
      sizes: ALL_SIZES.filter((s) => sizes.includes(s)),
      accentFrom: initial?.accentFrom ?? DEFAULT_ACCENT_FROM,
      accentTo: initial?.accentTo ?? DEFAULT_ACCENT_TO,
      coverImageUrl,
      galleryImageUrls,
      status,
      inventoryBySize: Object.fromEntries(
        sizes.map((s) => [s, inventory[s] ?? 0])
      ),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    setSaving(true);
    try {
      await onSave(product);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="block text-sm">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Name
        </span>
        <input
          className="input-bends"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Cover photo
          </p>
          <p className="mb-2 text-xs text-zinc-500">
            Use a <span className="font-medium text-zinc-700 dark:text-zinc-300">4:5</span>{" "}
            portrait (e.g. 1080×1350). JPG, PNG, or WebP · max 5MB.
          </p>
          <div className="flex flex-wrap items-start gap-3">
            {coverImageUrl ? (
              <div className="relative h-28 w-28 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <Image
                  src={coverImageUrl}
                  alt="Cover"
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-28 w-28 items-center justify-center border border-dashed border-zinc-300 text-xs text-zinc-400 dark:border-zinc-600">
                No cover
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void handleCoverChange(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={uploading !== null}
                onClick={() => coverInputRef.current?.click()}
                className="border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
              >
                {uploading === "cover"
                  ? "Uploading…"
                  : coverImageUrl
                    ? "Replace cover"
                    : "Upload cover"}
              </button>
              {coverImageUrl ? (
                <button
                  type="button"
                  onClick={() => setCoverImageUrl(null)}
                  className="text-left text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            More photos
          </p>
          <p className="mb-2 text-xs text-zinc-500">
            Extra angles for the product page (up to {MAX_GALLERY}). Same{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">4:5</span>{" "}
            portrait as the cover (e.g. 1080×1350).
          </p>
          <div className="flex flex-wrap gap-2">
            {galleryImageUrls.map((url) => (
              <div
                key={url}
                className="relative h-20 w-20 overflow-hidden border border-zinc-200 dark:border-zinc-700"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setGalleryImageUrls((prev) => prev.filter((u) => u !== url))
                  }
                  className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[10px] font-medium text-white"
                >
                  Remove
                </button>
              </div>
            ))}
            {galleryImageUrls.length < MAX_GALLERY ? (
              <>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleGalleryChange(e.target.files)}
                />
                <button
                  type="button"
                  disabled={uploading !== null}
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex h-20 w-20 items-center justify-center border border-dashed border-zinc-300 text-xs text-zinc-500 disabled:opacity-50 dark:border-zinc-600"
                >
                  {uploading === "gallery" ? "…" : "+ Add"}
                </button>
              </>
            ) : null}
          </div>
        </div>
        {uploadError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        ) : null}
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
          disabled={saving || uploading !== null}
          className="rounded-md bg-brand-to px-5 py-2 text-sm font-semibold text-white hover:bg-brand-via/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : initial ? "Save product" : "Add product"}
        </button>
      </div>
    </form>
  );
}
