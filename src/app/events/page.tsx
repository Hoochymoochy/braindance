"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}

function StreamCard({ set, index }: { set: DjSet; index: number }) {
  return (
    <Link
      href={`/stream/${set.video_id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden text-white bg-black/50 backdrop-blur-sm border border-purple-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/30 hover:shadow-[0_0_24px_rgba(236,72,153,0.12)] cursor-pointer"
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
          <span className="truncate">{set.channel}</span>
          <span className="w-1 h-1 shrink-0 bg-purple-400/40 rounded-full" />
          <span>{formatViews(set.view_count ?? 0)} views</span>
        </div>
      </div>
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
    <div className="flex flex-col gap-1">
      {eyebrow && (
        <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-purple-400/80">
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const skeletons = (n: number) =>
    Array.from({ length: n }).map((_, i) => (
      <div
        key={i}
        className="group relative flex flex-col rounded-2xl overflow-hidden text-white bg-black/50 backdrop-blur-sm border border-purple-900/40"
        style={{ animation: `fs-card-in 0.45s ${i * 60}ms both` }}
      >
        <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-purple-900/20 to-black">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>

        <div className="flex flex-col gap-2 px-4 py-3">
          <div className="space-y-3 w-full">
            <div className="h-4 bg-purple-900/30 rounded-lg w-3/4 animate-shimmer-slow" />
            <div className="h-4 bg-purple-900/30 rounded-lg w-1/2 animate-shimmer-slow" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <div className="h-3 bg-purple-900/25 rounded w-24 animate-shimmer-slow" />
            <div className="w-1 h-1 shrink-0 bg-purple-400/20 rounded-full" />
            <div className="h-3 bg-purple-900/25 rounded w-16 animate-shimmer-slow" />
          </div>
        </div>
      </div>
    ));

  return (
    <div className="min-h-screen flex flex-col text-white bg-black thermal-background relative overflow-hidden">
      <div
        className="thermal-cursor"
        style={{ left: `${mousePosition.x}px`, top: `${mousePosition.y}px` }}
      />
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 py-10 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DJ Sets
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-purple-500/25 bg-black/60 backdrop-blur-md mb-10 shadow-[0_0_20px_rgba(168,85,247,0.08)] transition-all duration-300 ease-out"
            style={{
              transform: isFiltering ? "scale(0.995)" : "scale(1)",
              opacity: isFiltering ? 0.95 : 1,
            }}
          >
            <div className="flex items-center gap-2 text-purple-300 text-sm shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </div>

            <button
              type="button"
              onClick={goRandomSet}
              disabled={loading || allDjSets.length === 0}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600/85 to-purple-600/85 border border-pink-500/35 text-sm font-medium hover:from-pink-500 hover:to-purple-500 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 gap-2 cursor-pointer active:scale-95 hover:scale-105 active:shadow-[0_0_12px_rgba(236,72,153,0.4)]"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Random set
            </button>

            <select
              value={filter.genre}
              onChange={(e) => handleFilterChange({ ...filter, genre: e.target.value })}
              className="px-3 py-1.5 rounded-lg bg-black border border-purple-400/30 text-sm min-w-[140px] cursor-pointer transition-all duration-200 hover:border-purple-400/60 focus:border-pink-500/60 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
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
              className="px-3 py-1.5 rounded-lg bg-black border border-purple-400/30 text-sm min-w-[140px] cursor-pointer transition-all duration-200 hover:border-purple-400/60 focus:border-pink-500/60 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
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
                className="ml-auto text-xs text-pink-400 hover:text-pink-300 hover:underline transition-colors duration-200 cursor-pointer"
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
                <p className="text-sm text-purple-400/50 col-span-full py-4">
                  No featured picks yet. Refresh the DJ feed or check back soon.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
              <SectionHeader title="Current DJ Sets" />
              {!loading && filteredDjSets.length > 0 && (
                <p className="text-xs text-purple-400/60 tabular-nums">
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
              <div className="flex justify-center mt-10">
                <button
                  type="button"
                  onClick={loadMore}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-purple-500/40 bg-black/50 text-purple-200 text-sm font-medium hover:border-pink-500/45 hover:bg-purple-950/35 transition-all duration-200 cursor-pointer active:scale-95 hover:scale-105 active:shadow-[0_0_12px_rgba(236,72,153,0.4)]"
                >
                  Load more
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
            {!loading && filteredDjSets.length === 0 && allDjSets.length > 0 && (
              <p className="text-sm text-purple-400/55 py-10 text-center max-w-md mx-auto">
                No sets match these filters. Reset filters or try{" "}
                <button
                  type="button"
                  onClick={goRandomSet}
                  className="text-pink-400 hover:text-pink-300 hover:underline transition-colors duration-200 cursor-pointer"
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
        @keyframes fs-card-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes shimmer-slow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }

        .animate-shimmer-slow {
          animation: shimmer-slow 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}