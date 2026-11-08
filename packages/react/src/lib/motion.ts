/**
 * Kura motion presets. Use these instead of ad-hoc numbers so every surface moves the same way.
 * See DESIGN.md → Motion. CSS equivalents live in styles/kura.css (--kura-duration-*, --ease-kura-*).
 *
 *   import { springs } from "@kura-ui/react/utils";
 *   <motion.div transition={springs.snappy} />
 */

/** Spring presets for `motion/react`. `visualDuration` is the perceived duration in seconds. */
export const springs = {
  /** Presses, toggles, small state flips. Fast and nearly critically damped. */
  snappy: { type: "spring", visualDuration: 0.2, bounce: 0.1 },
  /** Default for layout changes, panels, popovers. No overshoot. */
  smooth: { type: "spring", visualDuration: 0.35, bounce: 0 },
  /** Large surfaces (sheets, drawers, hero elements). */
  gentle: { type: "spring", visualDuration: 0.5, bounce: 0.05 },
  /** Playful confirmation and "alive" elements (orbs, success ticks). Use sparingly. */
  bouncy: { type: "spring", visualDuration: 0.4, bounce: 0.25 },
} as const;

/** Durations in seconds (motion) — mirror of --kura-duration-* in CSS (ms). */
export const durations = {
  instant: 0.09,
  fast: 0.15,
  base: 0.22,
  slow: 0.32,
  slower: 0.48,
} as const;

/** Cubic-bezier easings — mirror of --ease-kura-* in CSS. */
export const easings = {
  /** Default. Strong ease-out: responsive start, soft landing. Enter + user-initiated motion. */
  out: [0.23, 1, 0.32, 1],
  /** Elements moving on-screen from A to B. */
  inOut: [0.77, 0, 0.175, 1],
  /** Exits only. Never for enters. */
  in: [0.55, 0, 1, 0.45],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type SpringPreset = keyof typeof springs;

/** Transition to use when the user prefers reduced motion: instant, or a short fade. */
export const reducedTransition = { duration: 0 } as const;
