import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "approval-prompt",
  name: "ApprovalPrompt",
  category: "agent",
  status: "beta",
  description:
    "The moment an agent needs a person: what it asks, the exact command, what it touches and the risk, with Approve (⌘↵) and Deny (Esc) keys.",
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
      description:
        'What is being asked, as the headline, e.g. "Run the sessions migration on production". Labels the region.',
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
        "Drawn as three dots (one, two or three lit) with the words “Low risk” / “Medium risk” / “High risk”; high is red.",
    },
    {
      name: "facts",
      type: "readonly ApprovalFact[]",
      description:
        "What the action touches, as a property list with dotted leaders: { label, value }[], e.g. Target / Rows affected / Rollback. Keep it to two to four lines.",
    },
    {
      name: "agent",
      type: "ApprovalAgent",
      description:
        'Who is asking: { name, detail? }. Renders the agent\'s dot sigil and “<name> asks, <detail>”, e.g. { name: "migrator", detail: "for step 4 of the plan" }.',
    },
    {
      name: "requestedAt",
      type: "number | Date",
      description:
        "When the agent asked. Shows a ticking “0:18” waited clock beside “Needs you” while pending.",
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
      type: "(decision: ApprovalDecision, details: ApprovalDecisionDetails) => void",
      description:
        'Called with every decision. details.source is "agent" when an agent connected through createAgent decided (it can deny; approving needs a person), otherwise how the person pressed.',
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
      default: '"Approve"',
      description: "Label on the approve key. Name the action when you can, e.g. “Run migration”.",
    },
    { name: "denyLabel", type: "string", default: '"Deny"', description: "Deny label." },
    {
      name: "alwaysAllowLabel",
      type: "string",
      default: '"Always allow"',
      description: "Always-allow label.",
    },
    {
      name: "agentConfirm",
      type: "string",
      description:
        'What the person is asked when an agent tries to approve, e.g. "Runs a production migration". Default "Runs <command>", or "Approves this request" without a command.',
    },
  ],
  parts: [
    {
      name: "ApprovalPrompt",
      dataSlot: "approval-prompt",
      description:
        '<section> labelled by the title and the command (so stacked prompts have distinct names). `data-decision="pending" | "approved" | "denied" | "always"`, `data-risk`. While pending an ember Halftone sits in its top-right corner; it fades out when decided.',
    },
    {
      name: "Title",
      dataSlot: "approval-prompt-title",
      description: "The headline (h3, 19px); mutes once resolved.",
    },
    {
      name: "Risk",
      dataSlot: "approval-prompt-risk",
      description: "Three dots and the risk in words, on the left of the footer. `data-risk`.",
    },
    {
      name: "Command",
      dataSlot: "approval-prompt-command",
      description:
        "Sunk mono command well with a copy button on hover; the <code> is `approval-prompt-code`.",
    },
    {
      name: "Agent",
      dataSlot: "approval-prompt-agent",
      description: "The asking agent's sigil and “<name> asks, <detail>”.",
    },
    {
      name: "Facts",
      dataSlot: "approval-prompt-facts",
      description: "<dl> of label · dotted leader · value.",
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
      description:
        "Status line at the top: the waiting StatusGlyph, “Needs you” in ember and the waited clock; becomes Approved / Denied / Always allowed with the matching glyph.",
    },
    {
      name: "Actions",
      dataSlot: "approval-prompt-actions",
      description:
        "Keycaps with their shortcuts printed on them: Always allow / Deny (Esc) / Approve (⌘↵, the ink fill); inert once resolved.",
    },
    {
      name: "Resolution",
      dataSlot: "approval-prompt-resolution",
      description:
        'role="status" line that cross-fades in: “Approved by you.” / “Denied by you. Nothing ran.” / “Always allowed.”',
    },
  ],
  a11y: {
    role: "region",
    notes: [
      "A <section> labelled by the title and described by the description, so screen-reader users land on the whole request.",
      "Buttons expose their shortcuts with aria-keyshortcuts; keycaps are also rendered visually.",
      "The resolution is a status region, so the decision is announced; the action row becomes inert and hidden.",
      "Risk is conveyed in text (“High risk”), not only colour. No dark patterns: Deny is as prominent as Approve.",
      "Agent-ready (ui-sdk): createAgent lists the prompt by its title with value = the decision and one action, deny. Approve and Always allow are buttons marked data-agent-confirm, so an agent's press waits for the person, who is told what will run.",
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
      "The waiting glyph stops blinking, the halftone and resolved states only cross-fade, and details open without height travel.",
  },
  dependencies: {
    npm: ["@ui-sdk/core", "@ui-sdk/react", "lucide-react"],
    kura: ["agent-sigil", "button", "halftone", "kbd", "status-glyph"],
  },
  related: ["tool-call", "halftone", "status-glyph", "agent-sigil", "run-header"],
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
      description: "Headline, command and risk.",
    },
    {
      name: "ApprovalPromptFull",
      kind: "full",
      title: "High-risk, every option",
      description:
        "The asking agent, facts with dotted leaders, a waited clock, details, controlled decision, Always allow and ⌘↵ / Esc; “Ask again” resets it.",
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
    "Ember belongs to this component: the halftone, the glyph and “Needs you” are the only ember on a Kura screen, and they leave when the person decides. Do not add ember elsewhere to match it.",
    "The decision is only UI state: actually gate the side effect on onApprove / onDecisionChange in your agent loop.",
    "Render past prompts with `defaultDecision` (or controlled `decision`) set to the stored outcome and `shortcuts={false}`.",
    "When several prompts are visible, enable `shortcuts` on the newest pending one only.",
    "With an in-app assistant, create one bridge (`createAgent({ allow })` from @ui-sdk/react/agent): the assistant can read pending prompts and deny them; its approve presses reach your `allow` callback with step.confirm set, so show that sentence to the person and return their answer.",
  ],
});
