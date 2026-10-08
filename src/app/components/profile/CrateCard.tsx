"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { CrateCover } from "@/app/components/profile/CrateCover";
import type { CratePreview } from "@/app/lib/profile/crates";

export function CrateCard({
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
    <div className="group relative">
      <Link
        href={href}
        className="flex flex-col gap-3 rounded-sm p-2 transition-opacity duration-bends-fast ease-bends hover:opacity-85"
      >
        <CrateCover
          thumbnails={crate.thumbnails}
          videoIds={crate.cover_video_ids}
          name={crate.name}
        />
        <div className="min-w-0 px-0.5">
          <p className="truncate text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
            {crate.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
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
          className="absolute right-2 top-2 z-20 rounded-lg bg-black/50 p-1.5 text-white opacity-100 backdrop-blur-sm transition-opacity hover:bg-red-500/80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {confirming ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-crate-${crate.id}`}
          onClick={() => {
            if (!deleting) setConfirming(false);
          }}
        >
          <div
            className="glass-bends w-full max-w-sm rounded-2xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id={`delete-crate-${crate.id}`}
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
