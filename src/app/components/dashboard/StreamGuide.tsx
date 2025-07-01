"use client";

import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import Link from "next/link";

const StreamGuide: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mb-4">
      {/* Floating ? Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
        >
          <HelpCircle size={16} />
          How do I stream?
        </button>
      )}

      {/* Guide Panel */}
      {open && (
        <div className="rounded-2xl p-6 bg-black/40 border border-white/10 text-white space-y-4 mt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">🎥 Stream Setup Guide</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-white/70">
            Bring your event to life with a livestream in just a few steps.
          </p>

          <ol className="list-decimal list-inside space-y-3 text-white/90">
            <li>
              <strong>Activate YouTube Streaming</strong><br />
              Go to{" "}
              <Link href="https://studio.youtube.com/" className="underline text-blue-400" target="_blank">
                YouTube Studio
              </Link>, click <code>Go Live</code>, and wait 24h if it's your first time.
            </li>

            <li>
              <strong>Set Up OBS</strong><br />
              Download from{" "}
              <Link href="https://obsproject.com/" className="underline text-blue-400" target="_blank">
                obsproject.com
              </Link>, add webcam + mic, and paste your YouTube stream key in OBS → Settings → Stream.
            </li>

            <li>
              <strong>Connect Your Stream</strong><br />
              Edit your event here on the dashboard and paste your YouTube link into the Stream URL field.
            </li>

            <li>
              <strong>Go Live and Dance</strong><br />
              Your event will show in <em>Live Streams</em> once live 🎶🔥
            </li>
          </ol>

          <div className="text-sm text-white/60 pt-2">
            Bonus overlays? Try{" "}
            <Link href="https://www.canva.com/" className="underline text-blue-400" target="_blank">
              Canva
            </Link>{" "}
            or{" "}
            <Link href="https://streamelements.com/" className="underline text-blue-400" target="_blank">
              StreamElements
            </Link>.
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamGuide;
