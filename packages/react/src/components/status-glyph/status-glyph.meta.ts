import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "status-glyph",
  name: "StatusGlyph",
  category: "primitives",
  status: "beta",
  description:
    "Internal status glyph shared by agent surfaces: queued, running, waiting on you, done, failed, skipped and paused, drawn crisply in SVG.",
  whenToUse: [
    "Inside an agent surface (task list, fleet, trace, run header) to show the state of a run, step or subagent the same way everywhere.",
  ],
  whenNotToUse: [
    "A whole tool invocation with arguments and a timer — use tool-call.",
    "A general loading indicator with no agent state — use thinking-indicator.",
  ],
  props: [
    {
      name: "status",
      type: '"queued" | "running" | "waiting" | "done" | "failed" | "skipped" | "paused"',
      required: true,
      description:
        "The state to draw. running = turning arc in the signal colour; waiting = amber ring with a pulsing dot (the agent needs you).",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "14, 16 or 20px.",
    },
    {
      name: "label",
      type: "string | null",
      description:
        'Spoken text (role="img"). Default the state name, e.g. "Running". Pass null when adjacent text already states it.',
    },
  ],
  parts: [
    {
      name: "StatusGlyph",
      dataSlot: "status-glyph",
      description: "Root span with `data-status`; contains one 16-unit SVG.",
    },
  ],
  a11y: {
    notes: [
      'Has role="img" with the state as its name, unless label={null}, in which case it is aria-hidden.',
      "State is never conveyed by colour alone: each state has a distinct shape.",
    ],
    reducedMotion: "The running arc stops turning and the waiting dot stops pulsing.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["task-list", "agent-fleet", "trace-waterfall", "run-header", "tool-call"],
  tags: ["status", "agent", "glyph", "internal"],
  examples: [
    { name: "StatusGlyphMinimal", kind: "minimal", title: "Running" },
    { name: "StatusGlyphFull", kind: "full", title: "Every state and size" },
  ],
  agentNotes: [
    "Use this rather than inventing per-component status dots, so all agent surfaces share one vocabulary.",
  ],
});
