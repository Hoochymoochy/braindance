"use client";

import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import Link from "next/link";

const StreamGuide: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mb-4">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm text-zinc-800 transition-all hover:bg-white"
        >
          <HelpCircle size={16} />
          How do I stream?
        </button>
      )}

      {open && (
        <div className="glass-bends-card mt-2 space-y-4 rounded-2xl p-6 text-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gradient-bends">Stream Setup Guide</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 transition hover:text-zinc-900"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-zinc-600">
            Bring your event to life with a livestream in just a few steps.
          </p>

          <ol className="list-decimal list-inside space-y-3 text-zinc-700">
            <li>
              <strong>Activate YouTube Streaming</strong><br />
              Go to{" "}
              <Link href="https://studio.youtube.com/" className="text-[#00ccff] underline hover:text-[#ff00f7]" target="_blank">
                YouTube Studio
              </Link>, click <code>Go Live</code>, and wait 24h if it&apos;s your first time.
            </li>

            <li>
              <strong>Set Up OBS</strong><br />
              Download from{" "}
              <Link href="https://obsproject.com/" className="text-[#00ccff] underline hover:text-[#ff00f7]" target="_blank">
                obsproject.com
              </Link>, add webcam + mic, and paste your YouTube stream key in OBS → Settings → Stream.
            </li>

            <li>
              <strong>Connect Your Stream</strong><br />
              Start your event with the action button and paste your YouTube link into the Stream URL field.
            </li>

            <li>
              <strong>Go Live and Dance</strong><br />
              Your event will show in <em>Live Streams</em> once live
            </li>
          </ol>

          <div className="pt-2 text-sm text-zinc-500">
            Bonus overlays? Try{" "}
            <Link href="https://www.canva.com/" className="text-[#00ccff] underline hover:text-[#ff00f7]" target="_blank">
              Canva
            </Link>{" "}
            or{" "}
            <Link href="https://streamelements.com/" className="text-[#00ccff] underline hover:text-[#ff00f7]" target="_blank">
              StreamElements
            </Link>.
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamGuide;
