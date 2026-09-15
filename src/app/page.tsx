"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, TrendingUp, Shuffle, ChevronDown } from "lucide-react";
import { EventsLayout } from "@/app/EventLayout";
import { EventPosterProps } from "@/app/components/user/Poster";
import { getAllEvents } from "@/app/lib/events/event";
import { getStreams } from "@/app/lib/events/stream";
import { StreamCard } from "@/app/components/dj-sets/StreamCard";

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
  currentSets?: DjSet[];
  /** Full catalog (duration-filtered only); used for Random, includes sets older than 90 days. */
  allSets?: DjSet[];
  featured?: {
    daily?: DjSet[];
    weekly?: DjSet[];
  };
};

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="mt-4 flex flex-col gap-1">
      {eyebrow && (
        <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand-from/80">
          <TrendingUp className="h-3 w-3" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-bold text-gradient-bends">{title}</h2>
    </div>
  );
}

const PAGE_SIZE = 9;

export default function Home() {
  const router = useRouter();
  const catalogRef = useRef<HTMLElement>(null);
  const [liveEvents, setLiveEvents] = useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventPosterProps[]>([]);
  const [allDjSets, setAllDjSets] = useState<DjSet[]>([]);
  const [randomPool, setRandomPool] = useState<DjSet[]>([]);
  const [featuredWeekly, setFeaturedWeekly] = useState<DjSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
      if (!res.ok) throw new Error("fetch failed");
      const data: DjSetsResponse = await res.json();

      setAllDjSets(Array.isArray(data.currentSets) ? data.currentSets : []);
      setRandomPool(
        Array.isArray(data.allSets)
          ? data.allSets
          : Array.isArray(data.currentSets)
            ? data.currentSets
            : []
      );
      setFeaturedWeekly(
        Array.isArray(data.featured?.weekly) ? data.featured.weekly : []
      );
    } catch {
      setAllDjSets([]);
      setRandomPool([]);
      setFeaturedWeekly([]);
    } finally {
      setLoading(false);
    }
  };

  const visibleDjSets = useMemo(
    () => allDjSets.slice(0, visibleCount),
    [allDjSets, visibleCount]
  );

  const hasMore = visibleCount < allDjSets.length;

  const loadMore = () => {
    setVisibleCount((c) => c + PAGE_SIZE);
  };

  const goRandomSet = () => {
    const pool = randomPool.length > 0 ? randomPool : allDjSets;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/stream/${pick.video_id}`);
  };

  const skeletons = (n: number) =>
    Array.from({ length: n }).map((_, i) => (
      <div
        key={i}
        className="skeleton-shimmer glass-bends-card h-64 rounded-2xl"
      />
    ));

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip text-zinc-900">
      <div className="relative z-10 flex-1">
        <section className="container mx-auto px-4 py-16 text-center md:py-24">
          <div className="mx-auto max-w-3xl rounded-2xl p-10 glass-bends backdrop-blur-lg border border-black/8">
            <div className="mb-4 text-sm uppercase tracking-wider text-brand-from/90">
              Welcome to Braindance
            </div>
            <h1 className="mb-6 bg-gradient-to-r from-brand-from via-brand-via to-brand-to bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl">
              Stream DJ sets. Discover new mixes.
            </h1>
            <p className="mb-8 text-base text-zinc-600 md:text-lg">
              Find fresh DJ sets and classic mixes in one place. Easy streaming, no fuss.
            </p>
            <button
              type="button"
              className="rounded-md bg-brand-to px-5 py-2 text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-[background-color,box-shadow] duration-bends-fast ease-bends hover:bg-brand-via/90 hover:shadow-[0_4px_14px_rgba(0,0,0,0.45)] dark:text-zinc-950"
              onClick={() =>
                catalogRef.current?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Streams <ArrowRight className="ml-2 inline h-4 w-4" />
            </button>
          </div>
        </section>

        <section
          ref={catalogRef}
          className="mx-auto max-w-7xl px-4 pb-16 pt-2"
        >
          <div className="glass-bends-card mb-10 flex flex-wrap items-center gap-3 rounded-xl p-4">
            <button
              type="button"
              onClick={goRandomSet}
              disabled={
                loading || (randomPool.length === 0 && allDjSets.length === 0)
              }
              className="hover-glow-brand inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300/80 bg-white/70 px-3 py-1.5 text-sm font-medium text-zinc-800 backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-bends ease-bends hover:border-brand-from/40 hover:bg-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-brand-from/35 disabled:pointer-events-none disabled:opacity-40"
            >
              <Shuffle className="h-3.5 w-3.5 shrink-0 text-brand-from" />
              <span className="font-medium text-brand-from">Random set</span>
            </button>
          </div>

          <div className="mb-12">
            <div className="mb-5">
              <SectionHeader
                eyebrow="Top weekly views"
                title="Featured This Week"
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading && skeletons(3)}
              {!loading &&
                featuredWeekly.map((set, i) => (
                  <StreamCard key={set.video_id} set={set} index={i} />
                ))}
              {!loading && featuredWeekly.length === 0 && (
                <p className="col-span-full py-4 text-sm text-[#7a7a7a]">
                  No featured picks yet. Refresh the DJ feed or check back soon.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <SectionHeader title="Current DJ Sets" />
              {!loading && allDjSets.length > 0 && (
                <p className="tabular-nums text-xs text-brand-from/65">
                  Showing {visibleDjSets.length} of {allDjSets.length}
                </p>
              )}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading && skeletons(6)}
              {!loading &&
                visibleDjSets.map((set, i) => (
                  <StreamCard key={set.video_id} set={set} index={i} />
                ))}
            </div>
            {!loading && hasMore && (
              <div className="mb-8 mt-16 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  className="hover-glow-brand inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-300/70 bg-white/70 px-6 py-3 text-sm font-medium text-zinc-800 backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-bends ease-bends hover:border-brand-from/40 hover:bg-brand-to/10 active:opacity-90"
                >
                  Load more
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <EventsLayout
        liveEvents={liveEvents}
        upcomingEvents={upcomingEvents}
        hideStuff={{}}
      />
    </div>
  );
}
