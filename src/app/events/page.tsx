"use client";

import React, { useEffect } from "react";
import { EventsLayout } from "@/app/EventLayout";
import { EventPosterProps } from "@/app/components/user/Poster";
import { getGlobalEvents } from "@/app/lib/event";
import { getStreams } from "@/app/lib/stream";

export default function ExamplePage() {
  const [topEvents, setTopEvents] = React.useState<EventPosterProps[]>([]);
  const [liveEvents, setLiveEvents] = React.useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<EventPosterProps[]>([]);

  const getEvents = async () => {
    const events = await getGlobalEvents();

    const live: EventPosterProps[] = [];
    const upcoming: EventPosterProps[] = [];

    await Promise.all(
      events.map(async (event) => {
        const streams = await getStreams(event.id);
        const hasLiveLink = streams?.some((s) => s.link !== null);

        console.log(event.image_url)

        if (hasLiveLink) {
          const liveEvent = {
            ...event,
            image_url: event.image_url,
            link: streams?.find((s) => s.link !== null)?.link,
          }

          live.push(liveEvent);
        } else {
          upcoming.push(event);
        }
      })
    );

    setLiveEvents(live);
    setUpcomingEvents(upcoming);
    // setTopEvents(events); // if needed
  };

  useEffect(() => {
    getEvents();
  }, []);

  return (
    <EventsLayout
      topEvents={topEvents}
      liveEvents={liveEvents}
      upcomingEvents={upcomingEvents}
      hideStuff={{}}
    />
  );
}
