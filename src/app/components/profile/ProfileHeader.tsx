"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Share2 } from "lucide-react";
import type { Profile } from "@/app/lib/profile/profile";
import { profileSharePath } from "@/app/lib/profile/profile";
import { EDIT_PROFILE_EVENT } from "@/app/lib/profile/events";
import type { Moment } from "@/app/lib/profile/moments";
import { ProfileMomentSpotlight } from "@/app/components/profile/ProfileMomentSpotlight";

export function ProfileHeader({
  profile,
  isOwner,
  topMoments = [],
  onSave,
  onSaveMomentNote,
}: {
  profile: Profile;
  isOwner?: boolean;
  /** Up to three moments shown beside the name dashboard. */
  topMoments?: Moment[];
  onSave?: (patch: { display_name: string; bio: string }) => Promise<void>;
  onSaveMomentNote?: (momentId: string, note: string) => Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const title = profile.display_name || profile.username;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${profileSharePath(profile.username)}`
      : profileSharePath(profile.username);

  useEffect(() => {
    if (!isOwner || !onSave) return;

    const openEdit = () => {
      setEditing(true);
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
    };

    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("edit") === "1"
    ) {
      openEdit();
    }

    window.addEventListener(EDIT_PROFILE_EVENT, openEdit);
    return () => window.removeEventListener(EDIT_PROFILE_EVENT, openEdit);
  }, [isOwner, onSave, profile.display_name, profile.bio]);

  const clearEditParam = () => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("edit") !== "1") return;
    router.replace(pathname, { scroll: false });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${title} on Braindance`,
          url: shareUrl,
        });
        return;
      }
    } catch {
      /* fall through to clipboard */
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({
        display_name: displayName.trim(),
        bio: bio.trim(),
      });
      setEditing(false);
      clearEditParam();
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="relative overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-from/35 via-brand-via/20 to-brand-to/30"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[var(--page-bg)] via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10 sm:p-8">
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-from/90">
            Profile
          </p>

          {editing ? (
            <div className="space-y-3">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-bends w-full max-w-md text-2xl font-bold"
                placeholder="Display name"
                aria-label="Display name"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="input-bends w-full max-w-lg resize-y"
                placeholder="A short bio"
                aria-label="Bio"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="rounded-xl border border-brand-to/50 bg-brand-to/80 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDisplayName(profile.display_name ?? "");
                    setBio(profile.bio ?? "");
                    clearEditParam();
                  }}
                  className="rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-brand-from/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <h1 className="min-w-0 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                  {title}
                </h1>
                <button
                  type="button"
                  onClick={handleShare}
                  className="mt-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[0.06] hover:text-brand-from dark:text-zinc-400 dark:hover:bg-white/[0.08] sm:mt-2.5"
                  aria-label={copied ? "Link copied" : "Share profile"}
                  title={copied ? "Link copied" : "Share profile"}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-brand-from" aria-hidden />
                  ) : (
                    <Share2 className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              <p className="text-sm text-zinc-500">@{profile.username}</p>
              {profile.bio ? (
                <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                  {profile.bio}
                </p>
              ) : isOwner ? (
                <p className="text-sm text-zinc-400">
                  Add a bio so people know your vibe.
                </p>
              ) : null}
            </>
          )}
        </div>

        {!editing ? (
          <div className="min-w-0 w-full flex-1 sm:max-w-md">
            <ProfileMomentSpotlight
              moments={topMoments.slice(0, 3)}
              isOwner={isOwner}
              onSaveNote={onSaveMomentNote}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
