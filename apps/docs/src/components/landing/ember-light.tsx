import type * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Ember light: the one brand light on the site. A few crisp spans of light, staggered like rows
 * of a trace waterfall, shoot out from behind whatever sits on top of it; each has a hot head and
 * a fading tail. Purely decorative and static (no motion to reduce).
 *
 * The light is drawn in a fixed 1600px box, centred, inside a full-bleed frame that fades out
 * towards the viewport edges, so nothing ever stops hard at the edge or the scrollbar.
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

// Hero: a 1600 × 520 box; the stage covers x 180–1420 from y 120 down. The side spans have their
// hot heads hidden just behind the stage edge, so light leaks out from behind it and fades outward.
const HERO: Span[] = [
  { x: -120, y: 176, w: 340, h: 12, dir: "r" },
  { x: -40, y: 222, w: 260, h: 3, dir: "r", o: 0.85 },
  { x: -80, y: 290, w: 300, h: 7, dir: "r", o: 0.6 },
  { x: 1380, y: 158, w: 280, h: 6, dir: "l", o: 0.85 },
  { x: 1380, y: 200, w: 360, h: 14, dir: "l" },
  { x: 1380, y: 276, w: 240, h: 3, dir: "l", o: 0.7 },
  // the lit top edge of the stage
  { x: 430, y: 119, w: 740, h: 2, dir: "c" },
];

// Band: a 1600 × 240 box; light bursts outward from behind the mark at its centre.
const BAND: Span[] = [
  { x: 260, y: 92, w: 500, h: 10, dir: "l" },
  { x: 380, y: 128, w: 380, h: 3, dir: "l", o: 0.8 },
  { x: 320, y: 150, w: 440, h: 6, dir: "l", o: 0.55 },
  { x: 840, y: 84, w: 420, h: 4, dir: "r", o: 0.8 },
  { x: 840, y: 112, w: 520, h: 12, dir: "r" },
  { x: 840, y: 156, w: 360, h: 3, dir: "r", o: 0.6 },
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
        "ember-light pointer-events-none absolute left-1/2 w-screen -translate-x-1/2 select-none overflow-hidden",
        variant === "hero" ? "h-[520px]" : "h-[240px]",
        className,
      )}
    >
      <div className="absolute inset-y-0 left-1/2 w-[1600px] -translate-x-1/2">
        {variant === "hero" ? (
          <>
            <div className="ember-glow" style={{ left: 260, top: 70, width: 1080, height: 100 }} />
            <div
              className="ember-glow ember-glow-wide"
              style={{ left: 0, top: 110, width: 1600, height: 300 }}
            />
          </>
        ) : (
          <div className="ember-glow" style={{ left: 480, top: 20, width: 640, height: 200 }} />
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
    </div>
  );
}
