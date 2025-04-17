// EventPoster.tsx
import React from "react";

export type EventPosterProps = {
  image: string;
  title: string;
  date: string;
  location: string;
  description?: string;
};

export const EventPoster: React.FC<EventPosterProps> = ({
  image,
  title,
  date,
  location,
  description,
}) => {
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-300 ease-in-out">
      <img src={image} alt={title} className="w-full   object-cover" />
      <div className="p-4 text-white">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-zinc-400">
          {date} · {location}
        </p>
        {description && (
          <p className="mt-2 text-sm text-zinc-300">{description}</p>
        )}
      </div>
    </div>
  );
};
