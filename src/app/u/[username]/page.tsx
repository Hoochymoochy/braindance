"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getProfileByUsername,
  type Profile,
} from "@/app/lib/profile/profile";
import {
  listCratesWithPreviews,
  type CratePreview,
} from "@/app/lib/profile/crates";
import {
  listMoments,
  type Moment,
} from "@/app/lib/profile/moments";
import { ProfileHeader } from "@/app/components/profile/ProfileHeader";
import { ProfileIntro } from "@/app/components/profile/ProfileIntro";
import { CratesCollection } from "@/app/components/profile/CratesCollection";
import { MomentsSetFolders } from "@/app/components/profile/MomentsSetFolders";

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [crates, setCrates] = useState<CratePreview[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const decoded = decodeURIComponent(username);
      const p = await getProfileByUsername(decoded);
      if (!p) {
        setNotFound(true);
        setProfile(null);
        return;
      }
      const [c, m] = await Promise.all([
        listCratesWithPreviews(p.id),
        listMoments(p.id),
      ]);
      setProfile(p);
      setCrates(c);
      setMoments(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-4 text-zinc-900 dark:text-zinc-100 sm:pt-8">
      {error ? (
        <p className="mb-8 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading profile…</p>
      ) : notFound || !profile ? (
        <div className="space-y-2 py-16 text-center">
          <h1 className="text-2xl font-medium tracking-tight">
            Profile not found
          </h1>
          <p className="text-sm text-zinc-500">
            This share link may be wrong or the user hasn&apos;t set up a
            profile yet.
          </p>
        </div>
      ) : (
        <div className="space-y-16 sm:space-y-20">
          <ProfileIntro userId={profile.id}>
            <ProfileHeader profile={profile} />
          </ProfileIntro>

          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-brand-from/70">
                Crates
              </h2>
              <p className="text-sm text-zinc-500">
                Record collection from @{profile.username}
              </p>
            </div>

            <CratesCollection
              crates={crates}
              hrefFor={(crate) =>
                `/u/${encodeURIComponent(profile.username)}/crates/${crate.id}`
              }
              emptyLabel="No crates to show yet."
            />
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-brand-from/70">
                Moments
              </h2>
              <p className="text-sm text-zinc-500">
                Tracks saved from sets.
              </p>
            </div>

            {moments.length === 0 ? (
              <p className="text-sm text-zinc-500">No moments shared yet.</p>
            ) : (
              <MomentsSetFolders moments={moments} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
