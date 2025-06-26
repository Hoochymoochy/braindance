"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeftCircle, MessageSquare, Send } from "lucide-react";
import { addFeedback } from "@/app/lib/utils/feedback";
import Link from "next/link";

export default function FeedbackPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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
    await addFeedback(message);
    setSubmitted(true);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-black thermal-background text-white relative overflow-hidden">
      <div
        className="thermal-cursor"
        style={{ left: `${mousePosition.x}px`, top: `${mousePosition.y}px` }}
      />

      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto border border-pink-500/30 bg-black/60 backdrop-blur-md rounded-2xl p-10 shadow-[0_0_15px_rgba(236,72,153,0.25)]">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mb-6">
            We Hear You
          </h1>
          <p className="text-base text-gray-300 mb-8">
            Drop your thoughts, dreams, bugs, or ideas. We tune into every signal that moves Braindance forward.
          </p>

          {submitted ? (
            <div className="text-center text-pink-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Thanks for your feedback!</h2>
              <p className="text-gray-400">You're helping shape the movement. Respect. 🔮</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Let it out. What are you thinking?"
                required
                rows={6}
                className="bg-black border border-pink-500/30 rounded-md px-4 py-3 text-white placeholder-gray-400"
              />
              <button
                type="submit"
                className="self-end flex items-center gap-2 bg-pink-600 hover:bg-purple-600 px-5 py-2 rounded-md transition text-white shadow"
              >
                Send It <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
