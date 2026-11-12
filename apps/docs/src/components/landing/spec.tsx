import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Wraps a live component on the landing page. On hover (or keyboard focus) a quiet label names
 * the component and links to its page.
 */
export function Spec({
  name,
  slug,
  className,
  children,
}: {
  name: string;
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("group/spec relative min-h-0 min-w-0", className)}>
      {children}
      <Link
        href={`/components/${slug}`}
        className={cn(
          "absolute -top-2.5 right-3 z-20 inline-flex h-5 items-center rounded-md bg-kura-surface-raised px-1.5 font-kura-mono text-[11px] text-kura-fg-muted shadow-kura-sm outline-none",
          "pointer-events-none translate-y-0.5 opacity-0 transition-[opacity,translate,color] duration-150 ease-kura-out hover:text-kura-fg",
          "group-hover/spec:pointer-events-auto group-hover/spec:translate-y-0 group-hover/spec:opacity-100",
          "focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:shadow-kura-focus",
        )}
      >
        &lt;{name} /&gt;
      </Link>
    </div>
  );
}
