import type * as React from "react";
import { cn } from "../../lib/cn";

export interface SpinnerProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Visual size. `sm` 13px, `md` 15px, `lg` 20px. */
  size?: "sm" | "md" | "lg";
  /** Accessible label announced to screen readers. Pass `null` when a parent already announces loading. */
  label?: string | null;
}

const sizes = { sm: "size-[13px]", md: "size-[15px]", lg: "size-5" } as const;

// Eight dots on a true circle in a 15-unit box, clockwise from twelve o'clock: the same ring as
// the running status glyph.
const RING: readonly (readonly [number, number])[] = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return [7.5 + Math.sin(a) * 5.4, 7.5 - Math.cos(a) * 5.4] as const;
});

/**
 * The Kura spinner: a ring of dots with a light chasing round it (the same motion as a running
 * status glyph). Inherits `currentColor`. Under reduced motion it holds still, as the glyph does:
 * the light rests on a quarter of the ring.
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
      <svg aria-hidden viewBox="0 0 15 15" className="size-full">
        {RING.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={1.25}
            style={{ animationDelay: `${i * 150}ms` }}
            className={
              i < 3
                ? "animate-kura-chase fill-current opacity-20 motion-reduce:animate-none motion-reduce:opacity-100"
                : "animate-kura-chase fill-current opacity-20 motion-reduce:animate-none"
            }
          />
        ))}
      </svg>
    </span>
  );
}
