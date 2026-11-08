import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "task-list",
  name: "TaskList",
  category: "agent",
  status: "beta",
  description:
    "The agent's plan as a todo list: segmented progress, shimmering current task, live and final durations, failure details, sub-tasks and a folded Completed group.",
  whenToUse: [
    "Show the todo list a coding agent maintains while it works (Claude Code TodoWrite, Codex plan, Cursor tasks) in a run sidebar or panel.",
    "Give a dense, scannable answer to 'what is the agent doing and what is left?' — '3 of 7' plus one row per task.",
    "Let the user click a task to show its output or diff next to the list (`onSelect` + `selectedId`).",
    "Show a failed task with its reason (`detail`) and a task blocked on the human (`waiting`).",
  ],
  whenNotToUse: [
    "A narrative step timeline with connectors and inline tool calls under each step — use agent-timeline.",
    "Parallel subagents working at the same time — use agent-fleet.",
    "Timing analysis of nested spans on a shared time axis — use trace-waterfall.",
    "A single tool invocation with arguments and result — use tool-call.",
  ],
  props: [
    {
      name: "items",
      type: "readonly TaskListItem[]",
      required: true,
      description:
        'The plan, in order. TaskListItem = { id, title, status: "queued" | "running" | "waiting" | "done" | "failed" | "skipped" | "paused", detail?, durationMs?, startedAt?, children? }.',
    },
    {
      name: "title",
      type: "React.ReactNode",
      default: '"Plan"',
      description: "Heading in the panel header (panel variant only).",
    },
    {
      name: "actions",
      type: "React.ReactNode",
      description:
        "Controls on the right of the header, after the progress bar (e.g. an IconButton).",
    },
    {
      name: "variant",
      type: '"panel" | "plain"',
      default: '"panel"',
      description:
        "panel = card with header, '3 of 7' and segmented progress; plain = rows only, for embedding in your own sidebar.",
    },
    {
      name: "collapseCompleted",
      type: "boolean",
      default: "true",
      description:
        "Fold the leading run of finished (done/skipped) items into a 'Completed (n)' row while work remains. Needs at least three finished items; a fully finished plan is shown in full.",
    },
    {
      name: "completedOpen",
      type: "boolean",
      description: "Whether the Completed group is expanded (controlled).",
    },
    {
      name: "defaultCompletedOpen",
      type: "boolean",
      default: "false",
      description: "Initial expanded state of the Completed group when uncontrolled.",
    },
    {
      name: "onCompletedOpenChange",
      type: "(open: boolean) => void",
      description: "Called when the Completed group is toggled.",
    },
    {
      name: "selectedId",
      type: "string | null",
      description:
        "Highlighted item (bg-kura-active plus a 2px accent bar). Purely visual; pair with onSelect.",
    },
    {
      name: "onSelect",
      type: "(id: string, item: TaskListItem) => void",
      description:
        "Makes rows buttons (with Up/Down/Home/End navigation) and reports the clicked item. Without it rows are static.",
    },
    {
      name: "empty",
      type: "React.ReactNode",
      description: "Content when `items` is empty. Default: a quiet 'No plan yet' state.",
    },
    {
      name: "label",
      type: "string",
      description:
        "Accessible name of the list. Default: `title` when it is a string, else 'Plan'.",
    },
  ],
  parts: [
    {
      name: "TaskList",
      dataSlot: "task-list",
      description:
        'Root. `data-variant`, `data-progress="done/total"`; contains a polite status region.',
    },
    {
      name: "Header",
      dataSlot: "task-list-header",
      description: "h-10 header: title, mono 'n of m', segmented progress, actions.",
    },
    {
      name: "Progress",
      dataSlot: "task-list-progress",
      description:
        "One 4px segment per top-level item, coloured by status (neutral done, blue running, amber waiting, red failed).",
    },
    {
      name: "Completed",
      dataSlot: "task-list-completed",
      description:
        'The folded group of finished items. `data-state="open" | "closed"`; its button has aria-expanded.',
    },
    {
      name: "Item",
      dataSlot: "task-list-item",
      description:
        '<li> with `data-status` and `data-selected`; the running item has aria-current="step".',
    },
    {
      name: "Row",
      dataSlot: "task-list-row",
      description:
        "The row: StatusGlyph, title, detail, duration. A <button> when onSelect is set.",
    },
    {
      name: "Title",
      dataSlot: "task-list-title",
      description:
        "Shimmers while running; muted when done; struck through when skipped. Status is spoken after it.",
    },
    {
      name: "Detail",
      dataSlot: "task-list-detail",
      description: "Second line. Red for failed, amber for waiting, subtle otherwise.",
    },
    {
      name: "Duration",
      dataSlot: "task-list-duration",
      description:
        "Mono, tabular, width-reserved. Live clock (0:42) while running, final duration (1m 12s) after.",
    },
    {
      name: "Children",
      dataSlot: "task-list-children",
      description: "Nested <ul> of sub-tasks with a hairline guide; the parent shows 'done/total'.",
    },
    {
      name: "Empty",
      dataSlot: "task-list-empty",
      description: "Rendered when there are no items.",
    },
  ],
  a11y: {
    role: "list",
    notes: [
      'A <ul> labelled by `label`/`title`; each item speaks its status after the title (“Run pnpm test (failed)”), and the running item has aria-current="step".',
      "A polite status region announces the current task (“Task 4 of 7: Patch src/middleware.ts”), a failure, “Waiting for you” or “All tasks complete”. Live timers are never announced.",
      "With onSelect, rows are buttons with aria-pressed reflecting selectedId; the Completed toggle has aria-expanded/aria-controls.",
      "Status is never colour-only: the glyph shape and the spoken status carry it.",
    ],
    keyboard: [
      { keys: "Tab", action: "Moves into the list (rows are buttons when onSelect is set)." },
      { keys: "ArrowDown / ArrowUp", action: "Moves focus to the next / previous row." },
      { keys: "Home / End", action: "Moves focus to the first / last row." },
      {
        keys: "Enter / Space",
        action: "Selects the focused task, or toggles the Completed group.",
      },
    ],
    reducedMotion:
      "Rows fade in without rising, the title shimmer and running segment pulse stop, and the chevron turns without animating.",
  },
  dependencies: { npm: ["lucide-react"], kura: ["shimmer-text", "status-glyph"] },
  related: ["agent-timeline", "agent-fleet", "run-header", "trace-waterfall", "status-glyph"],
  tags: ["agent", "plan", "todo", "tasks", "checklist", "progress", "claude-code", "run"],
  examples: [
    {
      name: "TaskListMinimal",
      kind: "minimal",
      title: "A plan in progress",
      description: "Two done, one running with a live timer, one queued.",
    },
    {
      name: "TaskListFull",
      kind: "full",
      title: "Live run",
      description:
        "The auth-client migration plays out: finished tasks fold into Completed, sub-tasks tick, the test run fails, a fix task appears, the re-run passes, the reviewer signs off and the PR opens.",
    },
    {
      name: "TaskListStates",
      kind: "state",
      title: "Every state",
      description: "Done, skipped, waiting for approval, failed with a reason, paused and queued.",
    },
    {
      name: "TaskListComposition",
      kind: "composition",
      title: "Plan beside output",
      description:
        "The plain variant in a sidebar; selecting a task shows its output on the right.",
    },
  ],
  agentNotes: [
    "Map a model-maintained todo list directly: pending → queued, in_progress → running, completed → done. Keep ids stable so rows don't remount.",
    "Pass `startedAt` for the running item (from your server) so the live timer survives reloads; pass `durationMs` once it finishes.",
    "Only one top-level item should be `running`; it carries the blue signal and the shimmer.",
    "Use `waiting` (amber) only when the agent is blocked on the human, and put the ask in `detail`.",
    "The Completed fold only collapses the *leading* finished items, so a failed task in the middle is never hidden.",
  ],
});
