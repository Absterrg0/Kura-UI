import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "agent-timeline",
  name: "AgentTimeline",
  category: "agent",
  status: "beta",
  description:
    "Vertical plan tracker for multi-step agents: queued/active/done/failed/skipped steps, nested sub-steps, live durations and a connector that fills.",
  whenToUse: [
    "Show an agent's plan and its progress (coding agents, research agents, deploy pipelines driven by a model).",
    "Show a todo list the model maintains (Claude Code / Cursor style task lists) with the current step highlighted.",
    "Nest sub-steps under a step, or attach a ToolCall / CodeBlock to a step via `content`.",
  ],
  whenNotToUse: [
    "A single tool invocation — use tool-call.",
    "Free-form model thinking — use reasoning.",
    "Generic (non-agent) wizards or checkout steppers — use a regular stepper; the active state here uses the AI signal colour.",
  ],
  props: [
    {
      name: "steps",
      type: "readonly AgentTimelineStep[]",
      required: true,
      description:
        'The plan, in display order. AgentTimelineStep = { id, title, status: "queued" | "active" | "done" | "failed" | "skipped", description?, duration? (ms), startedAt?, steps? (nested), content? }.',
    },
    {
      name: "label",
      type: "string",
      default: '"Agent progress"',
      description: "Accessible name of the list (e.g. the task name).",
    },
    {
      name: "size",
      type: '"sm" | "md"',
      default: '"md"',
      description:
        "md for plan panels, sm for dense sidebars. Nested sub-steps always render at sm.",
    },
  ],
  parts: [
    {
      name: "AgentTimeline",
      dataSlot: "agent-timeline",
      description:
        'Root. `data-size`, `data-progress="done/total"`; contains a polite status region.',
    },
    {
      name: "List",
      dataSlot: "agent-timeline-list",
      description: "The <ol> (nested lists for sub-steps).",
    },
    {
      name: "Step",
      dataSlot: "agent-timeline-step",
      description: '<li> with `data-status`; the active step has `aria-current="step"`.',
    },
    {
      name: "Node",
      dataSlot: "agent-timeline-node",
      description:
        "Status node: hollow ring (queued), blue pulse (active), check (done), cross (failed), dash (skipped).",
    },
    {
      name: "Connector",
      dataSlot: "agent-timeline-connector",
      description:
        "Hairline track to the next step; its fill scales in from the top (`data-filled`) once the step is done or skipped.",
    },
    {
      name: "Title",
      dataSlot: "agent-timeline-title",
      description: "Shimmers while active; struck through when skipped.",
    },
    {
      name: "Duration",
      dataSlot: "agent-timeline-duration",
      description: "Mono tabular duration; ticks live for the active step.",
    },
    {
      name: "Description",
      dataSlot: "agent-timeline-description",
      description: "Muted secondary line (danger-tinted on failure).",
    },
    {
      name: "Content",
      dataSlot: "agent-timeline-content",
      description: "The step's `content` slot.",
    },
  ],
  a11y: {
    role: "list",
    notes: [
      'Rendered as an ordered list; each step\'s status is spoken after its title (“Edit files (in progress)”) and the active step has aria-current="step".',
      "A polite status region announces “Step 3 of 5”, “A step failed” or “All steps complete” — the live timers are never announced.",
      "Nodes and connectors are decorative (aria-hidden); status is never conveyed by colour alone.",
    ],
    reducedMotion:
      "The active pulse and title shimmer stop; connectors fade in instead of growing; check/cross icons appear without scale.",
  },
  dependencies: { npm: [], kura: ["shimmer-text", "status-glyph"] },
  related: ["tool-call", "reasoning", "approval-prompt", "shimmer-text"],
  tags: ["agent", "plan", "timeline", "steps", "progress", "todo", "stepper", "tasks"],
  examples: [
    {
      name: "AgentTimelineMinimal",
      kind: "minimal",
      title: "Three steps",
      description: "Done, active and queued.",
    },
    {
      name: "AgentTimelineFull",
      kind: "full",
      title: "Live agent run",
      description:
        "A plan that progresses on its own: live timers, nested sub-steps, a description, filling connectors.",
    },
    {
      name: "AgentTimelineStates",
      kind: "state",
      title: "Every state, small",
      description: "Done, skipped, failed and queued at size sm.",
    },
    {
      name: "AgentTimelineWithTools",
      kind: "composition",
      title: "Steps with tool calls",
      description: "Inline ToolCalls attached to steps through `content`, inside a task card.",
    },
  ],
  agentNotes: [
    "Keep `id`s stable across updates so timers and connector transitions animate instead of remounting.",
    "Only one step should be `active` at a time per level; it carries the blue signal.",
    "Pass `duration` (ms) for finished steps; omit it for the active step to get a live timer (or pass `startedAt` from your server).",
    "Map a model-maintained todo list: pending → queued, in_progress → active, completed → done.",
  ],
});
