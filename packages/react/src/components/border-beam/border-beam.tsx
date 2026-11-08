import type * as React from "react";
import { cn } from "../../lib/cn";

/*
 * The beam is one conic gradient whose start angle is a registered custom property, so the
 * browser can interpolate it in a keyframe. A content-box/border-box mask cuts the gradient down
 * to a ring exactly `width` px thick that inherits the parent's border radius.
 */
const CSS = `
@property --kura-beam-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes kura-beam-spin { to { --kura-beam-angle: 360deg; } }
[data-slot="border-beam-ring"] {
  padding: var(--kura-beam-width);
  background: conic-gradient(from var(--kura-beam-angle), var(--kura-beam-stops));
  -webkit-mask: linear-gradient(black, black) content-box, linear-gradient(black, black);
  -webkit-mask-composite: xor;
  mask: linear-gradient(black, black) content-box exclude, linear-gradient(black, black);
  animation: kura-beam-spin var(--kura-beam-duration) linear infinite;
  animation-delay: var(--kura-beam-delay);
  animation-direction: var(--kura-beam-direction);
  animation-play-state: var(--kura-beam-play);
}
@media (prefers-reduced-motion: reduce) {
  [data-slot="border-beam-ring"] {
    animation: none;
    background: var(--kura-beam-static);
  }
}
`;

export interface BorderBeamProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Show the beam. Toggling fades it in/out (and pauses the animation when hidden). Default true. */
  active?: boolean;
  /** Seconds per lap. Default 8. */
  duration?: number;
  /** Beam length as a share of the lap, 0.05–0.9. Default 0.25. */
  size?: number;
  /** Ring thickness in px. Default 1. */
  width?: number;
  /** CSS colours from tail to head, e.g. `["transparent", "var(--kura-accent)"]`. Default: a blue accent tail fading in to a solid accent head. */
  colors?: readonly string[];
  /** Add a soft blurred glow around the beam. Default false. */
  glow?: boolean;
  /** Travel counter-clockwise. Default false. */
  reverse?: boolean;
  /** Start position as a share of the lap, 0–1. Use 0.5 on a second beam to run them opposite. Default 0. */
  offset?: number;
}

const DEFAULT_COLORS = [
  "transparent",
  "color-mix(in oklab, var(--kura-accent) 30%, transparent)",
  "var(--kura-accent)",
];

function stops(colors: readonly string[], size: number): string {
  const len = Math.min(0.9, Math.max(0.05, size)) * 360;
  const start = 360 - len;
  const head = 356;
  const list = colors.length > 1 ? colors : ["transparent", colors[0] ?? "var(--kura-accent)"];
  const step = (head - start) / (list.length - 1);
  const parts = list.map((c, i) => `${c} ${(start + i * step).toFixed(2)}deg`);
  return `transparent 0deg, transparent ${start.toFixed(2)}deg, ${parts.join(", ")}, transparent 360deg`;
}

/**
 * An animated light beam that travels around its parent's border — the "an agent is working in
 * here" signal for composers, cards and panels. Place it inside a `relative` element with a
 * border radius; it inherits the radius and never affects layout. Pure CSS (server-safe).
 */
export function BorderBeam({
  active = true,
  duration = 8,
  size = 0.25,
  width = 1,
  colors = DEFAULT_COLORS,
  glow = false,
  reverse = false,
  offset = 0,
  className,
  style,
  ...props
}: BorderBeamProps) {
  const vars = {
    "--kura-beam-duration": `${duration}s`,
    "--kura-beam-width": `${width}px`,
    "--kura-beam-stops": stops(colors, size),
    "--kura-beam-delay": `${-Math.min(1, Math.max(0, offset)) * duration}s`,
    "--kura-beam-direction": reverse ? "reverse" : "normal",
    "--kura-beam-play": active ? "running" : "paused",
    "--kura-beam-static": `color-mix(in oklab, ${colors[colors.length - 1] ?? "var(--kura-accent)"} 40%, transparent)`,
  } as React.CSSProperties;
  return (
    <div
      aria-hidden
      data-slot="border-beam"
      data-active={active}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-(--kura-duration-slower) ease-kura-out",
        active ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ ...vars, ...style }}
      {...props}
    >
      <style href="kura-border-beam" precedence="kura">
        {CSS}
      </style>
      {glow && (
        <div
          data-slot="border-beam-glow"
          className="absolute inset-0 rounded-[inherit] opacity-40 blur-[4px] motion-reduce:opacity-20"
        >
          <div
            data-slot="border-beam-ring"
            className="absolute inset-0 rounded-[inherit]"
            style={{ "--kura-beam-width": `${width + 2}px` } as React.CSSProperties}
          />
        </div>
      )}
      <div data-slot="border-beam-ring" className="absolute inset-0 rounded-[inherit]" />
    </div>
  );
}
