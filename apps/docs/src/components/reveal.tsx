"use client";

import * as React from "react";

/**
 * Marks its children in once it scrolls into view: each `[data-reveal-item]` inside rises in,
 * ordered by its `--d` (see `[data-reveal-group]` in globals.css). Under reduced motion the
 * stylesheet shows everything at once.
 */
export function Reveal({
  className,
  children,
  threshold = 0.12,
}: {
  className?: string;
  children: React.ReactNode;
  threshold?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return (
    <div ref={ref} data-reveal-group data-in={inView} className={className}>
      {children}
    </div>
  );
}
