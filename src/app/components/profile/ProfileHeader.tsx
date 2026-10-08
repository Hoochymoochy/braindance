"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Share2 } from "lucide-react";
import type { Profile } from "@/app/lib/profile/profile";
import { profileSharePath } from "@/app/lib/profile/profile";
import { EDIT_PROFILE_EVENT } from "@/app/lib/profile/events";

export function ProfileHeader({
  profile,
  isOwner,
  onSave,
}: {
  profile: Profile;
  isOwner?: boolean;
  onSave?: (patch: { display_name: string; bio: string }) => Promise<void>;
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
    <header className="space-y-4">
      {editing ? (
        <div className="space-y-3">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-bends w-full max-w-md text-2xl font-medium tracking-tight"
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
              className="rounded-md border border-brand-to/50 bg-brand-to/80 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-60"
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
              className="rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-3">
            <h1 className="min-w-0 text-4xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl sm:leading-[1.1]">
              {title}
            </h1>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-zinc-400 transition-colors duration-bends-fast ease-bends hover:text-zinc-700 dark:hover:text-brand-from"
              aria-label={copied ? "Link copied" : "Share profile"}
              title={copied ? "Link copied" : "Share profile"}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-brand-from" aria-hidden />
              ) : (
                <Share2 className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          </div>
          <p className="text-sm tracking-wide text-zinc-500">
            @{profile.username}
          </p>
          {profile.bio ? (
            <p className="max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {profile.bio}
            </p>
          ) : isOwner ? (
            <p className="text-sm text-zinc-400">
              Add a bio so people know your vibe.
            </p>
          ) : null}
        </>
      )}
    </header>
  );
}
