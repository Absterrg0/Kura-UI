import type * as React from "react";
import { cn } from "../../lib/cn";

export interface ShimmerTextProps extends React.HTMLAttributes<HTMLElement> {
  ref?: React.Ref<HTMLElement>;
  /** The text to shimmer, e.g. "Thinking…". Plain text reads best; inline elements are allowed. */
  children: React.ReactNode;
  /** Animate the sweep. Set false when the work is done to settle into plain text. Default true. */
  active?: boolean;
  /** Seconds for one full sweep. Default 2. Shorter feels urgent; keep it between 1.5 and 3. */
  duration?: number;
  /** Width of the bright band as a percentage of the text width. Default 30. */
  spread?: number;
  /** Render as another element, e.g. "p" or "div". Default "span". */
  as?: "span" | "p" | "div" | "strong" | "em";
}

/**
 * A sweep of light over ink across text — the canonical "Thinking…" / "Searching the web…"
 * affordance. The sweep eases in and out, so it rests between passes. Pure CSS (no JS animation loop), server-component safe, and static under
 * prefers-reduced-motion.
 */
export function ShimmerText({
  children,
  active = true,
  duration = 2,
  spread = 30,
  as = "span",
  className,
  style,
  ...props
}: ShimmerTextProps) {
  const band = Math.min(80, Math.max(5, spread)) / 2;
  const Comp = as as "span";
  return (
    <Comp
      data-slot="shimmer-text"
      data-active={active}
      className={cn(
        "inline-block",
        active &&
          "animate-kura-shimmer bg-clip-text text-transparent [animation-timing-function:var(--ease-kura-in-out)] [background-size:250%_100%] motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-kura-fg-muted",
        !active && "text-kura-fg-muted transition-colors duration-(--kura-duration-slow)",
        className,
      )}
      style={
        active
          ? {
              ...style,
              ["--kura-shimmer-duration" as string]: `${duration}s`,
              // Light passing over wet ink: dry ink at rest, a soft rise to full ink, and a faint
              // warm (shu) glint at the crest, the one hint that the model is the one working.
              backgroundImage: `linear-gradient(90deg, var(--kura-fg-subtle) calc(50% - ${band}%), color-mix(in oklab, var(--kura-fg-subtle), var(--kura-fg)) calc(50% - ${band / 2}%), color-mix(in oklab, var(--kura-fg) 78%, var(--kura-accent-text)) 50%, color-mix(in oklab, var(--kura-fg-subtle), var(--kura-fg)) calc(50% + ${band / 2}%), var(--kura-fg-subtle) calc(50% + ${band}%))`,
            }
          : style
      }
      {...props}
    >
      {children}
    </Comp>
  );
}
