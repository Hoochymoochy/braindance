"use client";

import { Music2 } from "lucide-react";
import { upgradeYoutubeThumbnail } from "@/app/lib/utils/youtube";
import { YoutubeThumbImage } from "@/app/components/ui/YoutubeThumbImage";
import { cn } from "@/lib/utils";

/** Spotify-style playlist cover: 2×2 mosaic or single art / empty state. */
export function CrateCover({
  thumbnails,
  videoIds,
  name,
  className,
  size = "md",
}: {
  thumbnails: string[];
  /** Optional parallel video ids — used to force max-res YouTube stills. */
  videoIds?: string[];
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "feature";
}) {
  const sizeClass =
    size === "feature"
      ? "aspect-[4/3] w-full sm:aspect-[16/11]"
      : size === "lg"
        ? "h-40 w-40 sm:h-52 sm:w-52"
        : size === "sm"
          ? "h-14 w-14"
          : "aspect-square w-full";

  // Oversize `sizes` so retina picks a sharper source.
  const imageSizes =
    size === "feature"
      ? "(max-width: 1024px) 90vw, 640px"
      : size === "lg"
        ? "416px"
        : size === "sm"
          ? "112px"
          : "(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 416px";

  const mosaicSizes =
    size === "feature"
      ? "(max-width: 1024px) 45vw, 320px"
      : size === "lg"
        ? "208px"
        : size === "sm"
          ? "56px"
          : "(max-width: 640px) 45vw, (max-width: 1024px) 20vw, 208px";

  const arts = thumbnails
    .slice(0, 4)
    .map((t, i) => ({
      src: upgradeYoutubeThumbnail(t, videoIds?.[i]) ?? t,
      videoId: videoIds?.[i],
    }))
    .filter((a) => Boolean(a.src));

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-sm bg-zinc-200 shadow-md dark:bg-zinc-900",
        sizeClass,
        className
      )}
      aria-hidden
    >
      {arts.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center bg-zinc-300/80 dark:bg-zinc-800">
          <Music2 className="h-1/4 w-1/4 text-zinc-500 dark:text-zinc-600" />
        </div>
      ) : arts.length === 1 ? (
        <YoutubeThumbImage
          src={arts[0]!.src}
          videoId={arts[0]!.videoId}
          sizes={imageSizes}
        />
      ) : (
        <div className="grid h-full w-full grid-cols-2 grid-rows-2">
          {Array.from({ length: 4 }).map((_, i) => {
            const art = arts[i];
            return art ? (
              <div key={i} className="relative">
                <YoutubeThumbImage
                  src={art.src}
                  videoId={art.videoId}
                  sizes={mosaicSizes}
                />
              </div>
            ) : (
              <div
                key={i}
                className="bg-zinc-300/70 dark:bg-zinc-800"
              />
            );
          })}
        </div>
      )}
      <span className="sr-only">{name}</span>
    </div>
  );
}
