import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "spinner",
  name: "Spinner",
  category: "primitives",
  status: "stable",
  description:
    "Eight-segment radial spinner for indeterminate loading that inherits the current text color.",
  whenToUse: [
    "Indeterminate waits on a control: a loading button, a pending row, a fetching list.",
    "Small inline busy indicators next to text.",
  ],
  whenNotToUse: [
    "AI ‘thinking’ states — use shimmer-text or thinking-indicator; they read as the model working, not the network.",
    "Known progress — use a progress bar or context-meter.",
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
    reducedMotion: "Rotation is replaced by a slow opacity pulse.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["button", "shimmer-text", "thinking-indicator"],
  tags: ["loading", "spinner", "busy", "progress", "indeterminate"],
  examples: [
    { name: "SpinnerMinimal", kind: "minimal", title: "Default" },
    { name: "SpinnerFull", kind: "full", title: "Sizes and colors" },
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
