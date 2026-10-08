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
      <div className="flex flex-col gap-3 rounded-sm p-2">
        <div
          className={cn(
            "flex aspect-square w-full items-center justify-center rounded-sm border border-dashed border-black/12 bg-black/[0.02] dark:border-white/15 dark:bg-white/[0.03]"
          )}
        >
          <Plus className="h-8 w-8 text-zinc-400" aria-hidden />
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
              className="rounded-md border border-brand-to/50 bg-brand-to/80 px-2.5 py-1.5 text-xs font-medium text-zinc-950 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={reset}
              className="rounded-md border border-black/10 px-2.5 py-1.5 text-xs dark:border-white/15"
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
      className="flex flex-col gap-3 rounded-sm p-2 text-left transition-opacity duration-bends-fast ease-bends hover:opacity-85"
    >
      <div
        className={cn(
          "flex aspect-square w-full items-center justify-center rounded-sm border border-dashed border-black/12 bg-black/[0.02] transition-colors duration-bends-fast ease-bends hover:border-brand-from/35 dark:border-white/15 dark:bg-white/[0.03] dark:hover:border-brand-from/40"
        )}
      >
        <Plus className="h-8 w-8 text-zinc-500 dark:text-zinc-500" aria-hidden />
      </div>
      <div className="min-w-0 px-0.5">
        <p className="truncate text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
          New crate
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">Start a collection</p>
      </div>
    </button>
  );
}
