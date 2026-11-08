import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "aurora",
  name: "Aurora",
  category: "effects",
  status: "beta",
  description:
    "Soft northern-lights background: folding light curtains drawn in a shader with premultiplied alpha, so it glows on dark and washes on light.",
  whenToUse: [
    "A sign-in, landing or 'welcome back' screen that should feel calm and a little magical.",
    "A night-themed hero or a header band above an agent dashboard.",
    "A background that must sit on top of an existing surface colour (it is transparent where there is no light).",
  ],
  whenNotToUse: [
    "A colourful blob background filling the whole area — use mesh-gradient.",
    "Showing that an agent is busy — use border-beam or thinking-indicator.",
    "A voice agent's presence — use agent-orb.",
    "Behind dense UI or long text: the curtains move; keep content short and centred.",
  ],
  props: [
    {
      name: "colors",
      type: '"signal" | "polar" | "ember" | "mist" | readonly [string, string, string]',
      default: '"signal"',
      description:
        "A preset, or three CSS colours `[lower edge, middle, upper fringe]`. signal uses the theme accent; polar is classic green-teal-blue.",
    },
    {
      name: "intensity",
      type: "number",
      default: "0.8",
      description: "Brightness of the curtains, 0–1.",
    },
    {
      name: "speed",
      type: "number",
      default: "1",
      description: "Animation speed multiplier. 0 renders a still frame.",
    },
    {
      name: "stars",
      type: "boolean",
      default: "true",
      description: "Twinkling stars behind the curtains. Only drawn when the background is dark.",
    },
    {
      name: "paused",
      type: "boolean",
      default: "false",
      description: "Freeze the animation on the current frame.",
    },
    { name: "maxDpr", type: "number", default: "1.5", description: "Device-pixel-ratio cap." },
    {
      name: "children",
      type: "React.ReactNode",
      description: "Content rendered on top, in normal flow.",
    },
  ],
  parts: [
    {
      name: "Aurora",
      dataSlot: "aurora",
      description:
        "Root container (`relative isolate overflow-hidden`). Give it a size and a background colour. `data-state` = animating | still.",
    },
    {
      name: "ShaderCanvas",
      dataSlot: "aurora-canvas",
      description: "Transparent WebGL layer behind the children (aria-hidden).",
    },
    {
      name: "Fallback",
      dataSlot: "aurora-fallback",
      description: "Blurred CSS radial gradients shown when WebGL2 is unavailable.",
    },
  ],
  a11y: {
    notes: [
      "Decorative and aria-hidden; children keep their semantics.",
      "The curtains sit mostly in the lower half; place text near the top or centre and check contrast in both themes.",
    ],
    keyboard: [],
    reducedMotion: "Renders one still frame (no drift, no twinkle). Theme changes redraw it.",
  },
  dependencies: { npm: [], kura: ["shader-canvas"] },
  related: ["mesh-gradient", "grain", "particle-field", "shader-canvas"],
  tags: ["aurora", "northern-lights", "background", "webgl", "shader", "hero", "night", "ambient"],
  examples: [
    {
      name: "AuroraMinimal",
      kind: "minimal",
      title: "Aurora on the canvas colour",
      description: "Give it a size and a background; the signal preset follows the theme.",
    },
    {
      name: "AuroraFull",
      kind: "full",
      title: "Presets, intensity, stars",
      description: "Every preset, intensity, stars and pause.",
    },
    {
      name: "AuroraSignIn",
      kind: "composition",
      title: "Sign-in hero",
      description: "Headline and Buttons over the aurora, finished with Grain.",
    },
  ],
  agentNotes: [
    "The canvas is transparent: set a background on the root (`bg-kura-canvas`, `bg-kura-surface-sunken`) — the aurora is light added on top of it.",
    "Give the root a height (`h-72`, `min-h-96`, `aspect-video`).",
    "Lift children above the canvas automatically (they are in flow); lift them above a `<Grain />` overlay with `relative z-10`.",
    "On light themes the curtains render as a deeper watercolour wash; check both themes.",
  ],
});
