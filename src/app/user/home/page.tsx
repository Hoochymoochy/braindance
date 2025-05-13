"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/app/components/Button";
import { ArrowRight, Flame, Zap } from "lucide-react";
import { BrainLogo } from "@/app/components/Brain-logo";

export default function Home() {
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
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block p-1 mb-6 bg-gradient-to-r from-thermal-hot via-thermal-warm to-thermal-neutral rounded-full">
              <div className="bg-black px-4 py-1 rounded-full">
                <span className="text-sm font-medium text-thermal-neutral">
                  Introducing Braindance
                </span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-thermal-hot via-thermal-warm to-thermal-neutral bg-clip-text text-transparent">
              Experience the future of neural interfaces
            </h1>
            <p className="text-lg md:text-xl text-thermal-neutral mb-8">
              A minimal, powerful platform for exploring the depths of
              consciousness and digital reality.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="w-full sm:w-auto bg-thermal-hot hover:bg-thermal-warm text-black border-0 font-semibold">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto border-thermal-neutral text-thermal-neutral hover:border-thermal-hot hover:text-thermal-hot"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-black p-8 rounded-xl border border-thermal-neutral/20 hover:border-thermal-hot/50 transition-colors group">
              <div className="w-12 h-12 bg-thermal-hot rounded-lg flex items-center justify-center mb-6 group-hover:bg-thermal-hot/80 transition-colors">
                <Flame className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-thermal-hot mb-3">
                Thermal Perception
              </h3>
              <p className="text-thermal-neutral">
                Experience reality through advanced thermal filtering
                technology, revealing patterns invisible to the naked eye.
              </p>
            </div>
            <div className="bg-black p-8 rounded-xl border border-thermal-neutral/20 hover:border-thermal-warm/50 transition-colors group">
              <div className="w-12 h-12 bg-thermal-warm rounded-lg flex items-center justify-center mb-6 group-hover:bg-thermal-warm/80 transition-colors">
                <BrainLogo className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-thermal-warm mb-3">
                Neural Integration
              </h3>
              <p className="text-thermal-neutral">
                Seamlessly connect your consciousness to digital environments
                with our proprietary neural interface.
              </p>
            </div>
            <div className="bg-black p-8 rounded-xl border border-thermal-neutral/20 hover:border-thermal-neutral/50 transition-colors group">
              <div className="w-12 h-12 bg-thermal-neutral rounded-lg flex items-center justify-center mb-6 group-hover:bg-thermal-neutral/80 transition-colors">
                <Zap className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-thermal-neutral mb-3">
                Immersive Reality
              </h3>
              <p className="text-thermal-neutral">
                Dive into fully realized digital worlds with sensory feedback
                that feels more real than reality itself.
              </p>
            </div>
          </div>
        </section>

        {/* Events Preview Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-thermal-hot">
              Featured Events
            </h2>
            <Link
              href="/events"
              className="flex items-center text-thermal-neutral hover:text-thermal-hot transition-colors"
            >
              View all events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-black border border-thermal-hot/30 rounded-lg overflow-hidden group hover:border-thermal-hot/70 transition-all duration-300">
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="/images/event1.png"
                    alt="Neural Interface Demo"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute top-3 left-3 bg-thermal-hot text-black px-3 py-1 rounded-full text-xs font-semibold">
                  LIVE
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-white mb-1">
                  Neural Interface Demo
                </h3>
                <p className="text-thermal-neutral text-sm mb-2">
                  May 20, 2025 • San Francisco
                </p>
                <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                  A live demonstration of our neural interface technology.
                </p>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="bg-thermal-hot hover:bg-thermal-warm text-black font-medium"
                  >
                    Join
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-black border border-thermal-hot/30 rounded-lg overflow-hidden group hover:border-thermal-hot/70 transition-all duration-300">
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="/images/event1.png"
                    alt="Digital Consciousness Workshop"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute top-3 left-3 bg-thermal-hot text-black px-3 py-1 rounded-full text-xs font-semibold">
                  LIVE
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-white mb-1">
                  Digital Consciousness Workshop
                </h3>
                <p className="text-thermal-neutral text-sm mb-2">
                  June 1, 2025 • Chicago
                </p>
                <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                  Learn about the future of digital consciousness.
                </p>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="bg-thermal-hot hover:bg-thermal-warm text-black font-medium"
                  >
                    Join
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-black border border-thermal-hot/30 rounded-lg overflow-hidden group hover:border-thermal-hot/70 transition-all duration-300">
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="/images/event1.png"
                    alt="Thermal Perception Conference"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-white mb-1">
                  Thermal Perception Conference
                </h3>
                <p className="text-thermal-neutral text-sm mb-2">
                  June 15, 2025 • Boston
                </p>
                <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                  A conference on thermal perception technology.
                </p>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="bg-thermal-hot hover:bg-thermal-warm text-black font-medium"
                  >
                    Join
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="relative overflow-hidden rounded-xl p-8 md:p-12 border border-thermal-neutral/20">
            <div className="absolute inset-0 bg-gradient-radial from-thermal-hot/20 via-transparent to-transparent"></div>
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-thermal-hot via-thermal-warm to-thermal-neutral bg-clip-text text-transparent">
                Ready to experience braindance?
              </h2>
              <p className="text-lg text-thermal-neutral mb-8">
                Join our community of explorers and experience the next
                evolution of digital consciousness.
              </p>
              <Button className="bg-thermal-hot hover:bg-thermal-warm text-black font-semibold border-0">
                Join the Waitlist
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
