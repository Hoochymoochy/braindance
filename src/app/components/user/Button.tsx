// src/components/ui/button.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
};

export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-xl bg-[#3700ff] px-4 py-2 text-white transition hover:bg-[#ff00f7]/85 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
