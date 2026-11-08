"use client";

import * as React from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";
import { useResolvedColors } from "../../lib/shader-color";
import { ShaderCanvas } from "../shader-canvas";
import { MAX_COLORS, MESH_GRADIENT_FRAG } from "./mesh-gradient.glsl";

export type MeshGradientPreset = "signal" | "paper" | "graphite" | "dusk" | "ember" | "glacier";

/**
 * Colour presets. `signal` and `paper` are built from Kura tokens and follow the theme; the rest
 * are fixed OKLCH palettes that look the same in light and dark: `graphite` and `dusk` are dark
 * (light text on top), `ember` and `glacier` are light (dark text on top).
 */
export const meshGradientPresets: Record<MeshGradientPreset, readonly string[]> = {
  signal: [
    "var(--kura-canvas)",
    "var(--kura-accent-subtle)",
    "color-mix(in oklab, var(--kura-accent) 78%, var(--kura-canvas))",
    "var(--kura-gray-3)",
    "var(--kura-accent-subtle)",
  ],
  paper: [
    "var(--kura-gray-1)",
    "var(--kura-gray-4)",
    "var(--kura-accent-subtle)",
    "var(--kura-gray-2)",
    "var(--kura-gray-6)",
  ],
  graphite: [
    "oklch(0.17 0.002 255)",
    "oklch(0.25 0.006 255)",
    "oklch(0.4 0.014 255)",
    "oklch(0.2 0.003 255)",
    "oklch(0.52 0.04 258)",
  ],
  dusk: [
    "oklch(0.2 0.035 262)",
    "oklch(0.34 0.06 260)",
    "oklch(0.56 0.07 255)",
    "oklch(0.8 0.045 55)",
    "oklch(0.26 0.045 266)",
  ],
  ember: [
    "oklch(0.975 0.008 80)",
    "oklch(0.92 0.03 72)",
    "oklch(0.82 0.07 55)",
    "oklch(0.95 0.018 85)",
    "oklch(0.78 0.075 50)",
  ],
  glacier: [
    "oklch(0.98 0.005 240)",
    "oklch(0.91 0.025 245)",
    "oklch(0.8 0.055 250)",
    "oklch(0.64 0.07 256)",
    "oklch(0.95 0.012 235)",
  ],
};

