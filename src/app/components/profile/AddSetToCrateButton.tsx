"use client";

import { useEffect, useState } from "react";
import { Check, ListMusic, Plus } from "lucide-react";
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
  /** `stream` matches set-page chrome under the player. */
  variant?: "default" | "stream";
};

/** Compact ➕ / ✓ control that opens the crate picker (same UX as stream cards). */
export function AddSetToCrateButton({
  set,
  className,
  variant = "default",
}: AddSetToCrateButtonProps) {
  const userId = useAuthUserId();
  const [open, setOpen] = useState(false);
  const [inCrate, setInCrate] = useState(false);
  const [busy, setBusy] = useState(false);
  const videoId = set.video_id?.trim() ?? "";
  const stream = variant === "stream";

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

  if (!videoId || !userId) return null;

  const handleClick = async () => {
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
          stream
            ? cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-bends-fast ease-bends disabled:opacity-60",
                inCrate
                  ? "bg-brand-from/15 text-brand-from hover:bg-brand-from/25"
                  : "text-zinc-500 hover:bg-black/[0.04] hover:text-brand-from dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-brand-from"
              )
            : cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-60",
                inCrate
                  ? "border-brand-from bg-brand-from text-white hover:bg-brand-from/90"
                  : "border-black/10 text-zinc-600 hover:border-brand-from/40 hover:bg-brand-from/10 hover:text-brand-from dark:border-brand-from/25 dark:text-zinc-300"
              ),
          className
        )}
      >
        {stream ? (
          <>
            <ListMusic className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{inCrate ? "In crate" : "Crate"}</span>
            {inCrate ? (
              <Check className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden />
            ) : (
              <Plus className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden />
            )}
          </>
        ) : inCrate ? (
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
        variant={variant}
      />
    </>
  );
}
