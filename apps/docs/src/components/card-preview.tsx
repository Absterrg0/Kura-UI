"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * The live preview area of a component card. Centres the component when it fits; when it is taller
 * than the stage it anchors to the top and is cut by the stage's edge instead.
 */
export function CardPreview({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current;
    const inner = el?.firstElementChild;
    if (!el || !inner || typeof ResizeObserver === "undefined") return;
    const check = () => setOverflow(inner.scrollHeight > el.clientHeight - 32);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      inert
      data-overflow={overflow || undefined}
      className={cn(
        "relative flex flex-col justify-center overflow-hidden px-6 py-4 data-overflow:justify-start data-overflow:pt-6 data-overflow:pb-0",
        className,
      )}
    >
      <div className="w-full">{children}</div>
    </div>
  );
}
