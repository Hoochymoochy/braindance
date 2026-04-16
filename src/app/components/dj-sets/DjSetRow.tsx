"use client";

import { StreamCard, type StreamCardSet } from "./StreamCard";
import { TracklistPreview } from "./TracklistPreview";

export function DjSetRow({
  set,
  index,
}: {
  set: StreamCardSet;
  index: number;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
      <div className="mx-auto w-full max-w-md shrink-0 lg:mx-0">
        <StreamCard set={set} index={index} />
      </div>
      <TracklistPreview videoId={set.video_id} className="min-h-[200px] flex-1" />
    </div>
  );
}
