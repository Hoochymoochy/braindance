"use client";

import React, { useEffect, useState } from "react";
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
};

function addCount() {
  //add acount to t
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
}) => {
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);

  const toggleSaved = () => setSaved((prev) => !prev);
  const toggleLiked = () => setLiked((prev) => !prev);

  return (
    <div className="bg-black border border-thermal-hot/30 rounded-xl overflow-hidden shadow-xl hover:shadow-thermal group hover:border-thermal-hot/70 transition-all duration-300">
      <div className="relative">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {live && (
          <div className="absolute top-3 left-3 bg-thermal-hot text-black px-3 py-1 rounded-full text-xs font-semibold">
            LIVE
          </div>
        )}
      </div>
      <div className="p-4 text-white">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm text-thermal-neutral">
          {date} · {location}
        </p>
        {description && (
          <p className="mt-2 text-sm text-zinc-400">{description}</p>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
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
          </div>

          {live && (
            <Link
              href={`/user/stream?host_id=${host_id}&id=${id}`}
              onClick={() => addCount}
              className="bg-thermal-hot hover:bg-thermal-warm text-black px-4 py-1 rounded-full shadow-md flex items-center justify-center text-sm font-semibold transition-colors duration-300"
            >
              Join
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
