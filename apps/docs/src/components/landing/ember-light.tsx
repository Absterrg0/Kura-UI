import type * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Ember light: the one brand light on the site. A few crisp spans of light, staggered like rows
 * of a trace waterfall, shoot out from behind whatever sits on top of it; each has a hot head and
 * a fading tail. Purely decorative and static (no motion to reduce).
 */
type Span = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Which end is the hot head: l(eft), r(ight), or c(entre) for a symmetric line. */
  dir: "l" | "r" | "c";
  o?: number;
};

// Hero: a 1600 × 560 box; the stage covers x 180–1420 from y 120 down.
const HERO: Span[] = [
  { x: 10, y: 168, w: 430, h: 10, dir: "l" },
  { x: 96, y: 210, w: 350, h: 4, dir: "l", o: 0.9 },
  { x: -10, y: 252, w: 520, h: 16, dir: "l" },
  { x: 132, y: 318, w: 330, h: 5, dir: "l", o: 0.8 },
  { x: 54, y: 396, w: 430, h: 9, dir: "l", o: 0.55 },
  { x: 1172, y: 148, w: 420, h: 7, dir: "r", o: 0.9 },
  { x: 1130, y: 190, w: 490, h: 18, dir: "r" },
  { x: 1214, y: 262, w: 300, h: 4, dir: "r", o: 0.85 },
  { x: 1150, y: 304, w: 430, h: 11, dir: "r", o: 0.8 },
  { x: 1236, y: 384, w: 330, h: 5, dir: "r", o: 0.5 },
  // the lit top edge of the stage
  { x: 470, y: 119, w: 660, h: 2, dir: "c" },
];

// Band: a 1600 × 300 box; light bursts outward from a line at its centre.
const BAND: Span[] = [
  { x: 520, y: 148, w: 560, h: 2, dir: "c" },
  { x: 190, y: 116, w: 560, h: 8, dir: "l", o: 0.9 },
  { x: 300, y: 152, w: 470, h: 14, dir: "l" },
  { x: 250, y: 196, w: 400, h: 4, dir: "l", o: 0.8 },
  { x: 860, y: 124, w: 540, h: 10, dir: "r" },
  { x: 840, y: 166, w: 450, h: 4, dir: "r", o: 0.85 },
  { x: 960, y: 196, w: 380, h: 12, dir: "r", o: 0.75 },
];

export function EmberLight({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "band";
  className?: string;
}) {
  const spans = variant === "hero" ? HERO : BAND;
  return (
    <div
      aria-hidden
      data-slot="ember-light"
      className={cn(
        "ember-light pointer-events-none absolute left-1/2 w-[1600px] -translate-x-1/2 select-none",
        variant === "hero" ? "h-[560px]" : "h-[300px]",
        className,
      )}
    >
      {variant === "hero" ? (
        <>
          <div className="ember-glow" style={{ left: 200, top: 64, width: 1200, height: 112 }} />
          <div
            className="ember-glow opacity-70"
            style={{ left: 0, top: 120, width: 1600, height: 380 }}
          />
        </>
      ) : (
        <div className="ember-glow" style={{ left: 300, top: 60, width: 1000, height: 180 }} />
      )}
      {spans.map((s) => (
        <span
          key={`${s.x}-${s.y}`}
          className="ember-span"
          data-dir={s.dir}
          style={
            {
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              "--o": s.o ?? 1,
              "--dir": s.dir === "l" ? "270deg" : "90deg",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
