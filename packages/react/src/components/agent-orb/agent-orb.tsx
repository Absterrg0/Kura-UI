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
  error: number;
}

const TARGETS: Record<AgentOrbState, Targets> = {
  idle: { energy: 0.45, swirl: 0, spinSpeed: 0.2, flow: 0.25, breath: 1, error: 0 },
  listening: { energy: 0.5, swirl: 0, spinSpeed: 0.2, flow: 0.4, breath: 0.4, error: 0 },
  thinking: { energy: 0.4, swirl: 1, spinSpeed: 3.2, flow: 0.5, breath: 0.2, error: 0 },
  speaking: { energy: 0.6, swirl: 0, spinSpeed: 0.2, flow: 0.6, breath: 0.2, error: 0 },
  error: { energy: 0.3, swirl: 0, spinSpeed: 0, flow: 0.08, breath: 0.5, error: 1 },
};

export interface AgentOrbProps extends Omit<React.ComponentProps<"div">, "children" | "color"> {
  /** What the agent is doing. Drives the motion and the announced label. Default "idle". */
  state?: AgentOrbState;
  /** Dot colour, any CSS colour. Default the ink (`var(--kura-fg)`). `error` uses the danger colour. */
  color?: string;
  /** Dots across the diameter. Fewer reads bolder, more reads finer. Default 19. */
  dots?: number;
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

// The no-WebGL ball: large dots in the middle, small ones toward the limb. The radius is a
// percentage of each cell's half-diagonal.
const FALLBACK_RINGS = [
  { r: "42%", mask: "radial-gradient(circle closest-side, #000 52%, transparent 54%)" },
  {
    r: "22%",
    mask: "radial-gradient(circle closest-side, transparent 54%, #000 56%, #000 98%, transparent 100%)",
  },
] as const;

function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k;
}

/**
 * The voice-agent orb: a sphere drawn as a halftone of dots, rendered in a fragment shader. The
 * dots breathe when idle, swell in rings with the microphone while listening, carry one bright
 * band round the ball while thinking, pulse with the agent's voice while speaking, and turn the
 * danger colour on error. Every transition is eased on the GPU uniforms. Decorative canvas plus a
 * polite text equivalent.
 */
export function AgentOrb({
  state = "idle",
  color = "var(--kura-fg)",
  dots = 19,
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
  const list = React.useMemo(() => [color, "var(--kura-danger-text)"], [color]);
  const { colors: resolved, version } = useResolvedColors(rootRef, list);
  const cells = Math.max(5, Math.min(61, Math.round(dots)));

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
    ink: [0, 0, 0] as Vec3,
  });

  // Under reduced motion the shader is frozen in time; wake it briefly to fade between states.
  const [awake, setAwake] = React.useState(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: wake on state/theme/colour changes.
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
        s.spin += dt * s.spinSpeed;
        s.phase += dt * s.flow;
      }

      const c = resolved.current;
      const ink = c[0]?.linear ?? [0.9, 0.9, 0.9];
      const danger = c[1]?.linear ?? ink;
      for (let j = 0; j < 3; j++) s.ink[j] = lerp(ink[j]!, danger[j]!, s.error);
      return s.ink;
    };
    const s = sim.current;
    // ShaderCanvas evaluates uniforms in insertion order: `u_ink` runs the tick first.
    return {
      u_ink: tick,
      u_cells: () => cells,
      u_energy: () => s.energy,
      u_swirl: () => s.swirl,
      u_spin: () => s.spin,
      u_phase: () => s.phase,
      u_level: () => s.level,
      u_breath: () => s.breath,
    };
  }, [resolved, cells]);

  const text = label ?? STATE_LABEL[state];

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
          // No WebGL: the same ball as two rings of CSS dots, larger at the centre.
          <div
            aria-hidden
            data-slot="agent-orb-fallback"
            className={cn(
              "absolute inset-[3%]",
              state === "thinking" && "animate-kura-pulse motion-reduce:animate-none",
            )}
            style={{ color: state === "error" ? "var(--kura-danger-text)" : color }}
          >
            {FALLBACK_RINGS.map((ring) => (
              <span
                key={ring.r}
                className="kura-dots absolute inset-0"
                style={
                  {
                    "--kura-dots-color": "currentColor",
                    "--kura-dots-pitch": `${100 / cells}%`,
                    "--kura-dots-r": ring.r,
                    maskImage: ring.mask,
                    WebkitMaskImage: ring.mask,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        }
      />
      <span className="sr-only" {...(announce ? { role: "status", "aria-live": "polite" } : {})}>
        {text}
      </span>
    </div>
  );
}
