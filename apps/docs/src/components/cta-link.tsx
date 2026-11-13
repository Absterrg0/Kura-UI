import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/cn";
import { DotArrow } from "./dot-arrow";
import { siteButton } from "./site-button";

/**
 * The site's primary call to action: the ink keycap with a dot arrow that ripples on hover.
 * `meta` is a quiet figure set before the arrow (a count, a version).
 */
export function CtaLink({
  href,
  children,
  meta,
  size = "lg",
  className,
}: {
  href: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={siteButton({
        size,
        className: cn(
          "group/cta relative gap-2.5",
          size === "lg" ? "h-11 rounded-[12px] pr-4 pl-5 text-[14.5px]" : "pr-2.5 pl-3",
          className,
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
}
