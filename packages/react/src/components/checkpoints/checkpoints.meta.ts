import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "checkpoints",
  name: "Checkpoints",
  category: "agent",
  status: "experimental",
  description:
    "Restore points across an agent run: a compact rail of auto and saved checkpoints with relative times, a current marker and inline-confirmed Restore.",
  whenToUse: [
    "A coding agent snapshots the workspace before edits (Claude Code rewind, Cursor checkpoints) and the human should be able to roll files back.",
    "Showing where the workspace is after a rewind: checkpoints newer than the current one read as undone and can be restored forward.",
    "Letting people save a manual checkpoint before a risky step (onCreate).",
  ],
  whenNotToUse: [
    "The agent's plan or steps — use task-list or agent-timeline.",
    "Reviewing what changed in files — use diff-view or file-changes.",
    "Git history or commits — this is for harness snapshots, not a commit log.",
  ],
  props: [
    {
      name: "checkpoints",
      type: "Checkpoint[]",
      required: true,
      description:
        "{ id, label, at, filesChanged?, kind: 'auto' | 'manual', current? }, newest first. Mark exactly one current.",
    },
    {
      name: "title",
      type: "React.ReactNode",
      default: '"Checkpoints"',
      description: "Header title; the count follows it.",
    },
    {
      name: "onRestore",
      type: "(id: string) => void | Promise<void>",
      description:
        "Restore handler, called after the inline confirm. Return a promise to show a spinner until it settles. Without it no Restore buttons render.",
    },
    {
      name: "onCreate",
      type: "() => void",
      description:
        "Shows 'Save checkpoint' in the header. Add a kind:'manual' checkpoint marked current.",
    },
    {
      name: "confirm",
      type: "boolean",
      default: "true",
      description: "Ask inline before restoring. false calls onRestore directly.",
    },
    {
      name: "empty",
      type: "React.ReactNode",
      description: "Replaces the default empty state ('No checkpoints yet').",
    },
  ],
  parts: [
    { name: "Checkpoints", dataSlot: "checkpoints", description: "Root panel (a size container)." },
    {
      name: "Header",
      dataSlot: "checkpoints-header",
      description: "Title, count and the optional checkpoints-create button.",
    },
    {
      name: "Item",
      dataSlot: "checkpoints-item",
      description:
        "<li> with `data-kind`, `data-current`, `data-ahead` (newer than current = undone) and `data-state='confirming'`. A StatusGlyph on a dotted spine: solid disc = current, hollow ring = any other; undone ones are faint.",
    },
    {
      name: "Label",
      dataSlot: "checkpoints-label",
      description: "What the agent had just done. Truncates.",
    },
    {
      name: "Current",
      dataSlot: "checkpoints-current",
      description:
        "The word 'Current' after the label; in a narrow row it is read out only, and the filled glyph marks the row.",
    },
    {
      name: "Files",
      dataSlot: "checkpoints-files",
      description: "'3 files' in mono (hidden when narrow).",
    },
    {
      name: "Restore",
      dataSlot: "checkpoints-restore",
      description:
        "Ghost button that swaps in for the relative time on hover/focus (always visible on touch); aria-expanded when confirming.",
    },
    {
      name: "Confirm",
      dataSlot: "checkpoints-confirm",
      description:
        "Inline confirm under the row: what will be undone (or re-applied), Cancel and Restore.",
    },
    { name: "Empty", dataSlot: "checkpoints-empty", description: "Empty state." },
  ],
  a11y: {
    role: "list (ol)",
    notes: [
      "An ordered list labelled by the title. Times are <time datetime> with the absolute time as a tooltip.",
      "Restore buttons are named 'Restore to <label>'. Opening the confirm moves focus to its Restore button; Escape or Cancel closes it and returns focus to the trigger.",
      "Undone checkpoints carry visually hidden '(undone)'. A polite status region announces 'Restored to …'.",
      "Relative times render after mount only, so server and client markup match.",
    ],
    keyboard: [
      { keys: "Tab", action: "Reach each Restore button (it becomes visible on focus)" },
      { keys: "Enter / Space", action: "Open the inline confirm, then confirm" },
      { keys: "Escape", action: "Cancel the confirm" },
    ],
    reducedMotion:
      "Rows fade in without rising; the confirm opens with a fade instead of a height transition.",
  },
  dependencies: { npm: ["@ui-sdk/react", "lucide-react"], kura: ["button", "status-glyph"] },
  related: ["run-header", "diff-view", "file-changes", "task-list"],
  tags: ["agent", "checkpoint", "restore", "rewind", "undo", "history", "snapshot"],
  examples: [
    { name: "CheckpointsMinimal", kind: "minimal", title: "Three checkpoints" },
    {
      name: "CheckpointsFull",
      kind: "full",
      title: "Live, with save and restore",
      description:
        "A new automatic checkpoint lands while you watch; Restore confirms inline and resolves after a simulated 900ms; Save checkpoint adds a manual one.",
    },
    {
      name: "CheckpointsRestored",
      kind: "state",
      title: "After a rewind",
      description:
        "The current checkpoint is in the middle; newer ones read as undone and can be restored forward.",
    },
    { name: "CheckpointsEmpty", kind: "state", title: "Empty" },
    {
      name: "CheckpointsComposition",
      kind: "composition",
      title: "With run-header",
      description:
        "Restoring rewinds the run's step count and pauses it; Resume returns to the latest checkpoint.",
    },
  ],
  agentNotes: [
    `Agent-ready (ui-sdk): createAgent lists the checkpoint list with where the workspace is as its value and each earlier checkpoint as an item. Its one action, \`restore\`, is marked data-agent-confirm, so an agent's restore always waits for the person.`,
    "Pass checkpoints newest first and mark exactly one current; the component uses `at` to work out which are undone.",
    "Restore only rewinds files in your harness; keep the conversation and say so in your UI copy if that differs.",
    "Make onRestore async when restoring takes time so the confirm shows a spinner and blocks double restores.",
  ],
});
