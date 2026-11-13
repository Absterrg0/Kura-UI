import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "status-glyph",
  name: "StatusGlyph",
  category: "primitives",
  status: "beta",
  description:
    "The Kura status glyph: a ring of dots for queued, running, waiting on you, done, failed, skipped and paused. Every agent surface draws state with it.",
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
        "The state to draw. queued = a ring of eight dots; running = a light chasing round the ring; waiting = ember ring with a blinking centre (the agent needs you); done = a solid disc; failed = cross; skipped = dash; paused = two bars.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "13, 15 or 20px.",
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
      description: "Root span with `data-status`; contains one 15-unit SVG of dots.",
    },
  ],
  a11y: {
    notes: [
      'Has role="img" with the state as its name, unless label={null}, in which case it is aria-hidden.',
      "State is never conveyed by colour alone: each state is a distinct dot pattern. Ember is used only for waiting on a person.",
    ],
    reducedMotion:
      "The running light stops chasing and rests on a quarter of the ring; the waiting centre stops blinking.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["task-list", "agent-fleet", "trace-waterfall", "run-header", "tool-call"],
  tags: ["status", "agent", "glyph", "dots", "dot-matrix"],
  examples: [
    { name: "StatusGlyphMinimal", kind: "minimal", title: "Running" },
    { name: "StatusGlyphFull", kind: "full", title: "Every state and size" },
    {
      name: "StatusGlyphComposition",
      kind: "composition",
      title: "With agent sigils",
      description: "A crew list: each agent's face on the left, its state on the right.",
    },
  ],
  agentNotes: [
    "Use this rather than inventing per-component status icons, pills or spinners, so all agent surfaces share one vocabulary.",
    "Never recolour it: ember is reserved for `waiting` (a person is needed).",
  ],
});
