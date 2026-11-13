import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/cn";
import { DotArrow } from "./dot-arrow";
import { siteButton } from "./site-button";

/**
 * The site's primary call to action: the ink keycap with a dot arrow. With `ring`, a dotted rim
 * sits around it and a short run of lit dots travels the rim, the "running" light of the status
 * glyph at button scale. `meta` is a quiet figure set before the arrow (a count, a version).
 */
export function CtaLink({
  href,
  children,
  meta,
  size = "lg",
  ring = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
  size?: "sm" | "lg";
  ring?: boolean;
  className?: string;
}) {
  const link = (
    <Link
      href={href}
      className={siteButton({
        size,
        className: cn(
          "group/cta relative gap-2.5",
          size === "lg" ? "h-11 rounded-[12px] pr-4 pl-5 text-[14.5px]" : "pr-2.5 pl-3",
          !ring && className,
        ),
      })}
    >
      {children}
      {meta != null && (
        <span className="-mr-0.5 font-kura-mono text-[11.5px] tabular-nums opacity-55">{meta}</span>
      )}
      <DotArrow width={size === "lg" ? 18 : 15} />
    </Link>
  );
  if (!ring) return link;
  return (
    <span className={cn("cta-ring relative inline-flex p-[7px]", className)}>
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <rect className="cta-ring-base" pathLength={200} rx="18" />
        <rect className="cta-ring-tail" pathLength={200} rx="18" />
        <rect className="cta-ring-head" pathLength={200} rx="18" />
      </svg>
      {link}
    </span>
  );
}
