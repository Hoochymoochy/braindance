"use client";

import React, { useEffect, useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { addContact } from "@/app/lib/utils/contact";

export default function ContactPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addContact(email, message);
    setSubmitted(true);
    setEmail("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-black thermal-background text-white relative overflow-hidden">
      <div
        className="thermal-cursor"
        style={{ left: `${mousePosition.x}px`, top: `${mousePosition.y}px` }}
      />

      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto border border-purple-500/30 bg-black/60 backdrop-blur-md rounded-2xl p-10 shadow-[0_0_15px_rgba(168,85,247,0.25)]">

          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
            Hit Us Up
          </h1>
          <p className="text-base text-gray-300 mb-8">
            Whether you&apos;re a DJ, venue, dreamer, or supporter—drop a message and we’ll vibe with you soon.
          </p>


          {submitted ? (
            <div className="text-center text-purple-400">
              <Sparkles className="w-10 h-10 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Message received!</h2>
              <p className="text-gray-400">We’ll reach out soon. Big love from the Braindance realm.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="bg-black border border-purple-500/30 rounded-md px-4 py-2 text-white placeholder-gray-400"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What’s on your mind?"
                required
                rows={6}
                className="bg-black border border-purple-500/30 rounded-md px-4 py-3 text-white placeholder-gray-400"
              />
              <button
                type="submit"
                className="self-end flex items-center gap-2 bg-purple-600 hover:bg-pink-600 px-5 py-2 rounded-md transition text-white shadow"
              >
                Send Message <Mail className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
