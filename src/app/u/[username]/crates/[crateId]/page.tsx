"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import {
  getProfileByUsername,
  type Profile,
} from "@/app/lib/profile/profile";
import {
  getCrate,
  listCrateSets,
  type Crate,
  type CrateSet,
} from "@/app/lib/profile/crates";
import { upgradeYoutubeThumbnail, youtubeThumbnailUrl } from "@/app/lib/utils/youtube";
import { CrateCover } from "@/app/components/profile/CrateCover";
import { CrateSetRow } from "@/app/components/profile/CrateSetRow";

export default function PublicCratePage() {
  const { username, crateId } = useParams<{
    username: string;
    crateId: string;
  }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [crate, setCrate] = useState<Crate | null>(null);
  const [sets, setSets] = useState<CrateSet[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!username || !crateId) return;
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const decoded = decodeURIComponent(username);
      const p = await getProfileByUsername(decoded);
      const row = await getCrate(crateId);
      if (!p || !row || row.user_id !== p.id) {
        setNotFound(true);
        return;
      }
      setProfile(p);
      setCrate(row);
      setSets(await listCrateSets(crateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load crate");
    } finally {
      setLoading(false);
    }
  }, [username, crateId]);

  useEffect(() => {
    load();
  }, [load]);

  const thumbnails = useMemo(() => {
    const coverSets = [...sets]
      .sort(
        (a, b) =>
          new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
      )
      .slice(0, 4);
    return {
      urls: coverSets
        .map(
          (s) =>
            upgradeYoutubeThumbnail(s.thumbnail, s.video_id) ??
            s.thumbnail ??
            youtubeThumbnailUrl(s.video_id)
        )
        .filter((t): t is string => Boolean(t)),
      videoIds: coverSets.map((s) => s.video_id),
    };
  }, [sets]);

  const playOrder = useMemo(
    () =>
      [...sets].sort(
        (a, b) =>
          new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
      ),
    [sets]
  );

  const firstSetHref =
    playOrder[0] && crateId
      ? `/stream/${playOrder[0].video_id}?src=crate&crate=${encodeURIComponent(crateId)}`
      : null;

  const backHref = profile
    ? `/u/${encodeURIComponent(profile.username)}`
    : "/";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 text-zinc-900 dark:text-zinc-100">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm backdrop-blur-sm transition-colors hover:border-brand-from/40 hover:text-brand-from dark:border-brand-from/20 dark:bg-black/30 dark:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to profile
      </Link>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading crate…</p>
      ) : notFound || !crate || !profile ? (
        <div className="space-y-2 py-16 text-center">
          <h1 className="text-2xl font-bold">Crate not found</h1>
          <p className="text-sm text-zinc-500">
            This crate may be private or the link is wrong.
          </p>
        </div>
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
                thumbnails={thumbnails.urls}
                videoIds={thumbnails.videoIds}
                name={crate.name}
                size="lg"
                className="shadow-xl"
              />
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-from/90">
                  Crate
                </p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                  {crate.name}
                </h1>
                {crate.description ? (
                  <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                    {crate.description}
                  </p>
                ) : null}
                <p className="text-sm text-zinc-500">
                  By{" "}
                  <Link
                    href={backHref}
                    className="font-medium text-brand-from hover:underline"
                  >
                    {profile.display_name || profile.username}
                  </Link>
                  {" · "}
                  {sets.length} {sets.length === 1 ? "set" : "sets"}
                </p>
                {firstSetHref ? (
                  <Link
                    href={firstSetHref}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-to px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-transform hover:scale-[1.02]"
                  >
                    <Play className="h-4 w-4 fill-current" aria-hidden />
                    Play
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {sets.length === 0 ? (
            <p className="text-sm text-zinc-500">This crate is empty.</p>
          ) : (
            <div className="rounded-xl border border-black/8 bg-white/40 px-1 py-1 dark:border-brand-from/15 dark:bg-black/20">
              {sets.map((set, i) => (
                <CrateSetRow
                  key={set.id}
                  set={set}
                  index={i}
                  crateId={crateId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
