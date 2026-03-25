"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeftCircle } from "lucide-react";
import Link from "next/link";

export default function PolicyPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black thermal-background text-white relative overflow-hidden">
      <div
        className="thermal-cursor"
        style={{ left: `${mousePosition.x}px`, top: `${mousePosition.y}px` }}
      />

      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto border border-purple-500/30 bg-black/60 backdrop-blur-md rounded-2xl p-10 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
          <Link
            href="/"
            className="flex items-center text-purple-300 hover:text-pink-400 transition mb-8"
          >
            <ArrowLeftCircle className="mr-2 h-5 w-5" />
            Back to Home
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
            Braindance Policies
          </h1>
          <p className="text-base text-gray-300 mb-8">
            We keep Braindance clear and trustworthy while building a better home for EDM streaming and set discovery.
          </p>

          <div className="space-y-10 text-sm md:text-base text-gray-300">
            <div>
              <h2 className="text-lg font-semibold text-purple-300 mb-2">🎧 Data Usage</h2>
              <p>
                We collect just enough data to fuel the experience—event joins, stream interactions, hype metrics. No shady tracking. No unnecessary snooping.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-pink-400 mb-2">📨 Emails & Contact</h2>
              <p>
                If you join our waitlist, we’ll hit you up with drops, updates, and exclusives. No spam. Unsubscribe anytime.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-indigo-400 mb-2">🔐 Privacy & Security</h2>
              <p>
                Your data lives in secure vaults. We use Supabase, encrypted auth, and token-based sessions. If we ever update how we handle info, you&apos;ll know first.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-purple-400 mb-2">🎚️ Content Standards</h2>
              <p>
                We focus on authentic DJ culture. Content should be respectful, music-first, and connected to real sets, artists, and events.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-pink-300 mb-2">🌍 Platform Direction</h2>
              <p>
                Our mission is simple: make it easier to stream DJ sets and highlight both new talent and older iconic sets in one ecosystem.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">👾 Final Word</h2>
              <p>
                We’re building Braindance as a global ritual—not a data trap. If you’ve got questions, hit us up. We’re here, alive, and listening.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