export interface MeshGradientProps extends React.ComponentProps<"div"> {
  /** A preset name, or 2–6 CSS colours (OKLCH, hex, rgb, `var(--token)`…). Default "signal". */
  colors?: MeshGradientPreset | readonly string[];
  /** Organic warping of the colour field, 0–1. Default 0.5. */
  distortion?: number;
  /** Twist around the centre, 0–1. Default 0.25. */
  swirl?: number;
  /** Animation speed multiplier. 0 freezes the flow. Default 1. */
  speed?: number;
  /** Film-grain amount, 0–1. Default 0.12. Hides banding on large, low-contrast gradients. */
  grain?: number;
  /** Lens the gradient gently toward the pointer. Default true. */
  interactive?: boolean;
  /** Freeze the animation on the current frame. Default false. */
  paused?: boolean;
  /** Changes the starting layout of the colour wells. Default 0. */
  seed?: number;
  /** Device-pixel-ratio cap. Gradients are soft, so 1–1.5 is plenty. Default 1.5. */
  maxDpr?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function fallbackBackground(colors: readonly string[]): string {
  const spots = ["18% 22%", "82% 18%", "72% 82%", "24% 78%", "50% 50%", "92% 55%"];
  const layers = colors
    .slice(1)
    .map((c, i) => `radial-gradient(60% 70% at ${spots[i]}, ${c}, transparent 70%)`);
  return [...layers, colors[0]].join(", ");
}

/**
 * Animated WebGL mesh gradient for hero sections, empty states and ambient surfaces. Blends up to
 * six colours in OKLab, with distortion, swirl, grain and a subtle pointer lens. Children render on
 * top. Falls back to layered CSS radial gradients without WebGL, and to a still frame under
 * reduced motion.
 */
export function MeshGradient({
  colors = "signal",
  distortion = 0.5,
  swirl = 0.25,
  speed = 1,
  grain = 0.12,
  interactive = true,
  paused = false,
  seed = 0,
  maxDpr = 1.5,
  className,
  children,
  ref,
  ...props
}: MeshGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const list = React.useMemo(() => {
    const raw = typeof colors === "string" ? meshGradientPresets[colors] : colors;
    const arr = raw.length ? raw.slice(0, MAX_COLORS) : meshGradientPresets.signal;
    return arr.length === 1 ? [arr[0]!, arr[0]!] : arr;
  }, [colors]);
  const { colors: resolved, version } = useResolvedColors(rootRef, list);

  // Smoothed pointer (xy 0–1, y up; z = influence). Mutated, never React state.
  const pointer = React.useRef({ x: 0.5, y: 0.5, z: 0, tx: 0.5, ty: 0.5, tz: 0, last: 0 });
  React.useEffect(() => {
    if (!interactive) {
      pointer.current.tz = 0;
      return;
    }
    const onMove = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / Math.max(1, r.width);
      const y = 1 - (e.clientY - r.top) / Math.max(1, r.height);
      const p = pointer.current;
      p.tx = x;
      p.ty = y;
      p.tz = x >= 0 && x <= 1 && y >= 0 && y <= 1 ? 1 : 0;
    };
    const onLeave = () => {
      pointer.current.tz = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive]);

  // `version` bumps when the theme flips: a new uniforms object repaints a still frame.
  // biome-ignore lint/correctness/useExhaustiveDependencies: version is the repaint trigger
  const uniforms = React.useMemo(() => {
    const color = (i: number) => () => {
      const c = resolved.current;
      return (c[Math.min(i, c.length - 1)]?.oklab ?? [0.5, 0, 0]) as [number, number, number];
    };
    return {
      u_c0: color(0),
      u_c1: color(1),
      u_c2: color(2),
      u_c3: color(3),
      u_c4: color(4),
      u_c5: color(5),
      u_count: () => resolved.current.length,
      u_distortion: clamp(distortion, 0, 1),
      u_swirl: clamp(swirl, 0, 1),
      u_grain: clamp(grain, 0, 1),
      u_seed: seed,
      u_mouse: () => {
        const p = pointer.current;
        const now = performance.now();
        const dt = p.last ? Math.min(0.1, (now - p.last) / 1000) : 1;
        p.last = now;
        const k = 1 - Math.exp(-dt * 3.5); // ~300ms ease toward the pointer
        p.x += (p.tx - p.x) * k;
        p.y += (p.ty - p.y) * k;
        p.z += (p.tz - p.z) * (1 - Math.exp(-dt * 2));
        return [p.x, p.y, p.z] as const;
      },
    };
  }, [resolved, version, distortion, swirl, grain, seed]);

  const isStill = reducedMotion || paused || speed === 0;

  return (
    <div
      ref={mergeRefs(rootRef, ref)}
      data-slot="mesh-gradient"
      data-state={isStill ? "still" : "animating"}
      className={cn("relative isolate overflow-hidden", className)}
      {...props}
    >
      <ShaderCanvas
        data-slot="mesh-gradient-canvas"
        fragmentShader={MESH_GRADIENT_FRAG}
        uniforms={uniforms}
        paused={paused || speed === 0}
        speed={speed}
        maxDpr={maxDpr}
        staticTime={4 + seed}
        className="-z-10 absolute inset-0"
        fallback={
          <div
            aria-hidden
            data-slot="mesh-gradient-fallback"
            className="absolute inset-0"
            style={{ background: fallbackBackground(list) }}
          />
        }
      />
      {children}
    </div>
  );
}
