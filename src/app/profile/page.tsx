"use client";

import { useCallback, useEffect, useState } from "react";
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
import {
  deleteMoment,
  listMoments,
  type Moment,
} from "@/app/lib/profile/moments";
import { ProfileHeader } from "@/app/components/profile/ProfileHeader";
import { ListenerArchetypeSection } from "@/app/components/profile/ListenerArchetypeSection";
import { CrateCard } from "@/app/components/profile/CrateCard";
import { CreateCrateTile } from "@/app/components/profile/CreateCrateTile";
import { MomentsSetFolders } from "@/app/components/profile/MomentsSetFolders";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [crates, setCrates] = useState<CratePreview[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
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

  const handleCreateCrate = async (name: string) => {
    try {
      await createCrate(name);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create crate");
      throw err;
    }
  };

  const handleDeleteCrate = async (id: string) => {
    await deleteCrate(id);
    await refresh();
  };

  const handleSaveProfile = async (patch: {
    display_name: string;
    bio: string;
  }) => {
    if (!profile) return;
    await updateProfile(profile.id, patch);
    await refresh();
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
          />

          <ListenerArchetypeSection userId={profile.id} />

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Crates</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Playlists of sets you want to keep.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <CreateCrateTile onCreate={handleCreateCrate} />
              {crates.map((crate) => (
                <CrateCard
                  key={crate.id}
                  crate={crate}
                  href={`/profile/crates/${crate.id}`}
                  onDelete={async () => {
                    try {
                      await handleDeleteCrate(crate.id);
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Could not delete crate"
                      );
                      throw err;
                    }
                  }}
                />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Moments</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Tracks you saved from sets.
              </p>
            </div>

            {moments.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No moments yet. Save a track from any stream page.
              </p>
            ) : (
              <MomentsSetFolders
                moments={moments}
                onDelete={async (moment) => {
                  try {
                    await deleteMoment(moment.id);
                    setMoments((prev) =>
                      prev.filter((m) => m.id !== moment.id)
                    );
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Could not delete moment"
                    );
                  }
                }}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
