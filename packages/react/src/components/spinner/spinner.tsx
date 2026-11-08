import type * as React from "react";
import { cn } from "../../lib/cn";

export interface SpinnerProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Visual size. `sm` 12px, `md` 16px, `lg` 20px. */
  size?: "sm" | "md" | "lg";
  /** Accessible label announced to screen readers. Pass `null` when a parent already announces loading. */
  label?: string | null;
}

const sizes = { sm: "size-3", md: "size-4", lg: "size-5" } as const;

const SEGMENTS = 8;

/**
 * Eight-segment radial spinner. Inherits `currentColor`. Under reduced motion it pulses instead
 * of rotating.
 */
export function Spinner({ size = "md", label = "Loading", className, ...props }: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-flex shrink-0 text-current", sizes[size], className)}
      {...props}
    >
      {label && <span className="sr-only">{label}</span>}
      <span
        aria-hidden
        className="absolute inset-0 animate-kura-spin [animation-timing-function:steps(8)] motion-reduce:animate-kura-pulse"
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className="absolute top-0 left-[calc(50%-0.75px)] h-full w-[1.5px]"
            style={{ transform: `rotate(${(i * 360) / SEGMENTS}deg)` }}
          >
            <span
              className="block h-[30%] w-full rounded-full bg-current"
              style={{ opacity: 0.15 + (0.85 * (i + 1)) / SEGMENTS }}
            />
          </span>
        ))}
      </span>
    </span>
  );
}
