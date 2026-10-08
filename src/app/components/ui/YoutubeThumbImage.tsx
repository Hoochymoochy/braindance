"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  upgradeYoutubeThumbnail,
  youtubeThumbnailFallbackUrl,
  youtubeThumbnailUrl,
} from "@/app/lib/utils/youtube";
import { cn } from "@/lib/utils";

/** YouTube often returns HTTP 200 for maxres with a ~120px gray stub — step down. */
const MIN_REAL_THUMB_WIDTH = 200;

type YoutubeThumbImageProps = {
  videoId?: string | null;
  /** Optional existing URL; upgraded to maxres when it is a YouTube still. */
  src?: string | null;
  sizes: string;
  className?: string;
  alt?: string;
};

/** High-res YouTube still with automatic quality fallback. */
export function YoutubeThumbImage({
  videoId,
  src,
  sizes,
  className,
  alt = "",
}: YoutubeThumbImageProps) {
  const hiRes =
    upgradeYoutubeThumbnail(src, videoId) ??
    (videoId ? youtubeThumbnailUrl(videoId, "maxresdefault") : src) ??
    "";
  const [thumbSrc, setThumbSrc] = useState(hiRes);

  useEffect(() => {
    setThumbSrc(hiRes);
  }, [hiRes]);

  if (!thumbSrc) return null;

  const stepDown = () => {
    const next = youtubeThumbnailFallbackUrl(thumbSrc);
    if (next !== thumbSrc) setThumbSrc(next);
  };

  return (
    <Image
      src={thumbSrc}
      alt={alt}
      fill
      unoptimized
      quality={100}
      className={cn("object-cover", className)}
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
