"use client";

import Link from "next/link";
import { BrainLogo } from "@/app/components/Brain-logo";

export default function Header() {
  return (
      <header className="border-b border-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-black/80 backdrop-blur-md shadow-[0_-2px_15px_rgba(236,72,153,0.2)]">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <BrainLogo withText={false} className="h-6 w-6 text-pink-400" />
            <span className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold tracking-wide uppercase">
              Braindance
            </span>
          </div>

        {/* Nav Links */}
        <nav className="flex space-x-6 text-sm">
          <Link
            href="/"
            className="text-white hover:text-pink-400 transition duration-200"
          >
            Home
          </Link>
          <Link
            href="/events"
            className="text-white hover:text-pink-400 transition duration-200"
          >
            Events
          </Link>
          <Link
            href="/about"
            className="text-white hover:text-pink-400 transition duration-200"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
