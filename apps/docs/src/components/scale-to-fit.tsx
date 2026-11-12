"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Lays its child out at least `width` px wide and scales it down to the container (never up), so a
 * live component keeps its real layout in a smaller card instead of being cropped mid-control.
 * The wrapper takes the scaled height, so nothing below it jumps.
 */
export function ScaleToFit({
  width,
  className,
  children,
}: {
  width: number;
  className?: string;
  children: React.ReactNode;
}) {
  const outer = React.useRef<HTMLDivElement>(null);
  const inner = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [layoutWidth, setLayoutWidth] = React.useState(width);
  const [height, setHeight] = React.useState<number | undefined>(undefined);
  React.useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const w = Math.max(o.clientWidth, width);
      const s = o.clientWidth / w;
      setLayoutWidth(w);
      setScale(s);
      setHeight(i.offsetHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={outer} className={cn("relative w-full", className)} style={{ height }}>
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
