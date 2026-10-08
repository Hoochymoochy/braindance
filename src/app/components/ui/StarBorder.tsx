"use client";

import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type StarBorderProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
  /** Main sparkle color (fades to transparent). */
  color?: string;
  speed?: CSSProperties["animationDuration"];
  thickness?: number;
} & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "children" | "className" | "color"
>;

/**
 * Animated star / sparkle border (React Bits Star Border).
 * @see https://reactbits.dev/animations/star-border
 */
export function StarBorder<T extends ElementType = "div">({
  as,
  className,
  contentClassName,
  color = "var(--brand-via)",
  speed = "6s",
  thickness = 1,
  children,
  style,
  ...rest
}: StarBorderProps<T>) {
  const Component = (as || "div") as ElementType;

  return (
    <Component
      className={cn(
        "relative block w-full overflow-hidden rounded-xl",
        className
      )}
      style={{
        padding: `${thickness}px`,
        ...(style as CSSProperties | undefined),
      }}
      {...rest}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-11px] right-[-250%] z-0 h-1/2 w-[300%] rounded-full opacity-70 animate-star-movement-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-10px] left-[-250%] z-0 h-1/2 w-[300%] rounded-full opacity-70 animate-star-movement-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className={cn("relative z-[1] rounded-[inherit]", contentClassName)}>
        {children}
      </div>
    </Component>
  );
}
