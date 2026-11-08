import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "trace-waterfall",
  name: "TraceWaterfall",
  category: "agent",
  status: "beta",
  description:
    "Span tree on a shared time axis for agent runs: nested agent, LLM, tool and retrieval spans, live bars, a details row and keyboard tree navigation.",
  whenToUse: [
    "Show where the time (and tokens, and money) went in an agent run: which model calls, tool calls and subagents ran, nested, and when.",
    "Debug a slow or failed run: spot the long LLM call, the failed `pnpm test`, the subagent that ran in parallel.",
    "Watch a run live: running spans grow against the axis and a 'now' line moves (pass `startedAt` or drive `now`).",
    "Inspect one span's input, output, error, model, tokens and cost inline by selecting it.",
  ],
  whenNotToUse: [
    "The agent's plan or todo list (what it intends to do) — use task-list.",
    "A narrative of steps with tool calls attached — use agent-timeline.",
    "Parallel subagents as a live roster with activity and progress — use agent-fleet.",
    "A single tool invocation — use tool-call.",
  ],
  props: [
    {
      name: "spans",
      type: "readonly TraceSpan[]",
      required: true,
      description:
        'Root spans (usually one agent span). TraceSpan = { id, name, kind: "agent" | "llm" | "tool" | "retrieval", start (ms since run start), end? (omit while running), status: AgentStatus, meta? (mono hint: path, command), model?, tokens? { input, output }, cost? (USD), input?, output?, error?, children? }.',
    },
    {
      name: "title",
      type: "React.ReactNode",
      default: '"Trace"',
      description: "Header title.",
    },
    {
      name: "actions",
      type: "React.ReactNode",
      description:
        "Controls on the right of the header (e.g. a replay or open-in-LangSmith button).",
    },
    {
      name: "now",
      type: "number",
      description:
        "Current run time in ms since start (a controlled clock). Running spans end here and the 'now' line sits here. Use it for replays and server-driven clocks.",
    },
    {
      name: "startedAt",
      type: "Date | number",
      description:
        "Wall-clock start of the run. When given (and `now` isn't), running spans grow live, ticking every 250ms. Without either, running spans end at the latest known time.",
    },
    {
      name: "selectedId",
      type: "string | null",
      description: "Selected span (controlled). Its details row opens under it.",
    },
    {
      name: "defaultSelectedId",
      type: "string | null",
      default: "null",
      description:
        "Initially selected span when uncontrolled. May name a span that doesn't exist yet; it opens when the span appears.",
    },
    {
      name: "onSelectedIdChange",
      type: "(id: string | null) => void",
      description: "Called when a span is selected, or with null when the selection is cleared.",
    },
    {
      name: "defaultCollapsedIds",
      type: "readonly string[]",
      description: "Spans whose subtrees start collapsed (e.g. noisy subagents).",
    },
    {
      name: "renderDetails",
      type: "(span: TraceSpan) => React.ReactNode",
      description:
        "Replace the details row body for a span (e.g. a CodeBlock with the diff a tool wrote). Return null to use the default stats + input/output.",
    },
    {
      name: "empty",
      type: "React.ReactNode",
      description: "Rendered when there are no spans. Default: 'No spans yet'.",
    },
    {
      name: "label",
      type: "string",
      default: '"Trace"',
      description: "Accessible name of the tree.",
    },
  ],
  parts: [
    {
      name: "TraceWaterfall",
      dataSlot: "trace-waterfall",
      description:
        'Root panel, a container-query context. `data-state="running" | "idle"`; contains a polite status region.',
    },
    {
      name: "Header",
      dataSlot: "trace-waterfall-header",
      description: "h-10 header: title, summary, actions.",
    },
    {
      name: "Summary",
      dataSlot: "trace-waterfall-summary",
      description:
        "Mono: span count · total duration · tokens · cost. Count/tokens/cost hide on narrow containers.",
    },
    {
      name: "Axis",
      dataSlot: "trace-waterfall-axis",
      description:
        "Sticky row with 'Span / Duration' over the tree and nice tick labels (0, 2m, 4m…) over the bars.",
    },
    {
      name: "Body",
      dataSlot: "trace-waterfall-body",
      description:
        "Scroll container. Give the root a height (e.g. `h-[480px]`) to scroll long traces under the sticky axis.",
    },
    {
      name: "Span",
      dataSlot: "trace-waterfall-span",
      description:
        'role="treeitem" with `data-kind`, `data-status`, `data-selected`; wraps the row and, when selected, its details.',
    },
    {
      name: "Row",
      dataSlot: "trace-waterfall-row",
      description:
        "h-8 grid row: indented tree cell (chevron, kind icon, name, mono meta, glyph for running/failed/waiting, duration) and the bar cell.",
    },
    {
      name: "Toggle",
      dataSlot: "trace-waterfall-toggle",
      description:
        "Chevron that collapses a subtree (pointer only; ArrowLeft/Right on the keyboard).",
    },
    {
      name: "Bar",
      dataSlot: "trace-waterfall-bar",
      description:
        "Positioned on the shared axis. Neutral greys by kind (LLM darkest), thin for agent spans; blue while running, red failed, amber waiting, ink when selected.",
    },
    {
      name: "Now",
      dataSlot: "trace-waterfall-now",
      description: "Hairline at the current time while any span is running.",
    },
    {
      name: "Details",
      dataSlot: "trace-waterfall-details",
      description:
        "Sunken row under the selected span: kind, start, duration, model, tokens, cost, then input and output/error.",
    },
    {
      name: "Duration",
      dataSlot: "trace-waterfall-duration",
      description: "Mono, tabular, width-reserved; ticks while the span runs.",
    },
    {
      name: "Empty",
      dataSlot: "trace-waterfall-empty",
      description: "Rendered when there are no spans.",
    },
  ],
  a11y: {
    role: "tree",
    notes: [
      "A WAI-ARIA tree: each span is a treeitem with aria-level/posinset/setsize, aria-expanded for subtrees and aria-selected; one roving tab stop.",
      "Each treeitem is labelled “bash pnpm test, tool, 38.4s, failed” — status is spoken, never colour-only. The selected span is described by its details row.",
      "A polite status region announces failures and “Trace complete, 11m 52s” — ticking durations are not announced.",
      "The axis, grid lines, bars and now-line are decorative (aria-hidden or inside labelled items).",
    ],
    keyboard: [
      { keys: "ArrowDown / ArrowUp", action: "Moves focus to the next / previous visible span." },
      {
        keys: "ArrowRight",
        action: "Expands a collapsed span; on an expanded span moves to its first child.",
      },
      {
        keys: "ArrowLeft",
        action: "Collapses an expanded span; otherwise moves to the parent span.",
      },
      { keys: "Home / End", action: "First / last visible span." },
      {
        keys: "Enter / Space",
        action: "Selects the focused span (opens details); again to close.",
      },
      { keys: "Escape", action: "Clears the selection." },
    ],
    reducedMotion:
      "Bars and the now-line jump to their new positions instead of easing; the chevron turns instantly; rows and details only fade.",
  },
  dependencies: { npm: ["lucide-react"], kura: ["status-glyph"] },
  related: ["task-list", "agent-fleet", "run-header", "tool-call", "agent-timeline"],
  tags: ["agent", "trace", "observability", "spans", "waterfall", "timeline", "tokens", "latency"],
  examples: [
    {
      name: "TraceWaterfallMinimal",
      kind: "minimal",
      title: "A finished turn",
      description: "One agent span with two LLM calls and a tool call.",
    },
    {
      name: "TraceWaterfallFull",
      kind: "full",
      title: "Replay of a run",
      description:
        "The 12-minute auth-client migration replayed on a controlled clock: subagents, a failing pnpm test (selected, with its error), the fix, review and PR. The axis rescales as the run grows.",
    },
    {
      name: "TraceWaterfallLive",
      kind: "state",
      title: "Live, from a wall clock",
      description:
        "A subagent that is still running: `startedAt` makes running bars grow in real time.",
    },
    {
      name: "TraceWaterfallCustomDetails",
      kind: "composition",
      title: "Custom details",
      description: "`renderDetails` shows the edit a tool made as a CodeBlock.",
    },
  ],
  agentNotes: [
    "Times are ms relative to the run start, not timestamps: convert with `span.start = +new Date(event.ts) - runStart`.",
    "Omit `end` (and set status running) for unfinished spans; pass `startedAt` (wall clock) or `now` so they grow.",
    "Put tokens/cost on leaf spans only. If every root span carries totals, the header uses the roots instead of summing.",
    "Ids must be unique across the whole tree; they drive selection, collapse state and focus.",
    "Give the root a fixed height for long traces; the axis stays sticky while the body scrolls.",
  ],
});
