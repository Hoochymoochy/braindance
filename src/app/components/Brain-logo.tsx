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
        <Brain size={size} className="text-thermal-hot" />
        <div className="absolute inset-0 blur-sm opacity-50 text-thermal-hot">
          <Brain size={size} />
        </div>
      </div>

      {withText && (
        <span className="text-xl font-bold bg-gradient-to-r from-thermal-hot via-thermal-warm to-thermal-neutral bg-clip-text text-transparent">
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
        <Brain size={size} className="text-thermal-hot animate-pulse" />
        <div
          className="absolute inset-0 blur-sm opacity-50 text-thermal-hot animate-pulse"
          style={{ animationDelay: "0.5s" }}
        >
          <Brain size={size} />
        </div>
      </div>

      {withText && (
        <span className="text-xl font-bold bg-gradient-to-r from-thermal-hot via-thermal-warm to-thermal-neutral bg-clip-text text-transparent">
          braindance
        </span>
      )}
    </div>
  );
};
