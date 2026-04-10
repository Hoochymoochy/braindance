"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import { incrementCityView } from "@/app/lib/utils/location";
import { addGeo } from "@/app/lib/events/heatmap";
import { useRouter } from "next/navigation";

export type EventPosterProps = {
  image_url: string;
  title: string;
  date: string;
  location: string;
  id: string;
  link?: string;
  description?: string;
  live?: boolean;
  hideStuff?: {
    bookmark?: boolean;
    heart?: boolean;
  };
};

export const EventPoster: React.FC<EventPosterProps> = ({
  image_url,
  title,
  date,
  location,
  description,
  link,
  id,
}) => {
  const router = useRouter();

  const handleClick = useCallback(
    async (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();

      const city = localStorage.getItem("city");
      const lat = localStorage.getItem("lat");
      const lon = localStorage.getItem("lon");

      if (city) await incrementCityView(id, city);
      if (lat && lon) await addGeo(id, parseInt(lat), parseInt(lon));

      router.push(`/stream/${id}`);
    },
    [id, router]
  );

  return (
    <div className="glass-bends-card group mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-white/15 shadow-lg transition-all duration-300 hover:border-[#00ccff]/35 hover:shadow-[0_0_24px_rgba(0,204,255,0.12)] sm:max-w-md md:max-w-lg">
      <div className="relative aspect-[2/3] w-full">
        <Image
          src={image_url || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      <div className="p-4 sm:p-5 md:p-6 text-white">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-white/65 sm:text-base">
          {date} · {location}
        </p>

        {description && (
          <p className="mt-3 text-sm sm:text-base text-zinc-400">{description}</p>
        )}

        <div className="flex justify-end items-center mt-5">
          {link && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClick}
              onTouchStart={handleClick}
              className="cursor-pointer select-none rounded-full bg-[#3700ff] px-4 py-1 text-sm font-semibold text-white shadow-md transition hover:bg-[#ff00f7]/90 sm:px-5 sm:py-2 sm:text-base"
            >
              Join
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
