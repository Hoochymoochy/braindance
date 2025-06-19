"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Radio, Camera, Globe2 } from "lucide-react";

export default function About() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const eventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black thermal-background text-white relative overflow-hidden">
      {/* Thermal Cursor */}
      <div
        className="thermal-cursor"
        style={{ left: `${mousePosition.x}px`, top: `${mousePosition.y}px` }}
      />

      {/* HERO */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto border border-purple-500/30 bg-black/60 backdrop-blur-md rounded-2xl p-10 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
          <div className="text-sm text-purple-300 uppercase mb-4 tracking-wider">
            The Origin
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
            About Braindance
          </h1>
          <p className="text-base md:text-lg text-gray-300 mb-8">
            The ritual begins with sound. Braindance is a live-streaming realm
            where DJs beam energy across the globe, and photos capture the
            moment in raw pixels—no filters, no fakes, just real digital energy.
          </p>
          <button
            className="bg-purple-600 hover:bg-pink-600 text-white px-5 py-2 rounded-md shadow transition"
            onClick={() => eventsRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            Explore Braindance
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20 space-y-24">
        {[
          {
            Icon: Radio,
            title: "Live Sets, Global Reach",
            description:
              "DJs plug into the stream and pulse energy around the world. Every broadcast becomes part of the collective vibe—felt in clubs, bedrooms, and headphones across every timezone.",
            color: "text-pink-400",
            bg: "bg-pink-900/40",
          },
          {
            Icon: Camera,
            title: "Live Event Photos",
            description:
              "The crowd becomes the lens. Every photo gets uploaded in real time, building an unfiltered gallery of sound, sweat, and spontaneity.",
            color: "text-purple-400",
            bg: "bg-purple-900/40",
            reverse: true,
          },
          {
            Icon: Globe2,
            title: "A Connected Future",
            description:
              "What starts as sound becomes motion, interaction, and synced rituals. Braindance is building the real-time fabric of global nightlife.",
            color: "text-indigo-400",
            bg: "bg-indigo-900/40",
          },
        ].map(({ Icon, title, description, color, bg, reverse }, i) => (
          <div
            key={i}
            className={`flex flex-col md:flex-row ${
              reverse ? "md:flex-row-reverse" : ""
            } items-center gap-12`}
          >
            <div
              className={`flex-1 border border-purple-500/30 ${bg} rounded-xl p-10 shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition`}
            >
              <Icon className={`w-12 h-12 mb-4 ${color}`} />
              <h2 className={`text-2xl font-bold mb-4 ${color}`}>{title}</h2>
              <p className="text-gray-300 text-base">{description}</p>
            </div>
            <div className="flex-1 w-full h-64 rounded-xl bg-purple-800/10 animate-pulse" />
          </div>
        ))}
      </section>

      {/* FINAL CTA */}
      <section
        ref={eventsRef}
        className="container mx-auto px-4 py-24 text-center"
      >
        <div className="max-w-3xl mx-auto border border-purple-500/30 bg-black/60 backdrop-blur-md rounded-2xl p-10 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
          <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-6">
            The Ritual Has Begun
          </h2>
          <p className="text-gray-300 mb-8 text-base md:text-lg">
            Tap in. Feel the motion. Capture the vibe. This is the future of
            nightlife, and you’re part of the first wave.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-purple-600 hover:bg-pink-600 text-white px-6 py-2 rounded-md shadow transition">
              Join Braindance <ArrowRight className="ml-2 h-4 w-4 inline" />
            </button>
            <Link href="/events">
              <div className="border border-white text-white px-6 py-2 rounded-md hover:bg-white hover:text-black transition">
                Explore Events
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
