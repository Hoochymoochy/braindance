"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateCrateTile({
  onCreate,
}: {
  onCreate: (name: string) => Promise<void>;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setNaming(false);
    setName("");
    setSaving(false);
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onCreate(trimmed);
      reset();
    } catch {
      setSaving(false);
    }
  };

  if (naming) {
    return (
      <div className="flex flex-col gap-3 rounded-xl p-3">
        <div
          className={cn(
            "flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-black/15 bg-black/[0.03] dark:border-brand-from/25 dark:bg-white/[0.04]"
          )}
        >
          <Plus className="h-10 w-10 text-zinc-400" aria-hidden />
        </div>
        <form
          className="min-w-0 space-y-2 px-0.5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Crate name"
            className="input-bends w-full text-sm"
            aria-label="Crate name"
            autoFocus
            disabled={saving}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-lg border border-brand-to/50 bg-brand-to/80 px-2.5 py-1.5 text-xs font-semibold text-zinc-950 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={reset}
              className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs dark:border-brand-from/20"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setNaming(true)}
      className="flex flex-col gap-3 rounded-xl p-3 text-left transition-colors duration-bends-fast ease-bends hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
    >
      <div
        className={cn(
          "flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-black/15 bg-black/[0.03] transition-colors hover:border-brand-from/40 hover:bg-brand-from/5 dark:border-brand-from/25 dark:bg-white/[0.04] dark:hover:border-brand-from/50"
        )}
      >
        <Plus className="h-10 w-10 text-zinc-500 dark:text-zinc-400" aria-hidden />
      </div>
      <div className="min-w-0 px-0.5">
        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
          Create crate
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">Add a playlist</p>
      </div>
    </button>
  );
}
