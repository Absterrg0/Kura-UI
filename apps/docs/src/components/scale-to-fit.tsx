"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Lays its child out at least `width` px wide and scales it down to the container (never up), so a
 * live component keeps its real layout in a smaller card instead of being cropped mid-control.
 * The wrapper takes the scaled height, so nothing below it jumps. Below `minScale` it stops
 * shrinking and lets the rest run off the right edge behind a soft fade (`data-overflow`), so text
 * never becomes unreadably small on a phone.
 */
export function ScaleToFit({
  width,
  minScale = 0,
  className,
  children,
}: {
  width: number;
  minScale?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const outer = React.useRef<HTMLDivElement>(null);
  const inner = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [layoutWidth, setLayoutWidth] = React.useState(width);
  const [height, setHeight] = React.useState<number | undefined>(undefined);
  const [overflow, setOverflow] = React.useState(false);
  React.useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const w = Math.max(o.clientWidth, width);
      const fit = o.clientWidth / w;
      const s = Math.max(fit, Math.min(1, minScale));
      setLayoutWidth(w);
      setScale(s);
      setOverflow(s > fit + 0.001);
      setHeight(i.offsetHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [width, minScale]);
  return (
    <div
      ref={outer}
      data-overflow={overflow || undefined}
      className={cn(
        "relative w-full data-overflow:overflow-hidden data-overflow:[mask-image:linear-gradient(90deg,#000_82%,transparent)]",
        className,
      )}
      style={{ height }}
    >
      <div
        ref={inner}
        className="origin-top-left [&>*]:max-w-none"
        style={{ width: layoutWidth, transform: scale < 1 ? `scale(${scale})` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
