import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "mesh-gradient",
  name: "MeshGradient",
  category: "effects",
  status: "beta",
  description:
    "Animated WebGL mesh gradient that blends up to six colours in OKLab, with distortion, swirl, grain and a pointer lens — for heroes and empty states.",
  whenToUse: [
    "A hero, landing or onboarding section that needs a calm, living background behind a headline.",
    "An empty state or a 'start a conversation' panel that should feel warm instead of blank.",
    "A card or banner announcing an AI feature, using the theme-aware `signal` preset.",
    "Any container where content should sit on a soft, slowly moving colour field (pass children).",
  ],
  whenNotToUse: [
    "Northern-lights curtains or a night-sky feel — use aurora.",
    "Showing that an agent is listening or speaking — use agent-orb.",
    "Signalling that a container is busy — use border-beam (it outlines instead of filling).",
    "Small inline indicators — use thinking-indicator or shimmer-text.",
    "Just adding texture to an existing background — use grain.",
    "A fully custom GLSL effect — build it on shader-canvas.",
  ],
  props: [
    {
      name: "colors",
      type: '"signal" | "paper" | "jade" | "dusk" | "ember" | "glacier" | readonly string[]',
      default: '"signal"',
      description:
        "A preset, or 2–6 CSS colours (OKLCH, hex, rgb, `var(--kura-*)`). `signal` and `paper` are built from tokens and follow light/dark; the others are fixed palettes.",
    },
    {
      name: "distortion",
      type: "number",
      default: "0.5",
      description: "Organic noise warping of the colour field, 0–1.",
    },
    {
      name: "swirl",
      type: "number",
      default: "0.25",
      description: "Twist around the centre, 0–1. Keep ≤ 0.5 behind text.",
    },
    {
      name: "speed",
      type: "number",
      default: "1",
      description: "Animation speed multiplier. 0 renders a still frame.",
    },
    {
      name: "grain",
      type: "number",
      default: "0.12",
      description: "Film-grain amount, 0–1. A little grain hides banding on large surfaces.",
    },
    {
      name: "interactive",
      type: "boolean",
      default: "true",
      description: "Gently lens the colour field toward the pointer while it is over the element.",
    },
    {
      name: "paused",
      type: "boolean",
      default: "false",
      description: "Freeze the animation on the current frame.",
    },
    {
      name: "seed",
      type: "number",
      default: "0",
      description: "Changes where the colour wells start, so two gradients on a page differ.",
    },
    {
      name: "maxDpr",
      type: "number",
      default: "1.5",
      description: "Device-pixel-ratio cap. The field is soft, so 1–1.5 keeps it cheap.",
    },
    {
      name: "children",
      type: "React.ReactNode",
      description: "Content rendered on top of the gradient (it sits in normal flow).",
    },
  ],
  parts: [
    {
      name: "MeshGradient",
      dataSlot: "mesh-gradient",
      description:
        "Root container (`relative isolate overflow-hidden`). Size it with classes. `data-state` = animating | still.",
    },
    {
      name: "ShaderCanvas",
      dataSlot: "mesh-gradient-canvas",
      description: "The WebGL layer behind the children (aria-hidden).",
    },
    {
      name: "Fallback",
      dataSlot: "mesh-gradient-fallback",
      description: "Layered CSS radial gradients shown when WebGL2 is unavailable.",
    },
  ],
  a11y: {
    notes: [
      "The gradient is decorative and aria-hidden; children keep their normal semantics.",
      "Text on top needs contrast: use `signal`/`paper` with text-kura-fg, or a dark preset with light text, and check both themes.",
      "The pointer lens is purely visual; nothing is interactive about the gradient itself.",
    ],
    keyboard: [],
    reducedMotion:
      "Renders a single still frame (no flow, no pointer lens). Theme changes still redraw it.",
  },
  dependencies: { npm: [], kura: ["shader-canvas"] },
  related: ["aurora", "grain", "shader-canvas", "agent-orb", "particle-field"],
  tags: ["gradient", "mesh", "webgl", "shader", "background", "hero", "oklab", "ambient"],
  examples: [
    {
      name: "MeshGradientMinimal",
      kind: "minimal",
      title: "Theme-aware signal gradient",
      description: "Give it a size; the default `signal` preset follows light and dark.",
    },
    {
      name: "MeshGradientFull",
      kind: "full",
      title: "Presets and controls",
      description: "Every preset plus distortion, swirl, speed, grain and pause.",
    },
    {
      name: "MeshGradientHero",
      kind: "composition",
      title: "Hero section",
      description: "Headline, badge and Button rendered as children on top of the gradient.",
    },
  ],
  agentNotes: [
    'Always give the root a size (e.g. `className="h-64 w-full rounded-kura-xl"` or `min-h-80`); it has no intrinsic height without children.',
    "Children render in normal flow on top — use the root as the section itself (add padding/flex), not as an absolutely positioned layer.",
    "Custom colours are resolved once per theme change; CSS variables work (`['var(--kura-accent)', 'oklch(0.9 0.04 90)']`).",
    "Pair with `<Grain />` as the last child for a print-like finish on large heroes.",
    "Use at most one or two animated gradients per page; give each a different `seed`.",
  ],
});
