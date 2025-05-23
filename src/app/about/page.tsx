"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Radio, Camera, Globe2 } from "lucide-react";
import { Button } from "@/app/components/Button";
import Link from "next/link";

export default function About() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white thermal-background relative overflow-hidden">
      {/* Thermal Cursor */}
      <div
        className="thermal-cursor"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      {/* Hero Banner */}
      <section className="w-full h-[80vh] flex flex-col items-center justify-center text-center px-6b">
        <div className="bg-black p-10 rounded-full border-thermal-hot border-1">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
            About <span className="">Braindance</span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl mb-10 ">
            The ritual begins with sound. Braindance is a streaming platform
            where DJs broadcast live and event photos tell the real story. No
            filters. No faking. Just raw, connected energy.
          </p>
          <Button variant="outline" className="w-full sm:w-auto">
            Explore Braindance
          </Button>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="container mx-auto px-4 py-20 space-y-24">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 bg-black p-10 rounded-xl border-thermal-hot border-1">
            <Radio className="w-14 h-14 mb-4 text-thermal-hot" />
            <h2 className="text-3xl font-bold mb-4">Live Sets, Global Reach</h2>
            <p className="text-thermal-neutral text-lg">
              DJs plug into the grid and stream live to the world. Every set is
              a pulse in the Braindance network — felt simultaneously across
              cities and timezones.
            </p>
          </div>
          <div className="flex-1">
            <div className="w-full h-64 bg-thermal-hot/10 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
          <div className="flex-1 bg-black p-10 rounded-xl border-thermal-hot border-1">
            <Camera className="w-14 h-14 mb-4 text-thermal-warm" />
            <h2 className="text-3xl font-bold mb-4">Live Event Photos</h2>
            <p className="text-thermal-neutral text-lg">
              Events come alive through the lens of the people there. Photos
              from attendees and crew appear in real time — raw, spontaneous,
              and unfiltered. Feel the vibe without being there.
            </p>
          </div>
          <div className="flex-1">
            <div className="w-full h-64 bg-thermal-warm/10 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1  bg-black p-10 rounded-xl border-thermal-hot border-1">
            <Globe2 className="w-14 h-14 mb-4 text-thermal-neutral" />
            <h2 className="text-3xl font-bold mb-4">A Connected Future</h2>
            <p className="text-thermal-neutral text-lg">
              Braindance is just getting started. Right now it’s streams and
              memories. Soon, it’ll be synced energy — movement, interaction,
              and rituals that unlock in real time.
            </p>
          </div>
          <div className="flex-1">
            <div className="w-full h-64 bg-thermal-neutral/10 rounded-xl animate-pulse" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="bg-black p-10  border-thermal-hot border-1">
          <h2 className="text-4xl font-bold mb-6">The Ritual Has Begun</h2>
          <p className="text-lg mb-8 text-thermal-neutral max-w-xl mx-auto">
            Tune in. Capture the moment. Be part of a global experience that’s
            reshaping nightlife from the stream outward.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="text-black font-semibold">
              Join Braindance
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Link href="/events">
              <Button variant="outline">Explore Events</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
