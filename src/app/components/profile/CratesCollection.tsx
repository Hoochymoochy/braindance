"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { CrateCover } from "@/app/components/profile/CrateCover";
import { CrateCard } from "@/app/components/profile/CrateCard";
import { CreateCrateTile } from "@/app/components/profile/CreateCrateTile";
import type { CratePreview } from "@/app/lib/profile/crates";

function FeaturedCrate({
  crate,
  href,
  onDelete,
}: {
  crate: CratePreview;
  href: string;
  onDelete?: () => void | Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!onDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete();
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative motion-enter">
      <Link
        href={href}
        className="flex h-full flex-col gap-4 rounded-sm transition-opacity duration-bends-fast ease-bends hover:opacity-90"
      >
        <CrateCover
          thumbnails={crate.thumbnails}
          videoIds={crate.cover_video_ids}
          name={crate.name}
          size="feature"
          className="shadow-lg"
        />
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-brand-from/65">
            Featured crate
          </p>
          <h3 className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            {crate.name}
          </h3>
          <p className="text-sm text-zinc-500">
            {crate.set_count} {crate.set_count === 1 ? "set" : "sets"}
          </p>
        </div>
      </Link>

      {onDelete ? (
        <button
          type="button"
          aria-label={`Delete ${crate.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirming(true);
          }}
          className="absolute right-2 top-2 z-20 rounded-md bg-black/55 p-1.5 text-white opacity-100 backdrop-blur-sm transition-opacity hover:bg-red-500/80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {confirming ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-featured-crate-${crate.id}`}
          onClick={() => {
            if (!deleting) setConfirming(false);
          }}
        >
          <div
            className="glass-bends w-full max-w-sm rounded-2xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id={`delete-featured-crate-${crate.id}`}
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Delete crate?
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Are you sure you want to delete &ldquo;{crate.name}&rdquo;? This
              will also remove all sets in this crate.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-brand-from/20"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl border border-red-500/40 bg-red-500/90 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CratesCollection({
  crates,
  hrefFor,
  onCreate,
  onDelete,
  emptyLabel = "No crates yet.",
}: {
  crates: CratePreview[];
  hrefFor: (crate: CratePreview) => string;
  onCreate?: (name: string) => Promise<void>;
  onDelete?: (crateId: string) => void | Promise<void>;
  emptyLabel?: string;
}) {
  const [featured, ...rest] = crates;
  const showFeatured = Boolean(featured);
  const showSideGrid = rest.length > 0 || Boolean(onCreate);

  if (!showFeatured && !onCreate) {
    return <p className="text-sm text-zinc-500">{emptyLabel}</p>;
  }

  return (
    <div
      className={
        showFeatured && showSideGrid
          ? "grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-6"
          : showFeatured
            ? "max-w-2xl"
            : undefined
      }
    >
      {featured ? (
        <FeaturedCrate
          crate={featured}
          href={hrefFor(featured)}
          onDelete={
            onDelete
              ? async () => {
                  await onDelete(featured.id);
                }
              : undefined
          }
        />
      ) : null}

      {showSideGrid ? (
        <div className="grid grid-cols-2 content-start gap-1 sm:grid-cols-3 lg:grid-cols-2">
          {onCreate ? <CreateCrateTile onCreate={onCreate} /> : null}
          {rest.map((crate, i) => (
            <div
              key={crate.id}
              className="motion-enter"
              style={{ animationDelay: `${80 + i * 40}ms` }}
            >
              <CrateCard
                crate={crate}
                href={hrefFor(crate)}
                onDelete={
                  onDelete
                    ? async () => {
                        await onDelete(crate.id);
                      }
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
