import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "run-header",
  name: "RunHeader",
  category: "agent",
  status: "experimental",
  description:
    "Header for one agent run: title, agent, model, branch, status, live elapsed clock, tokens, cost vs budget, step progress and Stop/Pause controls.",
  whenToUse: [
    "The top of a page or pane that shows one agent session (Claude Code, Codex, Devin-style runs): what it is doing, how long, how much it costs, and a way to stop it.",
    "A dense status row above a run's transcript, plan or fleet (variant='bar').",
    "Showing spend against a per-run budget; the cost turns red past 100%.",
    "Giving the human Stop / Pause / Resume with keyboard shortcuts while an agent works.",
  ],
  whenNotToUse: [
    "The run's step-by-step plan — use task-list (todo-style) or agent-timeline (steps with connectors).",
    "Parallel subagents inside a run — use agent-fleet.",
    "Context-window usage of one conversation — use context-meter.",
    "A single tool invocation — use tool-call.",
  ],
  props: [
    {
      name: "title",
      type: "React.ReactNode",
      required: true,
      description: 'What the run is doing, e.g. "Migrate session API to @acme/auth". Truncates.',
    },
    {
      name: "agent",
      type: "string",
      description: 'Agent name, e.g. "Kura". Panel meta line only.',
    },
    {
      name: "model",
      type: "string",
      description: 'Model id in mono, e.g. "claude-opus-5-5". Panel meta line only.',
    },
    {
      name: "status",
      type: '"queued" | "running" | "waiting" | "done" | "failed" | "skipped" | "paused"',
      required: true,
      description:
        "Run state, drawn with StatusGlyph and a word. running = chasing ring + 'Running'; waiting = ember 'Needs you'; done = 'Completed'; failed = red; skipped = 'Stopped'. queued/running/waiting/paused keep the clock ticking.",
    },
    {
      name: "startedAt",
      type: "Date | number",
      description:
        "Run start. Drives the live elapsed clock (m:ss, h:mm:ss). Without it the clock shows –:––.",
    },
    {
      name: "endedAt",
      type: "Date | number",
      description:
        "Run end. Freezes the clock at endedAt − startedAt (use for finished or persisted runs).",
    },
    {
      name: "tokens",
      type: "{ input: number; output: number }",
      description: 'Token usage. Panel shows "412k in · 38.1k out"; bar shows the total.',
    },
    { name: "cost", type: "number", description: "Spend so far in USD, formatted $1.82." },
    {
      name: "budget",
      type: "number",
      description:
        "Budget in USD. Shows the cost with 'of $5.00' under it; the cost turns red past 100%.",
    },
    {
      name: "branch",
      type: "string",
      description:
        "Git branch in mono with a branch icon. In the bar it shows from ~768px container width.",
    },
    {
      name: "progress",
      type: "{ done: number; total: number }",
      description:
        "Plan progress, drawn as a full-width DotRail (the step in hand counts as half). Ink, or red when the run failed; ember stays on the glyph and its label. '4 of 7' is spoken, not shown.",
    },
    {
      name: "actions",
      type: "React.ReactNode",
      description:
        "Extra controls before Pause/Stop, e.g. an 'Open PR' Button once the run is done.",
    },
    {
      name: "onStop",
      type: "() => void",
      description:
        "Shows Stop while the run is live (queued, running, waiting, paused). Bound to ⌘/Ctrl+.",
    },
    {
      name: "onPause",
      type: "() => void",
      description: "Shows Pause while running. Bound to ⌘/Ctrl+Shift+P.",
    },
    {
      name: "onResume",
      type: "() => void",
      description: "Shows Resume while paused. Bound to ⌘/Ctrl+Shift+P.",
    },
    {
      name: "variant",
      type: '"bar" | "panel"',
      default: '"panel"',
      description:
        "bar = one 44px row (glyph, title, status, branch, steps, tokens, cost, clock, controls; stats drop out as the container narrows). panel = title + meta line + a stats strip (Elapsed, Steps, Tokens, Spend).",
    },
    {
      name: "shortcuts",
      type: "boolean",
      default: "true",
      description:
        "Bind ⌘/Ctrl+. (Stop) and ⌘/Ctrl+Shift+P (Pause/Resume) on the document. Only one run header on screen should bind them.",
    },
  ],
  parts: [
    {
      name: "RunHeader",
      dataSlot: "run-header",
      description:
        "Root <section> labelled by the title; `data-variant`, `data-status`. A size container.",
    },
    { name: "Title", dataSlot: "run-header-title", description: "<h2>, truncated." },
    {
      name: "Status",
      dataSlot: "run-header-status",
      description: "Status word; ember when waiting on a person, red when failed.",
    },
    { name: "Agent", dataSlot: "run-header-agent", description: "Agent name (panel)." },
    { name: "Model", dataSlot: "run-header-model", description: "Model id in mono (panel)." },
    { name: "Branch", dataSlot: "run-header-branch", description: "Branch icon + mono name." },
    {
      name: "Controls",
      dataSlot: "run-header-controls",
      description: "actions, then run-header-pause and run-header-stop.",
    },
    {
      name: "Stats",
      dataSlot: "run-header-stats",
      description:
        "<dl>. In the panel each cell is run-header-stat with `data-stat` = elapsed | steps | tokens | cost, separated by hairlines.",
    },
    {
      name: "Elapsed",
      dataSlot: "run-header-elapsed",
      description: "Mono tabular clock with reserved width so ticking never shifts layout.",
    },
  ],
  a11y: {
    role: "region (section labelled by the title)",
    notes: [
      "The stats are a <dl>: each value has a term (Elapsed, Steps, Tokens, Spend), visually hidden in the bar.",
      "A polite status region announces only status changes ('Run waiting for you'); the ticking clock and counters are not announced.",
      "Stop and Pause have tooltips with their shortcuts and aria-keyshortcuts. Status is never colour-only: the glyph shape and the status word carry it.",
      "The status glyph is decorative here (label=null) because the status word sits next to it.",
    ],
    keyboard: [
      { keys: "Mod+.", action: "Stop the run (when onStop is set and the run is live)" },
      { keys: "Mod+Shift+P", action: "Pause or resume" },
      { keys: "Tab", action: "Actions, Pause, Stop" },
    ],
    reducedMotion:
      "The running glyph and the rail's leading dot hold still; the rail changes length without transition.",
  },
  dependencies: {
    npm: ["lucide-react"],
    kura: ["agent-sigil", "button", "dot-rail", "icon-button", "status-glyph", "tooltip"],
  },
  related: ["agent-fleet", "task-list", "checkpoints", "context-meter", "agent-timeline"],
  tags: [
    "agent",
    "run",
    "session",
    "header",
    "status",
    "cost",
    "budget",
    "tokens",
    "timer",
    "stop",
  ],
  examples: [
    {
      name: "RunHeaderMinimal",
      kind: "minimal",
      title: "Running",
      description: "Title, agent, model, status and a live clock.",
    },
    {
      name: "RunHeaderFull",
      kind: "full",
      title: "Live run",
      description:
        "Steps advance, tokens and spend climb against a $5 budget, the run waits for approval, then completes and offers Open PR. Pause, Resume and Stop work (⌘. and ⌘⇧P).",
    },
    {
      name: "RunHeaderBar",
      kind: "variant",
      title: "Bar",
      description: "One dense row per run: running, waiting for you, failed and completed.",
    },
    {
      name: "RunHeaderComposition",
      kind: "composition",
      title: "With agent-fleet",
      description: "A bar header above the run's subagents.",
    },
  ],
  agentNotes: [
    "Keep one RunHeader mounted for the life of a run and update props; pass startedAt from the server so reloads keep the right clock, and endedAt once it finishes.",
    "Set shortcuts={false} on every RunHeader except the one for the focused run, otherwise the Stop shortcut stops all of them.",
    "Map harness states: in-progress → running; needs approval / input → waiting; interrupted by the user → skipped ('Stopped'); error → failed.",
    "tokens.input should include cache reads if you want the number to match the bill; cost is whatever you computed — the component only formats it.",
    "Use the bar inside dense layouts (above a fleet or transcript) and the panel at the top of a run page.",
  ],
});
