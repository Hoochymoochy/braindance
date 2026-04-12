"use client";

import React, { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { addFeedback } from "@/app/lib/utils/feedback";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addFeedback(message);
    setSubmitted(true);
    setMessage("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl p-10 glass-bends">
          <h1 className="mb-6 text-4xl font-bold text-gradient-bends sm:text-5xl">
            Feedback
          </h1>
          <p className="mb-8 text-base text-white/80">
            Something broken? An idea? Tell us what&apos;s working and what isn&apos;t.
            We read these.
          </p>

          {submitted ? (
            <div className="text-center text-[#ff00f7]">
              <MessageSquare className="mx-auto mb-4 h-10 w-10" />
              <h2 className="mb-2 text-2xl font-bold">Got it</h2>
              <p className="text-white/65">
                Thanks for taking the time. It really does help.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say whatever you want. Bugs, ideas, rants, all fair game."
                required
                rows={6}
                className="input-bends min-h-[140px] resize-y py-3"
              />
              <button
                type="submit"
                className="flex items-center gap-2 self-end rounded-md bg-[#3700ff] px-5 py-2 text-white shadow transition hover:bg-[#ff00f7]/90"
              >
                Send <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
