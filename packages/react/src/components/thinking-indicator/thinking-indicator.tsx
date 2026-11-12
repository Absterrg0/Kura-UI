"use client";

import * as React from "react";
import { cn } from "../../lib/cn";
import { ShimmerText } from "../shimmer-text";

export type ThinkingIndicatorVariant = "dots" | "pulse" | "text";
export type ThinkingIndicatorSize = "sm" | "md" | "lg";

const CSS = `
@keyframes kura-ti-dot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
  30% { transform: translateY(-40%); opacity: 1; }
}
@keyframes kura-ti-ring { from { transform: scale(1); opacity: 0.55; } to { transform: scale(2.8); opacity: 0; } }
@keyframes kura-ti-breathe { 0%, 100% { transform: scale(0.82); } 50% { transform: scale(1); } }
`;

const SIZE: Record<ThinkingIndicatorSize, string> = {
  sm: "[--ti-dot:4px] [--ti-gap:3px]",
  md: "[--ti-dot:6px] [--ti-gap:4px]",
  lg: "[--ti-dot:8px] [--ti-gap:5px]",
};

const TEXT_SIZE: Record<ThinkingIndicatorSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-[15px]",
};

export interface ThinkingIndicatorProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Visual style. `text` cycles through `messages`. Default "dots". */
  variant?: ThinkingIndicatorVariant;
  /** Overall scale. Default "md". */
  size?: ThinkingIndicatorSize;
  /** Accessible status text announced to screen readers. Default "Thinking". */
  label?: string;
  /**
   * Status lines for the `text` variant, e.g. ["Searching…", "Reading 4 files…"]. Several lines
   * cycle on a timer with a cross-fade; a single line is shown (and announced) as is.
   */
  messages?: readonly string[];
  /** Milliseconds each message stays up when cycling. Default 2400. */
  interval?: number;
}

const motion = "motion-reduce:animate-none";

function Dots() {
  return (
    <span data-slot="thinking-indicator-shape" className="inline-flex items-center gap-(--ti-gap)">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "size-(--ti-dot) rounded-full bg-current [animation:kura-ti-dot_1.3s_cubic-bezier(0.45,0,0.55,1)_infinite]",
            motion,
            i === 0 && "motion-reduce:opacity-40",
            i === 1 && "motion-reduce:opacity-70",
          )}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function Pulse() {
  return (
    <span
      data-slot="thinking-indicator-shape"
      className="relative inline-flex size-[calc(var(--ti-dot)*2.6)] items-center justify-center"
    >
      <span
        className={cn(
          "absolute size-(--ti-dot) rounded-full bg-current [animation:kura-ti-ring_1.6s_cubic-bezier(0.23,1,0.32,1)_infinite]",
          motion,
          "motion-reduce:opacity-0",
        )}
      />
      <span
        className={cn(
          "size-[calc(var(--ti-dot)*1.25)] rounded-full bg-current [animation:kura-ti-breathe_1.6s_cubic-bezier(0.77,0,0.175,1)_infinite]",
          motion,
        )}
      />
    </span>
  );
}

/**
 * Compact AI "thinking" indicators — dots, a pulsing dot, or cycling status text — wrapped in
 * a polite live region. Shapes use `currentColor` (the blue accent by default); restyle with a text-colour
 * class. CSS-only animation; everything settles to a still glyph under reduced motion.
 */
export function ThinkingIndicator({
  variant = "dots",
  size = "md",
  label = "Thinking",
  messages,
  interval = 2400,
  className,
  ...props
}: ThinkingIndicatorProps) {
  const lines = messages?.length ? messages : [`${label}…`];
  const cycling = variant === "text" && lines.length > 1;
  const [index, setIndex] = React.useState(0);
  const key = lines.join("\n");

  // biome-ignore lint/correctness/useExhaustiveDependencies: restart when the message list changes.
  React.useEffect(() => {
    setIndex(0);
    if (!cycling) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % lines.length), Math.max(600, interval));
    return () => clearInterval(id);
  }, [cycling, key, interval]);

  const shape = variant === "dots" ? <Dots /> : variant === "pulse" ? <Pulse /> : null;

  return (
    <span
      role="status"
      aria-live="polite"
      data-slot="thinking-indicator"
      data-variant={variant}
      data-size={size}
      className={cn(
        "inline-flex items-center gap-2 align-middle text-kura-fg",
        SIZE[size],
        className,
      )}
      {...props}
    >
      <style href="kura-thinking-indicator" precedence="kura">
        {CSS}
      </style>
      {shape && (
        <>
          <span aria-hidden className="contents">
            {shape}
          </span>
          <span className="sr-only">{label}</span>
        </>
      )}
      {variant === "text" && (
        <>
          <span aria-hidden className="contents">
            <Pulse />
          </span>
          {cycling && <span className="sr-only">{label}</span>}
          <span
            data-slot="thinking-indicator-text"
            aria-hidden={cycling || undefined}
            className={cn("grid text-kura-fg-muted", TEXT_SIZE[size])}
          >
            {lines.map((line, i) => (
              <span
                key={`${i}-${line}`}
                data-active={i === index}
                className={cn(
                  "col-start-1 row-start-1 whitespace-nowrap transition-[opacity,translate] duration-(--kura-duration-slow) ease-kura-snap motion-reduce:translate-y-0",
                  i === index ? "opacity-100" : "translate-y-0.5 opacity-0",
                )}
              >
                {i === index ? <ShimmerText>{line}</ShimmerText> : line}
              </span>
            ))}
          </span>
        </>
      )}
    </span>
  );
}
