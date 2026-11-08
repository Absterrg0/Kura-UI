import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "particle-field",
  name: "ParticleField",
  category: "effects",
  status: "beta",
  description:
    "Drifting particle constellation that parts around the pointer and can converge into a ring or point to signal “generating”.",
  whenToUse: [
    "An empty state or hero for a knowledge/graph/agent product where a quiet network motif fits.",
    "Signalling that something is being generated: flip `converge` while the model works, release when done.",
    "A subtle, interactive backdrop behind a short prompt or call to action.",
  ],
  whenNotToUse: [
    "Soft colour backgrounds — use mesh-gradient or aurora.",
    "Inline progress feedback — use thinking-indicator or shimmer-text.",
    "A voice agent's presence — use agent-orb.",
    "Behind dense content: lines and motion compete with text.",
  ],
  props: [
    {
      name: "count",
      type: "number",
      description:
        "Number of particles. Default scales with the area (≈ one per 8,000 px², clamped 24–120). Links are O(n²); stay under ~180.",
    },
    {
      name: "linkDistance",
      type: "number",
      default: "100",
      description: "Max px distance at which two particles are joined by a hairline.",
    },
    { name: "speed", type: "number", default: "1", description: "Drift speed multiplier." },
    {
      name: "interactive",
      type: "boolean",
      default: "true",
      description: "Particles part around the pointer and link to it in the accent colour.",
    },
    {
      name: "converge",
      type: "boolean",
      default: "false",
      description:
        "Gather the particles into `shape` in the accent colour (the generating signal). Set false to release them back into a drift.",
    },
    {
      name: "shape",
      type: '"ring" | "point"',
      default: '"ring"',
      description: "ring: a slowly turning halo. point: a tight orbiting cluster.",
    },
    {
      name: "paused",
      type: "boolean",
      default: "false",
      description: "Freeze the field on the current frame.",
    },
    { name: "maxDpr", type: "number", default: "2", description: "Device-pixel-ratio cap." },
    {
      name: "children",
      type: "React.ReactNode",
      description: "Content rendered on top, in normal flow.",
    },
  ],
  parts: [
    {
      name: "ParticleField",
      dataSlot: "particle-field",
      description:
        "Root (`relative isolate overflow-hidden text-kura-fg-subtle`). `data-state` = drifting | converging | still | fallback; `data-converge` mirrors the prop.",
    },
    {
      name: "Canvas",
      dataSlot: "particle-field-canvas",
      description: "The 2D canvas behind the children (aria-hidden).",
    },
    {
      name: "Fallback",
      dataSlot: "particle-field-fallback",
      description: "A static CSS dot grid shown when canvas 2D is unavailable.",
    },
  ],
  a11y: {
    notes: [
      "Decorative: the canvas is aria-hidden and never takes pointer events from children.",
      "Converging is a visual signal only — pair it with text in a role=status region (e.g. “Generating…”).",
    ],
    keyboard: [],
    reducedMotion:
      "No drift, travel or pointer reaction: one still frame. Toggling `converge` jumps straight to the gathered (or scattered) layout without animating.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["mesh-gradient", "aurora", "thinking-indicator", "agent-orb", "grain"],
  tags: [
    "particles",
    "constellation",
    "network",
    "canvas",
    "background",
    "generating",
    "interactive",
  ],
  examples: [
    {
      name: "ParticleFieldMinimal",
      kind: "minimal",
      title: "Drifting constellation",
      description: "Size it and give it a background; particles use the text colour.",
    },
    {
      name: "ParticleFieldFull",
      kind: "full",
      title: "Converge, shapes and pause",
      description: "Toggle converge, switch ring/point, tune link distance and speed.",
    },
    {
      name: "ParticleFieldGenerating",
      kind: "composition",
      title: "Generating state",
      description:
        "A Button starts a 4s generation: particles gather into a ring while ShimmerText reports progress.",
    },
  ],
  agentNotes: [
    "Particle and link colour = the root's text colour; recolour with a class (`text-kura-fg-muted`). Converged particles and pointer links use `--kura-accent`.",
    "Give the root a height and a background; the canvas is transparent.",
    "Use `converge` for indeterminate generation (seconds, not milliseconds) and release it when output appears.",
    "It pauses automatically offscreen; keep one field per view.",
  ],
});
