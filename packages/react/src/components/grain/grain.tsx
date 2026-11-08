import type * as React from "react";
import { cn } from "../../lib/cn";

export type GrainBlend = "overlay" | "soft-light" | "multiply" | "screen" | "normal";

const CSS = `
@keyframes kura-grain {
  0%, 100% { transform: translate(0, 0); }
  12.5% { transform: translate(-7%, 4%); }
  25% { transform: translate(5%, -9%); }
  37.5% { transform: translate(-11%, -3%); }
  50% { transform: translate(8%, 7%); }
  62.5% { transform: translate(-3%, 11%); }
  75% { transform: translate(10%, -5%); }
  87.5% { transform: translate(-6%, -10%); }
}
`;

const TILE = 180;

/** A tiling, high-contrast monochrome noise tile (SVG feTurbulence) as a data URI. */
function noiseTile(scale: number): string {
  const freq = (0.85 / Math.max(0.25, scale)).toFixed(3);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE}' height='${TILE}'><filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncR type='linear' slope='2.4' intercept='-0.7'/><feFuncG type='linear' slope='2.4' intercept='-0.7'/><feFuncB type='linear' slope='2.4' intercept='-0.7'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/</g, "%3C").replace(/>/g, "%3E")}")`;
}

export interface GrainProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Strength of the grain, 0–1. Default 0.12. */
  opacity?: number;
  /** How the grain mixes with what is underneath. Default "overlay". */
  blend?: GrainBlend;
  /** Grain size multiplier; 1 is fine film grain, 2 is coarse. Default 1. */
  scale?: number;
  /** Flicker the grain like projected film. Off by default — stillness is the Kura default. */
  animated?: boolean;
  /** Flicker rate in frames per second when `animated`. Default 12. */
  fps?: number;
}

/**
 * A film-grain overlay for gradients, heroes and imagery. One cached SVG-noise tile, composited
 * with a blend mode; the optional flicker only moves a transform in `steps()`, so it stays on the
 * compositor and costs next to nothing. Pure CSS (server-safe), decorative, reduced-motion aware.
 */
export function Grain({
  opacity = 0.12,
  blend = "overlay",
  scale = 1,
  animated = false,
  fps = 12,
  className,
  style,
  ...props
}: GrainProps) {
  const frames = 8;
  return (
    <div
      aria-hidden
      data-slot="grain"
      data-animated={animated}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        opacity: Math.min(1, Math.max(0, opacity)),
        mixBlendMode: blend,
        ...style,
      }}
      {...props}
    >
      {animated && (
        <style href="kura-grain" precedence="kura">
          {CSS}
        </style>
      )}
      <div
        data-slot="grain-layer"
        className={cn(
          "absolute -inset-1/2",
          animated &&
            "[animation:var(--kura-grain-animation)] will-change-transform motion-reduce:animate-none",
        )}
        style={{
          backgroundImage: noiseTile(scale),
          backgroundSize: `${TILE}px ${TILE}px`,
          ["--kura-grain-animation" as string]: `kura-grain ${(frames / Math.max(1, fps)).toFixed(3)}s steps(1, end) infinite`,
        }}
      />
    </div>
  );
}
