"use client";

import { useState } from "react";
import { Check, Link2, LogOut, Pencil } from "lucide-react";
import type { Profile } from "@/app/lib/profile/profile";
import { profileSharePath } from "@/app/lib/profile/profile";
import type { Moment } from "@/app/lib/profile/moments";
import { ProfileMomentSpotlight } from "@/app/components/profile/ProfileMomentSpotlight";
import { cn } from "@/lib/utils";

export function ProfileHeader({
  profile,
  isOwner,
  topMoments = [],
  onSave,
  onLogout,
}: {
  profile: Profile;
  isOwner?: boolean;
  /** Up to three moments shown beside the name dashboard. */
  topMoments?: Moment[];
  onSave?: (patch: { display_name: string; bio: string }) => Promise<void>;
  onLogout?: () => void;
}) {
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
    } finally {
      setSaving(false);
    }
  };

  const actionBtn =
    "inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-sm font-medium text-zinc-800 backdrop-blur-sm transition-colors hover:border-brand-from/40 hover:text-brand-from dark:border-brand-from/20 dark:bg-black/30 dark:text-zinc-100";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={handleShare} className={actionBtn}>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-brand-from" aria-hidden />
          ) : (
            <Link2 className="h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Share profile"}
        </button>

        {isOwner && !editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={cn(
              actionBtn,
              "text-zinc-600 dark:text-zinc-300"
            )}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </button>
        ) : null}

        {isOwner && onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              actionBtn,
              "text-zinc-600 hover:border-red-400/40 hover:text-red-400 dark:text-zinc-300"
            )}
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Log out
          </button>
        ) : null}
      </div>

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
                    }}
                    className="rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-brand-from/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                  {title}
                </h1>
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
              <ProfileMomentSpotlight moments={topMoments.slice(0, 3)} />
            </div>
          ) : null}
        </div>
      </header>
    </div>
  );
}
