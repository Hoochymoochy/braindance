"use client";
import Link from "next/link";
import { BrainLogo } from "@/app/components/Brain-logo";

export default function Footer() {
  return (
    <footer className="border-t border-thermal-neutral/10">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <BrainLogo withText={false} className="h-6 w-6 text-thermal-hot" />
          </div>
          <div className="flex space-x-6">
            <Link
              href="#"
              className="text-sm text-thermal-neutral/70 hover:text-thermal-hot transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-sm text-thermal-neutral/70 hover:text-thermal-hot transition-colors"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="text-sm text-thermal-neutral/70 hover:text-thermal-hot transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
        <div className="mt-8 text-center md:text-left">
          <p className="text-sm text-thermal-neutral/50">
            © {new Date().getFullYear()} Braindance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
