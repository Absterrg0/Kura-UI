import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "message",
  name: "Message",
  category: "conversation",
  status: "beta",
  description:
    "Chat message (user/assistant) with avatar, hover actions, ‹ 2/3 › branches, error/streaming states and an autoscrolling MessageList thread.",
  whenToUse: [
    "Render the turns of a chat with an LLM: user bubbles on the right, assistant answers as open text on the left.",
    "Add per-message actions: copy, regenerate, edit, thumbs up/down and navigation between regenerated versions.",
    "Show a failed generation with an inline error and a Retry button.",
    "Wrap a whole conversation in MessageList for stick-to-bottom autoscroll with a “Jump to latest” key.",
  ],
  whenNotToUse: [
    "Only the streaming answer text, without chrome — use streaming-text.",
    "A model's hidden chain of thought — put a reasoning block inside the assistant Message.",
    "A tool invocation or an agent plan — use tool-call or agent-timeline inside the assistant Message.",
    "The input box at the bottom of a chat — use composer.",
  ],
  props: [
    {
      name: "from",
      type: '"user" | "assistant"',
      required: true,
      description:
        "Who wrote it. user = right-aligned bubble (a translucent fg tint that separates from any surface, in both themes); assistant = full-width open text.",
    },
    {
      name: "name",
      type: "React.ReactNode",
      description: 'Display name in the header, e.g. "Kura" or "You".',
    },
    {
      name: "avatar",
      type: "React.ReactNode",
      description: "Avatar element, usually `<MessageAvatar name src? fallback? />`.",
    },
    {
      name: "timestamp",
      type: "Date | number | string",
      description:
        "Sent time. A Date/epoch renders as a localized time (“10:42 AM”) in a <time> element with the full date as title; a string renders as-is.",
    },
    {
      name: "status",
      type: '"idle" | "streaming" | "error"',
      default: '"idle"',
      description:
        "streaming: sets aria-busy and keeps the action row invisible + inert (still laid out — no shift when it appears). error: dims the content and shows `error` with an optional Retry.",
    },
    {
      name: "error",
      type: "React.ReactNode",
      default: '"Something went wrong."',
      description: 'Error text for status="error".',
    },
    { name: "onRetry", type: "() => void", description: "Adds a Retry button to the error row." },
    {
      name: "actions",
      type: "React.ReactNode",
      description:
        "Action bar under the content, usually `<MessageActions>` with MessageCopyButton, MessageAction, MessageFeedback, MessageBranch.",
    },
  ],
  parts: [
    {
      name: "MessageList",
      dataSlot: "message-list",
      description:
        'Thread container (`role="log"` viewport). Sticks to the bottom while content grows, releases when the reader scrolls up, shows a “Jump to latest” key. `data-at-bottom`.',
      props: [
        {
          name: "stickToBottom",
          type: "boolean",
          default: "true",
          description: "Follow new content while the reader is at the bottom.",
        },
        {
          name: "threshold",
          type: "number",
          default: "64",
          description: "Px from the bottom that still counts as at-bottom.",
        },
        {
          name: "jumpLabel",
          type: "string",
          default: '"Jump to latest"',
          description: "Label of the jump key.",
        },
        {
          name: "contentClassName",
          type: "string",
          description: "Classes for the inner column (default `flex flex-col gap-5 px-4 py-6`).",
        },
      ],
    },
    {
      name: "Message",
      dataSlot: "message",
      description: "Root. `data-from`, `data-status`, `aria-busy` while streaming.",
    },
    { name: "Header", dataSlot: "message-header", description: "Name and time." },
    {
      name: "Body",
      dataSlot: "message-body",
      description:
        "Content slot: a flex column with gap-3, with markdown-friendly styles for p, ul/ol, a, strong, inline code, blockquote and h1–h3. Drop in rendered markdown, StreamingText or CodeBlocks.",
    },
    {
      name: "Error",
      dataSlot: "message-error",
      description: 'role="alert" row for status="error".',
    },
    {
      name: "MessageAvatar",
      dataSlot: "message-avatar",
      description:
        "30px raised tile: image → custom fallback → the dot sigil generated from `name`.",
      props: [
        {
          name: "name",
          type: "string",
          required: true,
          description: "Alt text, and the seed of the sigil fallback.",
        },
        { name: "src", type: "string", description: "Image URL; broken images fall back." },
        {
          name: "fallback",
          type: "React.ReactNode",
          description: "Custom fallback such as a logo or lucide icon.",
        },
      ],
    },
    {
      name: "MessageActions",
      dataSlot: "message-actions",
      description:
        'role="group" action bar; fades in on hover/focus-within, always visible on coarse pointers.',
      props: [
        {
          name: "visibility",
          type: '"hover" | "always"',
          default: '"hover"',
          description: "Reveal on hover/focus, or always show.",
        },
      ],
    },
    {
      name: "MessageAction",
      dataSlot: "message-action",
      description: "Small labelled IconButton (tooltip included) for regenerate, edit, share…",
    },
    {
      name: "MessageCopyButton",
      description:
        "Copy action; the icon cross-fades to a check for 1.6s and a polite status announces it.",
      props: [
        {
          name: "text",
          type: "string",
          required: true,
          description: "Text to copy (usually the raw markdown).",
        },
        { name: "onCopied", type: "() => void", description: "Called after a successful copy." },
      ],
    },
    {
      name: "MessageFeedback",
      dataSlot: "message-feedback",
      description:
        "Thumbs up/down toggles (aria-pressed); pressing the active one clears it. `data-value`.",
      props: [
        { name: "value", type: '"up" | "down" | null', description: "Controlled rating." },
        {
          name: "defaultValue",
          type: '"up" | "down" | null',
          default: "null",
          description: "Initial rating when uncontrolled.",
        },
        {
          name: "onValueChange",
          type: '(value: "up" | "down" | null) => void',
          description: "Called with the new rating.",
        },
      ],
    },
    {
      name: "MessageBranch",
      dataSlot: "message-branch",
      description:
        "“‹ 2/3 ›” version switcher for regenerations/edits; renders nothing when total ≤ 1.",
      props: [
        {
          name: "current",
          type: "number",
          required: true,
          description: "1-based visible version.",
        },
        { name: "total", type: "number", required: true, description: "Number of versions." },
        {
          name: "onCurrentChange",
          type: "(current: number) => void",
          description: "Called with the new 1-based index.",
        },
      ],
    },
    {
      name: "Jump",
      dataSlot: "message-list-jump",
      description: '“Jump to latest” key; `data-state="visible" | "hidden"` (inert when hidden).',
    },
  ],
  a11y: {
    role: "log",
    notes: [
      'MessageList\'s viewport is `role="log"` (implicitly polite) labelled “Conversation”, and focusable so the thread scrolls with the keyboard. A streaming Message sets `aria-busy`, so assistive tech announces the finished answer rather than each token.',
      "Every action is a labelled icon button with a tooltip; feedback toggles use aria-pressed; the branch switcher announces “Version 2 of 3”.",
      "Actions are revealed on hover AND keyboard focus (focus-within), and are always visible on touch devices.",
      'The error row is `role="alert"`.',
      "The hidden jump key is inert and aria-hidden, so it never traps focus.",
    ],
    keyboard: [
      {
        keys: "Tab",
        action: "Moves into a message's actions (revealing the bar) and through them",
      },
      { keys: "↑ / ↓ / Page Up / Page Down", action: "Scroll the focused thread" },
      { keys: "Enter / Space", action: "Activate an action; toggle feedback" },
    ],
    reducedMotion:
      "Jump-to-latest scrolls instantly and its key only fades (no slide); the copy check and thumbs swap without scale.",
  },
  dependencies: { npm: ["lucide-react"], kura: ["agent-sigil", "button", "icon-button"] },
  related: ["streaming-text", "code-block", "reasoning", "tool-call", "citation", "composer"],
  tags: [
    "chat",
    "message",
    "conversation",
    "thread",
    "bubble",
    "autoscroll",
    "feedback",
    "actions",
  ],
  examples: [
    {
      name: "MessageMinimal",
      kind: "minimal",
      title: "Two turns",
      description: "A user bubble and an assistant answer.",
    },
    {
      name: "MessageFull",
      kind: "full",
      title: "Avatars, actions and versions",
      description:
        "Name, time, avatar, copy/regenerate/edit, controlled thumbs, ‹ 2/3 › branches. Regenerate simulates an error with Retry.",
    },
    {
      name: "MessageStates",
      kind: "state",
      title: "Streaming and error",
      description: "A streaming answer with reserved actions, and a failed one.",
    },
    {
      name: "MessageThread",
      kind: "composition",
      title: "Autoscrolling thread",
      description:
        "MessageList with StreamingText, CodeBlock and a “Thinking…” turn. Scroll up mid-stream to see “Jump to latest”.",
    },
  ],
  agentNotes: [
    "Give MessageList a height (h-[480px], flex-1 inside a flex column, …) — it scrolls internally.",
    "Use `from`, not `role`, for the author (role is the ARIA attribute).",
    'Set status="streaming" on the assistant Message while StreamingText is running, then "idle" in its onComplete; pass `actions` from the start so the row is reserved.',
    "Message renders children inside a flex column with gap-3 — pass block elements (p, CodeBlock, lists) directly; do not add margins.",
    "For markdown, render it to elements (react-markdown etc.) inside Message; inline code, links, lists and blockquotes are styled by the body.",
    "Keep MessageBranch state (current version) in your store alongside the alternative texts.",
  ],
});
