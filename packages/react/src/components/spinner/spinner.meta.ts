import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "spinner",
  name: "Spinner",
  category: "primitives",
  status: "stable",
  description:
    "The Kura spinner: a ring of dots with a light chasing round it, for indeterminate loading; inherits the current text color.",
  whenToUse: [
    "Indeterminate waits on a control: a loading button, a pending row, a fetching list.",
    "Small inline busy indicators next to text.",
  ],
  whenNotToUse: [
    "An agent's state — use status-glyph (running is the same chasing ring, with the other states beside it).",
    "Known progress — use dot-rail or context-meter.",
    "Inside a Button — pass `loading` to button instead.",
  ],
  props: [
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "12px, 16px or 20px.",
    },
    {
      name: "label",
      type: "string | null",
      default: '"Loading"',
      description:
        "Accessible label (role=status). Pass null when a parent already announces loading.",
    },
  ],
  a11y: {
    role: "status",
    notes: [
      'With a label it renders role="status" containing visually hidden label text; with label={null} it is aria-hidden.',
    ],
    reducedMotion:
      "Holds still, like a running status glyph: the light rests on a quarter of the ring.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["button", "shimmer-text", "thinking-indicator"],
  tags: ["loading", "spinner", "busy", "progress", "indeterminate"],
  examples: [
    { name: "SpinnerMinimal", kind: "minimal", title: "Default" },
    { name: "SpinnerFull", kind: "full", title: "Three sizes, alone and inline" },
    {
      name: "SpinnerSourcesList",
      kind: "composition",
      title: "Syncing knowledge sources",
      description:
        "Per-row spinners for indexing, a loading Sync now Button and a Reconnect action for a failed source.",
    },
  ],
  agentNotes: ["Color it with a text-* class on the spinner or a parent; it uses currentColor."],
});
