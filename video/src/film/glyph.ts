/**
 * The StatusGlyph's geometry, exactly as the library draws it (status-glyph.tsx): a 15-unit box,
 * eight dots of r 1.25 on a circle of r 5.4, clockwise from twelve; done is one disc of r 5.6.
 * The chase is the library's kura-chase loop (1.2 s, linear, dot i delayed 150 ms × i), computed
 * from the film's clock instead of the browser's.
 */
export const G = { C: 7.5, R: 5.4, DOT: 1.25, DONE: 5.6 } as const;

export const RING = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { x: Math.sin(a) * G.R, y: -Math.cos(a) * G.R };
});

/** kura-chase keyframes: 0 % .2 → 8 % 1 → 30 % 1 → 55 % .2 → 100 % .2. */
function chaseKey(p: number) {
  if (p < 0.08) return 0.2 + (0.8 * p) / 0.08;
  if (p < 0.3) return 1;
  if (p < 0.55) return 1 - (0.8 * (p - 0.3)) / 0.25;
  return 0.2;
}

/** Opacity of ring dot `i` of a running glyph, `ms` into the loop. */
export function chase(i: number, ms: number) {
  const t = ms - i * 150;
  if (t < 0) return 0.2;
  return chaseKey((t % 1200) / 1200);
}
