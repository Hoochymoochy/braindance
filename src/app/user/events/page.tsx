"use client";
import React, { useEffect } from "react";
import { EventsLayout } from "@/app/EventLayout";
import { EventPosterProps } from "@/app/components/user/Poster";

export default function ExamplePage() {
  const [topEvents, setTopEvents] = React.useState<EventPosterProps[]>([]);
  const [liveEvents, setLiveEvents] = React.useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<
    EventPosterProps[]
  >([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/events/get-global-events")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setUpcomingEvents(data.upcomingEvents || []);
        setLiveEvents(data.liveEvents || []);
        // If you have top events in your API response, uncomment this:
        // setTopEvents(data.topEvents || []);

        // If you want to use live events as top events when no top events exist:
        if (!data.topEvents || data.topEvents.length === 0) {
          setTopEvents(data.liveEvents || []);
        } else {
          setTopEvents(data.topEvents);
        }
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
      });
  }, []);

  return (
    <EventsLayout
      topEvents={topEvents}
      liveEvents={liveEvents}
      upcomingEvents={upcomingEvents}
    />
  );
}
