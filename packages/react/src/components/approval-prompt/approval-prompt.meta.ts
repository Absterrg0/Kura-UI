import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "approval-prompt",
  name: "ApprovalPrompt",
  category: "agent",
  status: "beta",
  description:
    "Human-in-the-loop permission card (“Kura wants to run `rm -rf build`”) with risk level, details, Approve/Deny/Always allow, ⌘↵ and Esc, and resolved states.",
  whenToUse: [
    "An agent needs explicit permission before a side effect: running a shell command, editing files, sending email, spending money, calling a destructive API.",
    "Show exactly what will run (verbatim command) and how risky it is before the user decides.",
    "Offer “Always allow” for a class of actions in this session (persist the rule yourself in onAlwaysAllow).",
    "Keep the decision visible in the transcript afterwards (Approved / Denied / Always allowed) without the card changing height.",
  ],
  whenNotToUse: [
    "Showing a tool call that does not need permission — use tool-call (it also has an awaiting-approval status for compact inline approvals).",
    "Generic confirm dialogs unrelated to an agent (deleting a document) — use a dialog.",
    "Progress of a multi-step plan — use agent-timeline.",
  ],
  props: [
    {
      name: "title",
      type: "React.ReactNode",
      required: true,
      description: 'What the agent wants, e.g. "Kura wants to run a command". Labels the region.',
    },
    {
      name: "command",
      type: "string",
      description:
        "The exact command/action, shown verbatim in mono after a $ prompt (wraps, never truncated).",
    },
    {
      name: "description",
      type: "React.ReactNode",
      description: "Why and what it touches; becomes the region's accessible description.",
    },
    {
      name: "risk",
      type: '"low" | "medium" | "high"',
      default: '"medium"',
      description:
        "Badge (green/amber/red dot). high also turns Approve into a red “Run anyway” button.",
    },
    {
      name: "details",
      type: "React.ReactNode",
      description:
        "Content behind a “Details” expander: a diff (CodeBlock), arguments, affected files.",
    },
    {
      name: "decision",
      type: '"pending" | "approved" | "denied" | "always"',
      description: "Decision (controlled).",
    },
    {
      name: "defaultDecision",
      type: '"pending" | "approved" | "denied" | "always"',
      default: '"pending"',
      description: "Initial decision when uncontrolled (use a resolved value to render history).",
    },
    {
      name: "onDecisionChange",
      type: "(decision: ApprovalDecision) => void",
      description: "Called with every decision.",
    },
    {
      name: "onApprove",
      type: "() => void",
      description: "Called on Approve (button or ⌘/Ctrl+Enter).",
    },
    { name: "onDeny", type: "() => void", description: "Called on Deny (button or Esc)." },
    {
      name: "onAlwaysAllow",
      type: "() => void",
      description: "Shows an “Always allow” ghost button; called when chosen.",
    },
    {
      name: "shortcuts",
      type: "boolean",
      default: "true",
      description:
        "Bind ⌘/Ctrl+Enter (approve) and Esc (deny) on the document while pending, and show the keys on the buttons. Only one prompt on screen should bind them.",
    },
    {
      name: "approveLabel",
      type: "string",
      description: "Approve label. Default “Approve”, or “Run anyway” for high risk.",
    },
    { name: "denyLabel", type: "string", default: '"Deny"', description: "Deny label." },
    {
      name: "alwaysAllowLabel",
      type: "string",
      default: '"Always allow"',
      description: "Always-allow label.",
    },
    {
      name: "icon",
      type: "React.ReactNode",
      description: "Icon in the header tile. Default a terminal.",
    },
  ],
  parts: [
    {
      name: "ApprovalPrompt",
      dataSlot: "approval-prompt",
      description:
        '<section> labelled by the title and the command (so stacked prompts have distinct names). `data-decision="pending" | "approved" | "denied" | "always"`, `data-risk`.',
    },
    {
      name: "Title",
      dataSlot: "approval-prompt-title",
      description: "Heading; mutes once resolved.",
    },
    {
      name: "Risk",
      dataSlot: "approval-prompt-risk",
      description: "Risk badge with a coloured dot and text.",
    },
    {
      name: "Command",
      dataSlot: "approval-prompt-command",
      description: "Mono command well; the <code> is `approval-prompt-code`.",
    },
    {
      name: "Details",
      dataSlot: "approval-prompt-details",
      description: "Collapsible details (grid-rows transition, inert when closed).",
    },
    {
      name: "Footer",
      dataSlot: "approval-prompt-footer",
      description:
        "Fixed-height footer holding actions and the resolution, so resolving never shifts layout.",
    },
    {
      name: "Waiting",
      dataSlot: "approval-prompt-waiting",
      description: "Blue “Needs approval” pill — the view's one accent while pending.",
    },
    {
      name: "Actions",
      dataSlot: "approval-prompt-actions",
      description: "Always allow / Deny (Esc) / Approve (⌘↵); inert once resolved.",
    },
    {
      name: "Resolution",
      dataSlot: "approval-prompt-resolution",
      description: 'role="status" line that cross-fades in: Approved / Denied / Always allowed.',
    },
  ],
  a11y: {
    role: "region",
    notes: [
      "A <section> labelled by the title and described by the description, so screen-reader users land on the whole request.",
      "Buttons expose their shortcuts with aria-keyshortcuts; keycaps are also rendered visually.",
      "The resolution is a status region, so the decision is announced; the action row becomes inert and hidden.",
      "Risk is conveyed in text (“High risk”), not only colour. No dark patterns: Deny is as prominent as Approve.",
    ],
    keyboard: [
      { keys: "Mod+Enter", action: "Approve (while pending, when shortcuts is on)" },
      {
        keys: "Escape",
        action: "Deny (while pending, when shortcuts is on; not while typing in an input)",
      },
      { keys: "Tab", action: "Details, Always allow, Deny, Approve" },
    ],
    reducedMotion:
      "The waiting pulse stops and resolved states cross-fade without blur; details open without height travel.",
  },
  dependencies: { npm: ["lucide-react"], kura: ["button", "kbd"] },
  related: ["tool-call", "agent-timeline", "code-block", "kbd-shortcut"],
  tags: [
    "approval",
    "permission",
    "human-in-the-loop",
    "confirm",
    "agent",
    "security",
    "shortcuts",
    "consent",
  ],
  examples: [
    {
      name: "ApprovalPromptMinimal",
      kind: "minimal",
      title: "Low-risk command",
      description: "Title, command and risk.",
    },
    {
      name: "ApprovalPromptFull",
      kind: "full",
      title: "High-risk, every option",
      description:
        "Description, details, controlled decision, Always allow, custom labels and ⌘↵ / Esc; “Ask again” resets it.",
    },
    {
      name: "ApprovalPromptResolved",
      kind: "state",
      title: "Resolved states",
      description: "Approved, denied and always-allowed, as they appear in history.",
    },
    {
      name: "ApprovalPromptWithDiff",
      kind: "composition",
      title: "Approve a file edit",
      description: "A diff CodeBlock in the details, driving a ToolCall's status.",
    },
  ],
  agentNotes: [
    "Show the command verbatim — never paraphrase what will run.",
    "The decision is only UI state: actually gate the side effect on onApprove / onDecisionChange in your agent loop.",
    "Render past prompts with `defaultDecision` (or controlled `decision`) set to the stored outcome and `shortcuts={false}`.",
    "When several prompts are visible, enable `shortcuts` on the newest pending one only.",
  ],
});
