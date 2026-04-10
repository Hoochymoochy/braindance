"use client";

import React from "react";
import { ArrowLeftCircle } from "lucide-react";
import Link from "next/link";

export default function PolicyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl p-10 glass-bends">
          <Link
            href="/"
            className="mb-8 flex items-center text-[#00ccff]/85 transition hover:text-[#ff00f7]"
          >
            <ArrowLeftCircle className="mr-2 h-5 w-5" />
            Back to Home
          </Link>

          <h1 className="mb-6 text-4xl font-bold text-gradient-bends sm:text-5xl">
            Braindance Policies
          </h1>
          <p className="mb-8 text-base text-white/80">
            We keep Braindance clear and trustworthy while building a better home
            for EDM streaming and set discovery.
          </p>

          <div className="space-y-10 text-sm text-white/80 md:text-base">
            <div>
              <h2 className="mb-2 text-lg font-semibold text-[#00ccff]">
                🎧 Data Usage
              </h2>
              <p>
                We collect just enough data to fuel the experience—event joins,
                stream interactions, hype metrics. No shady tracking. No
                unnecessary snooping.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-[#ff00f7]">
                📨 Emails & Contact
              </h2>
              <p>
                If you join our waitlist, we&apos;ll hit you up with drops,
                updates, and exclusives. No spam. Unsubscribe anytime.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-[#3700ff]">
                🔐 Privacy & Security
              </h2>
              <p>
                Your data lives in secure vaults. We use Supabase, encrypted
                auth, and token-based sessions. If we ever update how we handle
                info, you&apos;ll know first.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-[#00ccff]/90">
                🎚️ Content Standards
              </h2>
              <p>
                We focus on authentic DJ culture. Content should be respectful,
                music-first, and connected to real sets, artists, and events.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-[#ff00f7]/90">
                🌍 Platform Direction
              </h2>
              <p>
                Our mission is simple: make it easier to stream DJ sets and
                highlight both new talent and older iconic sets in one ecosystem.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-white">
                👾 Final Word
              </h2>
              <p>
                We&apos;re building Braindance as a global ritual—not a data
                trap. If you&apos;ve got questions, hit us up. We&apos;re here,
                alive, and listening.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
