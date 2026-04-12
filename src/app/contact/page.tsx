"use client";

import React, { useState } from "react";
import { Mail } from "lucide-react";
import { addContact } from "@/app/lib/utils/contact";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addContact(email, message);
    setSubmitted(true);
    setEmail("");
    setMessage("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl p-10 glass-bends">
          <h1 className="mb-6 text-4xl font-bold text-gradient-bends sm:text-5xl">
            Contact
          </h1>
          <p className="mb-8 text-base text-white/80">
            DJs, venues, random questions, whatever. Leave your email and a message
            and we&apos;ll get back when we can.
          </p>

          {submitted ? (
            <div className="text-center text-[#00ccff]">
              <Mail className="mx-auto mb-4 h-10 w-10" />
              <h2 className="mb-2 text-2xl font-bold">Sent</h2>
              <p className="text-white/65">
                We got your message. You&apos;ll hear from us if a reply makes sense.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-bends"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What do you need?"
                required
                rows={6}
                className="input-bends min-h-[140px] resize-y py-3"
              />
              <button
                type="submit"
                className="flex items-center gap-2 self-end rounded-md bg-[#3700ff] px-5 py-2 text-white shadow transition-[background-color,box-shadow] duration-bends-fast ease-bends hover:bg-[#ff00f7]/90"
              >
                Send <Mail className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
