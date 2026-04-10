"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/app/lib/utils/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ccff]/40 disabled:opacity-50";

    const variants = {
      default: "bg-[#00ccff] text-black shadow-sm hover:bg-[#ff00f7]/90",
      outline:
        "border border-white/25 bg-transparent text-white/70 hover:border-[#00ccff] hover:text-[#00ccff]",
      ghost:
        "bg-transparent text-white/65 hover:bg-[#3700ff]/20 hover:text-[#ff00f7]",
      link: "bg-transparent text-white/65 underline-offset-4 hover:text-[#00ccff] hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 py-1 text-sm rounded-md",
      lg: "h-12 px-6 py-3 text-lg rounded-lg",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && "opacity-70 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
