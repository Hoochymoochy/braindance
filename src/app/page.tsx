"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Radio, Waves, Globe2, TrendingUp } from "lucide-react";
import { StreamCard } from "@/app/components/dj-sets/StreamCard";

type DjSet = {
  video_id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  view_count?: number;
};

type DjSetsResponse = {
  currentSets?: DjSet[];
  featured?: {
    weekly?: DjSet[];
  };
};

export default function Home() {
  const [featuredStreams, setFeaturedStreams] = useState<DjSet[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const eventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getFeaturedStreams = async () => {
      try {
        const response = await fetch("/api/dj-sets", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as DjSetsResponse;
        const weekly = data.featured?.weekly;
        let list = Array.isArray(weekly) ? weekly : [];
        if (
          list.length === 0 &&
          Array.isArray(data.currentSets) &&
          data.currentSets.length > 0
        ) {
          list = [...data.currentSets].sort(
            (a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)
          );
        }
        setFeaturedStreams(list.slice(0, 3));
      } catch {
        setFeaturedStreams([]);
      } finally {
        setStreamsLoading(false);
      }
    };

    getFeaturedStreams();
  }, []);

  return (
    <div className="relative text-zinc-900">
      <div className="relative z-10">
        {/* HERO */}
        <section className="container mx-auto px-4 py-24 text-center">
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
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                className="rounded-md bg-brand-to px-5 py-2 text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-[background-color,box-shadow] duration-bends-fast ease-bends hover:bg-brand-via/90 hover:shadow-[0_4px_14px_rgba(0,0,0,0.45)] dark:text-zinc-950"
                onClick={() =>
                  eventsRef.current?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Braindance
              </button>
              <Link
                href="/events"
                className="rounded-md border border-zinc-300/80 bg-white/60 px-5 py-2 text-zinc-800 backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-bends-fast ease-bends hover:border-brand-from/60 hover:bg-brand-from/10 hover:shadow-lg hover:shadow-brand-from/20"
              >
                Explore Streams <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="mx-auto max-w-4xl rounded-2xl p-8 glass-bends-card backdrop-blur-lg border border-black/8 md:p-10">
            <div className="mb-4 text-sm uppercase tracking-wider text-brand-from/90">
              About us
            </div>
            <h2 className="mb-5 bg-gradient-to-r from-brand-from via-brand-via to-brand-to bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              All your DJ sets in one place
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 md:text-lg">
              We stream DJ mixes and sets. Browse what&apos;s popular, discover new artists, and build your library.
            </p>
          </div>
        </section>

        {/* STORY PILLARS */}
        <section className="container mx-auto grid gap-6 px-4 py-10 md:grid-cols-3">
          {[
            {
              Icon: Radio,
              title: "Stream Anytime",
              description:
                "Watch DJ sets whenever you want. No ads, no hassle.",
              accent: "text-brand-via",
              iconBg: "bg-brand-via/15",
            },
            {
              Icon: Waves,
              title: "Discover Artists",
              description:
                "Find new DJs and revisit classics. All in one place.",
              accent: "text-brand-from",
              iconBg: "bg-brand-from/15",
            },
            {
              Icon: Globe2,
              title: "Stay Current",
              description:
                "See what's trending and what people are watching right now.",
              accent: "text-brand-to",
              iconBg: "bg-brand-to/20",
            },
          ].map(({ Icon, title, description, accent, iconBg }) => (
            <div
              key={title}
              className="hover-glow-brand rounded-xl p-6 glass-bends-card backdrop-blur-lg border border-black/8 transition-[background-color,box-shadow] duration-bends ease-bends"
            >
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-black/8 ${iconBg}`}
              >
                <Icon className={`h-5 w-5 ${accent}`} />
              </div>
              <h3 className={`mb-2 text-lg font-bold ${accent}`}>{title}</h3>
              <p className="text-sm text-zinc-600">{description}</p>
            </div>
          ))}
        </section>

        {/* ── FEATURED STREAMS ─────────────────────────────────────── */}
        <section className="container mx-auto space-y-6 px-4 py-8">
          <div className="mb-7 flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2 space-y-2 text-[0.7rem] font-medium uppercase tracking-widest text-brand-from/80">
                <TrendingUp className="h-3 w-3" />
                Top weekly views
              </span>
              <h2 className="m-0 bg-gradient-to-r from-brand-from via-brand-via to-brand-to bg-clip-text text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-tight text-transparent">
                Featured Streams
              </h2>
            </div>
            <Link
              href="/events"
              className="group inline-flex items-center gap-1.5 text-[0.8rem] text-brand-from/75 no-underline transition-colors duration-bends-fast ease-bends hover:text-brand-from"
            >
              View all
              <span className="inline-block transition-transform duration-bends-fast ease-bends group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>

          <div
            ref={eventsRef}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {streamsLoading &&
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="skeleton-shimmer glass-bends-card h-64 rounded-2xl"
                />
              ))}

            {!streamsLoading && featuredStreams.length === 0 && (
              <p className="col-span-full py-8 text-sm text-[#7a7a7a]">
                Featured streams will appear after DJ feed refresh.
              </p>
            )}

            {!streamsLoading &&
              featuredStreams.map((set, i) => (
                <StreamCard key={set.video_id} set={set} index={i} />
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
