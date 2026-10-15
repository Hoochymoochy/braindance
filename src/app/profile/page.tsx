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
import { VaultSectionOwner } from "@/app/components/vault/VaultSection";
import { reportVaultEvent } from "@/app/lib/vault/client";
import { vaultTrackKey } from "@/app/lib/vault/week";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [crates, setCrates] = useState<CratePreview[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
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
        <ProfilePageSkeleton />
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
                Vault
              </h2>
              <p className="text-sm text-zinc-500">
                Hit 100 this week for one exclusive set. Resets Monday UTC.
              </p>
            </div>
            <VaultSectionOwner />
          </section>

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
                    void reportVaultEvent({
                      type: "unsave_track",
                      videoId: moment.video_id,
                      trackKey: vaultTrackKey({
                        artist: moment.track_artist,
                        title: moment.track_title,
                        timestamp: moment.timestamp_label,
                      }),
                    });
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

function ProfilePageSkeleton() {
  return (
    <div
      className="space-y-16 sm:space-y-20"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_9.5rem] lg:items-start lg:gap-14">
        <div className="min-w-0 space-y-6">
          <div className="animate-pulse space-y-2.5">
            <div className="h-11 w-48 rounded bg-zinc-300/50 dark:bg-white/[0.06] sm:h-12 sm:w-56" />
            <div className="h-4 w-28 rounded bg-zinc-200/50 dark:bg-white/[0.04]" />
            <div className="h-4 w-64 max-w-full rounded bg-zinc-200/50 dark:bg-white/[0.04]" />
          </div>
          <div className="max-w-lg animate-pulse rounded-xl bg-[var(--page-bg)] p-4 sm:p-5">
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-zinc-300/50 dark:bg-white/[0.06]" />
              <div className="h-7 w-48 rounded bg-zinc-300/50 dark:bg-white/[0.06]" />
              <div className="h-4 w-full max-w-sm rounded bg-zinc-200/50 dark:bg-white/[0.04]" />
            </div>
          </div>
        </div>
        <aside
          className="border-t border-black/8 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 dark:border-white/[0.08]"
          aria-hidden
        >
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="animate-pulse space-y-1.5">
                <div className="h-6 w-10 rounded bg-zinc-300/50 dark:bg-white/[0.06]" />
                <div className="h-3 w-16 rounded bg-zinc-200/50 dark:bg-white/[0.04]" />
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <section className="space-y-6">
        <div className="space-y-1">
          <div className="h-3 w-14 animate-pulse rounded bg-zinc-300/50 dark:bg-white/[0.06]" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-zinc-200/50 dark:bg-white/[0.04]" />
        </div>
        <div className="animate-pulse space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-zinc-200/50 dark:bg-white/[0.04]" />
            <div className="h-1.5 w-full rounded-full bg-zinc-300/40 dark:bg-white/[0.06]" />
          </div>
          <div className="aspect-video w-full rounded bg-zinc-300/40 dark:bg-white/[0.06]" />
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-1">
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-300/50 dark:bg-white/[0.06]" />
          <div className="h-4 w-56 max-w-full animate-pulse rounded bg-zinc-200/50 dark:bg-white/[0.04]" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded bg-zinc-300/40 dark:bg-white/[0.06]"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
