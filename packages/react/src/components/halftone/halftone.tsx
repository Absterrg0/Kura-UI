import type * as React from "react";
import { cn } from "../../lib/cn";

export interface HalftoneProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Fade it out, e.g. once the person has decided. Default true. */
  visible?: boolean;
  /** How far the dots reach across the box from its top-right corner, 0–1. Default 0.62. */
  reach?: number;
}

// Three sizes of dot on one grid. Each smaller size reaches further from the corner, so the dots
// only ever shrink as they move away: a halftone, with no wash behind it.
const RINGS = [
  { r: 1.7, stops: "#000 0%, #000 18%, transparent 38%" },
  { r: 1.2, stops: "#000 0%, #000 38%, transparent 58%" },
  { r: 0.7, stops: "#000 0%, #000 56%, transparent 80%" },
] as const;

/**
 * Kura's one light: an ember halftone, dots that shrink as they fade from the top-right corner.
 * It marks the thing that needs a person, and it fades out once they decide. Put it first inside
 * a `relative isolate` box; it sits behind the content.
 */
export function Halftone({ visible = true, reach = 0.62, className, ...props }: HalftoneProps) {
  const size = `${Math.round(reach * 100)}% ${Math.round(reach * 142)}%`;
  return (
    <span
      aria-hidden
      data-slot="halftone"
      data-state={visible ? "visible" : "hidden"}
      className={cn(
        // A fade, not travel, so it stays under reduced motion.
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit] transition-opacity duration-(--kura-duration-slower) ease-kura-snap",
        !visible && "opacity-0",
        className,
      )}
      {...props}
    >
      {RINGS.map((ring) => {
        const mask = `radial-gradient(${size} at 100% 0%, ${ring.stops})`;
        return (
          <span
            key={ring.r}
            className="kura-dots absolute inset-0"
            style={
              {
                // Anchored to the corner the light comes from, so its dots are never cut.
                backgroundPosition: "right 3px top 3px",
                "--kura-dots-color": "var(--kura-ember)",
                "--kura-dots-r": `${ring.r}px`,
                "--kura-dots-pitch": "7px",
                maskImage: mask,
                WebkitMaskImage: mask,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
