"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [liveEvents, setLiveEvents] = useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventPosterProps[]>([]);
  const [allDjSets, setAllDjSets] = useState<DjSet[]>([]);
  const [featuredWeekly, setFeaturedWeekly] = useState<DjSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filter, setFilter] = useState({ genre: "", energy: "" });
  const [isFiltering, setIsFiltering] = useState(false);
  // Smooth parallax effect based on mouse position for 4K depth
  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      // Calculate parallax based on distance from center
      targetX = (e.clientX - centerX) * 0.015;
      targetY = (e.clientY - centerY) * 0.015;
    };

    const animate = () => {
      // Smooth easing for 4K-like motion
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setParallaxOffset({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
    <div ref={containerRef} className="relative flex min-h-screen flex-col overflow-hidden text-white">
      {/* BLACK OVERLAY - Fixed depth layer */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-black/40"
        aria-hidden
      />

      {/* ANIMATED BACKGROUND with 4K parallax depth */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        aria-hidden
        style={{
          transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`,
          transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform",
        }}
      >
        <div className="absolute inset-0">
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

      {/* CONTENT LAYER */}
      <main className="relative z-10 flex-1">
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
            <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#00ccff]">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </div>

            <button
              type="button"
              onClick={goRandomSet}
              disabled={loading || allDjSets.length === 0}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/18 bg-black/35 px-3 py-1.5 text-sm font-medium text-white/95 backdrop-blur-sm transition-all duration-200 hover:border-[#00ccff]/40 hover:bg-white/[0.06] hover:shadow-[0_0_24px_rgba(0,204,255,0.12)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#00ccff]/35 disabled:pointer-events-none disabled:opacity-40"
            >
              <Shuffle className="h-3.5 w-3.5 shrink-0 text-[#00ccff]" />
              <span className="font-medium text-[#00ccff]">Random set</span>
            </button>

            <select
              value={filter.genre}
              onChange={(e) => handleFilterChange({ ...filter, genre: e.target.value })}
              className="min-w-[140px] cursor-pointer rounded-md border border-white/18 bg-black/20 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition hover:border-[#00ccff]/35 focus:border-[#00ccff]/45 focus:outline-none focus:ring-1 focus:ring-[#00ccff]/25"
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
              className="min-w-[140px] cursor-pointer rounded-md border border-white/18 bg-black/20 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition hover:border-[#00ccff]/35 focus:border-[#00ccff]/45 focus:outline-none focus:ring-1 focus:ring-[#00ccff]/25"
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
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-6 py-3 text-sm font-medium text-white/90 transition-all duration-200 hover:border-[#00ccff]/40 hover:bg-[#3700ff]/15 active:scale-95 active:shadow-[0_0_12px_rgba(0,204,255,0.15)] hover:scale-105 backdrop-blur-sm"
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