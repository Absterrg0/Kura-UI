/**
 * Kura's dark tokens (packages/react/src/styles/kura.css). The film is one graphite space; colours
 * come from the tokens only. Ember is "a person is needed" and nothing else.
 */
export const K = {
  canvas: "var(--kura-canvas)",
  surface: "var(--kura-surface)",
  raised: "var(--kura-surface-raised)",
  sunken: "var(--kura-surface-sunken)",
  fg: "var(--kura-fg)",
  muted: "var(--kura-fg-muted)",
  subtle: "var(--kura-fg-subtle)",
  faint: "var(--kura-faint)",
  dotOff: "var(--kura-dot-off)",
  ember: "var(--kura-ember)",
  success: "var(--kura-success)",
} as const;

export const SANS = "Geist, ui-sans-serif, system-ui";
export const MONO = "'Geist Mono', ui-monospace, monospace";
