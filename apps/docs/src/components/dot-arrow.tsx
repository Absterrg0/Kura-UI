import type * as React from "react";
import { cn } from "@/lib/cn";

// An arrow set in dots on the logo's pitch, row by row.
const ARROW = ["0000100", "0000010", "1111111", "0000010", "0000100"];

/**
 * An arrow drawn in dots. Inside a `group`, hovering or focusing the group sends a wave of light
 * through it column by column (see `.dot-arrow` in globals.css); under reduced motion it stays put.
 */
export function DotArrow({ className, width = 17 }: { className?: string; width?: number }) {
  return (
    <svg
      viewBox="0 0 28 20"
      aria-hidden
      // Sized inline: a button's own svg sizing would square it otherwise.
      style={{ width, height: (width * 20) / 28 }}
      className={cn("dot-arrow shrink-0 overflow-visible", className)}
    >
      {ARROW.flatMap((row, y) =>
        [...row].map((on, x) =>
          on === "1" ? (
            <circle
              key={`${x}-${y}`}
              cx={2 + x * 4}
              cy={2 + y * 4}
              r={1.45}
              fill="currentColor"
              style={{ "--i": x } as React.CSSProperties}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
