"use client";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { BrainLogo } from "@/app/components/Brain-logo";

export default function Header() {
  return (
    <footer className="border-b border-thermal-neutral/10">
      <div className="container mx-auto px-4 py-7">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <BrainLogo className="h-6 w-6 text-thermal-hot" />
            <span className="text-lg font-bold ">braindance</span>
          </div>
          <div className="flex space-x-6">
            <Link href="/" className="text-sm">
              Home
            </Link>
            <Link href="/events" className="text-sm">
              Events
            </Link>
            <Link href="/about" className="text-sm">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
