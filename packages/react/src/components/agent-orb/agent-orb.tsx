"use client";

import * as React from "react";
import type { AudioAnalyser } from "../../hooks/use-audio-analyser";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";
import { useResolvedColors, type Vec3 } from "../../lib/shader-color";
import { ShaderCanvas } from "../shader-canvas";
import { AGENT_ORB_FRAG } from "./agent-orb.glsl";

export type AgentOrbState = "idle" | "listening" | "thinking" | "speaking" | "error";
export type AgentOrbPreset = "signal" | "pearl" | "graphite" | "ocean" | "amber";

/**
 * Palettes as [deep, mid, bright, glint]: the densest clouds, the body, the light between the
 * clouds, and the rim/sheen. `signal` is built from Kura tokens and follows the theme — pearl with
 * blue clouds on light pages, graphite with blue clouds on dark ones. The rest are fixed.
 */
export const agentOrbPresets: Record<AgentOrbPreset, readonly [string, string, string, string]> = {
  signal: [
    "var(--kura-accent)",
    "color-mix(in oklab, var(--kura-accent) 38%, var(--kura-surface))",
    "color-mix(in oklab, var(--kura-accent) 9%, var(--kura-surface))",
    "oklch(0.99 0.004 255)",
  ],
  pearl: [
    "oklch(0.7 0.008 255)",
    "oklch(0.85 0.006 255)",
    "oklch(0.975 0.003 255)",
    "oklch(1 0 0)",
  ],
  graphite: [
    "oklch(0.2 0.004 255)",
    "oklch(0.33 0.008 255)",
    "oklch(0.56 0.02 255)",
    "oklch(0.9 0.01 255)",
  ],
  ocean: [
    "oklch(0.4 0.16 264)",
    "oklch(0.57 0.17 258)",
    "oklch(0.82 0.08 245)",
    "oklch(0.97 0.02 240)",
  ],
  amber: ["oklch(0.7 0.12 58)", "oklch(0.85 0.06 70)", "oklch(0.97 0.015 85)", "oklch(1 0 0)"],
};

/** Error follows the theme like `signal`, with the danger token as the cloud colour. */
const ERROR_PALETTE = [
  "var(--kura-danger)",
  "color-mix(in oklab, var(--kura-danger) 40%, var(--kura-surface))",
  "color-mix(in oklab, var(--kura-danger) 6%, var(--kura-surface))",
  "oklch(0.99 0.004 25)",
] as const;

const STATE_LABEL: Record<AgentOrbState, string> = {
  idle: "Voice agent idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  error: "Voice agent error",
};

interface Targets {
  energy: number;
  swirl: number;
  spinSpeed: number;
  flow: number;
  breath: number;
  halo: number;
  error: number;
}

const TARGETS: Record<AgentOrbState, Targets> = {
  idle: { energy: 0.15, swirl: 0.05, spinSpeed: 0.04, flow: 0.2, breath: 1, halo: 0.2, error: 0 },
  listening: {
    energy: 0.4,
    swirl: 0.08,
    spinSpeed: 0.08,
    flow: 0.4,
    breath: 0.4,
    halo: 0.35,
    error: 0,
  },
  thinking: {
    energy: 0.5,
    swirl: 0.6,
    spinSpeed: 0.7,
    flow: 0.5,
    breath: 0.3,
    halo: 0.35,
    error: 0,
  },
  speaking: {
    energy: 0.5,
    swirl: 0.12,
    spinSpeed: 0.14,
    flow: 0.5,
    breath: 0.2,
    halo: 0.55,
    error: 0,
  },
  error: { energy: 0.1, swirl: 0, spinSpeed: 0.02, flow: 0.12, breath: 0.6, halo: 0.25, error: 1 },
};

export interface AgentOrbProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** What the agent is doing. Drives motion, colour and the announced label. Default "idle". */
  state?: AgentOrbState;
  /** A preset, or four CSS colours `[deep, mid, bright, glint]`. Default "signal". */
  colors?: AgentOrbPreset | readonly [string, string, string, string];
  /**
   * Audio analyser (from `useAudioAnalyser`). Its level drives the orb while `listening` (input)
   * or `speaking` (output). Overridden by `inputLevel`/`outputLevel` when those are set.
   */
  analyser?: AudioAnalyser;
  /** Microphone level 0–1, used while `listening`. */
  inputLevel?: number;
  /** Agent voice level 0–1, used while `speaking`. */
  outputLevel?: number;
  /** Accessible text for the current state. Default: "Listening", "Thinking", … */
  label?: string;
  /** Announce state changes politely to screen readers. Default true. */
  announce?: boolean;
  /** Device-pixel-ratio cap. Default 2. */
  maxDpr?: number;
}

function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k;
}

/**
 * The voice-agent orb: a calm, softly glassy sphere of slow colour clouds, rendered in a fragment
 * shader. It breathes when idle, swells with the microphone while listening, turns while thinking,
 * lifts with the agent's voice while speaking and shifts to the danger colour on error — every
 * transition is eased on the GPU uniforms. Decorative canvas plus a polite text equivalent.
 */
