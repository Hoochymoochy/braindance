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
            Policies
          </h1>
          <p className="mb-8 text-base text-white/80">
            Quick rundown of how we handle stuff on Braindance. Nothing sneaky—just
            what you&apos;d expect if we ran this thing like we&apos;d want it run for
            us.
          </p>

          <div className="space-y-10 text-sm text-white/80 md:text-base">
            <div>
              <h2 className="mb-2 text-lg font-semibold text-[#00ccff]">
                Data usage
              </h2>
              <p>
                We only collect what we need to make the app work—things like event
                joins, stream views, and rough location when you opt in. We&apos;re
                not here to build a creepy profile of you.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-[#ff00f7]">
                Email & contact
              </h2>
              <p>
                If you sign up for updates, we&apos;ll email you about product news
                and drops. You can bail out anytime—one click unsubscribe, no guilt
                trip.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-[#3700ff]">
                Privacy & security
              </h2>
              <p>
                Data lives behind normal modern safeguards (we use Supabase, encrypted
                connections, and sensible session handling). If we change something
                important, we&apos;ll say so on this page.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-[#00ccff]/90">
                Content
              </h2>
              <p>
                We&apos;re built around DJ culture and live sets. Keep it respectful,
                music-focused, and don&apos;t use the platform to be weird at people.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-[#ff00f7]/90">
                What we&apos;re trying to do
              </h2>
              <p>
                Make it easier to find and watch DJ sets—new artists, old favorites,
                all in one place. That&apos;s the whole pitch.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-white">
                Questions?
              </h2>
              <p>
                We&apos;re not trying to trap your data or hide behind legalese. If
                something&apos;s unclear, use the contact page and we&apos;ll actually
                read it.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
