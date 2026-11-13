import type * as React from "react";
import { cn } from "../../lib/cn";

export interface SpinnerProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Visual size. `sm` 13px, `md` 15px, `lg` 20px. */
  size?: "sm" | "md" | "lg";
  /** Accessible label announced to screen readers. Pass `null` when a parent already announces loading. */
  label?: string | null;
}

const sizes = { sm: "size-[13px]", md: "size-[15px]", lg: "size-5" } as const;

// The ring of a 5×5 dot matrix, clockwise from the top.
// biome-ignore format: a 5×5 ring reads better as two rows of pairs
const RING: readonly (readonly [number, number])[] = [
  [1, 0], [2, 0], [3, 0], [4, 1], [4, 2], [4, 3],
  [3, 4], [2, 4], [1, 4], [0, 3], [0, 2], [0, 1],
];

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
            key={`${x}-${y}`}
            cx={1.5 + x * 3}
            cy={1.5 + y * 3}
            r={1.1}
            style={{ animationDelay: `${i * 100}ms` }}
            className={
              i < 4
                ? "animate-kura-chase fill-current opacity-20 motion-reduce:animate-none motion-reduce:opacity-100"
                : "animate-kura-chase fill-current opacity-20 motion-reduce:animate-none"
            }
          />
        ))}
      </svg>
    </span>
  );
}
