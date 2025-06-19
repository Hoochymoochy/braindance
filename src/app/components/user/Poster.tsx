"use client";

import React, { useState } from "react";
// import { Bookmark, Heart } from "lucide-react"; // 🔒 commented out for now
import Link from "next/link";
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
  live = false,
  hideStuff = {},
}) => {
  // const [saved, setSaved] = useState(false); // 🔒 not used right now
  // const [liked, setLiked] = useState(false); // 🔒 not used right now

  // const toggleSaved = () => setSaved((prev) => !prev);
  // const toggleLiked = () => setLiked((prev) => !prev);

  const handleClick = () => {
    const city = localStorage.getItem("city");
    const lat = localStorage.getItem("lat");
    const lon = localStorage.getItem("lon");

    if (city) incrementCityView(id, city);
    if (lat && lon) addGeo(id, lat, lon);
  };

  return (
    <div className="bg-black border border-white/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-white/20 hover:border-white transition-all duration-300 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto group">
      <div className="relative aspect-[2/3] w-full">
        <img
          src={image_url || "/placeholder.svg"}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* {live && (
          <div className="absolute top-3 left-3 bg-white text-black px-3 py-1 rounded-full text-xs font-semibold">
            LIVE
          </div>
        )} */}
      </div>

      <div className="p-4 sm:p-5 md:p-6 text-white">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-thermal-neutral mt-1">
          {date} · {location}
        </p>

        {description && (
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            {description}
          </p>
        )}

        <div className="flex justify-end items-center mt-5">
          {/* Bookmark / Heart — disabled for now
          <div className="flex gap-2">
            {!hideStuff.bookmark && (
              <button
                onClick={toggleSaved}
                className={`p-2 rounded-full transition ${
                  saved
                    ? "text-thermal-hot bg-thermal-hot/20"
                    : "text-zinc-400 hover:text-thermal-hot"
                }`}
              >
                <Bookmark size={20} />
              </button>
            )}
            {!hideStuff.heart && (
              <button
                onClick={toggleLiked}
                className={`p-2 rounded-full transition ${
                  liked
                    ? "text-thermal-hot bg-thermal-hot/20"
                    : "text-zinc-400 hover:text-thermal-hot"
                }`}
              >
                <Heart size={20} />
              </button>
            )}
          </div>
          */}

          {link && (
            <Link
              href={`/stream/${id}`}
              onClick={handleClick}
              className="bg-white text-black hover:bg-pink-500 hover:text-white px-4 py-1 sm:px-5 sm:py-2 rounded-full shadow-md text-sm sm:text-base font-semibold transition"
            >
              Join
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
