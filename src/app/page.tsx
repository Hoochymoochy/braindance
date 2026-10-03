"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Shuffle, ChevronDown } from "lucide-react";
import { EventsLayout } from "@/app/EventLayout";
import { EventPosterProps } from "@/app/components/user/Poster";
import { getAllEvents } from "@/app/lib/events/event";
import { getAllStreams } from "@/app/lib/events/stream";
import { StreamCard } from "@/app/components/dj-sets/StreamCard";
import { CATALOG_REVALIDATE_SECONDS } from "@/app/lib/cache/http";
import { ttlGet, ttlSet } from "@/app/lib/cache/ttl";
import { trackEvent } from "@/app/lib/analytics";

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
        <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-900">
          <TrendingUp className="h-3 w-3" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
    </div>
  );
}

type HomeEventsCache = {
  live: EventPosterProps[];
  upcoming: EventPosterProps[];
};

const PAGE_SIZE = 9;
const DJ_SETS_CACHE_KEY = "home:dj-sets";
const EVENTS_CACHE_KEY = "home:events";
const CLIENT_CACHE_MS = CATALOG_REVALIDATE_SECONDS * 1000;

export default function Home() {
  const router = useRouter();
  const [liveEvents, setLiveEvents] = useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventPosterProps[]>([]);
  const [allDjSets, setAllDjSets] = useState<DjSet[]>([]);
  const [featuredWeekly, setFeaturedWeekly] = useState<DjSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const djSetsPromiseRef = useRef<Promise<DjSetsResponse | null> | null>(null);
  const randomPoolRef = useRef<DjSet[]>([]);
  const allDjSetsRef = useRef<DjSet[]>([]);
  const heroSentinelRef = useRef<HTMLDivElement | null>(null);
  const heroPassedRef = useRef(false);

  useEffect(() => {
    const el = heroSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || heroPassedRef.current) return;
        heroPassedRef.current = true;
        trackEvent("hero_passed");
        observer.disconnect();
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const applyDjSets = (data: DjSetsResponse) => {
      const current = Array.isArray(data.currentSets) ? data.currentSets : [];
      const pool = Array.isArray(data.allSets)
        ? data.allSets
        : current.length > 0
          ? current
          : [];
      allDjSetsRef.current = current;
      randomPoolRef.current = pool;
      setAllDjSets(current);
      setFeaturedWeekly(
        Array.isArray(data.featured?.weekly) ? data.featured.weekly : []
      );
    };

    const getEvents = async () => {
      const cached = ttlGet<HomeEventsCache>(EVENTS_CACHE_KEY);
      if (cached) {
        setLiveEvents(cached.live);
        setUpcomingEvents(cached.upcoming);
      }

      const events = (await getAllEvents()) ?? [];
      const streams = await getAllStreams();
      const streamsByEvent = new Map<string, typeof streams>();
      for (const row of streams) {
        const list = streamsByEvent.get(row.event_id) ?? [];
        list.push(row);
        streamsByEvent.set(row.event_id, list);
      }

      const live: EventPosterProps[] = [];
      const upcoming: EventPosterProps[] = [];

      for (const event of events) {
        const eventStreams = streamsByEvent.get(event.id) ?? [];
        const liveStream = eventStreams.find((s) => s.link !== null);
        if (liveStream) {
          live.push({
            ...event,
            link: liveStream.link ?? undefined,
          });
        } else {
          upcoming.push(event);
        }
      }

      ttlSet(EVENTS_CACHE_KEY, { live, upcoming }, CLIENT_CACHE_MS);
      setLiveEvents(live);
      setUpcomingEvents(upcoming);
    };

    const getDjSets = async (): Promise<DjSetsResponse | null> => {
      const cached = ttlGet<DjSetsResponse>(DJ_SETS_CACHE_KEY);
      if (cached) {
        applyDjSets(cached);
        setLoading(false);
      }

      try {
        const res = await fetch("/api/dj-sets");
        if (!res.ok) throw new Error("fetch failed");
        const data: DjSetsResponse = await res.json();
        ttlSet(DJ_SETS_CACHE_KEY, data, CLIENT_CACHE_MS);
        applyDjSets(data);
        return data;
      } catch {
        if (!cached) {
          allDjSetsRef.current = [];
          randomPoolRef.current = [];
          setAllDjSets([]);
          setFeaturedWeekly([]);
        }
        return cached;
      } finally {
        setLoading(false);
      }
    };

    djSetsPromiseRef.current = getDjSets();
    void getEvents();
  }, []);

  const visibleDjSets = useMemo(
    () => allDjSets.slice(0, visibleCount),
    [allDjSets, visibleCount]
  );

  const hasMore = visibleCount < allDjSets.length;

  const loadMore = () => {
    setVisibleCount((c) => c + PAGE_SIZE);
  };

  const goRandomSet = async () => {
    let pool =
      randomPoolRef.current.length > 0
        ? randomPoolRef.current
        : allDjSetsRef.current;

    if (pool.length === 0 && djSetsPromiseRef.current) {
      const data = await djSetsPromiseRef.current;
      if (data) {
        pool = Array.isArray(data.allSets)
          ? data.allSets
          : Array.isArray(data.currentSets)
            ? data.currentSets
            : [];
      }
    }

    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    trackEvent("random_set_clicked", {
      set_id: pick.video_id,
      set_title: pick.title,
      artist: pick.channel,
    });
    router.push(`/stream/${pick.video_id}?src=random`);
  };

  const skeletons = (n: number) =>
    Array.from({ length: n }).map((_, i) => (
      <div
        key={i}
        className="skeleton-shimmer glass-bends-card h-64 rounded-none"
      />
    ));

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip text-zinc-900">
      <div className="relative z-10 flex-1">
        <section
          id="home-hero"
          className="relative flex min-h-svh items-center overflow-hidden"
        >
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20">
            <p
              className="motion-enter mb-8 text-[0.7rem] font-medium uppercase tracking-[0.42em] text-zinc-500"
              style={{ animationDelay: "40ms" }}
            >
              Braindance
            </p>
            <h1 className="max-w-5xl text-[clamp(3.5rem,14vw,7rem)] font-bold leading-[0.9] tracking-[-0.045em] text-zinc-900">
              <span
                className="motion-enter block"
                style={{ animationDelay: "90ms" }}
              >
                Stream DJ sets
              </span>
              <span
                className="motion-enter mt-[0.12em] block text-gradient-bends"
                style={{ animationDelay: "160ms" }}
              >
                Discover new mixes
              </span>
            </h1>
            <div
              className="motion-enter mt-10"
              style={{ animationDelay: "230ms" }}
            >
              <button
                type="button"
                className="group inline-flex items-center gap-2 hover:cursor-pointer rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-[background-color,transform,box-shadow] duration-bends-fast ease-bends hover:bg-zinc-800 hover:shadow-[0_10px_28px_rgba(0,0,0,0.22)] active:scale-[0.98] dark:bg-brand-from dark:text-zinc-950 dark:hover:bg-brand-via"
                onClick={goRandomSet}
              >
                <Shuffle className="h-4 w-4" />
                Random set
              </button>
            </div>
          </div>
        </section>

        {/* Marks the start of set discovery; used once for hero_passed. */}
        <div ref={heroSentinelRef} className="h-px w-full" aria-hidden />

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-10">
          {/* Old catalog Random set bar — kept for easy restore
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
          */}

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
