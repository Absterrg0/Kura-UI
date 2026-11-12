import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "browser-session",
  name: "BrowserSession",
  category: "workspace",
  status: "experimental",
  description:
    "A computer/browser-use session made legible: tidy browser frame, the page, the agent's cursor with click ripple and target box, and a step log with take-over.",
  whenToUse: [
    "Show what a browser-use or computer-use agent is doing on a web page (Operator, Claude computer use, Browserbase, Playwright-driven agents).",
    "Stream screenshots of a remote browser (`src`) with the agent's next action drawn on top (`cursor`, `highlight`).",
    "Replay a recorded browser run step by step with the log of navigate / click / type / scroll / extract actions.",
    'Hand control to the human when the agent hits a login, 2FA or CAPTCHA (`status="paused"` + `onResume`), or let them take over (`onTakeOver`).',
  ],
  whenNotToUse: [
    "Terminal or shell output from the agent — use terminal.",
    "Code edits made by the agent — use diff-view or file-changes.",
    "A plan or todo list of the whole run — use task-list.",
    "A static rendered artifact (HTML preview, document) — use artifact-card.",
  ],
  props: [
    {
      name: "url",
      type: "string",
      required: true,
      description:
        "Page URL in the address bar. The host is emphasised, the path muted; https shows a lock.",
    },
    {
      name: "title",
      type: "string",
      description: "Page title next to the address bar (hidden in narrow containers).",
    },
    {
      name: "children",
      type: "React.ReactNode",
      description: "Viewport content: a live page, or a mock rendered as markup.",
    },
    {
      name: "src",
      type: "string",
      description:
        "A screenshot URL to show instead of children (e.g. the latest frame from a remote browser).",
    },
    {
      name: "alt",
      type: "string",
      description: "Alt text for `src`. Default “Screenshot of {url}”.",
    },
    {
      name: "viewport",
      type: "{ width: number; height: number }",
      description:
        "Design size of the page in CSS px (e.g. the agent's 1280×800 screen). Children render at this size and scale to fit the frame, so % coordinates stay exact at any width. Omit to let children flow at the frame's width.",
    },
    {
      name: "aspectRatio",
      type: "number",
      default: "16 / 10",
      description: "Viewport aspect ratio when `viewport` is not given.",
    },
    {
      name: "scrollTop",
      type: "number",
      default: "0",
      description: "Vertical page scroll in viewport px; eases on change (use for scroll steps).",
    },
    {
      name: "cursor",
      type: "BrowserPoint | null",
      description: "The agent's cursor { x, y } in % of the viewport. Glides to new positions.",
    },
    {
      name: "cursorLabel",
      type: "string",
      description: "Name tag on the cursor, e.g. the agent's name.",
    },
    {
      name: "clickKey",
      type: "string | number",
      description:
        "Change it to play a click ripple at the cursor. Default: the active step's id when that step is a click.",
    },
    {
      name: "highlight",
      type: "BrowserHighlight | null",
      description:
        'Box around the target element: { x, y, width, height } in % plus an optional `label` tag (e.g. `button "Create pull request"`).',
    },
    {
      name: "steps",
      type: "readonly BrowserStep[]",
      description:
        'The action log. BrowserStep = { id, kind: "navigate" | "click" | "type" | "scroll" | "extract", label, status: AgentStatus, detail? (mono: URL, selector, typed text) }. Omit to hide the log.',
    },
    {
      name: "activeStep",
      type: "string",
      description: "Id of the step being executed. Default: the first running step.",
    },
    {
      name: "status",
      type: '"browsing" | "paused" | "done" | "failed"',
      default: '"browsing"',
      description:
        "browsing = “Agent is browsing” (the chasing glyph); paused = “Paused for you” (it needs you: an ember glyph and label); done; failed.",
    },
    {
      name: "statusText",
      type: "React.ReactNode",
      description: "Secondary text after the status, e.g. “Enter the 2FA code, then hand back”.",
    },
    {
      name: "startedAt",
      type: "Date | number",
      description: "Session start (wall clock) for the elapsed clock; ticks while browsing.",
    },
    {
      name: "loading",
      type: "boolean",
      description:
        "Show the loading bar under the address bar. Default: true while the active step is a running navigate.",
    },
    {
      name: "actions",
      type: "React.ReactNode",
      description: "Extra controls in the status line (e.g. open in new tab, replay).",
    },
    {
      name: "onTakeOver",
      type: "() => void",
      description: "Shows a “Take over” button while browsing.",
    },
    {
      name: "onResume",
      type: "() => void",
      description: "Shows a “Resume agent” button while paused.",
    },
    {
      name: "layout",
      type: '"auto" | "side" | "stacked"',
      default: '"auto"',
      description:
        "Step log beside the browser (side), below it (stacked), or beside only when the container is ≥ 48rem (auto).",
    },
  ],
  parts: [
    {
      name: "BrowserSession",
      dataSlot: "browser-session",
      description:
        "Root panel; `data-status`, `data-layout`; container-query context; polite status region.",
    },
    {
      name: "Header",
      dataSlot: "browser-session-header",
      description:
        "Status line: glyph, “Agent is browsing” / “Paused for you”, statusText, done/total, elapsed, actions, Take over / Resume.",
    },
    {
      name: "Elapsed",
      dataSlot: "browser-session-elapsed",
      description: "Mono clock from startedAt.",
    },
    {
      name: "Browser",
      dataSlot: "browser-session-browser",
      description: "Column with the chrome and the viewport.",
    },
    {
      name: "Chrome",
      dataSlot: "browser-session-chrome",
      description: "Title (favicon letter + text) and the address bar.",
    },
    {
      name: "Address",
      dataSlot: "browser-session-address",
      description: 'role="group" “Address”: lock, host, muted path, in mono.',
    },
    {
      name: "Loading",
      dataSlot: "browser-session-loading",
      description: "The chasing glyph at the end of the address field while a page loads.",
    },
    {
      name: "Viewport",
      dataSlot: "browser-session-viewport",
      description: "Fixed-aspect frame (no layout shift), inset in the sheet.",
    },
    {
      name: "Page",
      dataSlot: "browser-session-page",
      description:
        "Holds children/src; scaled to fit when `viewport` is set; translated by scrollTop.",
    },
    {
      name: "Overlay",
      dataSlot: "browser-session-overlay",
      description: "aria-hidden layer for the highlight, ripple and cursor.",
    },
    {
      name: "Highlight",
      dataSlot: "browser-session-highlight",
      description: "Ink box + mono tag around the target; eases between targets.",
    },
    {
      name: "Cursor",
      dataSlot: "browser-session-cursor",
      description: "Pointer arrow with an optional ink name tag; glides between points.",
    },
    {
      name: "Ripple",
      dataSlot: "browser-session-ripple",
      description: "Ink ring that expands and fades after the cursor arrives.",
    },
    {
      name: "Log",
      dataSlot: "browser-session-log",
      description: "Scrollable step log; keeps the active step in view.",
    },
    {
      name: "Step",
      dataSlot: "browser-session-step",
      description:
        '<li> with `data-kind`, `data-status`, `data-active`; aria-current="step" on the active one.',
    },
  ],
  a11y: {
    notes: [
      "The overlay (cursor, ripple, highlight) is decorative and aria-hidden; what the agent is doing is carried by the step log and the status line.",
      'The step log is an <ol> labelled “Browser actions”; each step speaks its status after the label, and the active one has aria-current="step".',
      "A polite status region announces the active step's label (when it is a string), “Paused for you” / your statusText, “Session ended” or “Session failed” — never the ticking clock.",
      "The address bar is a labelled group; the lock icon is labelled “Secure connection”. With `src`, the image gets alt text (default “Screenshot of {url}”).",
      "Take over / Resume agent are real buttons with visible focus. Paused state is signalled by text and glyph.",
    ],
    keyboard: [
      {
        keys: "Tab",
        action:
          "Moves to the status-line actions (Take over / Resume agent) and any controls inside the page.",
      },
    ],
    reducedMotion:
      "The cursor and highlight jump instead of gliding (the highlight still fades), the click ripple is skipped, page scroll is instant and the loading glyph holds still.",
  },
  dependencies: { npm: ["lucide-react"], kura: ["button", "status-glyph"] },
  related: ["terminal", "task-list", "run-header", "approval-prompt", "tool-call"],
  tags: [
    "agent",
    "browser",
    "computer-use",
    "browser-use",
    "operator",
    "cursor",
    "screenshot",
    "takeover",
  ],
  examples: [
    {
      name: "BrowserSessionMinimal",
      kind: "minimal",
      title: "A page with the agent's cursor",
      description: "A mock PR page at a fixed 800×500 design size, the cursor and a target box.",
    },
    {
      name: "BrowserSessionFull",
      kind: "full",
      title: "Opening the pull request",
      description:
        "Kura opens the compare view, types the title and description, clicks “Create pull request” and reads the PR number. The cursor glides, clicks ripple, the log advances and the session settles.",
    },
    {
      name: "BrowserSessionPaused",
      kind: "state",
      title: "Paused for you",
      description:
        "A 2FA prompt only the human can answer: “Paused for you” and a “Resume agent” key.",
    },
    {
      name: "BrowserSessionComposition",
      kind: "composition",
      title: "Under the plan",
      description: "A narrow stacked session under a TaskList, as in a run sidebar.",
    },
  ],
  agentNotes: [
    "Coordinates are percentages of the viewport. If your agent reports pixels on a W×H screen, pass `viewport={{ width: W, height: H }}` and use x = px / W * 100.",
    "For remote browsers pass the latest screenshot as `src` and keep `viewport` equal to the screenshot size; draw the *next* action with `cursor` + `highlight`.",
    "Change `clickKey` (e.g. an action counter) to replay the ripple; repeated clicks on the same step otherwise only ripple once.",
    'Set `status="paused"` whenever the agent needs the human (login, 2FA, CAPTCHA, payment) and say why in `statusText`.',
    "Map the agent's actions to the five kinds; put the URL, selector or typed text in `detail` (mono).",
  ],
});
