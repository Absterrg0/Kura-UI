import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./timing";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** The curves. Nothing in the film is linear except the chase, which is linear in the library. */
export const E = {
  /** Fast out, long settle (expo-like): arrivals, camera pull-backs. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Weighted both ends: camera moves between two framings. */
  inOut: Easing.bezier(0.7, 0, 0.2, 1),
  /** A whip: almost all of the travel in the middle. */
  whip: Easing.bezier(0.85, 0, 0.15, 1),
  /** Anticipation: pulls back before it goes. */
  anticipate: Easing.bezier(0.55, -0.45, 0.3, 1),
  /** Overshoots the target, then settles. */
  back: Easing.bezier(0.3, 1.45, 0.45, 1),
  /** Kura's own UI curve, ease-kura-snap. */
  snap: Easing.bezier(0.2, 0.8, 0.2, 1),
  in: Easing.bezier(0.7, 0, 0.85, 0.4),
} as const;

/** `from` → `to` between frames a and b, clamped. */
export function tw(
  f: number,
  a: number,
  b: number,
  from = 0,
  to = 1,
  ease: (t: number) => number = E.out,
) {
  if (b <= a) return f < a ? from : to;
  return interpolate(f, [a, b], [from, to], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

const SPRINGS = {
  /** Lands with a visible overshoot (about 10 %). */
  snap: { damping: 12, stiffness: 230, mass: 0.7 },
  /** Lands with a small overshoot. */
  land: { damping: 17, stiffness: 190, mass: 0.8 },
  /** Settles without overshoot. */
  soft: { damping: 26, stiffness: 120, mass: 1 },
  /** A heavy camera. */
  heavy: { damping: 30, stiffness: 70, mass: 1.4 },
} as const;

/** 0 → 1 (with the spring's overshoot) from frame `start`. */
export function spr(f: number, start: number, kind: keyof typeof SPRINGS = "land") {
  if (f < start) return 0;
  return spring({ frame: f - start, fps: FPS, config: SPRINGS[kind] });
}

/** A struck pulse: 1 at the hit, decaying over `len` frames (for dots that thump on a beat). */
export const pulse = (since: number, len = 14) =>
  since < 0 || !Number.isFinite(since) ? 0 : Math.exp(-since / (len / 3));

/**
 * A count that advances `per` at every step (a sixteenth, say) from `start`, easing each step over
 * `glide` frames, capped at `max`: what an odometer reads while dots light in whole steps.
 */
export function stepped(
  f: number,
  start: number,
  step: number,
  per: number,
  max: number,
  glide = 7,
) {
  if (f < start) return 0;
  const k = Math.floor((f - start) / step);
  const into = f - start - k * step;
  const v = per * k + per * E.out(clamp(into / glide));
  return Math.min(max, v);
}
