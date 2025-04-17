"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center bg-black border-b border-white/10">
      <h1 className="text-2xl font-bold text-gradient">Braindance</h1>
      <nav>
        <ul className="flex gap-6 text-sm uppercase tracking-wide">
          <li>
            <Link href="/Home" className="hover:text-pink-400">
              Home
            </Link>
          </li>
          <li>
            <Link href="/Event" className="hover:text-pink-400">
              Event
            </Link>
          </li>
          <li>
            <Link href="/Lore" className="hover:text-pink-400">
              Lore
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
