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
import { ProfileIntro } from "@/app/components/profile/ProfileIntro";
import { CratesCollection } from "@/app/components/profile/CratesCollection";
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
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-4 text-zinc-900 dark:text-zinc-100 sm:pt-8">
      {error ? (
        <p className="mb-8 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {loading || !profile ? (
        <p className="text-sm text-zinc-500">Loading profile…</p>
      ) : (
        <div className="space-y-16 sm:space-y-20">
          <ProfileIntro userId={profile.id}>
            <ProfileHeader
              profile={profile}
              isOwner
              onSave={handleSaveProfile}
            />
          </ProfileIntro>

          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-brand-from/70">
                Crates
              </h2>
              <p className="text-sm text-zinc-500">
                Your record collection — sets worth keeping.
              </p>
            </div>

            <CratesCollection
              crates={crates}
              hrefFor={(crate) => `/profile/crates/${crate.id}`}
              onCreate={handleCreateCrate}
              onDelete={async (id) => {
                try {
                  await handleDeleteCrate(id);
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
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-brand-from/70">
                Moments
              </h2>
              <p className="text-sm text-zinc-500">
                Tracks pulled from a night out — saved for later.
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
        </div>
      )}
    </div>
  );
}
