"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  MAX_MOMENT_NOTE_LENGTH,
  type Moment,
} from "@/app/lib/profile/moments";
import { StarBorder } from "@/app/components/ui/StarBorder";
import { YoutubeThumbImage } from "@/app/components/ui/YoutubeThumbImage";

const NOTE_MAX = MAX_MOMENT_NOTE_LENGTH;

function SpotlightRow({
  moment,
  index,
  isOwner,
  onSaveNote,
}: {
  moment: Moment;
  index: number;
  isOwner?: boolean;
  onSaveNote?: (momentId: string, note: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(moment.note ?? "");
  const [saving, setSaving] = useState(false);

  const href = `/stream/${moment.video_id}?t=${moment.timestamp_seconds}`;
  const note = moment.note?.trim() ?? "";

  const handleSave = async () => {
    if (!onSaveNote) return;
    setSaving(true);
    try {
      await onSaveNote(moment.id, draft.slice(0, NOTE_MAX));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li
      className="motion-enter"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <StarBorder
        as="div"
        color="var(--brand-via)"
        speed={`${10 + index * 2}s`}
        thickness={1.5}
        contentClassName="group flex items-center gap-2.5 rounded-xl border border-black/8 bg-white/70 px-2 py-1.5 backdrop-blur-sm dark:border-brand-from/20 dark:bg-black/50"
      >
        <span className="w-4 shrink-0 text-center text-[11px] tabular-nums text-zinc-400">
          {index + 1}
        </span>
        <Link
          href={href}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-200 transition-transform duration-300 ease-bends hover:scale-105 dark:bg-zinc-800"
          aria-label="Open moment"
        >
          <YoutubeThumbImage videoId={moment.video_id} sizes="80px" />
        </Link>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-1.5">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, NOTE_MAX))}
                maxLength={NOTE_MAX}
                className="input-bends w-full text-sm"
                placeholder="Short note…"
                aria-label="Favorite note"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] tabular-nums text-zinc-400">
                  {draft.length}/{NOTE_MAX}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="rounded-lg border border-brand-to/50 bg-brand-to/80 px-2 py-1 text-xs font-semibold text-zinc-950 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setDraft(moment.note ?? "");
                    }}
                    className="rounded-lg border border-black/10 px-2 py-1 text-xs dark:border-brand-from/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1.5">
              <Link href={href} className="min-w-0 flex-1">
                {note ? (
                  <span className="block text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-50">
                    {note}
                  </span>
                ) : isOwner ? (
                  <span className="block text-sm text-zinc-400">
                    Add a short note…
                  </span>
                ) : (
                  <span className="block text-sm text-zinc-400 italic">
                    No note yet
                  </span>
                )}
              </Link>
              {isOwner && onSaveNote ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(moment.note ?? "");
                    setEditing(true);
                  }}
                  className="shrink-0 rounded-lg p-1 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-brand-from"
                  aria-label="Edit note"
                  title="Edit note"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          )}
        </div>
      </StarBorder>
    </li>
  );
}

export function ProfileMomentSpotlight({
  moments,
  isOwner,
  onSaveNote,
}: {
  moments: Moment[];
  isOwner?: boolean;
  onSaveNote?: (momentId: string, note: string) => Promise<void>;
}) {
  if (moments.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        Top moments
      </p>
      <ul className="space-y-1.5">
        {moments.map((moment, i) => (
          <SpotlightRow
            key={moment.id}
            moment={moment}
            index={i}
            isOwner={isOwner}
            onSaveNote={onSaveNote}
          />
        ))}
      </ul>
    </div>
  );
}
