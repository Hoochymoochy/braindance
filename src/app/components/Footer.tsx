"use client";

import Link from "next/link";
import { BrainLogo } from "@/app/components/Brain-logo";

export default function Footer() {
  return (
    <footer className="border-t border-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-black/80 backdrop-blur-md shadow-[0_-2px_15px_rgba(236,72,153,0.2)]">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <BrainLogo withText={false} className="h-6 w-6 text-pink-400" />
            <span className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold tracking-wide uppercase">
              Braindance
            </span>
          </div>

          {/* Links */}
          <div className="flex space-x-6">
            <Link
              href="/policy"
              className="text-sm text-gray-400 hover:text-pink-400 transition-colors"
            >
              Policy
            </Link>
            <Link
              href="/feedback"
              className="text-sm text-gray-400 hover:text-pink-400 transition-colors"
            >
              Feedback
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-400 hover:text-pink-400 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="mt-8 text-center md:text-left">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Braindance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
