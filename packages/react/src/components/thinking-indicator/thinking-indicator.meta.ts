import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "thinking-indicator",
  name: "ThinkingIndicator",
  category: "feedback",
  status: "beta",
  description:
    "Compact AI “thinking” indicators — three dots, a pulsing dot, or cycling status text — inside a polite live region.",
  whenToUse: [
    "The assistant has received a prompt but not produced its first token yet.",
    "A pending assistant message bubble or a placeholder row in a chat list.",
    "Cycling short status lines while an agent works: “Searching…”, “Reading 4 files…” (variant text).",
    "A tiny inline signal next to a label, tab or button that work is in progress.",
  ],
  whenNotToUse: [
    "Shimmering an existing label in place — use shimmer-text.",
    "Network or file loading that is not model thinking — use spinner.",
    "A voice agent's state — use agent-orb.",
    "Streaming the answer itself — use streaming-text.",
  ],
  props: [
    {
      name: "variant",
      type: '"dots" | "pulse" | "text"',
      default: '"dots"',
      description:
        "dots: three bouncing dots (staggered). pulse: a breathing dot with an expanding ring. text: cycling status lines with no shape.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "Dot size 4 / 6 / 8 px; text 12 / 14 / 15 px.",
    },
    {
      name: "label",
      type: "string",
      default: '"Thinking"',
      description:
        "Accessible status text. Announced once when the indicator mounts or the label changes — never on each animation cycle.",
    },
    {
      name: "messages",
      type: "readonly string[]",
      description:
        "Status lines for the text variant. Several lines cycle with a cross-fade (and only `label` is announced); a single line is shown and announced as is — update it as the agent progresses.",
    },
    {
      name: "interval",
      type: "number",
      default: "2400",
      description: "Milliseconds each message stays up when cycling (minimum 600).",
    },
  ],
  parts: [
    {
      name: "ThinkingIndicator",
      dataSlot: "thinking-indicator",
      description:
        "Inline root with role=status. `data-variant` and `data-size` mirror the props. Colour is currentColor (text-kura-accent by default).",
    },
    {
      name: "Shape",
      dataSlot: "thinking-indicator-shape",
      description: "The animated glyph (aria-hidden).",
    },
    {
      name: "Text",
      dataSlot: "thinking-indicator-text",
      description:
        "Text variant only: all messages stacked in one grid cell (width = widest message, so no layout shift); the active one has data-active=true.",
    },
  ],
  a11y: {
    role: "status",
    notes: [
      "role=status + aria-live=polite: screen readers hear the label once, politely, not a stream of updates.",
      "Shapes are aria-hidden; a visually hidden label carries the meaning.",
      "When several messages cycle, the cycling text is aria-hidden and only `label` is announced, so the live region does not spam.",
      "Colour is not the only signal: the text variant and the label describe the state.",
    ],
    keyboard: [],
    reducedMotion:
      "Loops stop. Dots show three static dots of rising opacity and the pulse is a still dot; text lines swap without travel.",
  },
  dependencies: { npm: [], kura: ["shimmer-text"] },
  related: ["shimmer-text", "agent-orb", "streaming-text", "message", "run-header"],
  tags: ["loading", "thinking", "typing", "dots", "status", "indicator", "pending", "ai"],
  examples: [
    { name: "ThinkingIndicatorMinimal", kind: "minimal", title: "Thinking dots" },
    {
      name: "ThinkingIndicatorFull",
      kind: "full",
      title: "Every variant and size",
      description: "dots and pulse at sm/md/lg, cycling text, and a muted recolour.",
    },
    {
      name: "ThinkingIndicatorInMessage",
      kind: "composition",
      title: "Pending assistant message",
      description: "Text variant inside a message bubble with a Stop Button.",
    },
  ],
  agentNotes: [
    'Recolour with a text class (`className="text-kura-fg-subtle"`); shapes use currentColor. Keep the blue default when it means “the model is working”; use a neutral grey for secondary, low-priority activity.',
    "Replace the indicator with the streamed message once the first token arrives; do not show both.",
    "For real progress, pass one message and update it (`messages={[step]}`) — each change is announced. For ambient variety, pass several and let them cycle.",
    "Keep messages short (≤ 5 words) and end with an ellipsis.",
  ],
});
