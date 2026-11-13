import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "terminal",
  name: "Terminal",
  category: "workspace",
  status: "experimental",
  description:
    "Streamed command output that behaves like a real terminal: ANSI colours, progress-bar rewrites, stick-to-bottom, live clock and exit-code badge.",
  whenToUse: [
    "Show a shell command an agent ran (pnpm test, git status, a build) with its output, while it runs and after.",
    "Stream a child process's stdout (AsyncIterable<string>) or a growing log string into the UI.",
    "Long logs where the tail matters: collapse to the last N lines with “Show all N lines”.",
    "A dev-server or watcher log with a Stop control in the header.",
  ],
  whenNotToUse: [
    "Source code or a snippet to copy — use code-block.",
    "Reviewing file edits — use diff-view.",
    "A tool call whose output is structured JSON — use tool-call.",
    "Interactive shells that take keyboard input — this renders output only (no PTY, no input line).",
  ],
  props: [
    {
      name: "command",
      type: "string",
      description:
        "The command, shown on the prompt line (`$ pnpm test`) and in the accessible name.",
    },
    {
      name: "lines",
      type: "readonly string[] | string",
      description:
        "Output as lines or one growing string. ANSI SGR (colours 30–37/90–97, 256/truecolour approximated, bold, dim, italic, underline, inverse) and cursor controls (\\r, erase line, cursor up, backspace) are rendered; OSC titles/links are stripped. Append-only updates are parsed incrementally.",
    },
    {
      name: "stream",
      type: "AsyncIterable<string>",
      description:
        "Output as a stream of chunks; takes precedence over `lines`. Chunks may split lines and escape sequences. Status is “running” until it ends.",
    },
    { name: "onStreamEnd", type: "() => void", description: "Called once `stream` has ended." },
    {
      name: "status",
      type: '"idle" | "running" | "done" | "failed"',
      description:
        'Lifecycle. Default: from exitCode (0 → done, otherwise failed), "running" while a stream is open, else "idle" (no glyph).',
    },
    {
      name: "exitCode",
      type: "number | null",
      description: "Exit code, shown as a badge once finished (red when non-zero).",
    },
    {
      name: "startedAt",
      type: "Date | number",
      description: "Start time for the live clock. Default: when status became running.",
    },
    {
      name: "duration",
      type: "number",
      description:
        "Final duration in ms for persisted runs. Default: measured from running → finished in this session.",
    },
    {
      name: "cwd",
      type: "string",
      description: 'Working directory in the header, e.g. "~/acme/web".',
    },
    {
      name: "title",
      type: "React.ReactNode",
      description: 'Header title, e.g. "Run tests". Default: the cwd, or "Terminal".',
    },
    {
      name: "prompt",
      type: "string",
      default: '"$"',
      description: "Prompt glyph before the command.",
    },
    {
      name: "maxHeight",
      type: "number",
      default: "320",
      description:
        "Viewport height in px. Output sticks to the bottom while the user is there; scrolling up shows “Jump to latest” / “N new lines”.",
    },
    {
      name: "maxLines",
      type: "number",
      description: "Collapse to the last N lines with a “Show all N lines” control at the top.",
    },
    {
      name: "expanded",
      type: "boolean",
      description: "Showing every line past maxLines (controlled).",
    },
    {
      name: "defaultExpanded",
      type: "boolean",
      default: "false",
      description: "Initial expanded state when uncontrolled.",
    },
    {
      name: "onExpandedChange",
      type: "(expanded: boolean) => void",
      description: "Called when “Show all” / “Show last N” is used.",
    },
    {
      name: "wrap",
      type: "boolean",
      default: "true",
      description:
        "Soft-wrap long lines: at spaces and after a path's slashes, never at a hyphen, with the continuation hanging under the text (past the line's indent and markers). false scrolls sideways instead.",
    },
    {
      name: "copyable",
      type: "boolean",
      default: "true",
      description:
        "Show the copy button: copies `$ command` plus the plain output (no escape codes).",
    },
    {
      name: "onCopy",
      type: "(text: string) => void",
      description: "Called with the copied text after a successful copy.",
    },
    { name: "header", type: "boolean", default: "true", description: "Show the header row." },
    {
      name: "actions",
      type: "React.ReactNode",
      description: "Extra header controls before the copy button, e.g. a Stop Button.",
    },
  ],
  parts: [
    {
      name: "Terminal",
      dataSlot: "terminal",
      description:
        '`data-status="idle" | "running" | "done" | "failed"`, `data-state="collapsed" | "expanded"` when maxLines applies.',
    },
    {
      name: "Header",
      dataSlot: "terminal-header",
      description:
        "Status glyph, title (`terminal-title`), cwd, live clock / duration (`terminal-elapsed`), exit badge (`terminal-exit-code`), actions, copy.",
    },
    {
      name: "Output",
      dataSlot: "terminal-output",
      description:
        '`role="log"` scroll viewport (aria-live off), keyboard-scrollable; prompt line (`terminal-command`) and lines (`terminal-line`).',
    },
    {
      name: "Cursor",
      dataSlot: "terminal-cursor",
      description: "Block cursor at the live edge while running.",
    },
    {
      name: "Expand",
      dataSlot: "terminal-expand",
      description: "“Show all N lines” row when collapsed (`terminal-collapse` to collapse again).",
    },
    {
      name: "Jump",
      dataSlot: "terminal-jump",
      description:
        "Floating “Jump to latest” / “N new lines” key when scrolled away from the bottom.",
    },
  ],
  a11y: {
    role: "log",
    notes: [
      "The output is a role=log region named “Output of <command>” with aria-live off, so streaming never floods a screen reader.",
      "A separate polite status announces only transitions: “pnpm test running”, “pnpm test failed, exit code 1”, and copy confirmation.",
      "The viewport is focusable (Tab) and scrolls with arrow keys / Page Up / Page Down.",
      "Status is text as well as colour: the exit badge reads “exit 1”; the glyph is decorative next to it.",
    ],
    keyboard: [
      { keys: "Tab", action: "Focus the output, then the expand, jump, action and copy buttons" },
      { keys: "Arrow keys / Page Up / Page Down", action: "Scroll the focused output" },
      { keys: "Enter / Space", action: "Activate Show all / Jump to latest / Copy" },
    ],
    reducedMotion:
      "The cursor stops pulsing, the running glyph stops chasing, and the copy icon swap and jump-key entrance become plain fades. Jump to latest still scrolls smoothly only if the browser allows it.",
  },
  dependencies: { npm: ["@ui-sdk/react", "lucide-react"], kura: ["icon-button", "status-glyph"] },
  related: ["diff-view", "file-changes", "code-block", "tool-call", "agent-timeline"],
  tags: ["terminal", "shell", "logs", "ansi", "streaming", "command", "agent", "workspace"],
  examples: [
    {
      name: "TerminalMinimal",
      kind: "minimal",
      title: "Finished command",
      description: "`git status --short` with coloured output and an exit badge.",
    },
    {
      name: "TerminalFull",
      kind: "full",
      title: "Streaming test run",
      description:
        "`pnpm test` streams vitest output line by line (live clock, cursor, stick-to-bottom), ends with one failing test and exit 1.",
    },
    {
      name: "TerminalCollapsed",
      kind: "state",
      title: "Collapsed build log",
      description:
        "A Next.js build collapsed to the last 9 lines; one line is a \\r-rewritten progress counter.",
    },
    {
      name: "TerminalComposition",
      kind: "composition",
      title: "Dev server with Stop",
      description: "A Button in `actions` stops a dev server that keeps logging.",
    },
  ],
  agentNotes: [
    `Agent-ready (ui-sdk): createAgent lists the terminal by its command with the status and exit code as its value. It has no actions.`,
    "Pass raw process output; don't strip ANSI codes. Escape sequences split across chunks are buffered.",
    "For a growing string, only append — replacing earlier text triggers a full re-parse (still correct, just slower).",
    "Keep the same Terminal mounted from running → done so the measured duration works; for history pass `duration`.",
    "`stream` is consumed once; create a new iterable to restart. Set `exitCode` in onStreamEnd to finish with a badge.",
    "Monochrome by default: only red and green keep a hue; yellow maps to ink and blue/magenta/cyan to muted ink. Override any with --kura-terminal-{red,green,yellow,blue,magenta,cyan,white,gray,black} on a parent.",
    "Helpers exported alongside: parseAnsi(text), stripAnsi(text), AnsiScreen (incremental).",
  ],
});
