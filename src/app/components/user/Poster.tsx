"use client";

import React, { useState } from "react";
import { Bookmark, Heart } from "lucide-react";
import Link from "next/link";

export type EventPosterProps = {
  image: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  host_id: string;
  id: string;
  live?: boolean;
  hideStuff?: {
    bookmark?: boolean;
    heart?: boolean;
  };
};

function addCount() {
  // Implement your counter logic here
}

export const EventPoster: React.FC<EventPosterProps> = ({
  image,
  title,
  date,
  location,
  description,
  live,
  host_id,
  id,
  hideStuff = {},
}) => {
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);

  const toggleSaved = () => setSaved((prev) => !prev);
  const toggleLiked = () => setLiked((prev) => !prev);

  return (
    <div className="bg-black border border-thermal-hot/30 rounded-2xl overflow-hidden shadow-lg hover:shadow-thermal hover:border-thermal-hot/70 transition-all duration-300 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto">
      <div className="relative aspect-[2/3] w-full">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* {live && (
          <div className="absolute top-3 left-3 bg-thermal-hot text-black px-3 py-1 rounded-full text-xs font-semibold">
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

        <div className="flex justify-between items-center mt-5">
          <div className="flex gap-2">
            {!hideStuff.bookmark && (
              <button
                className={`p-2 rounded-full ${
                  saved
                    ? "text-thermal-hot bg-thermal-hot/20"
                    : "text-zinc-400 hover:text-thermal-hot"
                }`}
                onClick={toggleSaved}
              >
                <Bookmark size={20} />
              </button>
            )}

            {!hideStuff.heart && (
              <button
                className={`p-2 rounded-full ${
                  liked
                    ? "text-thermal-hot bg-thermal-hot/20"
                    : "text-zinc-400 hover:text-thermal-hot"
                }`}
                onClick={toggleLiked}
              >
                <Heart size={20} />
              </button>
            )}
          </div>

          {live && (
            <Link
              href={`/stream?host_id=${host_id}&id=${id}`}
              onClick={addCount}
              className="bg-thermal-hot hover:bg-thermal-warm text-black px-4 py-1 sm:px-5 sm:py-2 rounded-full shadow-md text-sm sm:text-base font-semibold transition-colors duration-300"
            >
              Join
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
