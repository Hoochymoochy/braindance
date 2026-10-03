"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    <div
      ref={rootRef}
      className={`glass-bends-card hover-glow-brand motion-enter-float group mx-auto w-full max-w-sm overflow-hidden rounded-none border border-black/8 shadow-lg hover:border-brand-from/35 sm:max-w-md md:max-w-lg${
        inView ? " is-inview" : ""
      }`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={image_url || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      <div className="p-4 sm:p-5 md:p-6 text-zinc-900">
        <h2 className="text-lg font-semibold text-gradient-bends sm:text-xl md:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600 sm:text-base">
          {date} · {location}
        </p>

        {description && (
          <p className="mt-3 text-sm text-zinc-500 sm:text-base">{description}</p>
        )}

        <div className="flex justify-end items-center mt-5">
          {link && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClick}
              onTouchStart={handleClick}
              className="cursor-pointer select-none rounded-full bg-brand-to px-4 py-1 text-sm font-semibold text-zinc-950 shadow-md transition-[background-color,box-shadow] duration-300 ease-in-out hover:bg-brand-via/90 sm:px-5 sm:py-2 sm:text-base"
            >
              Join
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
