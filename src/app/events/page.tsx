"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, SlidersHorizontal } from "lucide-react";
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
  genres?: string[];
  energy?: string;
};

type DjSetsResponse = {
  currentSets: DjSet[];
  featured: {
    daily: DjSet[];
    weekly: DjSet[];
  };
};

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}

/* =========================
   STREAM CARD (unchanged vibe)
========================= */
function StreamCard({ set, index }: { set: DjSet; index: number }) {
  return (
    <Link
      href={`/stream/${set.video_id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden text-white bg-black/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
      style={{ animation: `fs-card-in 0.45s ${index * 60}ms both` }}
    >
      <div className="relative w-full aspect-video overflow-hidden bg-black">
        {set.thumbnail ? (
          <Image
            src={set.thumbnail}
            alt={set.title}
            width={640}
            height={360}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-black" />
        )}

        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        <p className="text-sm font-semibold line-clamp-2 text-purple-100">
          {set.title}
        </p>

        <div className="flex items-center gap-2 text-xs text-purple-300/70">
          <span>{set.channel}</span>
          <span className="w-1 h-1 bg-purple-400/40 rounded-full" />
          <span>{formatViews(set.view_count ?? 0)} views</span>
        </div>
      </div>
    </Link>
  );
}

/* =========================
   HEADER
========================= */
function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-1 mb-5">
      {eyebrow && (
        <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-purple-400/80">
          <TrendingUp className="w-3 h-3" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
        {title}
      </h2>
    </div>
  );
}

export default function ExamplePage() {
  const [liveEvents, setLiveEvents] = useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventPosterProps[]>([]);
  const [currentDjSets, setCurrentDjSets] = useState<DjSet[]>([]);
  const [featuredWeekly, setFeaturedWeekly] = useState<DjSet[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState({ genre: "", energy: "" });

  useEffect(() => {
    getEvents();
    getDjSets();
  }, []);

  const getEvents = async () => {
    const events = await getAllEvents();
    const live: EventPosterProps[] = [];
    const upcoming: EventPosterProps[] = [];

    await Promise.all(
      events.map(async (event) => {
        const streams = await getStreams(event.id);
        const hasLiveLink = streams?.some((s) => s.link !== null);

        if (hasLiveLink) {
          live.push({
            ...event,
            link: streams?.find((s) => s.link !== null)?.link,
          });
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
      const res = await fetch("/api/dj-sets", { cache: "no-store" });
      const data: DjSetsResponse = await res.json();

      setCurrentDjSets(data.currentSets.slice(0, 9));
      setFeaturedWeekly(data.featured.weekly);
    } catch {
      setCurrentDjSets([]);
      setFeaturedWeekly([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDjSets = currentDjSets.filter((set) => {
    return (
      (!filter.genre || set.genres?.includes(filter.genre)) &&
      (!filter.energy || set.energy === filter.energy)
    );
  });

  const skeletons = (n: number) =>
    Array.from({ length: n }).map((_, i) => (
      <div
        key={i}
        className="h-52 rounded-2xl bg-purple-500/10 animate-pulse"
      />
    ));

  return (
    <div className="min-h-screen flex flex-col text-white">
      {/* MAIN */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 py-10">

          {/* TITLE + FILTER BAR */}
          <div className="flex flex-col gap-6 mb-10">

            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DJ Sets
            </h1>

            {/* 🔥 FILTER BAR */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-purple-500/20 bg-black/60 backdrop-blur-md">
              <div className="flex items-center gap-2 text-purple-300 text-sm">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </div>

              <select
                value={filter.genre}
                onChange={(e) => setFilter({ ...filter, genre: e.target.value })}
                className="px-3 py-1.5 rounded-lg bg-black border border-purple-400/30 text-sm"
              >
                <option value="">All Genres</option>
                <option value="techno">Techno</option>
                <option value="house">House</option>
                <option value="hardstyle">Hardstyle</option>
              </select>

              <select
                value={filter.energy}
                onChange={(e) => setFilter({ ...filter, energy: e.target.value })}
                className="px-3 py-1.5 rounded-lg bg-black border border-purple-400/30 text-sm"
              >
                <option value="">All Energy</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              {(filter.genre || filter.energy) && (
                <button
                  onClick={() => setFilter({ genre: "", energy: "" })}
                  className="ml-auto text-xs text-pink-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* FEATURED */}
          <div className="mb-12">
            <SectionHeader eyebrow="Top weekly views" title="Featured This Week" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && skeletons(3)}
              {!loading &&
                featuredWeekly.map((set, i) => (
                  <StreamCard key={set.video_id} set={set} index={i} />
                ))}
            </div>
          </div>

          {/* CURRENT */}
          <div>
            <SectionHeader title="Current DJ Sets" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && skeletons(6)}
              {!loading &&
                filteredDjSets.map((set, i) => (
                  <StreamCard key={set.video_id} set={set} index={i} />
                ))}
            </div>
          </div>
        </section>
      </main>

      {/* EVENTS (no dead space now) */}
      <EventsLayout
        liveEvents={liveEvents}
        upcomingEvents={upcomingEvents}
        hideStuff={{}}
      />

      <style>{`
        @keyframes fs-card-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}