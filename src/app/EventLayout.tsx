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
    gradient: string,
    events: EventPosterProps[],
    live = false
  ) => {
    if (events.length === 0) return null;

    return (
      <section className="mt-16">
        {!hideStuff.title && (
          <h2
            className={`text-3xl md:text-4xl font-bold text-transparent bg-clip-text ${gradient} mb-8`}
          >
            {title}
          </h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <div
              key={index}
              className="group transition-transform transform hover:scale-[1.02] duration-300"
            >
              <EventPoster {...event} hideStuff={hideStuff} live={live} />
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen w-full px-4 py-16 md:px-10 bg-black text-white relative overflow-hidden thermal-background">
      {/* Cursor Aura */}
      <div
        className="thermal-cursor pointer-events-none fixed z-50"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      {/* Sections */}
      {renderSection(
        "Top Events",
        "bg-gradient-to-r from-purple-400 to-pink-400",
        topEvents,
        true
      )}
      {renderSection(
        "Live Events",
        "bg-gradient-to-r from-pink-500 to-yellow-400",
        liveEvents,
        true
      )}
      {renderSection(
        "Upcoming Events",
        "bg-gradient-to-r from-indigo-400 to-purple-500",
        upcomingEvents
      )}
    </div>
  );
};
