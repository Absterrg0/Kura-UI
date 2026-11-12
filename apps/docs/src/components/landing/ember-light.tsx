import type * as React from "react";
import { cn } from "@/lib/cn";

// Three sizes of dot on one grid; each smaller size reaches further from the source, so the dots
// only ever shrink as they move away. No wash behind them.
const RINGS = [
  { r: 2.3, stops: "#000 0%, #000 12%, transparent 32%" },
  { r: 1.6, stops: "#000 0%, #000 32%, transparent 54%" },
  { r: 0.95, stops: "#000 0%, #000 52%, transparent 78%" },
] as const;

/**
 * The site's one brand light: an ember halftone rising from behind whatever sits below it (the
 * hero stage, the closing mark). The same dots as the library's Halftone, at page scale. Static.
 */
export function EmberLight({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      data-slot="ember-light"
      className={cn(
        "pointer-events-none absolute inset-x-0 mx-auto h-[200px] w-full max-w-[1180px] select-none",
        className,
      )}
    >
      {RINGS.map((ring) => {
        const mask = `radial-gradient(52% 100% at 50% 100%, ${ring.stops})`;
        return (
          <div
            key={ring.r}
            className="kura-dots absolute inset-0"
            style={
              {
                backgroundPosition: "center bottom",
                "--kura-dots-color": "var(--kura-ember)",
                "--kura-dots-r": `${ring.r}px`,
                "--kura-dots-pitch": "9px",
                maskImage: mask,
                WebkitMaskImage: mask,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
