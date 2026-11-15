import { Easing, interpolate, spring } from "remotion";

export const FPS = 60;
/** 120 BPM: a beat is 30 frames, a bar 120. */
export const BEAT = 30;
export const BAR = 120;

/** Kura's one curve, `ease-kura-snap`. */
export const SNAP = Easing.bezier(0.2, 0.8, 0.2, 1);
/** The camera's curve: slower to leave, settles without overshoot. */
export const GLIDE = Easing.bezier(0.65, 0, 0.25, 1);

/** `from` → `to` between frames `a` and `b`, clamped, on the snap curve by default. */
export function tween(
  frame: number,
  a: number,
  b: number,
  from = 0,
  to = 1,
  easing: (t: number) => number = SNAP,
) {
  return interpolate(frame, [a, b], [from, to], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** A critically damped spring from `start` (0 → 1, no overshoot). */
export function settle(frame: number, start: number, stiffness = 120, mass = 1) {
  return spring({
    frame: frame - start,
    fps: FPS,
    config: { damping: 200, stiffness, mass },
    durationRestThreshold: 0.001,
  });
}

/** Word stagger that reads as a person, not a metronome. */
export function stagger(i: number, base = 4) {
  return Math.round(base * i ** 0.8);
}

export function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** A tiny deterministic hash → [0, 1). */
export function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
