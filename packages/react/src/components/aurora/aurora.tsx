"use client";

import * as React from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";
import { useResolvedColors } from "../../lib/shader-color";
import { ShaderCanvas } from "../shader-canvas";
import { AURORA_FRAG } from "./aurora.glsl";

export type AuroraPreset = "signal" | "polar" | "ember" | "mist";

/**
 * Palettes as [lower edge, middle, upper fringe]. `signal` follows the theme's blue accent; the
 * rest are fixed: `polar` is icy blue-white, `mist` neutral grey, `ember` a soft warm dawn.
 */
export const auroraPresets: Record<AuroraPreset, readonly [string, string, string]> = {
  signal: [
    "var(--kura-accent)",
    "color-mix(in oklab, var(--kura-accent) 60%, oklch(0.75 0.06 240))",
    "oklch(0.45 0.08 260)",
  ],
  polar: ["oklch(0.9 0.035 235)", "oklch(0.74 0.07 245)", "oklch(0.5 0.08 258)"],
  ember: ["oklch(0.88 0.07 75)", "oklch(0.74 0.1 50)", "oklch(0.5 0.07 35)"],
  mist: ["oklch(0.9 0.004 255)", "oklch(0.72 0.01 255)", "oklch(0.5 0.015 255)"],
};

export interface AuroraProps extends React.ComponentProps<"div"> {
  /** A preset, or three CSS colours `[lower edge, middle, upper fringe]`. Default "signal". */
  colors?: AuroraPreset | readonly [string, string, string];
  /** Brightness of the curtains, 0–1. Default 0.8. */
  intensity?: number;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** Faint stars behind the aurora (only drawn on dark backgrounds). Default false. */
  stars?: boolean;
  /** Freeze the animation on the current frame. Default false. */
  paused?: boolean;
  /** Device-pixel-ratio cap. Default 1.5. */
  maxDpr?: number;
}

/**
 * A soft aurora background: slow, folding veils of light with gentle vertical texture, drawn in a
 * fragment shader with premultiplied alpha so it sits on any surface — a quiet glow on dark, a pale
 * wash on light. Children render on top. CSS fallback without
 * WebGL; a still frame under reduced motion.
 */
export function Aurora({
  colors = "signal",
  intensity = 0.8,
  speed = 1,
  stars = false,
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

  // `version` bumps when the theme flips: a new uniforms object repaints a still frame.
  // biome-ignore lint/correctness/useExhaustiveDependencies: version is the repaint trigger
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
  }, [resolved, version, intensity, stars]);

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
