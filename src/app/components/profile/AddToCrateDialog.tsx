"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import {
  addSetToCrate,
  createCrate,
  listCrateIdsContainingVideo,
  listCratesWithPreviews,
  removeSetFromCrate,
  type CratePreview,
  type CrateSetInput,
} from "@/app/lib/profile/crates";
import { CrateCover } from "@/app/components/profile/CrateCover";
import { upgradeYoutubeThumbnail, youtubeThumbnailUrl } from "@/app/lib/utils/youtube";
import { cn } from "@/lib/utils";

type AddToCrateDialogProps = {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  set: CrateSetInput;
  /** Fired whenever membership for this set changes (add or remove). */
  onMembershipChange?: (inAnyCrate: boolean) => void;
};

export function AddToCrateDialog({
  open,
  onClose,
  userId,
  set,
  onMembershipChange,
}: AddToCrateDialogProps) {
  const router = useRouter();
  const [crates, setCrates] = useState<CratePreview[]>([]);
  const [inCrateIds, setInCrateIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !userId) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setCreating(false);
    setNewName("");

    Promise.all([
      listCratesWithPreviews(userId),
      listCrateIdsContainingVideo(userId, set.video_id),
    ])
      .then(([rows, containing]) => {
        if (cancelled) return;
        setCrates(rows);
        setInCrateIds(new Set(containing));
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
  }, [open, userId, set.video_id]);

  const syncMembership = (next: Set<string>) => {
    setInCrateIds(next);
    onMembershipChange?.(next.size > 0);
  };

  const hiResThumb =
    upgradeYoutubeThumbnail(set.thumbnail, set.video_id) ??
    youtubeThumbnailUrl(set.video_id);

  const patchCover = (crate: CratePreview, adding: boolean): CratePreview => {
    if (adding) {
      const thumbnails = crate.thumbnails.includes(hiResThumb)
        ? crate.thumbnails
        : [...crate.thumbnails, hiResThumb].slice(0, 4);
      const cover_video_ids = crate.cover_video_ids.includes(set.video_id)
        ? crate.cover_video_ids
        : [...crate.cover_video_ids, set.video_id].slice(0, 4);
      return {
        ...crate,
        set_count: crate.set_count + 1,
        thumbnails,
        cover_video_ids,
      };
    }

    const idx = crate.cover_video_ids.indexOf(set.video_id);
    return {
      ...crate,
      set_count: Math.max(0, crate.set_count - 1),
      thumbnails:
        idx >= 0
          ? crate.thumbnails.filter((_, i) => i !== idx)
          : crate.thumbnails.filter((t) => t !== hiResThumb),
      cover_video_ids: crate.cover_video_ids.filter((id) => id !== set.video_id),
    };
  };

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

  const handleToggle = async (crateId: string) => {
    setSaving(crateId);
    setError("");
    try {
      if (inCrateIds.has(crateId)) {
        await removeSetFromCrate(crateId, set.video_id);
        const next = new Set(inCrateIds);
        next.delete(crateId);
        syncMembership(next);
        setCrates((prev) =>
          prev.map((c) => (c.id === crateId ? patchCover(c, false) : c))
        );
      } else {
        await addSetToCrate(crateId, set);
        const next = new Set(inCrateIds);
        next.add(crateId);
        syncMembership(next);
        setCrates((prev) =>
          prev.map((c) => (c.id === crateId ? patchCover(c, true) : c))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update crate");
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
      const preview: CratePreview = {
        ...crate,
        set_count: 1,
        thumbnails: [hiResThumb],
        cover_video_ids: [set.video_id],
      };
      setCrates((prev) => [preview, ...prev]);
      const next = new Set(inCrateIds);
      next.add(crate.id);
      syncMembership(next);
      setNewName("");
      setCreating(false);
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
        className="glass-bends w-full max-w-lg rounded-2xl p-6 shadow-lg sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="add-to-crate-title"
              className="text-lg font-semibold text-gradient-bends sm:text-xl"
            >
              Add to crate
            </h2>
            <p className="mt-1 truncate text-sm text-zinc-500">{set.title}</p>
          </div>
          {!creating ? (
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => {
                setCreating(true);
                setError("");
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-to/50 bg-brand-to/80 px-3.5 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Create crate
            </button>
          ) : null}
        </div>

        {creating ? (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleCreateAndAdd();
            }}
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Crate name"
              className="input-bends flex-1"
              aria-label="Crate name"
              autoFocus
              disabled={saving !== null}
            />
            <button
              type="submit"
              disabled={saving !== null || !newName.trim()}
              className="rounded-xl border border-brand-to/50 bg-brand-to/80 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              {saving === "new" ? "…" : "Create"}
            </button>
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-brand-from/20"
            >
              Cancel
            </button>
          </form>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 max-h-72 space-y-2 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading crates…</p>
          ) : crates.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No crates yet — hit Create crate above.
            </p>
          ) : (
            crates.map((crate) => {
              const alreadyIn = inCrateIds.has(crate.id);
              return (
                <button
                  key={crate.id}
                  type="button"
                  disabled={saving !== null}
                  onClick={() => handleToggle(crate.id)}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors",
                    "hover:bg-black/[0.04] dark:hover:bg-brand-from/10",
                    saving === crate.id && "opacity-60"
                  )}
                >
                  <CrateCover
                    thumbnails={crate.thumbnails}
                    videoIds={crate.cover_video_ids}
                    name={crate.name}
                    size="sm"
                    className="shadow-sm"
                  />
                  <span className="min-w-0 flex-1 truncate text-base font-medium text-zinc-800 dark:text-zinc-100">
                    {crate.name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors",
                      alreadyIn
                        ? "border-brand-from bg-brand-from text-white"
                        : "border-black/10 text-zinc-600 dark:border-brand-from/25 dark:text-zinc-300"
                    )}
                    aria-hidden
                  >
                    {alreadyIn ? (
                      <Check className="h-4 w-4" strokeWidth={2.25} />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </span>
                </button>
              );
            })
          )}
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