export function AgentOrb({
  state = "idle",
  colors = "signal",
  analyser,
  inputLevel,
  outputLevel,
  label,
  announce = true,
  maxDpr = 2,
  className,
  style,
  ref,
  ...props
}: AgentOrbProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const palette = typeof colors === "string" ? agentOrbPresets[colors] : colors;
  const list = React.useMemo(() => [...palette, ...ERROR_PALETTE, "var(--kura-canvas)"], [palette]);
  const { colors: resolved, version } = useResolvedColors(rootRef, list);

  // Everything the render loop needs, without re-creating uniforms on every prop change.
  const live = React.useRef({ state, analyser, inputLevel, outputLevel, reducedMotion });
  live.current = { state, analyser, inputLevel, outputLevel, reducedMotion };

  // Animated uniform state, eased toward the targets of the current `state` every frame.
  const sim = React.useRef({
    ...TARGETS[state],
    level: 0,
    spin: 0,
    phase: 0,
    last: 0,
    out: {
      deep: [0, 0, 0] as Vec3,
      mid: [0, 0, 0] as Vec3,
      bright: [0, 0, 0] as Vec3,
      glint: [0, 0, 0] as Vec3,
    },
    light: 0,
  });

  // Under reduced motion the shader is frozen in time; wake it briefly to fade between states.
  const [awake, setAwake] = React.useState(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: wake on state/theme/palette changes.
  React.useEffect(() => {
    if (!reducedMotion) return;
    setAwake(true);
    const id = setTimeout(() => setAwake(false), 900);
    return () => clearTimeout(id);
  }, [reducedMotion, state, version, list]);

  const uniforms = React.useMemo(() => {
    const tick = () => {
      const s = sim.current;
      const now = performance.now();
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 1;
      s.last = now;
      const {
        state: st,
        analyser: an,
        inputLevel: inL,
        outputLevel: outL,
        reducedMotion: rm,
      } = live.current;
      const target = TARGETS[st];
      const k = 1 - Math.exp(-dt / 0.35); // ~350ms ease, retargets mid-flight
      s.energy = lerp(s.energy, target.energy, k);
      s.swirl = lerp(s.swirl, target.swirl, k);
      s.spinSpeed = lerp(s.spinSpeed, target.spinSpeed, k);
      s.flow = lerp(s.flow, target.flow, k);
      s.breath = lerp(s.breath, target.breath, k);
      s.halo = lerp(s.halo, target.halo, k);
      s.error = lerp(s.error, target.error, 1 - Math.exp(-dt / 0.25));

      let level = 0;
      if (!rm && (st === "listening" || st === "speaking")) {
        const manual = st === "listening" ? inL : outL;
        level = manual ?? an?.read().level ?? 0;
        level = Math.min(1, Math.max(0, level));
      }
      // Fast attack, slower release, like a VU meter.
      s.level = lerp(s.level, level, 1 - Math.exp(-dt / (level > s.level ? 0.05 : 0.18)));
      if (!rm) {
        s.spin += dt * s.spinSpeed * 1.6;
        s.phase += dt * s.flow;
      }

      // Blend toward the error palette in OKLab; the shader works in OKLab too.
      const c = resolved.current;
      const mix = (i: number, out: Vec3) => {
        const a = c[i]?.oklab ?? [0.6, 0, 0];
        const b = c[i + 4]?.oklab ?? a;
        for (let j = 0; j < 3; j++) out[j] = lerp(a[j]!, b[j]!, s.error);
        return out;
      };
      mix(0, s.out.deep);
      mix(1, s.out.mid);
      mix(2, s.out.bright);
      mix(3, s.out.glint);
      s.light = (c[8]?.oklab[0] ?? 1) > 0.55 ? 1 : 0;
      return s.out.deep;
    };
    const s = sim.current;
    // ShaderCanvas evaluates uniforms in insertion order: `u_deep` runs the tick first.
    return {
      u_deep: tick,
      u_mid: () => s.out.mid,
      u_bright: () => s.out.bright,
      u_glint: () => s.out.glint,
      u_energy: () => s.energy + s.level * 0.5,
      u_swirl: () => s.swirl,
      u_spin: () => s.spin,
      u_phase: () => s.phase,
      u_level: () => s.level,
      u_breath: () => s.breath,
      u_halo: () => s.halo + s.level * 0.6,
      u_light: () => s.light,
    };
  }, [resolved]);

  const text = label ?? STATE_LABEL[state];
  const [deep, mid, bright, glint] = state === "error" ? ERROR_PALETTE : palette;

  return (
    <div
      ref={mergeRefs(rootRef, ref)}
      data-slot="agent-orb"
      data-state={state}
      className={cn("relative isolate aspect-square", className)}
      style={style}
      {...props}
    >
      <ShaderCanvas
        data-slot="agent-orb-canvas"
        fragmentShader={AGENT_ORB_FRAG}
        uniforms={uniforms}
        respectReducedMotion={false}
        speed={reducedMotion ? 0 : 1}
        paused={reducedMotion && !awake}
        maxDpr={maxDpr}
        className="absolute inset-0"
        fallback={
          <div
            aria-hidden
            data-slot="agent-orb-fallback"
            className={cn(
              "absolute inset-[8%] overflow-hidden rounded-full shadow-kura-md transition-[scale] duration-(--kura-duration-slower) ease-kura-out motion-reduce:transition-none",
              state === "speaking" && "scale-[1.03] motion-reduce:scale-100",
            )}
            style={{ background: bright }}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-full blur-md",
                state === "thinking" &&
                  "animate-kura-spin [animation-duration:3.2s] motion-reduce:animate-none",
              )}
              style={{
                background: `radial-gradient(60% 55% at 70% 72%, ${deep}, transparent 70%), radial-gradient(55% 50% at 28% 62%, ${mid}, transparent 72%), radial-gradient(50% 45% at 60% 22%, ${mid}, transparent 70%)`,
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(42% 32% at 34% 24%, color-mix(in oklab, ${glint} 55%, transparent), transparent 70%), radial-gradient(circle at 50% 50%, transparent 66%, color-mix(in oklab, ${glint} 45%, transparent) 100%)`,
              }}
            />
          </div>
        }
      />
      <span className="sr-only" {...(announce ? { role: "status", "aria-live": "polite" } : {})}>
        {text}
      </span>
    </div>
  );
}
