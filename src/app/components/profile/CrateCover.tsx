"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Music2 } from "lucide-react";
import {
  upgradeYoutubeThumbnail,
  youtubeThumbnailFallbackUrl,
} from "@/app/lib/utils/youtube";
import { cn } from "@/lib/utils";

/** YouTube often returns HTTP 200 for maxres with a ~120px gray stub — step down. */
const MIN_REAL_THUMB_WIDTH = 200;

function CoverThumb({
  src,
  videoId,
  sizes,
}: {
  src: string;
  videoId?: string | null;
  sizes: string;
}) {
  const hiRes = upgradeYoutubeThumbnail(src, videoId) ?? src;
  const [thumbSrc, setThumbSrc] = useState(hiRes);

  useEffect(() => {
    setThumbSrc(hiRes);
  }, [hiRes]);

  const stepDown = () => {
    const next = youtubeThumbnailFallbackUrl(thumbSrc);
    if (next !== thumbSrc) setThumbSrc(next);
  };

  return (
    <Image
      src={thumbSrc}
      alt=""
      fill
      unoptimized
      quality={100}
      className="object-cover"
      sizes={sizes}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth > 0 && img.naturalWidth < MIN_REAL_THUMB_WIDTH) {
          stepDown();
        }
      }}
      onError={stepDown}
    />
  );
}

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
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "h-40 w-40 sm:h-52 sm:w-52"
      : size === "sm"
        ? "h-14 w-14"
        : "aspect-square w-full";

  // Oversize `sizes` so retina picks a sharper source.
  const imageSizes =
    size === "lg"
      ? "416px"
      : size === "sm"
        ? "112px"
        : "(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 416px";

  const mosaicSizes =
    size === "lg"
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
        "relative shrink-0 overflow-hidden rounded-md bg-zinc-200 shadow-md dark:bg-zinc-800",
        sizeClass,
        className
      )}
      aria-hidden
    >
      {arts.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-from/40 via-brand-via/30 to-brand-to/40">
          <Music2 className="h-1/3 w-1/3 text-white/80" />
        </div>
      ) : arts.length === 1 ? (
        <CoverThumb
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
                <CoverThumb
                  src={art.src}
                  videoId={art.videoId}
                  sizes={mosaicSizes}
                />
              </div>
            ) : (
              <div
                key={i}
                className="bg-gradient-to-br from-brand-from/30 to-brand-to/30"
              />
            );
          })}
        </div>
      )}
      <span className="sr-only">{name}</span>
    </div>
  );
}
