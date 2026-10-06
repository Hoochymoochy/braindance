"use client";

import Image from "next/image";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Spotify-style playlist cover: 2×2 mosaic or single art / empty state. */
export function CrateCover({
  thumbnails,
  name,
  className,
  size = "md",
}: {
  thumbnails: string[];
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "h-40 w-40 sm:h-52 sm:w-52"
      : size === "sm"
        ? "h-12 w-12"
        : "aspect-square w-full";

  const arts = thumbnails.slice(0, 4);

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
        <Image
          src={arts[0]!}
          alt=""
          fill
          className="object-cover"
          sizes="208px"
        />
      ) : (
        <div className="grid h-full w-full grid-cols-2 grid-rows-2">
          {Array.from({ length: 4 }).map((_, i) => {
            const src = arts[i] ?? arts[0];
            return src ? (
              <div key={i} className="relative">
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="104px"
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
