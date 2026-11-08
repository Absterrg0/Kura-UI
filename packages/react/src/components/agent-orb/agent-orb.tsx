"use client";

import * as React from "react";
import type { AudioAnalyser } from "../../hooks/use-audio-analyser";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";
import { ShaderCanvas } from "../shader-canvas";
import { AGENT_ORB_FRAG } from "./agent-orb.glsl";
import { useResolvedColors, type Vec3 } from "./shader-color";

export type AgentOrbState = "idle" | "listening" | "thinking" | "speaking" | "error";
export type AgentOrbPreset = "jade" | "ocean" | "amber" | "graphite";

/** Palettes as [deep, mid, bright, glint] OKLCH colours. */
export const agentOrbPresets: Record<AgentOrbPreset, readonly [string, string, string, string]> = {
  jade: [
    "oklch(0.3 0.06 188)",
    "oklch(0.56 0.115 174)",
    "oklch(0.84 0.13 166)",
    "oklch(0.98 0.03 150)",
  ],
  ocean: [
    "oklch(0.27 0.07 255)",
    "oklch(0.53 0.13 242)",
    "oklch(0.82 0.1 218)",
    "oklch(0.98 0.02 210)",
  ],
  amber: [
    "oklch(0.33 0.08 42)",
    "oklch(0.64 0.15 55)",
    "oklch(0.87 0.13 82)",
    "oklch(0.99 0.03 95)",
  ],
  graphite: [
    "oklch(0.22 0.006 85)",
    "oklch(0.46 0.01 85)",
    "oklch(0.82 0.01 85)",
    "oklch(0.99 0 0)",
  ],
};

const ERROR_PALETTE = [
  "oklch(0.3 0.08 25)",
  "oklch(0.55 0.17 25)",
  "oklch(0.78 0.13 35)",
  "oklch(0.97 0.03 45)",
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
  idle: { energy: 0.2, swirl: 0.05, spinSpeed: 0.05, flow: 0.22, breath: 1, halo: 0.25, error: 0 },
  listening: {
    energy: 0.45,
    swirl: 0.1,
    spinSpeed: 0.1,
    flow: 0.45,
    breath: 0.4,
    halo: 0.45,
    error: 0,
  },
  thinking: {
    energy: 0.6,
    swirl: 0.85,
    spinSpeed: 1.1,
    flow: 0.6,
    breath: 0.3,
    halo: 0.4,
    error: 0,
  },
  speaking: {
    energy: 0.55,
    swirl: 0.15,
    spinSpeed: 0.18,
    flow: 0.55,
    breath: 0.2,
    halo: 0.7,
    error: 0,
  },
  error: { energy: 0.15, swirl: 0, spinSpeed: 0.02, flow: 0.12, breath: 0.6, halo: 0.3, error: 1 },
};

export interface AgentOrbProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** What the agent is doing. Drives motion, colour and the announced label. Default "idle". */
  state?: AgentOrbState;
  /** A preset, or four CSS colours `[deep, mid, bright, glint]`. Default "jade". */
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
 * The voice-agent orb: a glassy, liquid sphere rendered in a fragment shader. It breathes when
 * idle, ripples with the microphone while listening, swirls while thinking, pulses with the
 * agent's voice while speaking and turns red on error — every transition is smoothed on the GPU
 * uniforms. Decorative canvas plus a polite text equivalent of the state.
 */
export function AgentOrb({
  state = "idle",
  colors = "jade",
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

      const c = resolved.current;
      const mix = (i: number, out: Vec3) => {
        const a = c[i]?.linear ?? [0.3, 0.3, 0.3];
        const b = c[i + 4]?.linear ?? a;
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
              "absolute inset-[15%] overflow-hidden rounded-full transition-[scale] duration-(--kura-duration-slower) ease-kura-out motion-reduce:transition-none",
              state === "speaking" && "scale-[1.04] motion-reduce:scale-100",
            )}
            style={{
              background: mid,
              boxShadow: `0 0 48px -8px color-mix(in oklab, ${bright} 45%, transparent)`,
            }}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-full",
                state === "thinking" &&
                  "animate-kura-spin [animation-duration:2.4s] motion-reduce:animate-none",
              )}
              style={{
                background: `conic-gradient(from 200deg, ${mid}, ${deep}, ${mid}, ${bright}, ${mid})`,
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at 34% 28%, ${glint} 0%, transparent 16%), radial-gradient(circle at 60% 82%, color-mix(in oklab, ${bright} 70%, transparent) 0%, transparent 42%), radial-gradient(circle at 50% 50%, transparent 58%, color-mix(in oklab, ${bright} 55%, transparent) 100%)`,
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
