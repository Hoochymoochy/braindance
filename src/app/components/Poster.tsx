"use client";

import React, { useState } from "react";
import { Bookmark, Heart } from "lucide-react";

export type EventPosterProps = {
  image: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  live?: boolean;
};

export const EventPoster: React.FC<EventPosterProps> = ({
  image,
  title,
  date,
  location,
  description,
  live,
}) => {
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);

  const toggleSaved = () => setSaved((prev) => !prev);
  const toggleLiked = () => setLiked((prev) => !prev);

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-300 ease-in-out">
      <img src={image} alt={title} className="w-full object-cover" />
      <div className="p-4 text-white">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-zinc-400">
          {date} · {location}
        </p>
        {description && (
          <p className="mt-2 text-sm text-zinc-300">{description}</p>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <button
              className={`p-2 rounded-full ${
                saved ? "text-blue-600" : "text-gray-500"
              } hover:bg-gray-100`}
              onClick={toggleSaved}
            >
              <Bookmark size={20} />
            </button>

            <button
              className={`p-2 rounded-full ${
                liked ? "text-red-500" : "text-gray-500"
              } hover:bg-gray-100`}
              onClick={toggleLiked}
            >
              <Heart size={20} />
            </button>
          </div>

          {live && (
            <div className="bg-zinc-800 text-white px-4 py-1 rounded-full shadow-md flex items-center justify-center text-sm font-semibold">
              JOIN
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
