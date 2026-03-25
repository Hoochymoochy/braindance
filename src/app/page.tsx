"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Radio, Waves, Globe2, TrendingUp } from "lucide-react";

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

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [featuredStreams, setFeaturedStreams] = useState<DjSet[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const eventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const getFeaturedStreams = async () => {
      try {
        const response = await fetch("/api/dj-sets", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as DjSetsResponse;
        const weekly = data.featured?.weekly;
        let list = Array.isArray(weekly) ? weekly : [];
        if (list.length === 0 && Array.isArray(data.currentSets) && data.currentSets.length > 0) {
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
            Braindance helps EDM culture move faster by making DJ sets easier to
            stream, discover, and celebrate across generations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              className="bg-purple-600 hover:bg-pink-600 text-white px-5 py-2 rounded-md shadow transition"
              onClick={() =>
                eventsRef.current?.scrollIntoView({ behavior: "smooth" })
              }
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
            description:
              "Stream DJ sets without friction and stay connected to what is happening now.",
            color: "text-pink-400",
          },
          {
            Icon: Waves,
            title: "Discovery Flow",
            description:
              "Find rising artists and respected legends side by side with simple, useful curation.",
            color: "text-purple-400",
          },
          {
            Icon: Globe2,
            title: "Culture First",
            description:
              "We are building for global EDM culture with a focus on sound, story, and community.",
            color: "text-indigo-400",
          },
        ].map(({ Icon, title, description, color }) => (
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

      {/* ── FEATURED STREAMS ─────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-end mb-7">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium tracking-widest uppercase text-purple-400/80">
              <TrendingUp className="w-3 h-3" />
              Top weekly views
            </span>
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 m-0">
              Featured Streams
            </h2>
          </div>
          <Link
            href="/events"
            className="group inline-flex items-center gap-1.5 text-[0.8rem] text-purple-400/70 hover:text-purple-300 transition-colors no-underline"
          >
            View all
            <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Skeletons while loading */}
          {streamsLoading &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl h-64"
                style={{
                  background:
                    "linear-gradient(110deg,rgba(168,85,247,0.06) 25%,rgba(168,85,247,0.12) 50%,rgba(168,85,247,0.06) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "fs-shimmer 1.4s infinite",
                }}
              />
            ))}

          {/* Empty state */}
          {!streamsLoading && featuredStreams.length === 0 && (
            <p className="text-sm text-purple-400/45 col-span-full py-8">
              Featured streams will appear after DJ feed refresh.
            </p>
          )}

          {/* Stream cards */}
          {!streamsLoading &&
            featuredStreams.map((set, i) => (
              <Link
                key={set.video_id}
                href={`/stream/${set.video_id}`}
                className="group relative flex flex-col rounded-2xl overflow-hidden no-underline text-white"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(168,85,247,0.15)",
                  animation: `fs-card-in 0.45s ${i * 80}ms both`,
                  transition:
                    "transform 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.3s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(244,114,182,0.35)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(168,85,247,0.15)";
                }}
              >
                {/* Thumbnail */}
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9", background: "#0d0010" }}>
                  {set.thumbnail ? (
                    <Image
                      src={set.thumbnail}
                      alt={set.title}
                      width={640}
                      height={360}
                      className="w-full h-full object-cover"
                      style={{
                        transition:
                          "transform 0.5s cubic-bezier(0.22,1,0.36,1), filter 0.3s",
                        filter: "brightness(0.88) saturate(1.1)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform =
                          "scale(1.04)";
                        (e.currentTarget as HTMLElement).style.filter =
                          "brightness(0.7) saturate(1.2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform =
                          "scale(1)";
                        (e.currentTarget as HTMLElement).style.filter =
                          "brightness(0.88) saturate(1.1)";
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        background:
                          "linear-gradient(135deg,#1a0033 0%,#0d001a 100%)",
                      }}
                    />
                  )}

                  {/* Gradient bleed */}
                  <div
                    className="absolute bottom-0 left-0 right-0 pointer-events-none"
                    style={{
                      height: "40%",
                      background:
                        "linear-gradient(to bottom,transparent,rgba(0,0,0,0.6))",
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
                      style={{
                        width: 3,
                        height: 3,
                        background: "rgba(167,139,250,0.35)",
                      }}
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
            ))}
        </div>
      </section>

      {/* Shimmer + card-in keyframes */}
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