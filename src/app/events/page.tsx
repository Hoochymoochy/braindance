"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { EventsLayout } from "@/app/EventLayout";
import { EventPosterProps } from "@/app/components/user/Poster";
import { getAllEvents } from "@/app/lib/events/event";
import { getStreams } from "@/app/lib/events/stream";

type DjSet = {
  video_id: string;
  title: string;
  channel: string;
  published_at: string;
  thumbnail?: string;
  url: string;
  view_count?: number;
  duration_seconds?: number;
};

type DjSetsResponse = {
  currentSets: DjSet[];
  featured: {
    daily: DjSet[];
    weekly: DjSet[];
  };
};

export default function ExamplePage() {
  const [liveEvents, setLiveEvents] = React.useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<EventPosterProps[]>([]);
  const [currentDjSets, setCurrentDjSets] = React.useState<DjSet[]>([]);
  const [featuredWeekly, setFeaturedWeekly] = React.useState<DjSet[]>([]);

  const getEvents = async () => {
    const events = await getAllEvents();

    const live: EventPosterProps[] = [];
    const upcoming: EventPosterProps[] = [];

    await Promise.all(
      events.map(async (event) => {
        const streams = await getStreams(event.id);
        const hasLiveLink = streams?.some((s) => s.link !== null);
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
  };

  const getDjSets = async () => {
    try {
      const response = await fetch("/api/dj-sets", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as DjSetsResponse;
      setCurrentDjSets(data.currentSets.slice(0, 9));
      setFeaturedWeekly(data.featured.weekly);
    } catch {
      setCurrentDjSets([]);
      setFeaturedWeekly([]);
    }
  };

  useEffect(() => {
    getEvents();
    getDjSets();
  }, []);

  return (
    <div className="min-h-screen bg-black thermal-background text-white">
      <section className="container mx-auto px-4 pt-12 pb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
          DJ Sets
        </h1>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-purple-300">
              Featured This Week
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredWeekly.map((set) => (
              <Link
                key={set.video_id}
                href={`/stream/${set.video_id}`}
                className="border border-purple-900/50 bg-black/60 rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition"
              >
                {set.thumbnail && (
                  <Image
                    src={set.thumbnail}
                    alt={set.title}
                    width={640}
                    height={360}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="font-medium text-sm mb-2 line-clamp-2">{set.title}</p>
                  <p className="text-xs text-gray-400">
                    {set.channel} • {(set.view_count ?? 0).toLocaleString()} views
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white">Current DJ Sets</h2>
            <Link href="/" className="text-sm text-purple-400 hover:underline">
              Back Home
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDjSets.map((set) => (
              <Link
                key={set.video_id}
                href={`/stream/${set.video_id}`}
                className="border border-purple-900/50 bg-black/60 rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition"
              >
                {set.thumbnail && (
                  <Image
                    src={set.thumbnail}
                    alt={set.title}
                    width={640}
                    height={360}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="font-medium text-sm mb-2 line-clamp-2">{set.title}</p>
                  <p className="text-xs text-gray-400">
                    {set.channel} • {(set.view_count ?? 0).toLocaleString()} views
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <EventsLayout
        liveEvents={liveEvents}
        upcomingEvents={upcomingEvents}
        hideStuff={{}}
      />
    </div>
  );
}
