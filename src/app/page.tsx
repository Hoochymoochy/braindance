"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/Button";
import { ArrowRight, Flame, Zap } from "lucide-react";
import { BrainLogo } from "@/app/components/Brain-logo";
import { EventsLayout } from "@/app/EventLayout";
import { EventPosterProps } from "@/app/components/user/Poster";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [topEvents, setTopEvents] = React.useState<EventPosterProps[]>([]);
  const [liveEvents, setLiveEvents] = React.useState<EventPosterProps[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<
    EventPosterProps[]
  >([]);
  const [joinWaitlist, setJoinWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const eventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/events/get-global-events")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setUpcomingEvents(data.upcomingEvents || []);
        setLiveEvents(data.liveEvents || []);
        // If you have top events in your API response, uncomment this:
        // setTopEvents(data.topEvents || []);

        // If you want to use live events as top events when no top events exist:
        if (!data.topEvents || data.topEvents.length === 0) {
          setTopEvents(data.liveEvents || []);
        } else {
          setTopEvents(data.topEvents);
        }
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
      });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);
  const handleJoinWaitlist = () => {};

  return (
    <div className="min-h-screen bg-black thermal-background">
      <div
        className="thermal-cursor"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center bg-black rounded-full p-10 border border-thermal-neutral/20">
            <div className="inline-block p-1 mb-6 rounded-full">
              <div className="bg-black px-4 py-1 rounded-full">
                <span className="text-sm font-medium">
                  Welcome to Braindance
                </span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Streaming the pulse of the planet
            </h1>
            <p className="text-lg md:text-xl mb-8">
              Braindance connects the world through music—one stream at a time.
              DJs broadcast energy, listeners tune in from every corner, and a
              global rhythm is born. It's more than just music—it's movement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-full sm:w-auto text-black px-4 py-2 rounded-md font-semibold flex items-center justify-center">
                Join the Ritual
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
              <button
                onClick={() =>
                  eventsRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                className="w-full sm:w-auto border border-white text-white px-4 py-2 rounded-md hover:bg-white hover:text-black transition"
              >
                Explore Braindance
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-black p-8 rounded-xl border border-thermal-neutral/20 hover:border-thermal-hot/50 transition-colors group">
              <div className="w-12 h-12 bg-thermal-hot rounded-lg flex items-center justify-center mb-6 group-hover:bg-thermal-hot/80 transition-colors">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-thermal-hot mb-3">
                Global Hype Rituals
              </h3>
              <p className="text-thermal-neutral">
                Cities around the world tune in, stream together, and raise the
                collective volume. When energy surges, exclusive drops and
                shoutouts ignite the moment.
              </p>
            </div>

            <div className="bg-black p-8 rounded-xl border border-thermal-neutral/20 hover:border-thermal-warm/50 transition-colors group">
              <div className="w-12 h-12 bg-thermal-warm rounded-lg flex items-center justify-center mb-6 group-hover:bg-thermal-warm/80 transition-colors">
                <BrainLogo withText={false} className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-thermal-warm mb-3">
                DJ-Driven Energy
              </h3>
              <p className="text-thermal-neutral">
                Each set is a live broadcast of energy. DJs stream straight to
                the world, and every beat becomes a signal connecting you to the
                global pulse.
              </p>
            </div>

            <div className="bg-black p-8 rounded-xl border border-thermal-neutral/20 hover:border-thermal-neutral/50 transition-colors group">
              <div className="w-12 h-12 bg-thermal-neutral rounded-lg flex items-center justify-center mb-6 group-hover:bg-thermal-neutral/80 transition-colors">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-thermal-neutral mb-3">
                Real-Time Connection
              </h3>
              <p className="text-thermal-neutral">
                Stream live, tune in instantly, and feel the vibe with others
                across the planet. Wherever you are, you're never out of sync
                with the sound.
              </p>
            </div>
          </div>
        </section>

        {/* Events Preview Section */}
        <section ref={eventsRef} className="container mx-auto px-4 py-20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Events</h2>
            <Link href="/events" className="flex items-center ">
              View all events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <EventsLayout
            topEvents={upcomingEvents}
            hideStuff={{ bookmark: true, heart: true, title: true }}
          />
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="relative overflow-hidden rounded-xl p-8 md:p-12 border border-thermal-neutral/20 bg-black">
            <div className="absolute inset-0 "></div>
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to experience braindance?
              </h2>
              <p className="text-lg mb-8">
                Join our community of explorers and experience the next
                evolution of digital consciousness.
              </p>
              <button
                className="border-1 border-thermal-hot px-4 py-2 rounded-md"
                onClick={() => setJoinWaitlist(!joinWaitlist)}
              >
                Join waitlist
              </button>
            </div>
          </div>
        </section>

        {joinWaitlist && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
            onClick={() => {
              setJoinWaitlist(false);
              setSubmitted(false);
            }}
          >
            <div
              className="relative w-full max-w-md bg-black border border-thermal-neutral/20 rounded-2xl p-6 text-center shadow-lg animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Exit Button */}
              <button
                onClick={() => {
                  setJoinWaitlist(false);
                  setSubmitted(false);
                }}
                className="absolute top-4 right-4 text-thermal-neutral hover:text-thermal-hot text-xl transition"
              >
                ✕
              </button>

              {/* Conditional rendering */}
              {!submitted ? (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                      <Flame className="h-6 w-6 text-black" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Join our waitlist</h3>
                  <p className="mb-4">Be the first to experience Braindance.</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmitted(true);
                      // Optional: Send to backend here
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="flex-1 px-4 py-2 bg-black border border-thermal-neutral/20 rounded-md text-white "
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 border border-thermal-hot rounded-md hover:bg-white transition"
                    >
                      Join
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mb-2">
                    You're on the list!
                  </h3>
                  <p className="">
                    We about to bring the heat around the world!!! 🔥
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
