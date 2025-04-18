// src/components/ui/button.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
};

export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-xl bg-pink-600 text-white hover:bg-pink-700 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
