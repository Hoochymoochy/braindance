"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp } from "lucide-react";
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

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}

function StreamCard({ set, index }: { set: DjSet; index: number }) {
  return (
    <Link
      key={set.video_id}
      href={`/stream/${set.video_id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden no-underline text-white"
      style={{
        background: "rgba(0,0,0,0.55)",
        border: "1px solid rgba(168,85,247,0.15)",
        animation: `fs-card-in 0.45s ${index * 60}ms both`,
        transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.3s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(244,114,182,0.35)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.15)";
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "16/9", background: "#0d0010" }}
      >
        {set.thumbnail ? (
          <Image
            src={set.thumbnail}
            alt={set.title}
            width={640}
            height={360}
            className="w-full h-full object-cover"
            style={{
              transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1), filter 0.3s",
              filter: "brightness(0.88) saturate(1.1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
              (e.currentTarget as HTMLElement).style.filter = "brightness(0.7) saturate(1.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLElement).style.filter = "brightness(0.88) saturate(1.1)";
            }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "linear-gradient(135deg,#1a0033 0%,#0d001a 100%)" }}
          />
        )}
        {/* Gradient bleed */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: "40%",
            background: "linear-gradient(to bottom,transparent,rgba(0,0,0,0.6))",
          }}
        />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 px-5 py-4">
        <p
          className="text-[0.88rem] font-semibold leading-snug m-0"
          style={{
            color: "#f0e6ff",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {set.title}
        </p>
        <div
          className="flex items-center gap-1.5 text-[0.74rem]"
          style={{ color: "rgba(167,139,250,0.65)" }}
        >
          <span style={{ color: "rgba(196,181,253,0.7)", fontWeight: 500 }}>
            {set.channel}
          </span>
          <span
            className="rounded-full flex-shrink-0"
            style={{ width: 3, height: 3, background: "rgba(167,139,250,0.35)" }}
          />
          <span>{formatViews(set.view_count ?? 0)} views</span>
        </div>
      </div>

      {/* Inner glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100"
        style={{
          boxShadow: "0 0 28px rgba(244,114,182,0.18) inset",
          transition: "opacity 0.3s",
        }}
      />
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-1 mb-7">
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium tracking-widest uppercase text-purple-400/80">
          <TrendingUp className="w-3 h-3" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 m-0">
        {title}
      </h2>
    </div>
  );
}

export default function ExamplePage() {
  const [liveEvents, setLiveEvents] = React.useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<EventPosterProps[]>([]);
  const [currentDjSets, setCurrentDjSets] = React.useState<DjSet[]>([]);
  const [featuredWeekly, setFeaturedWeekly] = React.useState<DjSet[]>([]);
  const [loading, setLoading] = React.useState(true);

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
            image_url: event.image_url,
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
      const response = await fetch("/api/dj-sets", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as DjSetsResponse;
      setCurrentDjSets(data.currentSets.slice(0, 9));
      setFeaturedWeekly(data.featured.weekly);
    } catch {
      setCurrentDjSets([]);
      setFeaturedWeekly([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEvents();
    getDjSets();
  }, []);

  const skeletons = (n: number) =>
    Array.from({ length: n }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl"
        style={{
          height: 220,
          background:
            "linear-gradient(110deg,rgba(168,85,247,0.06) 25%,rgba(168,85,247,0.12) 50%,rgba(168,85,247,0.06) 75%)",
          backgroundSize: "200% 100%",
          animation: "fs-shimmer 1.4s infinite",
        }}
      />
    ));

  return (
    <div className="min-h-screen bg-black thermal-background text-white">
      <section className="container mx-auto px-4 pt-12 pb-4">

        {/* Page title */}
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-10">
          DJ Sets
        </h1>

        {/* Featured This Week */}
        <div className="mb-14">
          <SectionHeader eyebrow="Top weekly views" title="Featured This Week" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && skeletons(3)}
            {!loading && featuredWeekly.length === 0 && (
              <p className="text-sm text-purple-400/45 col-span-full py-6">
                No featured sets this week yet.
              </p>
            )}
            {!loading &&
              featuredWeekly.map((set, i) => (
                <StreamCard key={set.video_id} set={set} index={i} />
              ))}
          </div>
        </div>

        {/* Current DJ Sets */}
        <div className="mb-16">
          <div className="flex items-end justify-between mb-7">
            <SectionHeader title="Current DJ Sets" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && skeletons(6)}
            {!loading && currentDjSets.length === 0 && (
              <p className="text-sm text-purple-400/45 col-span-full py-6">
                No sets available right now.
              </p>
            )}
            {!loading &&
              currentDjSets.map((set, i) => (
                <StreamCard key={set.video_id} set={set} index={i} />
              ))}
          </div>
        </div>
      </section>

      <EventsLayout
        liveEvents={liveEvents}
        upcomingEvents={upcomingEvents}
        hideStuff={{}}
      />

      <style>{`
        @keyframes fs-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fs-card-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}