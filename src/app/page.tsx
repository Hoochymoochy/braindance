"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Radio, Waves, Globe2 } from "lucide-react";

type DjSet = {
  video_id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  view_count?: number;
};

type DjSetsResponse = {
  featured: {
    weekly: DjSet[];
  };
};

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [featuredStreams, setFeaturedStreams] = useState<DjSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const getFeaturedStreams = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dj-sets", { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as DjSetsResponse;

        // Defensive: handle unexpected shapes
        const weekly = data?.featured?.weekly;
        if (!Array.isArray(weekly)) {
          throw new Error(
            `Unexpected response shape. Got: ${JSON.stringify(data).slice(0, 200)}`
          );
        }

        setFeaturedStreams(weekly.slice(0, 3));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[FeaturedStreams] fetch failed:", message);
        setError(message);
        setFeaturedStreams([]);
      } finally {
        setLoading(false);
      }
    };

    getFeaturedStreams();
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black thermal-background text-white relative overflow-hidden">
      <div
        className="thermal-cursor"
        style={{ left: `${mousePosition.x}px`, top: `${mousePosition.y}px` }}
      />

      {/* HERO */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto border border-purple-500/30 bg-black/60 backdrop-blur-md rounded-2xl p-10 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
          <div className="text-sm text-purple-300 uppercase mb-4 tracking-wider">
            Welcome to Braindance
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
            Streaming the pulse of the planet
          </h1>
          <p className="text-base md:text-lg text-gray-300 mb-8">
            Braindance helps EDM culture move faster by making DJ sets easier to stream, discover, and celebrate across generations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              className="bg-purple-600 hover:bg-pink-600 text-white px-5 py-2 rounded-md shadow transition"
              onClick={() => eventsRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Braindance
            </button>
            <Link
              href="/events"
              className="border border-white text-white px-5 py-2 rounded-md hover:bg-white hover:text-black transition"
            >
              Explore Streams <ArrowRight className="inline ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto border border-purple-500/30 bg-black/60 backdrop-blur-md rounded-2xl p-8 md:p-10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <div className="text-sm text-purple-300 uppercase tracking-wider mb-4">
            Our Story
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-5">
            A home for new and legendary DJ sets
          </h2>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed">
            Braindance started with one simple idea: EDM culture deserves a
            cleaner streaming experience. We make it easy to tap into fresh sets,
            revisit classics, and discover artists across eras in one place.
          </p>
        </div>
      </section>

      {/* STORY PILLARS */}
      <section className="container mx-auto px-4 py-10 grid md:grid-cols-3 gap-6">
        {[
          {
            Icon: Radio,
            title: "Live Energy",
            color: "text-pink-400",
            description:
              "Stream DJ sets without friction and stay connected to what is happening now.",
          },
          {
            Icon: Waves,
            title: "Discovery Flow",
            color: "text-purple-400",
            description:
              "Find rising artists and respected legends side by side with simple, useful curation.",
          },
          {
            Icon: Globe2,
            title: "Culture First",
            color: "text-indigo-400",
            description:
              "We are building for global EDM culture with a focus on sound, story, and community.",
          },
        ].map(({ Icon, title, color, description }) => (
          <div
            key={title}
            className="p-6 border border-purple-900/50 bg-black/60 rounded-xl shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition"
          >
            <div className="w-10 h-10 mb-4 flex items-center justify-center rounded-lg bg-purple-900/40">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${color}`}>{title}</h3>
            <p className="text-sm text-gray-300">{description}</p>
          </div>
        ))}
      </section>

      {/* FEATURED STREAMS */}
      <section ref={eventsRef} className="container mx-auto px-4 py-16">

        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-pink-400/70 mb-2">
              Weekly Spotlight
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
              Featured<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                Streams
              </span>
            </h2>
          </div>
          <Link
            href="/events"
            className="group flex items-center gap-2 text-xs text-gray-500 hover:text-pink-300 transition-colors pb-1"
          >
            See all
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden bg-purple-950/20 aspect-[4/5] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error state — visible so you can debug */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-6 text-sm text-red-300 space-y-1">
            <p className="font-semibold text-red-400">Failed to load featured streams</p>
            <p className="text-red-300/70 font-mono text-xs break-all">{error}</p>
            <p className="text-gray-500 text-xs pt-2">
              Check the browser console and your <code>/api/dj-sets</code> response shape.
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && featuredStreams.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredStreams.map((set, idx) => (
              <Link
                key={set.video_id}
                href={`/stream/${set.video_id}`}
                className="group relative rounded-xl overflow-hidden bg-black block"
              >
                <div className="relative w-full aspect-[4/5] overflow-hidden">
                  {set.thumbnail ? (
                    <Image
                      src={set.thumbnail}
                      alt={set.title}
                      fill
                      className="object-cover scale-100 group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-950/40" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-pink-500/40 transition-all duration-300 rounded-xl" />

                  <span className="absolute top-3 left-4 text-6xl font-black text-white/10 group-hover:text-white/20 transition-colors select-none leading-none">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-2">
                      {set.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 truncate max-w-[70%]">
                        {set.channel}
                      </span>
                      <span className="text-[11px] text-pink-400 font-medium tabular-nums">
                        {(set.view_count ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state — only shown when API succeeded but returned no items */}
        {!loading && !error && featuredStreams.length === 0 && (
          <p className="text-sm text-gray-600">
            No featured streams found. The API responded but returned an empty weekly list.
          </p>
        )}
      </section>
    </div>
  );
}