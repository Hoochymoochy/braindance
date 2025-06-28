"use client";

import React, { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { incrementCityView } from "@/app/lib/utils/location";
import { addGeo } from "@/app/lib/events/heatmap";

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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleClick = useCallback(async () => {
    console.log("📲 Join click triggered");
  
    const city = localStorage.getItem("city");
    const lat = localStorage.getItem("lat");
    const lon = localStorage.getItem("lon");
  
    console.log("🌍 Locals:", { city, lat, lon });
  
    try {
      if (city) {
        const cityRes = await incrementCityView(id, city);
        console.log("📈 City Tracking:", cityRes);
      }
  
      if (lat && lon) {
        const geoRes = await addGeo(id, parseInt(lat), parseInt(lon));
        console.log("📍 Geo Tracking:", geoRes);
      }
  
      // 🚨 Give mobile 300ms breathing room
      setTimeout(() => {
        router.push(`/stream/${id}`);
      }, 300);
    } catch (err) {
      console.error("❌ Click Tracking Error:", err);
      // Still navigate, just log the failure
      router.push(`/stream/${id}`);
    }
  }, [id, router]);
  

  if (!hydrated) return null;

  return (
    <div className="bg-black border border-white/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-white/20 hover:border-white transition-all duration-300 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto group">
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
        <p className="text-sm sm:text-base text-thermal-neutral mt-1">
          {date} · {location}
        </p>

        {description && (
          <p className="mt-3 text-sm sm:text-base text-zinc-400">{description}</p>
        )}

        <div className="flex justify-end items-center mt-5">
          {link && (
            <div
              onClick={handleClick}
              onTouchStart={handleClick}
              role="button"
              tabIndex={0}
              className="bg-white text-black hover:bg-pink-500 hover:text-white px-4 py-1 sm:px-5 sm:py-2 rounded-full shadow-md text-sm sm:text-base font-semibold transition cursor-pointer select-none"
            >
              Join
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
