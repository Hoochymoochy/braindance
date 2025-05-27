"use client";

import React, { useState, useEffect } from "react";
import { EventPosterProps, EventPoster } from "@/app/components/user/Poster";

type EventsLayoutProps = {
  topEvents: EventPosterProps[];
  liveEvents: EventPosterProps[];
  upcomingEvents: EventPosterProps[];
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="thermal-background min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-10">
      <div
        className="thermal-cursor"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      {topEvents.length > 0 && (
        <>
          {!hideStuff.title && (
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-thermal-hot mb-6 tracking-tight">
              TOP EVENTS
            </h1>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topEvents.map((event, index) => (
              <div
                key={index}
                className="transform transition-transform hover:scale-[1.02] duration-300"
              >
                <EventPoster {...event} live={true} />
              </div>
            ))}
          </div>
        </>
      )}

      {liveEvents.length > 0 && (
        <>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-thermal-warm mb-6 tracking-tight mt-12">
            Live Events
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveEvents.map((event, index) => (
              <div
                key={index}
                className="transform transition-transform hover:scale-[1.02] duration-300"
              >
                <EventPoster {...event} hideStuff={hideStuff} live={true} />
              </div>
            ))}
          </div>
        </>
      )}

      {upcomingEvents.length > 0 && (
        <>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-thermal-neutral mb-6 tracking-tight mt-12">
            Upcoming Events
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                className="transform transition-transform hover:scale-[1.02] duration-300"
              >
                <EventPoster {...event} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
