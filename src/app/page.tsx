"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Zap } from "lucide-react";
import { BrainLogo } from "@/app/components/Brain-logo";
import { EventsLayout } from "@/app/EventLayout";
import { EventPosterProps } from "@/app/components/user/Poster";
import { getAllEvents } from "@/app/lib/events/event";
import { getStreams } from "@/app/lib/events/stream";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [liveEvents, setLiveEvents] = useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventPosterProps[]>([]);
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

      setLiveEvents(live);
      setUpcomingEvents(upcoming.slice(0, 3));
    };

    getEvents();
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
            DJs broadcast energy, listeners tune in globally, and a digital rhythm is born.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              className="bg-purple-600 hover:bg-pink-600 text-white px-5 py-2 rounded-md shadow transition"
              onClick={() => eventsRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Braindance
            </button>
            <Link
              href="#"
              className="border border-white text-white px-5 py-2 rounded-md hover:bg-white hover:text-black transition"
            >
              Join the Ritual <ArrowRight className="inline ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20 grid md:grid-cols-3 gap-8">
        {[
          {
            Icon: Flame,
            title: "Global Hype Rituals",
            color: "text-pink-400",
            description:
              "Cities raise the energy together. Exclusive drops and shoutouts ignite at peak hype.",
          },
          {
            Icon: BrainLogo,
            title: "DJ-Driven Energy",
            color: "text-purple-400",
            description:
              "Live streams transmit raw energy. Every beat is a signal in the planetary network.",
          },
          {
            Icon: Zap,
            title: "Real-Time Connection",
            color: "text-indigo-400",
            description:
              "No matter where you are, tune in instantly and never miss the vibe.",
          },
        ].map(({ Icon, title, color, description }, i) => (
          <div
            key={i}
            className="p-6 border border-purple-900/50 bg-black/60 rounded-xl shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition"
          >
            <div className={`w-10 h-10 mb-4 flex items-center justify-center rounded-lg bg-purple-900/40`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${color}`}>{title}</h3>
            <p className="text-sm text-gray-300">{description}</p>
          </div>
        ))}
      </section>

      {/* EVENTS */}
      <section ref={eventsRef} className="container mx-auto px-4 py-20">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Featured Events
          </h2>
          <Link href="/events" className="text-sm text-purple-400 hover:underline flex items-center">
            View all events <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <EventsLayout
          topEvents={upcomingEvents}
          hideStuff={{ bookmark: true, heart: true, title: true }}
        />
      </section>

      {/* CALL TO ACTION */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-xl p-10 border border-purple-900/40 bg-black/60 text-center shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
            Ready to experience Braindance?
          </h2>
          <p className="text-gray-300 mb-6">Join the community shaping the next evolution of global sound.</p>
          <button
            className="px-4 py-2 border border-pink-500 rounded-md text-pink-400 hover:bg-pink-600 hover:text-black transition"
            onClick={() => setJoinWaitlist(true)}
          >
            Join Waitlist
          </button>
        </div>
      </section>

      {/* WAITLIST MODAL */}
      {joinWaitlist && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center"
          onClick={() => {
            setJoinWaitlist(false);
            setSubmitted(false);
          }}
        >
          <div
            className="relative w-full max-w-md bg-black border border-purple-900/40 rounded-xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.25)] animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setJoinWaitlist(false);
                setSubmitted(false);
              }}
              className="absolute top-3 right-4 text-gray-400 hover:text-pink-400 transition"
            >
              ✕
            </button>
            {!submitted ? (
              <>
                <h3 className="text-xl font-bold mb-2 text-purple-300">Join the Waitlist</h3>
                <p className="text-sm text-gray-400 mb-4">Be first in line for global rituals & drops.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                  className="flex flex-col gap-3"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="px-4 py-2 bg-black border border-purple-500/30 rounded-md text-white placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-pink-500 text-white px-4 py-2 rounded-md transition"
                  >
                    Submit
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-pink-400 mb-2">You’re on the list!</h3>
                <p className="text-sm text-gray-300">We’re coming in loud. Stay tuned. 🔊</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
