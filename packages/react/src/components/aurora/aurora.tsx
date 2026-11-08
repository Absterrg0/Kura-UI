"use client";

import * as React from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";
import { ShaderCanvas } from "../shader-canvas";
import { AURORA_FRAG } from "./aurora.glsl";
import { useResolvedColors } from "./shader-color";

export type AuroraPreset = "signal" | "polar" | "ember" | "mist";

/** Palettes as [lower edge, middle, upper fringe]. `signal` follows the theme's accent. */
export const auroraPresets: Record<AuroraPreset, readonly [string, string, string]> = {
  signal: [
    "var(--kura-accent)",
    "color-mix(in oklab, var(--kura-accent) 55%, oklch(0.62 0.11 215))",
    "oklch(0.45 0.09 245)",
  ],
  polar: ["oklch(0.86 0.19 152)", "oklch(0.74 0.13 190)", "oklch(0.48 0.12 255)"],
  ember: ["oklch(0.88 0.14 88)", "oklch(0.72 0.16 52)", "oklch(0.45 0.1 30)"],
  mist: ["oklch(0.92 0.01 85)", "oklch(0.75 0.015 220)", "oklch(0.5 0.02 240)"],
};

export interface AuroraProps extends React.ComponentProps<"div"> {
  /** A preset, or three CSS colours `[lower edge, middle, upper fringe]`. Default "signal". */
  colors?: AuroraPreset | readonly [string, string, string];
  /** Brightness of the curtains, 0–1. Default 0.8. */
  intensity?: number;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** Twinkling stars behind the aurora (only drawn on dark backgrounds). Default true. */
  stars?: boolean;
  /** Freeze the animation on the current frame. Default false. */
  paused?: boolean;
  /** Device-pixel-ratio cap. Default 1.5. */
  maxDpr?: number;
}

/**
 * A soft aurora (northern lights) background: folding light curtains with crisp lower edges and
 * vertical rays, drawn in a fragment shader with premultiplied alpha so it sits on any surface —
 * luminous on dark, a watercolour wash on light. Children render on top. CSS fallback without
 * WebGL; a still frame under reduced motion.
 */
export function Aurora({
  colors = "signal",
  intensity = 0.8,
  speed = 1,
  stars = true,
  paused = false,
  maxDpr = 1.5,
  className,
  children,
  ref,
  ...props
}: AuroraProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const palette = typeof colors === "string" ? auroraPresets[colors] : colors;
  const list = React.useMemo(() => [...palette, "var(--kura-canvas)"], [palette]);
  const { colors: resolved, version } = useResolvedColors(rootRef, list);

  const uniforms = React.useMemo(() => {
    const col = (i: number) => () =>
      (resolved.current[i]?.linear ?? [0.3, 0.6, 0.5]) as [number, number, number];
    return {
      u_low: col(0),
      u_mid: col(1),
      u_high: col(2),
      u_intensity: Math.min(1, Math.max(0, intensity)),
      u_stars: stars ? 1 : 0,
      u_light: () => ((resolved.current[3]?.oklab[0] ?? 1) > 0.55 ? 1 : 0),
    };
  }, [resolved, intensity, stars]);

  const isStill = reducedMotion || paused || speed === 0;
  const [low, mid, high] = palette;

  return (
    <div
      ref={mergeRefs(rootRef, ref)}
      data-slot="aurora"
      data-state={isStill ? "still" : "animating"}
      className={cn("relative isolate overflow-hidden", className)}
      {...props}
    >
      <ShaderCanvas
        key={isStill ? `still-${version}` : "live"}
        data-slot="aurora-canvas"
        fragmentShader={AURORA_FRAG}
        uniforms={uniforms}
        paused={paused || speed === 0}
        speed={speed * 0.6}
        maxDpr={maxDpr}
        staticTime={12}
        className="-z-10 absolute inset-0"
        fallback={
          <div
            aria-hidden
            data-slot="aurora-fallback"
            className="absolute inset-0 opacity-70 blur-2xl"
            style={{
              background: `radial-gradient(60% 28% at 30% 62%, ${low}, transparent 70%), radial-gradient(50% 30% at 70% 55%, ${mid}, transparent 70%), radial-gradient(70% 30% at 50% 80%, ${high}, transparent 75%)`,
            }}
          />
        }
      />
      {children}
    </div>
  );
}
