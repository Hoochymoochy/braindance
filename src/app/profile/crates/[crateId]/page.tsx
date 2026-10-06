"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { useUserId } from "@/app/components/profile/UserProvider";
import {
  getCrate,
  listCrateSets,
  removeSetFromCrate,
  updateCrate,
  type Crate,
  type CrateSet,
} from "@/app/lib/profile/crates";
import { CrateCover } from "@/app/components/profile/CrateCover";
import { CrateSetRow } from "@/app/components/profile/CrateSetRow";

export default function CrateDetailPage() {
  const { crateId } = useParams<{ crateId: string }>();
  const userId = useUserId();
  const router = useRouter();
  const [crate, setCrate] = useState<Crate | null>(null);
  const [sets, setSets] = useState<CrateSet[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!crateId) return;
    setLoading(true);
    setError("");
    try {
      const row = await getCrate(crateId);
      if (!row || row.user_id !== userId) {
        router.replace("/profile");
        return;
      }
      setCrate(row);
      setName(row.name);
      setDescription(row.description ?? "");
      setSets(await listCrateSets(crateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load crate");
    } finally {
      setLoading(false);
    }
  }, [crateId, userId, router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const thumbnails = useMemo(
    () =>
      sets
        .map((s) => s.thumbnail)
        .filter((t): t is string => Boolean(t))
        .slice(0, 4),
    [sets]
  );

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crateId) return;
    try {
      await updateCrate(crateId, {
        name: name.trim() || crate?.name || "Untitled",
        description: description.trim(),
      });
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save crate");
    }
  };

  const handleRemove = async (videoId: string) => {
    if (!crateId) return;
    try {
      await removeSetFromCrate(crateId, videoId);
      setSets((prev) => prev.filter((s) => s.video_id !== videoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove set");
    }
  };

  const firstSetHref = sets[0]
    ? `/stream/${sets[0].video_id}?src=crate`
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 text-zinc-900 dark:text-zinc-100">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-brand-from"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to profile
      </Link>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {loading || !crate ? (
        <p className="text-sm text-zinc-500">Loading crate…</p>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-2xl">
            <div
              className="absolute inset-0 bg-gradient-to-br from-brand-from/40 via-brand-via/25 to-brand-to/35"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[var(--page-bg)] via-transparent to-transparent"
              aria-hidden
            />
            <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:gap-8 sm:p-8">
              <CrateCover
                thumbnails={thumbnails}
                name={crate.name}
                size="lg"
                className="shadow-xl"
              />
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-from/90">
                  Crate
                </p>
                {editing ? (
                  <form onSubmit={handleSaveMeta} className="space-y-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-bends w-full text-2xl font-bold"
                      aria-label="Crate name"
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Optional description"
                      className="input-bends w-full resize-y"
                      aria-label="Crate description"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-xl border border-brand-to/50 bg-brand-to/80 px-3 py-2 text-sm font-semibold text-zinc-950"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setName(crate.name);
                          setDescription(crate.description ?? "");
                        }}
                        className="rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-brand-from/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                      {crate.name}
                    </h1>
                    {crate.description ? (
                      <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                        {crate.description}
                      </p>
                    ) : null}
                    <p className="text-sm text-zinc-500">
                      {sets.length} {sets.length === 1 ? "set" : "sets"}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {firstSetHref ? (
                        <Link
                          href={firstSetHref}
                          className="inline-flex items-center gap-2 rounded-full bg-brand-to px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-transform hover:scale-[1.02]"
                        >
                          <Play className="h-4 w-4 fill-current" aria-hidden />
                          Play
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="rounded-full border border-black/10 px-4 py-2 text-sm dark:border-brand-from/20"
                      >
                        Edit details
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {sets.length === 0 ? (
            <p className="text-sm text-zinc-500">
              This crate is empty. Add sets from home or any stream page.
            </p>
          ) : (
            <div className="rounded-xl border border-black/8 bg-white/40 px-1 py-1 dark:border-brand-from/15 dark:bg-black/20">
              <div className="hidden grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] gap-3 border-b border-black/5 px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-white/10 sm:grid">
                <span>#</span>
                <span />
                <span>Title</span>
                <span />
              </div>
              {sets.map((set, i) => (
                <CrateSetRow
                  key={set.id}
                  set={set}
                  index={i}
                  onRemove={() => handleRemove(set.video_id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
