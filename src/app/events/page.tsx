"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  SlidersHorizontal,
  Shuffle,
  ChevronDown,
} from "lucide-react";
import { EventsLayout } from "@/app/EventLayout";
import { EventPosterProps } from "@/app/components/user/Poster";
import { getAllEvents } from "@/app/lib/events/event";
import { getStreams } from "@/app/lib/events/stream";
import { StreamCard } from "@/app/components/dj-sets/StreamCard";
import dynamic from "next/dynamic";

const ColorBends = dynamic(() => import("@/components/ColorBends"), {
  ssr: false,
  loading: () => null,
});

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
  currentSets?: DjSet[];
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
  const [featuredWeekly, setFeaturedWeekly] = useState<DjSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filter, setFilter] = useState({ genre: "", energy: "" });
  const [isFiltering, setIsFiltering] = useState(false);

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
      setFeaturedWeekly(
        Array.isArray(data.featured?.weekly) ? data.featured.weekly : []
      );
    } catch {
      setAllDjSets([]);
      setFeaturedWeekly([]);
    } finally {
      setLoading(false);
    }
  };

  const genreOptions = useMemo(() => {
    const s = new Set<string>();
    allDjSets.forEach((set) => set.genres?.forEach((g) => s.add(g)));
    return Array.from(s).sort();
  }, [allDjSets]);

  const filteredDjSets = useMemo(
    () =>
      allDjSets.filter((set) => {
        return (
          (!filter.genre || set.genres?.includes(filter.genre)) &&
          (!filter.energy || set.energy === filter.energy)
        );
      }),
    [allDjSets, filter.genre, filter.energy]
  );

  const visibleDjSets = useMemo(
    () => filteredDjSets.slice(0, visibleCount),
    [filteredDjSets, visibleCount]
  );

  const hasMore = visibleCount < filteredDjSets.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter.genre, filter.energy]);

  const loadMore = () => {
    setVisibleCount((c) => c + PAGE_SIZE);
  };

  const goRandomSet = () => {
    const pool = filteredDjSets.length > 0 ? filteredDjSets : allDjSets;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/stream/${pick.video_id}`);
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setIsFiltering(true);
    setFilter(newFilter);
    setTimeout(() => setIsFiltering(false), 300);
  };

  const handleResetFilters = () => {
    setIsFiltering(true);
    setFilter({ genre: "", energy: "" });
    setTimeout(() => setIsFiltering(false), 300);
  };

  const BEND_COLORS = ["#00ccff", "#ff00f7", "#3700ff", "#7a7a7a"] as const;


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
    <div className="relative flex min-h-screen flex-col overflow-hidden text-white">
            <div
        className="pointer-events-none fixed inset-0 bg-transparent"
        aria-hidden
      >
        <div
          style={{
            width: "1080px",
            height: "1080px",
            position: "relative",
            left: "50%",
            top: "50%",
            transform:
              "translate(-50%, -50%) scale(max(100vw / 1080px, 100vh / 1080px))",
            transformOrigin: "center center",
          }}
        >
          <ColorBends
            rotation={65}
            speed={0.25}
            colors={[...BEND_COLORS]}
            transparent={false}
            autoRotate={0.3}
            scale={1.5}
            frequency={1}
            warpStrength={0}
            mouseInfluence={0}
            parallax={0}
            noise={0}
          />
        </div>
      </div>
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-10 pb-16">
          <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-3xl font-bold text-gradient-bends md:text-4xl">
              DJ Sets
            </h1>
          </div>

          <div
            className="glass-bends-card mb-10 flex flex-wrap items-center gap-3 rounded-xl p-4 transition-all duration-300 ease-out"
            style={{
              transform: isFiltering ? "scale(0.995)" : "scale(1)",
              opacity: isFiltering ? 0.95 : 1,
            }}
          >
            <div className="flex shrink-0 items-center gap-2 text-sm text-[#00ccff]/90">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </div>

            <button
              type="button"
              onClick={goRandomSet}
              disabled={loading || allDjSets.length === 0}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#ff00f7]/35 bg-gradient-to-r from-[#3700ff]/90 to-[#ff00f7]/75 px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:from-[#ff00f7]/85 hover:to-[#3700ff]/80 disabled:pointer-events-none disabled:opacity-40 active:scale-95 active:shadow-[0_0_12px_rgba(0,204,255,0.25)] hover:scale-105"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Random set
            </button>

            <select
              value={filter.genre}
              onChange={(e) => handleFilterChange({ ...filter, genre: e.target.value })}
              className="min-w-[140px] cursor-pointer rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-sm transition-all duration-200 hover:border-[#00ccff]/45 focus:border-[#ff00f7]/50 focus:outline-none focus:ring-1 focus:ring-[#00ccff]/25"
            >
              <option value="">All Genres</option>
              {genreOptions.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </option>
              ))}
              {genreOptions.length === 0 && !loading && (
                <>
                  <option value="techno">Techno</option>
                  <option value="house">House</option>
                  <option value="hardstyle">Hardstyle</option>
                </>
              )}
            </select>

            <select
              value={filter.energy}
              onChange={(e) =>
                handleFilterChange({ ...filter, energy: e.target.value })
              }
              className="min-w-[140px] cursor-pointer rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-sm transition-all duration-200 hover:border-[#00ccff]/45 focus:border-[#ff00f7]/50 focus:outline-none focus:ring-1 focus:ring-[#00ccff]/25"
            >
              <option value="">All Energy</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            {(filter.genre || filter.energy) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto cursor-pointer text-xs text-[#ff00f7] transition-colors duration-200 hover:text-[#00ccff] hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="mb-12">
            <div className="mb-5">
              <SectionHeader
                eyebrow="Top weekly views"
                title="Featured This Week"
              />
            </div>
            <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${isFiltering ? "opacity-75" : "opacity-100"}`}>
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
              {!loading && filteredDjSets.length > 0 && (
                <p className="tabular-nums text-xs text-[#00ccff]/65">
                  Showing {visibleDjSets.length} of {filteredDjSets.length}
                </p>
              )}
            </div>
            <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${isFiltering ? "opacity-75" : "opacity-100"}`}>
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
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-6 py-3 text-sm font-medium text-white/90 transition-all duration-200 hover:border-[#00ccff]/40 hover:bg-[#3700ff]/15 active:scale-95 active:shadow-[0_0_12px_rgba(0,204,255,0.15)] hover:scale-105"
                >
                  Load more
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
            {!loading && filteredDjSets.length === 0 && allDjSets.length > 0 && (
              <p className="mx-auto max-w-md py-10 text-center text-sm text-white/55">
                No sets match these filters. Reset filters or try{" "}
                <button
                  type="button"
                  onClick={goRandomSet}
                  className="cursor-pointer text-[#ff00f7] transition-colors duration-200 hover:text-[#00ccff] hover:underline"
                >
                  Random set
                </button>
                .
              </p>
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