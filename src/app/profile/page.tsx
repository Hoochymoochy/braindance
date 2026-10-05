"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { getProfile, ensureProfileForCurrentUser, type Profile } from "@/app/lib/profile/profile";
import {
  createCrate,
  deleteCrate,
  listCrates,
  type Crate,
} from "@/app/lib/profile/crates";
import { deleteMoment, listMoments, type Moment } from "@/app/lib/profile/moments";
import { supabase } from "@/app/lib/utils/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [crates, setCrates] = useState<Crate[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [crateName, setCrateName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const id = await ensureProfileForCurrentUser();
      const [p, c, m] = await Promise.all([
        getProfile(id),
        listCrates(id),
        listMoments(id),
      ]);
      setProfile(p);
      setCrates(c);
      setMoments(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreateCrate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = crateName.trim();
    if (!name) return;
    try {
      await createCrate(name);
      setCrateName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create crate");
    }
  };

  const handleDeleteCrate = async (id: string) => {
    if (!confirm("Delete this crate and its sets?")) return;
    try {
      await deleteCrate(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete crate");
    }
  };

  const handleDeleteMoment = async (id: string) => {
    try {
      await deleteMoment(id);
      setMoments((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove moment");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await fetch("/api/auth/token", { method: "DELETE" });
    router.push("/login");
  };

  const displayName =
    profile?.display_name || profile?.username || "Your profile";

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 pb-16 text-zinc-900 dark:text-zinc-100">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-from/80">
            Profile
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gradient-bends">
            {displayName}
          </h1>
          {profile?.username ? (
            <p className="mt-1 text-sm text-zinc-500">{profile.username}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm text-zinc-600 transition-colors hover:border-brand-from/40 hover:text-brand-from dark:border-brand-from/20 dark:text-zinc-300"
        >
          Log out
        </button>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                Crates
              </h2>
            </div>
            <p className="text-sm text-zinc-500">
              Build custom crates of DJ sets you want to keep.
            </p>

            <form onSubmit={handleCreateCrate} className="flex gap-2">
              <input
                type="text"
                value={crateName}
                onChange={(e) => setCrateName(e.target.value)}
                placeholder="Name a new crate"
                className="input-bends flex-1"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-to/50 bg-brand-to/80 px-3 py-2 text-sm font-semibold text-zinc-950"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Create
              </button>
            </form>

            {crates.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No crates yet. Create one, then add sets from the home page or
                while watching.
              </p>
            ) : (
              <ul className="space-y-2">
                {crates.map((crate) => (
                  <li
                    key={crate.id}
                    className="glass-bends-card flex items-center gap-3 rounded-xl border border-black/8 px-4 py-3 dark:border-brand-from/15"
                  >
                    <FolderOpen
                      className="h-4 w-4 shrink-0 text-brand-from"
                      aria-hidden
                    />
                    <Link
                      href={`/profile/crates/${crate.id}`}
                      className="min-w-0 flex-1 font-medium hover:text-brand-from"
                    >
                      {crate.name}
                    </Link>
                    <button
                      type="button"
                      aria-label={`Delete ${crate.name}`}
                      onClick={() => handleDeleteCrate(crate.id)}
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-400/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              Moments
            </h2>
            <p className="text-sm text-zinc-500">
              Tracks you pinned from a set — jump back to that exact moment.
            </p>

            {moments.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No moments yet. Open a set&apos;s tracklist and hit Save moment.
              </p>
            ) : (
              <ul className="space-y-2">
                {moments.map((moment) => (
                  <li
                    key={moment.id}
                    className="glass-bends-card flex items-start gap-3 rounded-xl border border-black/8 px-4 py-3 dark:border-brand-from/15"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/stream/${moment.video_id}?t=${moment.timestamp_seconds}`}
                        className="font-medium hover:text-brand-from"
                      >
                        {moment.track_title}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {moment.track_artist}
                        {moment.track_artist && moment.timestamp_label
                          ? " · "
                          : ""}
                        <span className="font-mono text-brand-from/90">
                          {moment.timestamp_label}
                        </span>
                      </p>
                      {moment.set_title ? (
                        <p className="mt-0.5 truncate text-xs text-zinc-400">
                          {moment.set_title}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Remove moment"
                      onClick={() => handleDeleteMoment(moment.id)}
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-400/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
