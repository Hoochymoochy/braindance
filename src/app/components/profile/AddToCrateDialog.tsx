"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addSetToCrate,
  createCrate,
  listCrates,
  type Crate,
  type CrateSetInput,
} from "@/app/lib/profile/crates";
import { cn } from "@/lib/utils";

type AddToCrateDialogProps = {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  set: CrateSetInput;
};

export function AddToCrateDialog({
  open,
  onClose,
  userId,
  set,
}: AddToCrateDialogProps) {
  const router = useRouter();
  const [crates, setCrates] = useState<Crate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    if (!open || !userId) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setDone("");

    listCrates(userId)
      .then((rows) => {
        if (!cancelled) setCrates(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load crates");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  if (!open) return null;

  if (!userId) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
        <div className="glass-bends w-full max-w-sm rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gradient-bends">
            Save to a crate
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Log in to add sets to your crates.
          </p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-brand-from/20"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="flex-1 rounded-xl border border-brand-to/50 bg-brand-to/80 px-3 py-2 text-sm font-semibold text-zinc-950"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleAdd = async (crateId: string) => {
    setSaving(crateId);
    setError("");
    try {
      await addSetToCrate(crateId, set);
      setDone("Added to crate");
      setTimeout(onClose, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add set");
    } finally {
      setSaving(null);
    }
  };

  const handleCreateAndAdd = async () => {
    const name = newName.trim();
    if (!name) {
      setError("Name your crate first");
      return;
    }
    setSaving("new");
    setError("");
    try {
      const crate = await createCrate(name);
      await addSetToCrate(crate.id, set);
      setDone(`Saved to ${crate.name}`);
      setTimeout(onClose, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create crate");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-crate-title"
        className="glass-bends w-full max-w-md rounded-2xl p-6 shadow-lg"
      >
        <h2
          id="add-to-crate-title"
          className="text-lg font-semibold text-gradient-bends"
        >
          Add to crate
        </h2>
        <p className="mt-1 truncate text-sm text-zinc-500">{set.title}</p>

        {error ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {done ? (
          <p className="mt-3 text-sm text-brand-from" role="status">
            {done}
          </p>
        ) : null}

        <div className="mt-4 max-h-48 space-y-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading crates…</p>
          ) : crates.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No crates yet — create one below.
            </p>
          ) : (
            crates.map((crate) => (
              <button
                key={crate.id}
                type="button"
                disabled={saving !== null}
                onClick={() => handleAdd(crate.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  "hover:bg-black/[0.04] dark:hover:bg-brand-from/10",
                  saving === crate.id && "opacity-60"
                )}
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {crate.name}
                </span>
                <span className="text-xs text-brand-from">
                  {saving === crate.id ? "Adding…" : "Add"}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New crate name"
            className="input-bends flex-1"
          />
          <button
            type="button"
            disabled={saving !== null}
            onClick={handleCreateAndAdd}
            className="rounded-xl border border-brand-to/50 bg-brand-to/80 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
          >
            {saving === "new" ? "…" : "Create"}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-brand-from/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
