"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useUserId } from "@/app/components/profile/UserProvider";
import {
  getCrate,
  listCrateSets,
  removeSetFromCrate,
  updateCrate,
  type Crate,
  type CrateSet,
} from "@/app/lib/profile/crates";
import { StreamCard } from "@/app/components/dj-sets/StreamCard";

export default function CrateDetailPage() {
  const { crateId } = useParams<{ crateId: string }>();
  const userId = useUserId();
  const router = useRouter();
  const [crate, setCrate] = useState<Crate | null>(null);
  const [sets, setSets] = useState<CrateSet[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crateId) return;
    try {
      await updateCrate(crateId, {
        name: name.trim() || crate?.name || "Untitled",
        description: description.trim(),
      });
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
          <form onSubmit={handleSaveMeta} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-bends w-full text-xl font-semibold"
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
            <button
              type="submit"
              className="rounded-xl border border-brand-to/50 bg-brand-to/80 px-3 py-2 text-sm font-semibold text-zinc-950"
            >
              Save crate
            </button>
          </form>

          {sets.length === 0 ? (
            <p className="text-sm text-zinc-500">
              This crate is empty. Add sets from home or any stream page.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sets.map((set, index) => (
                <li key={set.id} className="relative">
                  <StreamCard
                    set={{
                      video_id: set.video_id,
                      title: set.title,
                      channel: set.channel,
                      thumbnail: set.thumbnail ?? undefined,
                    }}
                    index={index}
                    source="crate"
                    showAddToCrate={false}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${set.title}`}
                    onClick={() => handleRemove(set.video_id)}
                    className="absolute right-2 top-2 z-10 rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-500/80"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
