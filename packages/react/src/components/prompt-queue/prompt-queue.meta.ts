import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "prompt-queue",
  name: "PromptQueue",
  category: "agent",
  status: "experimental",
  description:
    "Stack of follow-up prompts queued while an agent works: reorder, edit inline, remove, or Send now to steer. Renders nothing when empty.",
  whenToUse: [
    "The user types follow-ups while an agent is mid-turn (Claude Code / Codex queued messages) and they should send in order when it finishes.",
    "Letting the user steer: interrupt the agent and send one queued prompt immediately.",
    "Directly above a composer (variant='tray') so queued prompts read as part of the input.",
  ],
  whenNotToUse: [
    "Suggested prompts the user has not written — use prompt-suggestions.",
    "The prompt input itself — use composer (and put PromptQueue above it).",
    "Work the agent plans to do — use task-list.",
  ],
  props: [
    {
      name: "items",
      type: "QueuedPrompt[]",
      description:
        "Queued prompts in send order (controlled): { id, text, attachments?: { name, type?: 'image' | 'file' }[] }.",
    },
    {
      name: "defaultItems",
      type: "QueuedPrompt[]",
      description: "Initial prompts when uncontrolled.",
    },
    {
      name: "onItemsChange",
      type: "(items: QueuedPrompt[]) => void",
      description:
        "Called with the whole new list after a reorder, edit, remove or Send now. Fires on every step while dragging.",
    },
    {
      name: "onSendNow",
      type: "(item: QueuedPrompt) => void",
      description:
        "Steer: interrupt the agent and send this prompt now. The prompt is removed from the queue first. Without it no Send now button renders.",
    },
    {
      name: "title",
      type: "React.ReactNode",
      default: '"Queued"',
      description: "Header title; the count follows it.",
    },
    {
      name: "hint",
      type: "React.ReactNode",
      default: '"Sends when the agent finishes this turn"',
      description:
        "Secondary header text, e.g. 'Sends when Kura finishes running pnpm test'. null hides it.",
    },
    {
      name: "variant",
      type: '"panel" | "tray"',
      default: '"panel"',
      description:
        "panel = standalone card; tray = sunken, rounded on top only, meant to sit flush on top of a Composer (inset it with className='mx-3').",
    },
  ],
  parts: [
    { name: "PromptQueue", dataSlot: "prompt-queue", description: "Root with `data-variant`." },
    {
      name: "Header",
      dataSlot: "prompt-queue-header",
      description: "Title, count and prompt-queue-hint.",
    },
    {
      name: "Item",
      dataSlot: "prompt-queue-item",
      description:
        "Focusable <li> (`data-state` = editing | dragging): index (grip on hover), text, attachments, actions.",
    },
    {
      name: "Handle",
      dataSlot: "prompt-queue-handle",
      description:
        "Drag grip shown in place of the index on hover (pointer only; keyboard uses Alt+arrows or Space).",
    },
    {
      name: "Text",
      dataSlot: "prompt-queue-text",
      description: "One truncated line; the full text is the title tooltip.",
    },
    {
      name: "Attachments",
      dataSlot: "prompt-queue-attachments",
      description: "First attachment's icon and name in mono, then '+N'.",
    },
    {
      name: "Actions",
      dataSlot: "prompt-queue-actions",
      description:
        "Move up, Move down, Edit, Remove and prompt-queue-send ('Send now'); shown on hover/focus, always on touch.",
    },
    {
      name: "Editor",
      dataSlot: "prompt-queue-editor",
      description: "Auto-growing textarea replacing the row while editing, with Cancel/Save.",
    },
  ],
  a11y: {
    role: "list (ol) of focusable items",
    notes: [
      "The list is labelled by the title and described by visually hidden keyboard help. Items use a roving tabindex (one Tab stop) and are named '2 of 3: <text>'.",
      "A polite status region announces moves ('Moved to position 1 of 3'), removals and Send now. Actions are icon buttons with tooltips.",
      "Escape in the editor cancels without reaching the composer's own Escape (stop) handler.",
    ],
    keyboard: [
      { keys: "ArrowUp / ArrowDown", action: "Move focus between prompts" },
      { keys: "Alt+ArrowUp / Alt+ArrowDown", action: "Move the focused prompt up / down" },
      { keys: "Space, then arrows, then Space", action: "Grab, move and drop (Escape restores)" },
      {
        keys: "Enter / F2",
        action: "Edit inline (Enter saves, Shift+Enter newline, Escape cancels)",
      },
      { keys: "Delete / Backspace", action: "Remove" },
      { keys: "Mod+Enter", action: "Send now" },
    ],
    reducedMotion:
      "Reorders jump into place instead of sliding; the drag still follows the pointer.",
  },
  dependencies: { npm: ["lucide-react", "motion"], kura: ["button", "icon-button"] },
  related: ["composer", "run-header", "prompt-suggestions", "task-list"],
  tags: ["agent", "queue", "prompts", "follow-up", "steer", "reorder", "drag", "composer"],
  examples: [
    { name: "PromptQueueMinimal", kind: "minimal", title: "Two queued prompts" },
    {
      name: "PromptQueueFull",
      kind: "full",
      title: "Controlled, with steering",
      description: "Attachments, a prompt that arrives after mount, and Send now reported below.",
    },
    {
      name: "PromptQueueTray",
      kind: "variant",
      title: "Tray",
      description: "Rounded on top only, tucked onto the input below.",
    },
    {
      name: "PromptQueueComposition",
      kind: "composition",
      title: "Above a composer",
      description: "Messages sent while the agent works are queued; Send now steers.",
    },
  ],
  agentNotes: [
    "When the agent finishes a turn, shift the first item off `items` and send it yourself — the component never sends on its own.",
    "onSendNow means 'interrupt and send': stop the current turn in your harness before sending.",
    "Keep ids stable across edits; reordering and focus rely on them.",
    "Empty queue renders only a visually hidden status region, so you can leave it mounted above the composer.",
  ],
});
