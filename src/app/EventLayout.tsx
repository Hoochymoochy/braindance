"use client";

import React, { useState, useEffect } from "react";
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const renderSection = (
    title: string,
    color: string,
    events: EventPosterProps[],
    live = false
  ) => {
    if (events.length === 0) return null;

    return (
      <section className="mt-12">
        {!hideStuff.title && (
          <h1
            className={`text-2xl sm:text-3xl md:text-4xl font-bold text-${color} mb-6 tracking-tight`}
          >
            {title}
          </h1>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <div
              key={index}
              className="transform transition-transform hover:scale-[1.02] duration-300"
            >
              <EventPoster {...event} hideStuff={hideStuff} live={live} />
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="thermal-background min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-10 relative">
      {/* Cursor Aura */}
      <div
        className="thermal-cursor pointer-events-none fixed z-50"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      {renderSection("Top Events", "thermal-hot", topEvents, true)}
      {renderSection("Live Events", "thermal-warm", liveEvents, true)}
      {renderSection("Upcoming Events", "thermal-neutral", upcomingEvents)}
    </div>
  );
};
