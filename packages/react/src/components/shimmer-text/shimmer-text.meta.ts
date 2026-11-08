import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "shimmer-text",
  name: "ShimmerText",
  category: "feedback",
  status: "beta",
  description:
    "A sweep of light over ink across text, with a faint vermilion glint at its crest — the canonical “Thinking…” / “Searching…” label for in-progress AI work.",
  whenToUse: [
    "Show that a model or agent is working: “Thinking…”, “Searching the web…”, “Reading 12 files…”.",
    "Label the current step of a running tool call or reasoning trace.",
    "A lightweight inline loading label where a spinner would be too mechanical.",
  ],
  whenNotToUse: [
    "Long paragraphs or body text — the sweep hurts legibility beyond a short phrase.",
    "Determinate progress (uploads, token budgets) — use a progress bar or context-meter.",
    "Streaming the model's answer itself — use streaming-text.",
    "A standalone animated dot/orb indicator — use thinking-indicator or agent-orb.",
  ],
  props: [
    {
      name: "children",
      type: "React.ReactNode",
      required: true,
      description: "The text to shimmer. Plain text reads best; inline elements are allowed.",
    },
    {
      name: "active",
      type: "boolean",
      default: "true",
      description: "Animate the sweep. Set false when the work finishes to settle into muted text.",
    },
    {
      name: "duration",
      type: "number",
      default: "2",
      description:
        "Seconds per sweep (eased in and out, so it rests between passes). Keep between 1.5 (urgent) and 3 (calm).",
    },
    {
      name: "spread",
      type: "number",
      default: "30",
      description: "Width of the bright band as a % of the text width (clamped 5–80).",
    },
    {
      name: "as",
      type: '"span" | "p" | "div" | "strong" | "em"',
      default: '"span"',
      description: "Element to render.",
    },
  ],
  parts: [
    {
      name: "ShimmerText",
      dataSlot: "shimmer-text",
      description: "A single inline element; `data-active` reflects the `active` prop.",
    },
  ],
  a11y: {
    notes: [
      "The text stays real text: screen readers read it normally; the animation is purely visual.",
      'Not a live region. Wrap the label in an element with role="status" (or aria-live="polite") if the change of state should be announced.',
      "Colors come from fg/fg-subtle tokens (plus a touch of accent-text at the crest) so contrast holds in light and dark mode.",
    ],
    reducedMotion: "The sweep is removed; the text renders as static muted text.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["thinking-indicator", "reasoning", "tool-call", "streaming-text"],
  tags: ["loading", "thinking", "status", "text", "animation", "shimmer", "skeleton", "progress"],
  examples: [
    {
      name: "ShimmerTextMinimal",
      kind: "minimal",
      title: "Thinking label",
      description: "The smallest correct usage.",
    },
    {
      name: "ShimmerTextFull",
      kind: "full",
      title: "Tuned sweep",
      description:
        "Every prop: element, speed, band width, and toggling `active` when work completes.",
    },
    {
      name: "ShimmerTextInToolStep",
      kind: "composition",
      title: "Agent step with status region",
      description: "A tool-call style row announcing progress politely to screen readers.",
    },
  ],
  agentNotes: [
    'Server-component safe: no hooks, pure CSS animation. No "use client" needed to render it.',
    "Flip `active` to false instead of unmounting when work completes, so layout does not jump.",
    "Keep the label under ~6 words and end with an ellipsis (…) while active.",
  ],
});
