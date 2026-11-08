import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "code-block",
  name: "CodeBlock",
  category: "conversation",
  status: "beta",
  description:
    "Syntax-highlighted code with a filename header, copy, line numbers, highlighted lines, diffs, wrap, collapsible height and streaming-safe rendering.",
  whenToUse: [
    "Show code a model wrote in a chat answer, including while it is still streaming.",
    "Show a file or snippet with a filename header and a copy button (docs, READMEs, agent output).",
    "Show an agent's proposed edit as a unified diff with +/- lines.",
    "Long files that should start collapsed to a fixed height with a “Show N more lines” control.",
    'Terminal commands (language="bash") with an extra header action such as Run.',
  ],
  whenNotToUse: [
    "Inline code inside a sentence — use a plain <code> element.",
    "Tool arguments/results JSON inside an agent step — use tool-call, which pretty-prints JSON for you.",
    "Prose output from a model — use streaming-text or message.",
    "Editable code — use a real editor (CodeMirror/Monaco); CodeBlock is read-only.",
  ],
  props: [
    {
      name: "code",
      type: "string",
      required: true,
      description:
        "The source to display. For diffs pass unified-diff lines prefixed with `+`, `-` or a space (`@@`, `+++`, `---` lines render as meta).",
    },
    {
      name: "language",
      type: "string",
      default: '"text"',
      description:
        "Language id: ts/tsx/js/jsx, json, bash/sh, python, css, html/xml, yaml, sql, go, rust, java, … (see `supportedLanguages`). Unknown ids render as plain text.",
    },
    {
      name: "filename",
      type: "string",
      description: 'File name shown in the header, e.g. "app/page.tsx".',
    },
    {
      name: "lineNumbers",
      type: "boolean",
      default: "false",
      description: "Show a tabular line-number gutter (not selectable, aria-hidden).",
    },
    {
      name: "highlightLines",
      type: "readonly number[]",
      description: "1-based line numbers to emphasise with a tinted row and a left rule.",
    },
    {
      name: "diff",
      type: "boolean",
      description:
        'Render `+`/`-` prefixed lines as additions/removals (matcha/beni tinted row with a 2px rule, sign gutter, screen-reader “added:/removed:”). Defaults to true when `language` is "diff"; otherwise the content after the sign is highlighted with `language`.',
    },
    {
      name: "streaming",
      type: "boolean",
      default: "false",
      description:
        "Code is still arriving. Only complete lines are tokenized (memoized), the unfinished last line renders plain until its newline lands, and a block caret marks the live edge — no flicker from half-open strings or comments.",
    },
    { name: "wrap", type: "boolean", description: "Soft-wrap long lines (controlled)." },
    {
      name: "defaultWrap",
      type: "boolean",
      default: "false",
      description: "Initial wrap state when uncontrolled.",
    },
    {
      name: "onWrapChange",
      type: "(wrap: boolean) => void",
      description: "Called when the wrap toggle is pressed.",
    },
    {
      name: "maxHeight",
      type: "number",
      description:
        "Collapse code taller than this many px, with a bottom fade and a “Show N more lines” pill; the header gets an expand/collapse button.",
    },
    { name: "expanded", type: "boolean", description: "Expanded past `maxHeight` (controlled)." },
    {
      name: "defaultExpanded",
      type: "boolean",
      default: "false",
      description: "Initial expanded state when uncontrolled.",
    },
    {
      name: "onExpandedChange",
      type: "(expanded: boolean) => void",
      description: "Called when the code is expanded or collapsed.",
    },
    {
      name: "copyable",
      type: "boolean",
      default: "true",
      description: "Show the copy button (icon cross-fades to a check for 1.6s on success).",
    },
    {
      name: "onCopy",
      type: "(code: string) => void",
      description: "Called with the copied text after a successful copy.",
    },
    {
      name: "header",
      type: "boolean",
      default: "true",
      description:
        "Show the header row (filename/language and actions). Without it, no wrap or copy button is shown.",
    },
    {
      name: "actions",
      type: "React.ReactNode",
      description:
        "Extra header actions rendered before wrap/copy, e.g. a ghost xs Button “Run” or “Apply”.",
    },
  ],
  parts: [
    {
      name: "CodeBlock",
      dataSlot: "code-block",
      description:
        'Root. `data-language`, `data-wrap`, `data-streaming`, `data-state="collapsed" | "expanded"` (only when collapsible).',
    },
    {
      name: "Header",
      dataSlot: "code-block-header",
      description: "Filename/language and actions.",
    },
    {
      name: "Title",
      dataSlot: "code-block-title",
      description: "Filename, or the language when no filename is given.",
    },
    {
      name: "Language",
      dataSlot: "code-block-language",
      description: "Language badge, shown next to a filename.",
    },
    {
      name: "Body",
      dataSlot: "code-block-body",
      description: "Height-limited wrapper (transitions max-height when expanding).",
    },
    {
      name: "Code",
      dataSlot: "code-block-code",
      description: "The <code> element holding the lines.",
    },
    {
      name: "Line",
      dataSlot: "code-block-line",
      description:
        '`data-line`, `data-highlighted`, `data-diff="add" | "remove" | "context" | "meta"`.',
    },
    {
      name: "LineNumber",
      dataSlot: "code-block-line-number",
      description: "Gutter number (aria-hidden).",
    },
    { name: "Caret", dataSlot: "code-block-caret", description: "Streaming caret (aria-hidden)." },
    {
      name: "Expand",
      dataSlot: "code-block-expand",
      description: "Bottom fade + “Show N more lines” pill while collapsed.",
    },
  ],
  a11y: {
    role: "region",
    notes: [
      'The scroll area is a focusable `role="region"` labelled “<filename or language> code”, so keyboard users can scroll wide code with the arrow keys.',
      "Copy, wrap and expand are labelled icon buttons with tooltips; wrap exposes `aria-pressed`, expand exposes `aria-expanded`.",
      "A polite status region announces “Copied to clipboard”.",
      "Line numbers, diff signs and the caret are aria-hidden; removed/added lines get visually hidden “removed:”/“added:” prefixes.",
      "Syntax colours take their lightness from --kura-fg-muted, keeping its ≥ 4.5:1 contrast in both themes; only hue and chroma change.",
    ],
    keyboard: [
      { keys: "Tab", action: "Moves through header actions, then the scrollable code region" },
      { keys: "← / →", action: "Scrolls wide code horizontally when the region is focused" },
      { keys: "Enter / Space", action: "Activates copy, wrap or expand" },
    ],
    reducedMotion:
      "The copy icon swap becomes a pure cross-fade (no scale/blur), the streaming caret stops pulsing and expanding is instant.",
  },
  dependencies: { npm: ["lucide-react"], kura: ["icon-button"] },
  related: ["tool-call", "message", "streaming-text", "approval-prompt"],
  tags: ["code", "syntax-highlighting", "diff", "copy", "streaming", "snippet", "pre", "markdown"],
  examples: [
    {
      name: "CodeBlockMinimal",
      kind: "minimal",
      title: "Snippet",
      description: "Code + language. Header shows the language; copy and wrap are built in.",
    },
    {
      name: "CodeBlockFull",
      kind: "full",
      title: "File with every option",
      description:
        "Filename, line numbers, highlighted lines, controlled wrap, collapsed to 300px, onCopy.",
    },
    {
      name: "CodeBlockDiff",
      kind: "variant",
      title: "Diff",
      description: "A proposed edit as a unified diff, highlighted as TSX.",
    },
    {
      name: "CodeBlockStreaming",
      kind: "state",
      title: "Streaming",
      description: "Code arriving a few characters at a time — the open last line never flickers.",
    },
    {
      name: "CodeBlockComposition",
      kind: "composition",
      title: "Command with a Run action",
      description: "A bash block with a header Button, followed by a header-less output block.",
    },
  ],
  agentNotes: [
    "Highlighting is built in, synchronous and dependency-free (no shiki/prism needed); unknown languages render as plain text.",
    "While a model is still writing code, pass `streaming` and the growing string as `code`; set it to false when the fence closes.",
    'For diffs keep the leading `+`/`-`/space on every line and set `diff` (or language="diff" for no inner highlighting).',
    "The default palette is ink and seal on paper: shu (vermilion) keywords and tags, matcha strings, kincha (ochre) constants and attributes, ai (indigo) functions, asagi types, ink properties, subtle italic comments. Chroma shrinks as lightness rises, so it is saturated on washi and calm on sumi.",
    "Theme the palette with CSS variables on any ancestor: --kura-syntax-keyword, -string, -constant, -function, -type, -tag, -attr, -property.",
    "`highlightCode(code, language)` is exported for custom renderers; it returns tokens grouped by line.",
  ],
});
