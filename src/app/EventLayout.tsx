// app/EventLayout.tsx
import React from "react";
import { EventPosterProps, EventPoster } from "@/app/components/Poster";

type EventsLayoutProps = {
  topEvents: EventPosterProps[];
  liveEvents: EventPosterProps[];
  upcomingEvents: EventPosterProps[];
};

export const EventsLayout: React.FC<EventsLayoutProps> = ({
  liveEvents = [],
  upcomingEvents = [],
}) => {
  return (
    <div
      className="bg-fixed bg-cover bg-center min-h-screen w-full p-8"
      style={{ backgroundImage: "url('/2k_earth_daymaptry.jpg')" }}
    >
      <h1 className="text-4xl font-bold text-white mb-6 tracking-tight">
        TOP EVENTS
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveEvents.map((event, index) => (
          <EventPoster key={index} {...event} />
        ))}
      </div>
      <h1 className="text-4xl font-bold text-white mb-6 tracking-tight mt-10">
        Live Events
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveEvents.map((event, index) => (
          <EventPoster key={index} {...event} />
        ))}
      </div>

      <h1 className="text-4xl font-bold text-white mb-6 tracking-tight mt-10">
        Upcoming Events
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingEvents.map((event, index) => (
          <EventPoster key={index} {...event} />
        ))}
      </div>
    </div>
  );
};
