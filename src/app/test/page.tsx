"use client";

import React from "react";
import ColorBends from "@/components/ColorBends";

/**
 * Screen Recording Template (Web Version)
 * Pure background for easy recording
 * 
 * Usage:
 * 1. Place this in app/record/page.tsx
 * 2. Run dev server: npm run dev
 * 3. Open http://localhost:3000/record
 * 4. Use a screen recording tool (OBS, QuickTime, etc.)
 */
export default function RecordingPage() {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-black">
      {/* Full-screen ColorBends background */}
      <div className="absolute inset-0 w-full h-full">
        <ColorBends
          rotation={65}
          speed={0.25}
          colors={["#00ccff", "#ff00f7", "#3700ff", "#7a7a7a"]}
          transparent={false}
          autoRotate={0.3}
          scale={1.5}
          frequency={1}
          warpStrength={0}
          mouseInfluence={0}
          parallax={0}
          noise={0}
        />
      </div>

      {/* Optional: Center text overlay (remove if not needed) */}
      {/* <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-4xl font-bold text-white/50">Recording...</h1>
      </div> */}
    </div>
  );
}