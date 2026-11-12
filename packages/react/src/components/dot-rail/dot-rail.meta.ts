import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "dot-rail",
  name: "DotRail",
  category: "feedback",
  status: "beta",
  description:
    "Progress as a row of dots: lit dots for what is done, faint dots for what is left, a pulsing lead dot while it moves. Also draws spans on a time axis.",
  whenToUse: [
    "Show determinate progress of a run, a step or a subagent (Kura never uses solid progress bars).",
    "Draw a span on a shared time axis: give it `start` and `value` and stack several rails (this is how trace-waterfall draws spans).",
    "A quiet meter inside a row, where a bar would be too heavy.",
  ],
  whenNotToUse: [
    "State with no amount (queued, running, done) — use status-glyph.",
    "Indeterminate loading — use spinner or thinking-indicator.",
    "Context-window usage with a breakdown — use context-meter.",
  ],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description:
        "How much is lit, 0–1. As progress it runs from the start; with `start` it is the span's length.",
    },
    {
      name: "start",
      type: "number",
      default: "0",
      description: "Where the lit run begins, 0–1, for a span on a shared axis.",
    },
    {
      name: "live",
      type: "boolean",
      default: "false",
      description: "Pulse the leading dot to show it is still moving.",
    },
    {
      name: "tone",
      type: '"ink" | "muted" | "ember" | "success" | "danger"',
      default: '"ink"',
      description:
        'Colour of the lit dots. "muted" for finished work, "ember" only for something waiting on a person.',
    },
    { name: "pitch", type: "number", default: "6", description: "Dot spacing in px." },
    {
      name: "label",
      type: "string",
      description:
        "Accessible name. With it the rail is a progressbar with aria-valuenow; without it, it is aria-hidden.",
    },
  ],
  parts: [
    {
      name: "DotRail",
      dataSlot: "dot-rail",
      description: "Root: the full row of faint dots. `data-tone`, `data-live`.",
    },
    { name: "Lit", dataSlot: "dot-rail-lit", description: "The lit run, snapped to whole dots." },
    { name: "Head", dataSlot: "dot-rail-head", description: "The pulsing lead dot when `live`." },
  ],
  a11y: {
    role: "progressbar",
    notes: [
      "With `label` it is a progressbar (aria-valuemin 0, aria-valuemax 100, aria-valuenow). Without `label` it is decorative and hidden; put the number in text next to it.",
      "Lit and unlit dots differ in brightness, not only colour.",
    ],
    reducedMotion: "The lead dot stops pulsing and the lit run changes length without easing.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["status-glyph", "trace-waterfall", "agent-fleet", "run-header", "context-meter"],
  tags: ["progress", "dots", "meter", "span", "timeline"],
  examples: [
    { name: "DotRailMinimal", kind: "minimal", title: "Progress" },
    { name: "DotRailFull", kind: "full", title: "Tones, live and spans" },
    {
      name: "DotRailComposition",
      kind: "composition",
      title: "A subagent row",
      description: "With AgentSigil and StatusGlyph, the way AgentFleet composes them.",
    },
  ],
  agentNotes: [
    "Needs the `kura-dots` utility from Kura's stylesheet (it ships with the kura-theme registry item).",
    "It snaps with the CSS round() function, so widths are whole dots; do not set a fractional pitch.",
    'Ember is reserved: only use tone="ember" when the thing is waiting on a person.',
  ],
});
