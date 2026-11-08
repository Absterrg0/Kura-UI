import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/cn";

/** A link drawn as one swash of the brush. The stroke sits behind the label, so text stays crisp. */
export function SwashLink({
  href,
  tone = "ink",
  size = "md",
  className,
  children,
}: {
  href: string;
  tone?: "ink" | "shu";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative isolate inline-flex items-center gap-2 font-medium outline-none transition-[translate,rotate] duration-150 focus-visible:outline-2 active:translate-y-px active:rotate-[-0.4deg]",
        size === "md" ? "h-12 px-8 text-[15px]" : "h-10 px-7 text-[13.5px]",
        tone === "ink" ? "text-kura-fg-inverted" : "text-kura-accent-fg",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "swash absolute inset-0 -z-10 transition-colors duration-150",
          tone === "ink"
            ? "bg-kura-ink group-hover:bg-kura-ink-hover"
            : "bg-kura-accent group-hover:bg-kura-accent-hover",
        )}
      />
      {children}
    </Link>
  );
}
