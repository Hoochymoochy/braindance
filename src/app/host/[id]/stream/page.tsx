"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const SetupStream = () => {
  const [step, setStep] = useState(0);
  const [streamUrl, setStreamUrl] = useState("");
  const params = useParams();
  const hostId = params?.id as string;

  const handleSubmit = () => {
    if (streamUrl.startsWith("https://www.youtube.com/")) {
      setStep(2);
    } else {
      alert("Please enter a valid YouTube live URL.");
    }
  };

  useEffect(() => {
    if (step === 2) {
      try {
        fetch(`http://localhost:4000/stream?host=${hostId}&id=1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamUrl }),
        })
          .then((res) => res.json())
          .then((data) => console.log("Stream URL:", data))
          .catch((error) => console.error(error));
      } catch {}
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="bg-zinc-900 rounded-2xl shadow-lg p-8 w-full max-w-xl space-y-6">
        {/* Step 0 – Request Streaming Access */}
        {step === 0 && (
          <>
            <h1 className="text-3xl font-bold mb-4">
              🎤 Request Access to Stream
            </h1>
            <p className="text-zinc-300 mb-4">
              To stream live on YouTube, you must first enable live streaming on
              your account.
            </p>
            <p className="text-zinc-400">
              Once requested, access may take up to <strong>24 hours</strong> to
              be granted.
            </p>
            <a
              href="https://www.youtube.com/verify"
              target="_blank"
              rel="noreferrer"
              className="block text-center bg-blue-600 hover:bg-blue-700 transition-colors text-white py-3 rounded-xl font-semibold mt-6"
            >
              Request Access
            </a>
            <button
              onClick={() => setStep(1)}
              className="mt-4 w-full text-sm text-blue-400 underline hover:text-blue-300"
            >
              I’ve already enabled it — continue
            </button>
          </>
        )}

        {/* Step 1 – Stream URL Input */}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold mb-4">🎥 Set Up Your Stream</h1>
            <p className="text-zinc-300 mb-2">
              Host ID: <span className="text-blue-400">{hostId}</span>
            </p>
            <ol className="list-decimal list-inside text-zinc-400 mt-4 space-y-2">
              <li>
                Go to{" "}
                <a
                  href="https://www.youtube.com/live_dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline"
                >
                  YouTube Live Dashboard
                </a>
              </li>
              <li>Start a new stream and set it to "Public" or "Unlisted"</li>
              <li>
                Copy the <strong>Watch URL</strong> (not the stream key)
              </li>
            </ol>

            <div className="mt-6">
              <label htmlFor="url" className="block text-sm font-medium mb-1">
                YouTube Live URL
              </label>
              <input
                id="url"
                type="text"
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
              />
              <button
                onClick={handleSubmit}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white py-3 rounded-xl font-semibold"
              >
                Continue to Stream
              </button>
            </div>
          </>
        )}

        {/* Step 2 – Live Preview */}
        {step === 2 && (
          <>
            <h1 className="text-3xl font-bold mb-4">🔴 You're Live!</h1>
            <p className="text-zinc-300 mb-4">
              Your stream is ready, Host{" "}
              <span className="text-blue-400">{hostId}</span>!
            </p>
            <div className="aspect-video bg-black border-2 border-zinc-700 rounded-xl overflow-hidden">
              <iframe
                src={streamUrl.replace("watch?v=", "embed/")}
                title="YouTube Live Stream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <p className="text-sm text-zinc-500 mt-3 text-center">
              This is your live preview — you're good to go.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SetupStream;
