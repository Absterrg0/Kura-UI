import type * as React from "react";
import { cn } from "../../lib/cn";

export interface SpinnerProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Visual size. `sm` 12px, `md` 16px, `lg` 20px. */
  size?: "sm" | "md" | "lg";
  /** Accessible label announced to screen readers. Pass `null` when a parent already announces loading. */
  label?: string | null;
}

const sizes = { sm: "size-3", md: "size-4", lg: "size-5" } as const;

/**
 * A quiet ring spinner: a faint track with a quarter arc turning over it. Inherits
 * `currentColor`. Under reduced motion the arc stops turning and pulses instead.
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
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        fill="none"
        className="size-full animate-kura-spin motion-reduce:animate-kura-pulse"
      >
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.75" opacity="0.2" />
        <path
          d="M8 1.75a6.25 6.25 0 0 1 6.25 6.25"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
