// src/components/ui/button.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
};

export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-xl bg-brand-to px-4 py-2 text-zinc-950 transition hover:bg-brand-via/85 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
