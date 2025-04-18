// ExamplePage.tsx
import React from "react";
import { EventsLayout } from "@/app/EventLayout";

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
  return (
    <EventsLayout
      topEvents={dummyEvents}
      liveEvents={dummyEvents}
      upcomingEvents={dummyEvents2}
    />
  );
}
