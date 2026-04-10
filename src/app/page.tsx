"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Radio, Waves, Globe2, TrendingUp } from "lucide-react";
import { StreamCard } from "@/app/components/dj-sets/StreamCard";

const ColorBends = dynamic(() => import("@/components/ColorBends"), {
  ssr: false,
  loading: () => null,
});

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

const BEND_COLORS = ["#00ccff", "#ff00f7", "#3700ff", "#7a7a7a"] as const;

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
    <div className="relative min-h-screen overflow-hidden text-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-black"
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

      <div className="relative z-10">
        {/* HERO */}
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl rounded-2xl p-10 glass-bends">
            <div className="mb-4 text-sm uppercase tracking-wider text-[#00ccff]/90">
              Welcome to Braindance
            </div>
            <h1 className="mb-6 bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl">
              Stream DJ sets. Discover new mixes.
            </h1>
            <p className="mb-8 text-base text-white/80 md:text-lg">
              Find fresh DJ sets and classic mixes in one place. Easy streaming, no fuss.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                className="rounded-md bg-[#3700ff] px-5 py-2 text-white shadow transition hover:bg-[#ff00f7]/90"
                onClick={() =>
                  eventsRef.current?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Braindance
              </button>
              <Link
                href="/events"
                className="rounded-md border border-white/40 bg-white/5 px-5 py-2 text-white backdrop-blur-sm transition hover:border-[#00ccff]/60 hover:bg-[#00ccff]/10"
              >
                Explore Streams <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="mx-auto max-w-4xl rounded-2xl p-8 glass-bends md:p-10">
            <div className="mb-4 text-sm uppercase tracking-wider text-[#00ccff]/90">
              About us
            </div>
            <h2 className="mb-5 bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              All your DJ sets in one place
            </h2>
            <p className="text-base leading-relaxed text-white/80 md:text-lg">
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
              accent: "text-[#ff00f7]",
              iconBg: "bg-[#ff00f7]/15",
            },
            {
              Icon: Waves,
              title: "Discover Artists",
              description:
                "Find new DJs and revisit classics. All in one place.",
              accent: "text-[#00ccff]",
              iconBg: "bg-[#00ccff]/15",
            },
            {
              Icon: Globe2,
              title: "Stay Current",
              description:
                "See what's trending and what people are watching right now.",
              accent: "text-[#3700ff]",
              iconBg: "bg-[#3700ff]/20",
            },
          ].map(({ Icon, title, description, accent, iconBg }) => (
            <div
              key={title}
              className="rounded-xl p-6 glass-bends-card transition hover:shadow-[0_0_28px_rgba(0,204,255,0.15)]"
            >
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 ${iconBg}`}
              >
                <Icon className={`h-5 w-5 ${accent}`} />
              </div>
              <h3 className={`mb-2 text-lg font-bold ${accent}`}>{title}</h3>
              <p className="text-sm text-white/75">{description}</p>
            </div>
          ))}
        </section>

        {/* ── FEATURED STREAMS ─────────────────────────────────────── */}
        <section className="container mx-auto space-y-6 px-4 py-8">
          <div className="mb-7 flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2 space-y-2 text-[0.7rem] font-medium uppercase tracking-widest text-[#00ccff]/80">
                <TrendingUp className="h-3 w-3" />
                Top weekly views
              </span>
              <h2 className="m-0 bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-tight text-transparent">
                Featured Streams
              </h2>
            </div>
            <Link
              href="/events"
              className="group inline-flex items-center gap-1.5 text-[0.8rem] text-[#00ccff]/75 no-underline transition-colors hover:text-[#00ccff]"
            >
              View all
              <span className="inline-block transition-transform group-hover:translate-x-0.5">
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
                  className="glass-bends-card h-64 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(110deg,rgba(0,204,255,0.08) 25%,rgba(55,0,255,0.1) 50%,rgba(255,0,247,0.08) 75%), rgba(0,0,0,0.2)",
                    backgroundSize: "200% 100%",
                    animation: "fs-shimmer 1.4s infinite",
                  }}
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
    </div>
  );
}