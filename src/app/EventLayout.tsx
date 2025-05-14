"use client";
import React from "react";
import { EventPosterProps, EventPoster } from "@/app/components/user/Poster";
import { useState, useEffect } from "react";

type EventsLayoutProps = {
  topEvents: EventPosterProps[];
  liveEvents: EventPosterProps[];
  upcomingEvents: EventPosterProps[];
  hideStuff?: {
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
    <div className="thermal-background min-h-screen w-full p-8">
      <div
        className="thermal-cursor"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      {topEvents && topEvents.length > 0 && (
        <>
          {!hideStuff && (
            <h1 className="text-4xl font-bold text-thermal-hot mb-6 tracking-tight">
              TOP EVENTS
            </h1>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topEvents.map((event, index) => (
              <div
                key={index}
                className="transform transition-transform hover:scale-[1.02] duration-300"
              >
                <EventPoster {...event} hideStuff={hideStuff} />
              </div>
            ))}
          </div>
        </>
      )}

      {liveEvents && liveEvents.length > 0 && (
        <>
          <h1 className="text-4xl font-bold text-thermal-warm mb-6 tracking-tight mt-10">
            Live Events
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveEvents.map((event, index) => (
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

      {upcomingEvents && upcomingEvents.length > 0 && (
        <>
          <h1 className="text-4xl font-bold text-thermal-neutral mb-6 tracking-tight mt-10">
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
