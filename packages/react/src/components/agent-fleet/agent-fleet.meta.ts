import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "agent-fleet",
  name: "AgentFleet",
  category: "agent",
  status: "experimental",
  description:
    "Panel of parallel subagents: status, name and role, live activity, thin progress, elapsed time, tokens and cost, with a fleet summary and selection.",
  whenToUse: [
    "An orchestrator delegates work to several subagents at once (explorer, test-writer, reviewer) and the human needs to see who is doing what.",
    "A master/detail layout where choosing a subagent shows its transcript or tool calls next to the list.",
    "Spotting at a glance which subagent is waiting for approval or has failed ('3 running · 1 waiting · 2 done').",
  ],
  whenNotToUse: [
    "Sequential steps of one agent — use task-list or agent-timeline.",
    "Timing and nesting of spans inside a run — use trace-waterfall.",
    "The run as a whole (title, cost, stop) — use run-header, and put AgentFleet under it.",
  ],
  props: [
    {
      name: "agents",
      type: "FleetAgent[]",
      required: true,
      description:
        "{ id, name, role?, status, activity?, progress? (0–1), startedAt?, endedAt?, tokens?, cost? }, in display order. activity is the current action while running, or the result once done/failed.",
    },
    {
      name: "title",
      type: "React.ReactNode",
      default: '"Subagents"',
      description: "Header title; the count follows it.",
    },
    {
      name: "selectedId",
      type: "string | null",
      description: "Selected agent id (controlled).",
    },
    {
      name: "defaultSelectedId",
      type: "string | null",
      default: "null",
      description: "Initially selected agent id when uncontrolled.",
    },
    {
      name: "onSelect",
      type: "(id: string) => void",
      description:
        "Called when a row is chosen by click, Enter or Space. When set (or selectedId is given) the list becomes a single-select listbox.",
    },
    {
      name: "density",
      type: '"compact" | "comfortable"',
      default: '"comfortable"',
      description:
        "comfortable = two lines (name + role, then activity; tokens, cost and clock on the right, progress under them). compact = one 36px row (name, activity, progress, tokens, clock).",
    },
    {
      name: "empty",
      type: "React.ReactNode",
      description: "Replaces the default empty state ('No subagents yet').",
    },
  ],
  parts: [
    {
      name: "AgentFleet",
      dataSlot: "agent-fleet",
      description:
        "Root panel with `data-density`. A size container: cost, tokens and summary drop out when narrow.",
    },
    {
      name: "Header",
      dataSlot: "agent-fleet-header",
      description:
        "Title, count and agent-fleet-summary ('3 running · 1 waiting · 2 done'; waiting in amber, failed in red).",
    },
    {
      name: "Agent",
      dataSlot: "agent-fleet-agent",
      description:
        "One row (<li>, role=option when selectable) with `data-status`, `data-selected`. Selected = active fill + 2px blue bar on the left.",
    },
    { name: "Name", dataSlot: "agent-fleet-name", description: "Agent name." },
    { name: "Role", dataSlot: "agent-fleet-role", description: "Role (comfortable only)." },
    {
      name: "Activity",
      dataSlot: "agent-fleet-activity",
      description:
        "One truncated line; shimmers while running, amber when waiting, red when failed.",
    },
    {
      name: "Progress",
      dataSlot: "agent-fleet-progress",
      description: "3px bar while live: blue running, amber waiting, grey paused.",
    },
    {
      name: "Tokens",
      dataSlot: "agent-fleet-tokens",
      description: "Mono token total, e.g. 84.2k.",
    },
    {
      name: "Cost",
      dataSlot: "agent-fleet-cost",
      description: "Mono cost (comfortable, wide containers).",
    },
    {
      name: "Elapsed",
      dataSlot: "agent-fleet-elapsed",
      description: "Mono clock; ticks while live, frozen at endedAt − startedAt.",
    },
    { name: "Empty", dataSlot: "agent-fleet-empty", description: "Empty state." },
  ],
  a11y: {
    role: "listbox (selectable) or list",
    notes: [
      "The list is labelled by the title. Selectable rows are options with aria-selected and a roving tabindex (one Tab stop).",
      "Each row's status glyph is a labelled image ('Running', 'Waiting for you'), so status is not colour-only; progress is read as a percentage.",
      "A polite status region announces only transitions out of running ('client-patcher done', 'test-writer failed'), not ticking clocks or progress.",
    ],
    keyboard: [
      { keys: "ArrowDown / ArrowUp (j / k)", action: "Move focus between agents" },
      { keys: "Home / End", action: "First / last agent" },
      { keys: "Enter / Space", action: "Select the focused agent" },
    ],
    reducedMotion:
      "New rows fade in without rising; running glyphs, activity shimmer and progress width transitions stop.",
  },
  dependencies: { npm: ["@ui-sdk/react"], kura: ["shimmer-text", "status-glyph"] },
  related: ["run-header", "task-list", "trace-waterfall", "tool-call", "agent-timeline"],
  tags: [
    "agent",
    "subagents",
    "fleet",
    "parallel",
    "orchestration",
    "status",
    "listbox",
    "progress",
  ],
  examples: [
    {
      name: "AgentFleetMinimal",
      kind: "minimal",
      title: "Three subagents",
      description: "Done, running and queued; not selectable.",
    },
    {
      name: "AgentFleetFull",
      kind: "full",
      title: "Live fleet",
      description:
        "Six subagents advance: an approval clears, patches land, tests fail, the reviewer starts. Controlled selection.",
    },
    {
      name: "AgentFleetCompact",
      kind: "variant",
      title: "Compact",
      description: "One 36px row per agent.",
    },
    {
      name: "AgentFleetEmpty",
      kind: "state",
      title: "Empty",
      description: "Before any delegation.",
    },
    {
      name: "AgentFleetComposition",
      kind: "composition",
      title: "Master / detail with tool-call",
      description: "Selecting a subagent shows its recent tool calls.",
    },
  ],
  agentNotes: [
    `Agent-ready (ui-sdk): createAgent lists the fleet by its title with a status summary as its value and each subagent (name, status, activity) as an item; when selectable, an agent can \`select\` one to show the person.`,
    "Give every agent a stable id; rows key on it and the announcer diffs statuses by id.",
    "Write activity in present tense while running ('Rewriting mocks in login.test.ts') and as a result when done ('Found 23 calls in 9 files'), or the failure when failed.",
    "Pass startedAt from the harness (not Date.now() at render) and endedAt when the agent stops so clocks stay correct across reloads.",
    "progress is optional; omit it for open-ended work rather than inventing a number.",
  ],
});
