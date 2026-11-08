import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "grain",
  name: "Grain",
  category: "effects",
  status: "beta",
  description:
    "Paper-grain overlay — washi fibres or film grain — from one SVG-noise tile, with blend modes and an optional compositor-only flicker.",
  whenToUse: [
    "Adding a print-like finish on top of a mesh-gradient, aurora or photo.",
    "Hiding colour banding on large, low-contrast gradients.",
    "Giving a flat hero or empty-state panel a subtle tactile texture — washi paper by default.",
  ],
  whenNotToUse: [
    "As the background itself — combine it with mesh-gradient or aurora.",
    "Over body text or dense UI: noise reduces legibility.",
    "Signalling activity — grain is texture; use border-beam or thinking-indicator.",
  ],
  props: [
    {
      name: "texture",
      type: '"washi" | "film"',
      default: '"washi"',
      description:
        "washi: a fine paper tooth plus long, horizontal paper fibres (the Kura page). film: plain, even film grain.",
    },
    {
      name: "opacity",
      type: "number",
      default: "0.12",
      description: "Strength of the grain, 0–1. 0.08–0.2 is subtle; 0.3+ is stylised.",
    },
    {
      name: "blend",
      type: '"overlay" | "soft-light" | "multiply" | "screen" | "normal"',
      default: '"overlay"',
      description:
        "mix-blend-mode. overlay works on mid and dark tones; multiply suits light surfaces; screen suits very dark ones.",
    },
    {
      name: "scale",
      type: "number",
      default: "1",
      description: "Grain size multiplier: 1 is fine film grain, 2–3 is coarse.",
    },
    {
      name: "animated",
      type: "boolean",
      default: "false",
      description:
        "Flicker the grain like projected film (a stepped transform, compositor-only). Off by default.",
    },
    {
      name: "fps",
      type: "number",
      default: "12",
      description: "Flicker rate when animated. 8–15 reads as film; higher looks like TV static.",
    },
  ],
  parts: [
    {
      name: "Grain",
      dataSlot: "grain",
      description:
        "Absolutely positioned overlay (`inset-0`, pointer-events none, overflow hidden) carrying opacity and blend mode. `data-animated` and `data-texture` mirror the props.",
    },
    {
      name: "Layer",
      dataSlot: "grain-layer",
      description: "Oversized noise layer (200%) that the flicker translates.",
    },
  ],
  a11y: {
    notes: [
      "Decorative and aria-hidden; it never receives pointer events.",
      "Keep opacity low over text; grain can lower perceived contrast.",
    ],
    keyboard: [],
    reducedMotion: "The flicker stops; the grain stays as a static texture.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["mesh-gradient", "aurora", "shader-canvas", "particle-field"],
  tags: ["grain", "noise", "texture", "film", "overlay", "svg", "background", "effect"],
  examples: [
    {
      name: "GrainMinimal",
      kind: "minimal",
      title: "Grain over a gradient",
      description: "Place it inside any positioned element.",
    },
    {
      name: "GrainFull",
      kind: "full",
      title: "Blend modes, opacity, scale, flicker",
      description: "Compare every blend mode on a light and a dark surface.",
    },
    {
      name: "GrainOnGradient",
      kind: "composition",
      title: "On a mesh gradient",
      description: "The classic pairing: MeshGradient with Grain as its last child.",
    },
  ],
  agentNotes: [
    "The parent must be positioned (`relative`) — Grain is `absolute inset-0`. Render it last so it sits on top, and lift text above it with `relative z-10` if needed.",
    "Server-safe: no hooks, no 'use client'.",
    'On near-white surfaces `overlay` is almost invisible by design; use `blend="multiply"` with opacity ~0.06 there.',
    "One Grain per surface; it tiles a 180px image, so cost does not grow with size.",
  ],
});
