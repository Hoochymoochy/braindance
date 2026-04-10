// components/brain-logo.tsx
"use client";

import React from "react";
import { Brain } from "lucide-react";

interface BrainLogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
}

export const BrainLogo: React.FC<BrainLogoProps> = ({
  size = 24,
  withText = true,
  className = "",
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <Brain size={size} className="text-[#00ccff]" />
        <div className="absolute inset-0 blur-sm opacity-50 text-[#ff00f7]">
          <Brain size={size} />
        </div>
      </div>

      {withText && (
        <span className="bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-xl font-bold text-transparent">
          braindance
        </span>
      )}
    </div>
  );
};

// Animated version with pulsing effect
export const AnimatedBrainLogo: React.FC<BrainLogoProps> = ({
  size = 24,
  withText = true,
  className = "",
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <Brain size={size} className="animate-pulse text-[#00ccff]" />
        <div
          className="absolute inset-0 animate-pulse blur-sm opacity-50 text-[#ff00f7]"
          style={{ animationDelay: "0.5s" }}
        >
          <Brain size={size} />
        </div>
      </div>

      {withText && (
        <span className="bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-xl font-bold text-transparent">
          braindance
        </span>
      )}
    </div>
  );
};
