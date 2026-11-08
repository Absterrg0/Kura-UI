import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "particle-field",
  name: "ParticleField",
  category: "effects",
  status: "beta",
  description:
    "Drifting particle field printed as a halftone dot screen or a hairline constellation; converges into a vermilion ring or halftone sun while generating.",
  whenToUse: [
    "An empty state or hero that should feel printed rather than glowing: drifting halftone drops on paper, like a dithered illustration.",
    'A knowledge/graph product where a quiet network motif fits (`variant="constellation"`).',
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
      name: "variant",
      type: '"halftone" | "constellation"',
      default: '"halftone"',
      description:
        "halftone: the particles' density screened as a grid of ink dots that swell where particles gather, over a faint pin-prick screen. constellation: dots joined by hairlines (uses `linkDistance`).",
    },
    {
      name: "cellSize",
      type: "number",
      default: "7",
      description:
        "Halftone screen pitch in px (distance between dot centres, min 4). Larger is coarser and cheaper.",
    },
    {
      name: "count",
      type: "number",
      description:
        "Number of particles. Default scales with the area (≈ one per 5,500 px², clamped 30–160). Links are O(n²); stay under ~180.",
    },
    {
      name: "linkDistance",
      type: "number",
      default: "110",
      description:
        "constellation only: max px distance at which two particles are joined by a hairline.",
    },
    { name: "speed", type: "number", default: "1", description: "Drift speed multiplier." },
    {
      name: "interactive",
      type: "boolean",
      default: "true",
      description:
        "Particles part around the pointer; constellation links them to it, halftone marks it with a faint ring of accent dots.",
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
      description:
        "ring: a slowly turning halo. point: a tight orbiting cluster — a halftone sun in the halftone variant.",
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
        "Root (`relative isolate overflow-hidden text-kura-fg-subtle`). `data-state` = drifting | converging | still | fallback; `data-converge` and `data-variant` mirror the props.",
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
    "halftone",
    "dither",
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
      title: "Drifting halftone",
      description: "Size it and give it a background; the dots use the text colour.",
    },
    {
      name: "ParticleFieldFull",
      kind: "full",
      title: "Converge, shapes, variants and pause",
      description:
        "Toggle converge (point = a halftone sun), switch ring/point and halftone/constellation.",
    },
    {
      name: "ParticleFieldGenerating",
      kind: "composition",
      title: "Generating state",
      description:
        "A Button on a mounted paper slip starts a 4s generation: particles gather into a vermilion halftone sun while ShimmerText reports progress.",
    },
  ],
  agentNotes: [
    "Dot, particle and link colour = the root's text colour; recolour with a class (`text-kura-fg-muted` for a quiet print, `text-kura-fg` for full ink). Converged particles and pointer marks use `--kura-accent`.",
    "Text over the halftone needs its own surface (a raised card) or a low `count`; the dots are deliberately bold.",
    "The halftone variant redraws at ~30 fps and costs O(particles × kernel cells); raise `cellSize` on very large areas.",
    "Give the root a height and a background; the canvas is transparent.",
    "Use `converge` for indeterminate generation (seconds, not milliseconds) and release it when output appears.",
    "It pauses automatically offscreen; keep one field per view.",
  ],
});
