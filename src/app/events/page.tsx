"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Shuffle, ChevronDown } from "lucide-react";
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
        <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#00ccff]/80">
          <TrendingUp className="h-3 w-3" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-bold text-gradient-bends">{title}</h2>
    </div>
  );
}

const PAGE_SIZE = 9;

export default function EventsPage() {
  const router = useRouter();
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
        className="glass-bends-card h-64 rounded-2xl"
        style={{
          background:
            "linear-gradient(110deg,rgba(0,204,255,0.08) 25%,rgba(55,0,255,0.1) 50%,rgba(255,0,247,0.08) 75%), rgba(0,0,0,0.2)",
          backgroundSize: "200% 100%",
          animation: "fs-shimmer 1.4s infinite",
        }}
      />
    ));

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-zinc-900">
      <main className="relative z-10 flex-1">
        <section className="mx-auto max-w-7xl px-4 py-10 pb-16">
          <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-3xl font-bold text-gradient-bends md:text-4xl">
              DJ Sets
            </h1>
          </div>

          <div className="glass-bends-card mb-10 flex flex-wrap items-center gap-3 rounded-xl p-4">
            <button
              type="button"
              onClick={goRandomSet}
              disabled={
                loading || (randomPool.length === 0 && allDjSets.length === 0)
              }
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300/80 bg-white/70 px-3 py-1.5 text-sm font-medium text-zinc-800 backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-bends ease-bends hover:border-[#00ccff]/40 hover:bg-white hover:shadow-[0_0_24px_rgba(0,204,255,0.12)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#00ccff]/35 disabled:pointer-events-none disabled:opacity-40"
            >
              <Shuffle className="h-3.5 w-3.5 shrink-0 text-[#00ccff]" />
              <span className="font-medium text-[#00ccff]">Random set</span>
            </button>
          </div>

          <div className="mb-12">
            <div className="mb-5">
              <SectionHeader
                eyebrow="Top weekly views"
                title="Featured This Week"
              />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <SectionHeader title="Current DJ Sets" />
              {!loading && allDjSets.length > 0 && (
                <p className="tabular-nums text-xs text-[#00ccff]/65">
                  Showing {visibleDjSets.length} of {allDjSets.length}
                </p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && skeletons(6)}
              {!loading &&
                visibleDjSets.map((set, i) => (
                  <StreamCard key={set.video_id} set={set} index={i} />
                ))}
            </div>
            {!loading && hasMore && (
              <div className="flex justify-center mt-16 mb-8">
                <button
                  type="button"
                  onClick={loadMore}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-300/70 bg-white/70 px-6 py-3 text-sm font-medium text-zinc-800 backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-bends ease-bends hover:border-[#00ccff]/40 hover:bg-[#3700ff]/10 hover:shadow-[0_0_20px_rgba(0,204,255,0.1)] active:opacity-90"
                >
                  Load more
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

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
      `}</style>
    </div>
  );
}
