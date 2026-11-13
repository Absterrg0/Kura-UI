"use client";

import * as React from "react";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";

export interface HalftoneProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Fade it out, e.g. once the person has decided. Default true. */
  visible?: boolean;
  /** How far the dots reach across the box from its top-right corner, 0–1. Default 0.62. */
  reach?: number;
}

// One grid, anchored to the corner the light comes from. Dot sizes come in quarter-pixel steps,
// so the field reads as a few crisp rings of equal dots, never as a blur.
const PITCH = 7;
const INSET = 6.5;
const MAX_R = 2;
const MIN_R = 0.75;

/**
 * The dots of a halftone for a box of `width` × `height` px with corner radius `corner`: whole
 * dots only, each fully inside the box and its rounded corner, shrinking with distance from the
 * top-right corner. Returns one SVG path.
 */
export function halftonePath(width: number, height: number, reach: number, corner = 0): string {
  const rx = Math.max(1, reach * width);
  const ry = Math.max(1, reach * 1.42 * height);
  let d = "";
  for (let row = 0; ; row++) {
    const y = INSET + row * PITCH;
    if (y - INSET >= ry || y + MIN_R > height) break;
    for (let col = 0; ; col++) {
      const x = width - INSET - col * PITCH;
      if (width - x - INSET >= rx || x - MIN_R < 0) break;
      const t = Math.hypot((width - INSET - x) / rx, (y - INSET) / ry);
      if (t >= 1) break;
      const r = Math.round(MAX_R * (1 - t ** 1.5) * 4) / 4;
      if (r < MIN_R || x - r < 0 || y + r > height) continue;
      // Inside the rounded corner, with a pixel to spare.
      if (corner > 0 && x > width - corner && y < corner) {
        if (Math.hypot(x - (width - corner), y - corner) + r > corner - 1) continue;
      }
      d += `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
    }
  }
  return d;
}

/**
 * Kura's one light: an ember halftone, dots that shrink as they fade from the top-right corner.
 * It marks the thing that needs a person, and it fades out once they decide. Put it first inside
 * a `relative isolate` box; it sits behind the content.
 */
export function Halftone({
  visible = true,
  reach = 0.62,
  className,
  ref,
  ...props
}: HalftoneProps) {
  const own = React.useRef<HTMLSpanElement>(null);
  // Measured on the client: the dots are laid out in whole pixels for the box they sit in.
  const [box, setBox] = React.useState<{ w: number; h: number; corner: number } | null>(null);
  React.useEffect(() => {
    const el = own.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      const corner = Number.parseFloat(getComputedStyle(el).borderTopRightRadius) || 0;
      setBox((b) => (b && b.w === w && b.h === h && b.corner === corner ? b : { w, h, corner }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const path = React.useMemo(
    () => (box && box.w > 0 && box.h > 0 ? halftonePath(box.w, box.h, reach, box.corner) : ""),
    [box, reach],
  );
  const shown = visible && path !== "";
  return (
    <span
      ref={mergeRefs(own, ref)}
      aria-hidden
      data-slot="halftone"
      data-state={visible ? "visible" : "hidden"}
      className={cn(
        // A fade, not travel, so it stays under reduced motion. It also fades in once measured.
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit] transition-opacity duration-(--kura-duration-slower) ease-kura-snap",
        !shown && "opacity-0",
        className,
      )}
      {...props}
    >
      {path && (
        <svg aria-hidden className="absolute inset-0 size-full fill-kura-ember">
          <path d={path} />
        </svg>
      )}
    </span>
  );
}
