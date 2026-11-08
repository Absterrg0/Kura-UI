import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "tool-call",
  name: "ToolCall",
  category: "agent",
  status: "beta",
  description:
    "One tool invocation: name and icon, queued/running/done/failed/awaiting-approval status, live elapsed time and collapsible JSON args and result.",
  whenToUse: [
    "Show a function/tool call an LLM made (AI SDK tool parts, MCP calls, OpenAI/Anthropic tool_use blocks) inside an assistant message.",
    "Show a tool's progress with a live timer, then its result or error.",
    'A tool that needs the user\'s go-ahead: status="awaiting-approval" with Approve/Deny buttons in `actions`.',
    'Compact inline mentions of tool use within answer text (variant="inline").',
  ],
  whenNotToUse: [
    "A multi-step plan with many steps and progress — use agent-timeline (put ToolCalls inside steps if needed).",
    "A dedicated, prominent permission request with risk level and keyboard shortcuts — use approval-prompt.",
    "Plain code output — use code-block.",
    "Model thinking — use reasoning.",
  ],
  props: [
    {
      name: "name",
      type: "string",
      required: true,
      description:
        'Tool identifier, e.g. "search_web". Rendered in mono when no `title` is given; also used in the status announcement.',
    },
    {
      name: "title",
      type: "React.ReactNode",
      description:
        'Human label, e.g. "Searching the web" → "Searched the web". Replaces `name` visually.',
    },
    {
      name: "icon",
      type: "React.ReactNode",
      description: "Tool icon (lucide), e.g. <Globe />. Default a wrench.",
    },
    {
      name: "status",
      type: '"pending" | "running" | "success" | "error" | "awaiting-approval"',
      default: '"running"',
      description:
        "Lifecycle. pending = hollow ring; running = blue pulse + shimmering title + ticking timer; success = check; error = cross (details open by default); awaiting-approval = blue hand.",
    },
    {
      name: "args",
      type: "unknown",
      description:
        "Arguments. Objects are pretty-printed JSON with syntax tint (CodeBlock); strings render as-is.",
    },
    {
      name: "result",
      type: "unknown",
      description:
        "Output. Objects are pretty-printed JSON; strings render as-is. Long values collapse at 220px with “Show N more lines”.",
    },
    {
      name: "error",
      type: "React.ReactNode",
      description: 'Error message for status="error", shown in a danger panel in the details.',
    },
    {
      name: "summary",
      type: "React.ReactNode",
      description:
        "One-line summary next to the title (truncated). Default: the first primitive value in `args`. Pass null to hide.",
    },
    {
      name: "startedAt",
      type: "Date | number",
      description:
        "Start time for the live timer (e.g. from the server). Default: when status became running.",
    },
    {
      name: "duration",
      type: "number",
      description:
        "Final duration in ms (persisted calls). Default: measured from running → success/error.",
    },
    {
      name: "variant",
      type: '"card" | "inline"',
      default: '"card"',
      description:
        "card = bordered card; inline = compact borderless row for use inside message text.",
    },
    { name: "open", type: "boolean", description: "Details expanded (controlled)." },
    {
      name: "defaultOpen",
      type: "boolean",
      description:
        'Initial expanded state when uncontrolled. Default true for "error" and "awaiting-approval".',
    },
    {
      name: "onOpenChange",
      type: "(open: boolean) => void",
      description: "Called when details are toggled.",
    },
    {
      name: "actions",
      type: "React.ReactNode",
      description: "Always-visible footer row (right-aligned), e.g. Deny / Approve buttons.",
    },
  ],
  parts: [
    {
      name: "ToolCall",
      dataSlot: "tool-call",
      description:
        '`data-status`, `data-variant`, `data-state="open" | "closed"` (when it has details).',
    },
    {
      name: "Trigger",
      dataSlot: "tool-call-trigger",
      description: "Header row; a button with aria-expanded when there are details.",
    },
    {
      name: "Status",
      dataSlot: "tool-call-status",
      description: "20px status glyph (aria-hidden).",
    },
    { name: "Icon", dataSlot: "tool-call-icon", description: "Tool icon (aria-hidden)." },
    {
      name: "Title",
      dataSlot: "tool-call-title",
      description: "Title or mono name; shimmers while running.",
    },
    { name: "Summary", dataSlot: "tool-call-summary", description: "Truncated one-line summary." },
    {
      name: "Elapsed",
      dataSlot: "tool-call-elapsed",
      description: "Mono tabular duration: 180ms, 1.5s, 1m 5s.",
    },
    {
      name: "Details",
      dataSlot: "tool-call-details",
      description: "Collapsible args/error/result (grid-rows transition, inert when closed).",
    },
    {
      name: "Section",
      dataSlot: "tool-call-section",
      description: "“Arguments” / “Result” label + headerless CodeBlock.",
    },
    {
      name: "Error",
      dataSlot: "tool-call-error",
      description: "Danger panel with the error message.",
    },
    { name: "Actions", dataSlot: "tool-call-actions", description: "Footer for `actions`." },
  ],
  a11y: {
    notes: [
      "The header is a button (aria-expanded/aria-controls) only when there is something to expand.",
      "Each call has a polite status region (“search_web Running” → “search_web Completed”); the ticking timer is not announced.",
      "Status is conveyed by text for screen readers, not only by colour/icon.",
      "Collapsed details are inert; JSON panes are keyboard-scrollable regions named “Arguments code” / “Result code”.",
    ],
    keyboard: [
      { keys: "Enter / Space", action: "Expand or collapse the details" },
      { keys: "Tab", action: "Into the JSON panes and footer actions" },
    ],
    reducedMotion:
      "The running pulse and title shimmer stop; the chevron and details change without travel (fade only).",
  },
  dependencies: { npm: ["lucide-react"], kura: ["code-block", "shimmer-text"] },
  related: ["agent-timeline", "approval-prompt", "code-block", "reasoning", "message"],
  tags: ["tool", "function-calling", "agent", "mcp", "status", "json", "timer", "collapsible"],
  examples: [
    {
      name: "ToolCallMinimal",
      kind: "minimal",
      title: "Finished call",
      description: "Name, args and a string result.",
    },
    {
      name: "ToolCallFull",
      kind: "full",
      title: "Live lifecycle",
      description:
        "pending → running (shimmer + timer) → success with a JSON result; controlled open state.",
    },
    {
      name: "ToolCallStates",
      kind: "state",
      title: "All states",
      description: "Queued, running, done and failed.",
    },
    {
      name: "ToolCallInline",
      kind: "variant",
      title: "Inline",
      description: "A compact row inside answer text.",
    },
    {
      name: "ToolCallApproval",
      kind: "composition",
      title: "Awaiting approval",
      description: "Approve/Deny Buttons in the actions footer resolve the call.",
    },
  ],
  agentNotes: [
    "Map AI SDK tool part states: input-streaming → pending, input-available → running, output-available → success, output-error → error.",
    "Keep the same ToolCall mounted across states so the measured timer works; for history, pass `duration` (ms).",
    "Swap `title` between present and past tense (“Searching…” → “Searched the web”) as the status changes.",
    "args/result accept any JSON-serializable value; circular objects fall back to String().",
  ],
});
