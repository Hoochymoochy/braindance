"use client";

import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { StreamCard } from "@/app/components/dj-sets/StreamCard";
import { useHomeSearch } from "@/app/components/dj-sets/HomeSearchContext";
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
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
    </div>
  );
}

function matchesQuery(set: DjSet, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    set.title.toLowerCase().includes(q) ||
    set.channel.toLowerCase().includes(q) ||
    set.video_id.toLowerCase().includes(q)
  );
}

const PAGE_SIZE = 9;
const DJ_SETS_CACHE_KEY = "home:dj-sets";
const CLIENT_CACHE_MS = CATALOG_REVALIDATE_SECONDS * 1000;

export default function Home() {
  const router = useRouter();
  const [allDjSets, setAllDjSets] = useState<DjSet[]>([]);
  const [catalogSets, setCatalogSets] = useState<DjSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { query: searchQuery } = useHomeSearch();
  const deferredQuery = useDeferredValue(searchQuery);
  const djSetsPromiseRef = useRef<Promise<DjSetsResponse | null> | null>(null);
  const randomPoolRef = useRef<DjSet[]>([]);
  const allDjSetsRef = useRef<DjSet[]>([]);
  const heroSentinelRef = useRef<HTMLDivElement | null>(null);
  const heroPassedRef = useRef(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const isSearching = deferredQuery.trim().length > 0;

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
      setCatalogSets(pool);
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
          setCatalogSets([]);
        }
        return cached;
      } finally {
        setLoading(false);
      }
    };

    djSetsPromiseRef.current = getDjSets();
  }, []);

  const filteredSets = useMemo(() => {
    if (!isSearching) return allDjSets;
    return catalogSets.filter((set) => matchesQuery(set, deferredQuery));
  }, [isSearching, allDjSets, catalogSets, deferredQuery]);

  const visibleDjSets = useMemo(
    () => filteredSets.slice(0, visibleCount),
    [filteredSets, visibleCount]
  );

  const hasMore = visibleCount < filteredSets.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredQuery]);

  useEffect(() => {
    if (loading || !hasMore) return;
    const el = loadMoreSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((c) =>
          c >= filteredSets.length
            ? c
            : Math.min(c + PAGE_SIZE, filteredSets.length)
        );
      },
      { rootMargin: "400px 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, hasMore, filteredSets.length, visibleCount]);

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

        <div ref={heroSentinelRef} className="h-px w-full" aria-hidden />

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-10">
          <div>
            {/* One search input stays mounted so focus isn't lost when results kick in */}
            <div className="mb-5 min-w-0">
              <SectionHeader
                title={isSearching ? "Search results" : "Current DJ Sets"}
              />
              {!loading && isSearching ? (
                <p
                  className="mt-1 tabular-nums text-xs text-brand-from/65"
                  aria-live="polite"
                >
                  {filteredSets.length}{" "}
                  {filteredSets.length === 1 ? "result" : "results"}
                </p>
              ) : !loading && allDjSets.length > 0 ? (
                <p className="mt-1 tabular-nums text-xs text-brand-from/65">
                  Showing {visibleDjSets.length} of {allDjSets.length}
                </p>
              ) : null}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading && skeletons(6)}
              {!loading &&
                visibleDjSets.map((set, i) => (
                  <StreamCard
                    key={set.video_id}
                    set={set}
                    index={i}
                    showAddToCrate={false}
                  />
                ))}
              {!loading && isSearching && filteredSets.length === 0 && (
                <p className="col-span-full py-8 text-sm text-[#7a7a7a]">
                  No sets match &ldquo;{deferredQuery.trim()}&rdquo;.
                </p>
              )}
            </div>
            {!loading && hasMore && (
              <div
                ref={loadMoreSentinelRef}
                className="mb-8 mt-12 h-px w-full"
                aria-hidden
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
