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
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thermal-hot/50 disabled:opacity-50";

    const variants = {
      default: "bg-thermal-hot hover:bg-thermal-warm text-black shadow-sm",
      outline:
        "border border-thermal-neutral text-thermal-neutral hover:border-thermal-hot hover:text-thermal-hot bg-transparent",
      ghost:
        "text-thermal-neutral hover:text-thermal-hot hover:bg-thermal-hot/10 bg-transparent",
      link: "text-thermal-neutral underline-offset-4 hover:underline hover:text-thermal-hot bg-transparent",
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
