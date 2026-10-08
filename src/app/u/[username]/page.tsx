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
  pickTopMoments,
  sortMomentsForProfile,
  type Moment,
} from "@/app/lib/profile/moments";
import { ProfileHeader } from "@/app/components/profile/ProfileHeader";
import { ListenerArchetypeSection } from "@/app/components/profile/ListenerArchetypeSection";
import { CrateCard } from "@/app/components/profile/CrateCard";
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
      setMoments(sortMomentsForProfile(m));
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
    <div className="mx-auto max-w-5xl space-y-10 px-4 pb-16 text-zinc-900 dark:text-zinc-100">
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading profile…</p>
      ) : notFound || !profile ? (
        <div className="space-y-2 py-16 text-center">
          <h1 className="text-2xl font-bold">Profile not found</h1>
          <p className="text-sm text-zinc-500">
            This share link may be wrong or the user hasn&apos;t set up a
            profile yet.
          </p>
        </div>
      ) : (
        <>
          <ProfileHeader
            profile={profile}
            topMoments={pickTopMoments(moments)}
          />

          <ListenerArchetypeSection userId={profile.id} />

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Crates</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Public crates from @{profile.username}
              </p>
            </div>

            {crates.length === 0 ? (
              <p className="text-sm text-zinc-500">No crates to show yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {crates.map((crate) => (
                  <CrateCard
                    key={crate.id}
                    crate={crate}
                    href={`/u/${encodeURIComponent(profile.username)}/crates/${crate.id}`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Moments</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Saved timestamps from sets they love.
              </p>
            </div>

            {moments.length === 0 ? (
              <p className="text-sm text-zinc-500">No moments shared yet.</p>
            ) : (
              <MomentsSetFolders moments={moments} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
