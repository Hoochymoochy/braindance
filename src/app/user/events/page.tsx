// ExamplePage.tsx
"use client";
import React, { use, useEffect } from "react";
import { EventsLayout } from "@/app/EventLayout";
import { EventPosterProps } from "@/app/components/user/Poster";

const dummyEvents = [
  {
    image: "/poster2.jpg",
    title: "Techno Night",
    date: "April 26, 2025",
    location: "Warehouse 22, SLC",
    description: "Get lost in the rhythm. All night rave.",
    live: true,
  },
  {
    image: "/poster3.jpg",
    title: "Sunset Drift",
    date: "May 3, 2025",
    location: "Rooftop Lounge, São Luís",
    description: "Tropical house and chill vibes.",
    live: true,
  },
  {
    image: "/poster3.jpg",
    title: "Sunset Drift",
    date: "May 3, 2025",
    location: "Rooftop Lounge, São Luís",
    description: "Tropical house and chill vibes.",
  },
];

const dummyEvents2 = [
  {
    image: "/poster2.jpg",
    title: "Techno Night",
    date: "April 26, 2025",
    location: "Warehouse 22, SLC",
    description: "Get lost in the rhythm. All night rave.",
  },
  {
    image: "/poster3.jpg",
    title: "Sunset Drift",
    date: "May 3, 2025",
    location: "Rooftop Lounge, São Luís",
    description: "Tropical house and chill vibes.",
  },
  {
    image: "/poster3.jpg",
    title: "Sunset Drift",
    date: "May 3, 2025",
    location: "Rooftop Lounge, São Luís",
    description: "Tropical house and chill vibes.",
  },
];

export default function ExamplePage() {
  const [topEvents, setTopEvents] = React.useState(null);
  const [liveEvents, setLiveEvents] = React.useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<
    EventPosterProps[]
  >([]);
  useEffect(() => {
    fetch("http://localhost:4000/get-events")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setUpcomingEvents(data.upcomingEvents);
        setLiveEvents(data.liveEvents);
      });
  }, []);
  return (
    <EventsLayout
      topEvents={dummyEvents}
      liveEvents={liveEvents}
      upcomingEvents={upcomingEvents}
    />
  );
}
