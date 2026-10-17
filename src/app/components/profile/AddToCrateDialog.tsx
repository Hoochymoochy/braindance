"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ListMusic, Plus, X } from "lucide-react";
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
  /** `stream` matches set-page chrome (sharp edges, micro-labels). */
  variant?: "default" | "stream";
};

const scrollbarSubtle =
  "[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 dark:[&::-webkit-scrollbar-thumb]:bg-brand-from/25";

export function AddToCrateDialog({
  open,
  onClose,
  userId,
  set,
  onMembershipChange,
  variant = "default",
}: AddToCrateDialogProps) {
  const router = useRouter();
  const stream = variant === "stream";
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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

  if (!userId) {
    if (stream) {
      return (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          onClick={onClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-to-crate-title"
            className="glass-bends-card motion-enter relative w-full max-w-md overflow-hidden rounded-none border border-black/6 dark:border-white/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-from/[0.1] via-transparent to-brand-to/[0.08]"
              aria-hidden
            />
            <div className="relative z-10 p-5 sm:p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-brand-from/70">
                Save to crate
              </p>
              <h2
                id="add-to-crate-title"
                className="mt-2 text-base font-medium text-zinc-900 dark:text-zinc-50"
              >
                Log in to keep this set
              </h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                Crates live on your profile — sign in to start collecting.
              </p>
              <div className="mt-5 flex gap-2 border-t border-black/6 pt-4 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-3 py-2.5 text-sm text-zinc-500 transition-colors duration-bends-fast ease-bends hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="flex-1 border border-brand-from/40 bg-brand-from/15 px-3 py-2.5 text-sm font-medium text-brand-from transition-colors duration-bends-fast ease-bends hover:bg-brand-from/25"
                >
                  Log in
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

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
              className="flex-1 rounded-xl border border-brand-to/50 bg-brand-to/80 px-3 py-2 text-sm font-semibold text-white"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stream) {
    return (
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-to-crate-title"
          className="glass-bends-card motion-enter relative flex max-h-[min(88dvh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-none border border-black/6 dark:border-white/[0.06]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-from/[0.12] via-brand-via/[0.04] to-brand-to/[0.1]"
            aria-hidden
          />

          <div className="relative z-10 flex shrink-0 items-start gap-3 border-b border-black/6 px-4 py-3 dark:border-white/[0.06]">
            <ListMusic
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-brand-from/70"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <h2
                id="add-to-crate-title"
                className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-brand-from/70"
              >
                Add to crate
              </h2>
              <p className="mt-0.5 truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {set.title}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-sm p-1.5 text-zinc-500 transition-colors duration-bends-fast ease-bends hover:bg-black/[0.04] hover:text-zinc-800 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-2 border-b border-black/6 px-4 py-2.5 dark:border-white/[0.06]">
            {!creating ? (
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => {
                  setCreating(true);
                  setError("");
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500 transition-colors duration-bends-fast ease-bends hover:text-brand-from disabled:opacity-60 dark:text-zinc-400 dark:hover:text-brand-from"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                New crate
              </button>
            ) : (
              <form
                className="flex w-full min-w-0 items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleCreateAndAdd();
                }}
              >
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name this crate"
                  className="input-bends flex-1 !rounded-none py-1.5 text-sm"
                  aria-label="Crate name"
                  autoFocus
                  disabled={saving !== null}
                />
                <button
                  type="submit"
                  disabled={saving !== null || !newName.trim()}
                  className="shrink-0 border border-brand-from/35 bg-brand-from/15 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-from transition-colors duration-bends-fast ease-bends hover:bg-brand-from/25 disabled:opacity-60"
                >
                  {saving === "new" ? "…" : "Add"}
                </button>
                <button
                  type="button"
                  disabled={saving !== null}
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                  }}
                  className="shrink-0 px-1.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-zinc-500 transition-colors duration-bends-fast ease-bends hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {error ? (
            <p
              className="relative z-10 border-b border-black/6 px-4 py-2 text-xs text-red-400 dark:border-white/[0.06]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div
            className={cn(
              "relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-none px-2 py-2",
              scrollbarSubtle
            )}
          >
            {loading ? (
              <p className="px-2 py-8 text-center text-sm text-zinc-500">
                Loading crates…
              </p>
            ) : crates.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-zinc-500">
                No crates yet — make one above.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {crates.map((crate) => {
                  const alreadyIn = inCrateIds.has(crate.id);
                  return (
                    <li key={crate.id}>
                      <button
                        type="button"
                        disabled={saving !== null}
                        onClick={() => handleToggle(crate.id)}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors duration-bends-fast ease-bends",
                          alreadyIn
                            ? "bg-brand-from/10 dark:bg-brand-from/15"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                          saving === crate.id && "opacity-60"
                        )}
                      >
                        <CrateCover
                          thumbnails={crate.thumbnails}
                          videoIds={crate.cover_video_ids}
                          name={crate.name}
                          size="sm"
                          className="!h-10 !w-10 shadow-none"
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-sm font-medium",
                              alreadyIn
                                ? "text-brand-from"
                                : "text-zinc-900 dark:text-zinc-50"
                            )}
                          >
                            {crate.name}
                          </span>
                          <span className="block text-xs tabular-nums text-zinc-500">
                            {crate.set_count}{" "}
                            {crate.set_count === 1 ? "set" : "sets"}
                            {alreadyIn ? " · In crate" : ""}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm transition-colors duration-bends-fast ease-bends",
                            alreadyIn
                              ? "text-brand-from"
                              : "text-zinc-400 group-hover:text-brand-from"
                          )}
                          aria-hidden
                        >
                          {alreadyIn ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
                          ) : (
                            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="relative z-10 shrink-0 border-t border-black/6 px-4 py-2.5 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500 transition-colors duration-bends-fast ease-bends hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-to/50 bg-brand-to/80 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
              className="rounded-xl border border-brand-to/50 bg-brand-to/80 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
