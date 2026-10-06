"use client";

import Link from "next/link";
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
  onDelete?: () => void;
}) {
  return (
    <div className="group relative">
      <Link
        href={href}
        className="flex flex-col gap-3 rounded-xl p-3 transition-colors duration-bends-fast ease-bends hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      >
        <CrateCover
          thumbnails={crate.thumbnails}
          videoIds={crate.cover_video_ids}
          name={crate.name}
        />
        <div className="min-w-0 px-0.5">
          <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
            {crate.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            Crate · {crate.set_count} {crate.set_count === 1 ? "set" : "sets"}
          </p>
        </div>
      </Link>
      {onDelete ? (
        <button
          type="button"
          aria-label={`Delete ${crate.name}`}
          onClick={onDelete}
          className="absolute right-2 top-2 rounded-lg bg-black/40 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-red-500/80"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
