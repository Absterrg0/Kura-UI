import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Wraps a live component in the landing hero. On hover (or when `reveal` is on) it outlines the
 * component and names it, linking to its page: every pixel of the hero is a Kura component.
 */
export function Specimen({
  name,
  slug,
  reveal,
  className,
  children,
}: {
  name: string;
  slug: string;
  reveal: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-reveal={reveal || undefined}
      className={cn("group/specimen relative min-w-0", className)}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-px rounded-[15px] shadow-[0_0_0_1.5px_var(--kura-accent)] transition-opacity duration-150",
          "opacity-0 group-hover/specimen:opacity-100 group-data-[reveal]/specimen:opacity-100",
        )}
      />
      <Link
        href={`/components/${slug}`}
        className={cn(
          "absolute -top-2.5 left-3 z-20 inline-flex h-5 items-center gap-1 rounded-full bg-kura-accent px-2 font-kura-mono text-[11px] text-kura-accent-fg shadow-kura-sm transition-[opacity,translate] duration-150",
          "pointer-events-none translate-y-0.5 opacity-0 group-hover/specimen:pointer-events-auto group-hover/specimen:translate-y-0 group-hover/specimen:opacity-100",
          "group-data-[reveal]/specimen:pointer-events-auto group-data-[reveal]/specimen:translate-y-0 group-data-[reveal]/specimen:opacity-100",
          "focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100",
        )}
      >
        &lt;{name} /&gt;
      </Link>
    </div>
  );
}
