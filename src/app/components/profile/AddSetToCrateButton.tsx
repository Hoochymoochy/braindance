"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { AddToCrateDialog } from "@/app/components/profile/AddToCrateDialog";
import { useAuthUserId } from "@/app/lib/hooks/useAuthUserId";
import {
  listCrateIdsContainingVideo,
  removeSetFromAllUserCrates,
  type CrateSetInput,
} from "@/app/lib/profile/crates";
import { upgradeYoutubeThumbnail } from "@/app/lib/utils/youtube";
import { cn } from "@/lib/utils";

type AddSetToCrateButtonProps = {
  set: CrateSetInput;
  className?: string;
};

/** Compact ➕ / ✓ control that opens the crate picker (same UX as stream cards). */
export function AddSetToCrateButton({
  set,
  className,
}: AddSetToCrateButtonProps) {
  const userId = useAuthUserId();
  const [open, setOpen] = useState(false);
  const [inCrate, setInCrate] = useState(false);
  const [busy, setBusy] = useState(false);
  const videoId = set.video_id?.trim() ?? "";

  useEffect(() => {
    if (!userId || !videoId) {
      setInCrate(false);
      return;
    }

    let cancelled = false;
    listCrateIdsContainingVideo(userId, videoId)
      .then((ids) => {
        if (!cancelled) setInCrate(ids.length > 0);
      })
      .catch(() => {
        if (!cancelled) setInCrate(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, videoId]);

  if (!videoId) return null;

  const handleClick = async () => {
    if (!userId) {
      setOpen(true);
      return;
    }

    if (inCrate) {
      setBusy(true);
      try {
        await removeSetFromAllUserCrates(userId, videoId);
        setInCrate(false);
      } catch {
        setOpen(true);
      } finally {
        setBusy(false);
      }
      return;
    }

    setOpen(true);
  };

  const dialogSet: CrateSetInput = {
    video_id: videoId,
    title: set.title,
    channel: set.channel,
    thumbnail:
      upgradeYoutubeThumbnail(set.thumbnail, videoId) ?? set.thumbnail,
  };

  return (
    <>
      <button
        type="button"
        disabled={busy}
        aria-label={
          inCrate
            ? `Remove ${set.title} from crates`
            : `Add ${set.title} to a crate`
        }
        aria-pressed={inCrate}
        onClick={handleClick}
        className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-60",
          inCrate
            ? "border-brand-from bg-brand-from text-white hover:bg-brand-from/90"
            : "border-black/10 text-zinc-600 hover:border-brand-from/40 hover:bg-brand-from/10 hover:text-brand-from dark:border-brand-from/25 dark:text-zinc-300",
          className
        )}
      >
        {inCrate ? (
          <Check className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        ) : (
          <Plus className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>

      <AddToCrateDialog
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
        set={dialogSet}
        onMembershipChange={setInCrate}
      />
    </>
  );
}
