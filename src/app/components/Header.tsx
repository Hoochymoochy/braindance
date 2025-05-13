"use client";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { BrainLogo } from "@/app/components/Brain-logo";

export default function Header() {
  return (
    <header className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <BrainLogo className="h-8 w-8 text-thermal-hot" />
          <span className="text-xl font-bold bg-gradient-to-r from-thermal-hot via-thermal-warm to-thermal-neutral bg-clip-text text-transparent">
            braindance
          </span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm text-thermal-neutral hover:text-thermal-hot transition-colors"
          >
            Home
          </Link>
          <Link
            href="/events"
            className="text-sm text-thermal-neutral hover:text-thermal-hot transition-colors"
          >
            Events
          </Link>
          <Link
            href="#"
            className="text-sm text-thermal-neutral hover:text-thermal-hot transition-colors"
          >
            About
          </Link>
          <Button
            variant="ghost"
            className="text-sm text-thermal-neutral hover:text-thermal-hot hover:bg-black/50"
          >
            Sign In
          </Button>
        </nav>
        <Button
          // variant="ghost"
          size="icon"
          className="md:hidden text-thermal-neutral"
        >
          <span className="sr-only">Menu</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </div>
    </header>
  );
}
