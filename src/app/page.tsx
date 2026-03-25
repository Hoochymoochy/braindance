"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Flame, Zap, Radio, Waves, Globe2 } from "lucide-react";
import { BrainLogo } from "@/app/components/Brain-logo";
import { EventsLayout } from "@/app/EventLayout";
import { EventPosterProps } from "@/app/components/user/Poster";
import { getAllEvents } from "@/app/lib/events/event";
import { getStreams } from "@/app/lib/events/stream";
import { addEmail }  from "@/app/lib/utils/email";

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
  const [upcomingEvents, setUpcomingEvents] = useState<EventPosterProps[]>([]);
  const [featuredStreams, setFeaturedStreams] = useState<DjSet[]>([]);
  const [joinWaitlist, setJoinWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const eventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const getEvents = async () => {
      const events = await getAllEvents();
      const live: EventPosterProps[] = [];
      const upcoming: EventPosterProps[] = [];

      await Promise.all(
        events.map(async (event) => {
          const streams = await getStreams(event.id);
          const hasLive = streams?.some((s) => s.link !== null);

          if (hasLive) {
            live.push({
              ...event,
              link: streams.find((s) => s.link !== null)?.link || "",
            });
          } else {
            upcoming.push(event);
          }
        })
      );

      setUpcomingEvents(upcoming.slice(0, 3));
    };

    const getFeaturedStreams = async () => {
      try {
        const response = await fetch("/api/dj-sets", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as DjSetsResponse;
        setFeaturedStreams(data.featured.weekly.slice(0, 3));
      } catch {
        setFeaturedStreams([]);
      }
    };

    getEvents();
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

      {/* FEATURED STREAMS */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            Featured Streams
          </h2>
          <Link href="/events" className="text-sm text-purple-400 hover:underline">
            Based on top weekly views
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredStreams.map((set) => (
            <Link
              key={set.video_id}
              href={`/stream/${set.video_id}`}
              className="border border-purple-900/50 bg-black/60 rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition"
            >
              {set.thumbnail && (
                <Image
                  src={set.thumbnail}
                  alt={set.title}
                  width={640}
                  height={360}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <p className="font-medium text-sm mb-2 line-clamp-2">{set.title}</p>
                <p className="text-xs text-gray-400">
                  {set.channel} • {(set.view_count ?? 0).toLocaleString()} views
                </p>
              </div>
            </Link>
          ))}
          {featuredStreams.length === 0 && (
            <p className="text-sm text-gray-400">
              Featured streams will appear after DJ feed refresh.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
