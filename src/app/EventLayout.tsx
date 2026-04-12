"use client";

import React from "react";
import { EventPosterProps, EventPoster } from "@/app/components/user/Poster";

type EventsLayoutProps = {
  topEvents?: EventPosterProps[];
  liveEvents?: EventPosterProps[];
  upcomingEvents?: EventPosterProps[];
  hideStuff?: {
    title?: boolean;
    bookmark?: boolean;
    heart?: boolean;
  };
};

export const EventsLayout: React.FC<EventsLayoutProps> = ({
  topEvents = [],
  liveEvents = [],
  upcomingEvents = [],
  hideStuff = {},
}) => {
  const renderSection = (
    title: string,
    gradient: string,
    events: EventPosterProps[],
    live = false
  ) => {
    if (events.length === 0) return null;

    return (
      <section className="mt-20 border-t border-white/10 pt-8">
        {!hideStuff.title && (
          <h2
            className={`mb-10 bg-clip-text text-3xl font-bold leading-tight text-transparent md:text-4xl ${gradient}`}
          >
            {title}
          </h2>
        )}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <div key={index}>
              <EventPoster {...event} hideStuff={hideStuff} live={live} />
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      {renderSection(
        "Top Events",
        "bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff]",
        topEvents,
        true
      )}
      {renderSection(
        "Live Events",
        "bg-gradient-to-r from-[#ff00f7] to-[#00ccff]",
        liveEvents,
        true
      )}
      {renderSection(
        "Upcoming Events",
        "bg-gradient-to-r from-[#3700ff] to-[#00ccff]",
        upcomingEvents
      )}
    </div>
  );
};
