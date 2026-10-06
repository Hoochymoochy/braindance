"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  ensureProfileForCurrentUser,
  getProfile,
  updateProfile,
  type Profile,
} from "@/app/lib/profile/profile";
import {
  createCrate,
  deleteCrate,
  listCratesWithPreviews,
  type CratePreview,
} from "@/app/lib/profile/crates";
import { deleteMoment, listMoments, type Moment } from "@/app/lib/profile/moments";
import { supabase } from "@/app/lib/utils/supabaseClient";
import { ProfileHeader } from "@/app/components/profile/ProfileHeader";
import { CrateCard } from "@/app/components/profile/CrateCard";
import { MomentsTrackRow } from "@/app/components/profile/MomentsTrackRow";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [crates, setCrates] = useState<CratePreview[]>([]);
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
        listCratesWithPreviews(id),
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

  const handleSaveProfile = async (patch: {
    display_name: string;
    bio: string;
  }) => {
    if (!profile) return;
    await updateProfile(profile.id, patch);
    await refresh();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await fetch("/api/auth/token", { method: "DELETE" });
    router.push("/login");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 pb-16 text-zinc-900 dark:text-zinc-100">
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {loading || !profile ? (
        <p className="text-sm text-zinc-500">Loading profile…</p>
      ) : (
        <>
          <ProfileHeader
            profile={profile}
            isOwner
            onSave={handleSaveProfile}
            onLogout={handleLogout}
          />

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Crates</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Playlists of sets you want to keep.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCrate} className="flex max-w-md gap-2">
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
                No crates yet. Create one, then hit + on any set.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {crates.map((crate) => (
                  <CrateCard
                    key={crate.id}
                    crate={crate}
                    href={`/profile/crates/${crate.id}`}
                    onDelete={() => handleDeleteCrate(crate.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Moments</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Tracks you pinned — jump straight to that timestamp.
              </p>
            </div>

            {moments.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No moments yet. Open a tracklist and save a moment.
              </p>
            ) : (
              <div className="rounded-xl border border-black/8 bg-white/40 px-1 py-1 dark:border-brand-from/15 dark:bg-black/20">
                <div className="hidden grid-cols-[2rem_2.5rem_minmax(0,1fr)_5rem_auto] gap-3 border-b border-black/5 px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-white/10 sm:grid">
                  <span>#</span>
                  <span />
                  <span>Title</span>
                  <span>Time</span>
                  <span />
                </div>
                {moments.map((moment, i) => (
                  <MomentsTrackRow
                    key={moment.id}
                    moment={moment}
                    index={i}
                    onDelete={() => handleDeleteMoment(moment.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
