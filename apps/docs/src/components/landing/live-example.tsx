"use client";

import * as React from "react";
import { examples } from "@/generated/examples";

/**
 * Renders a generated example by slug and export name, with no stage around it. With `lazy`, the
 * example mounts only once it nears the viewport, so long grids of live components stay cheap.
 */
export function LiveExample({
  slug,
  name,
  lazy = false,
}: {
  slug: string;
  name: string;
  lazy?: boolean;
}) {
  const Example = examples[slug]?.[name];
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(!lazy);
  React.useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  if (!Example) return null;
  if (!visible) return <div ref={ref} className="h-full min-h-40 w-full" />;
  return <Example />;
}
