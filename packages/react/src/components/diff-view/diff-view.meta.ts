import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "diff-view",
  name: "DiffView",
  category: "workspace",
  status: "experimental",
  description:
    "Code review for agent edits: a parsed unified diff with syntax and word highlights, line numbers, and per-hunk Accept / Reject with j/k/a/r keys.",
  whenToUse: [
    "Let a user review the edits a coding agent made (Claude Code, Codex, Cursor-style) before applying or committing them.",
    "Show `git diff` / `git show` output or a model-written patch as a readable, highlighted diff.",
    "Per-change approval: accept or reject individual hunks, a whole file, or everything, and act on the resulting decisions.",
    "A read-only diff of what changed in a run (reviewable={false}).",
  ],
  whenNotToUse: [
    "Listing which files changed without showing contents — use file-changes (it composes well beside DiffView).",
    "Showing a single code snippet or a whole file — use code-block.",
    "Command or test output — use terminal.",
    "Approving a tool call or command before it runs — use approval-prompt.",
  ],
  props: [
    {
      name: "diff",
      type: "string",
      description:
        "A unified diff (`git diff`, `git show`, `diff -u`, a model's patch). Parsed with parseUnifiedDiff: renames, new/deleted/binary files, quoted paths, CRLF, missing counts, `\\ No newline at end of file`, and wrong hunk counts are handled. Ignored when `files` is given.",
    },
    {
      name: "files",
      type: "readonly DiffFileInput[]",
      description:
        'Structured files `{ path, oldPath?, status?, language?, binary?, hunks: [{ id?, oldStart?, newStart?, section?, lines }] }`. `lines` may be DiffLine objects or raw strings ("+added", "-removed", " context"); line numbers are computed.',
    },
    { name: "title", type: "React.ReactNode", default: '"Changes"', description: "Header title." },
    {
      name: "reviewable",
      type: "boolean",
      default: "true",
      description:
        "Show per-hunk Accept / Reject, per-file Accept file, Accept all / Reject all and the “2 of 5 reviewed” tally.",
    },
    {
      name: "review",
      type: "DiffReview",
      description:
        'Decisions (controlled): `{ [hunkId]: "accepted" | "rejected" }`; absent = pending. Hunk ids are `hunk.id` or `<path>#<index>` (see hunkId()).',
    },
    {
      name: "defaultReview",
      type: "DiffReview",
      default: "{}",
      description: "Initial decisions when uncontrolled.",
    },
    {
      name: "onReviewChange",
      type: "(review: DiffReview, change: DiffReviewChange) => void",
      description:
        'Called with the full next review state and `{ path, hunkIds, decision }` where decision is "accepted", "rejected" or "pending" (undo).',
    },
    {
      name: "collapsed",
      type: "readonly string[]",
      description: "Collapsed file paths (controlled).",
    },
    {
      name: "defaultCollapsed",
      type: "readonly string[]",
      default: "[]",
      description: "Initially collapsed file paths when uncontrolled.",
    },
    {
      name: "onCollapsedChange",
      type: "(collapsed: string[]) => void",
      description: "Called when a file is collapsed or expanded (by click or by collapseReviewed).",
    },
    {
      name: "collapseReviewed",
      type: "boolean",
      default: "true",
      description: "Collapse a file once every hunk in it has a decision (like GitHub's “Viewed”).",
    },
    {
      name: "autoAdvance",
      type: "boolean",
      default: "true",
      description:
        "After a decision, move focus to the next pending hunk (Cursor-style review flow).",
    },
    {
      name: "wrap",
      type: "boolean",
      default: "false",
      description: "Soft-wrap long lines instead of scrolling each hunk sideways.",
    },
    {
      name: "maxHeight",
      type: "number",
      description:
        "Scroll the files inside this height (px). File headers stay pinned while scrolling (also against page scroll without it).",
    },
    {
      name: "actions",
      type: "React.ReactNode",
      description: "Extra controls at the end of the header, e.g. a Commit button.",
    },
    {
      name: "empty",
      type: "React.ReactNode",
      description: "Rendered when there are no files. Default an icon + “No changes”.",
    },
  ],
  parts: [
    {
      name: "DiffView",
      dataSlot: "diff-view",
      description:
        '`data-state="empty" | "pending" | "reviewed"`, `data-reviewable`. A container query hides secondary header items below ~26–34rem.',
    },
    {
      name: "Header",
      dataSlot: "diff-view-header",
      description:
        "Title, mono summary (`diff-view-summary`: files, +N −M), review progress (`diff-view-progress`) and Accept all / Reject all.",
    },
    {
      name: "File",
      dataSlot: "diff-view-file",
      description:
        '`<section aria-label={path}>` with `data-status="added" | "modified" | "deleted" | "renamed"` and `data-state="open" | "closed"`.',
    },
    {
      name: "FileHeader",
      dataSlot: "diff-view-file-header",
      description:
        "Sticky row: collapse toggle (button, aria-expanded), path (`diff-view-path`: dim directory + bold name, old → new for renames), status word, +N −M, five ratio dots (`diff-view-ratio`), Accept file / review state (`diff-view-file-review`).",
    },
    {
      name: "Hunk",
      dataSlot: "diff-view-hunk",
      description:
        '`role="group"`, roving tabindex, `data-hunk-id`, `data-review="pending" | "accepted" | "rejected"`. Ink bar on the left when focused.',
    },
    {
      name: "HunkHeader",
      dataSlot: "diff-view-hunk-header",
      description:
        "`@@ −a,b +c,d @@` + section heading, and Reject / Accept (`diff-view-hunk-actions`) or the decision (`diff-view-hunk-state`) with Undo.",
    },
    {
      name: "Line",
      dataSlot: "diff-view-line",
      description:
        '`data-kind="context" | "add" | "remove"`: old and new line numbers, sign, highlighted code with word-level change marks.',
    },
  ],
  a11y: {
    notes: [
      "Each file is a labelled section; its header toggle is a button with aria-expanded/aria-controls.",
      "Hunks are focusable groups named “Change 2 of 9, src/auth/client.ts lines 10–19, pending review”; only the current hunk (and its buttons) is in the Tab order.",
      "Added/removed lines carry sr-only “added:” / “removed:” prefixes; colour is never the only signal (+/− signs, status words, labels).",
      "Decisions are announced in a polite status region (“Accepted hunk in src/middleware.ts. 3 of 9 reviewed.”) — once per action, never per render.",
      "Accept / Reject tooltips show their single-key shortcuts.",
    ],
    keyboard: [
      { keys: "J / K", action: "Next / previous hunk (skips collapsed files)" },
      { keys: "A", action: "Accept the focused hunk, then move to the next pending one" },
      { keys: "R", action: "Reject the focused hunk, then move to the next pending one" },
      { keys: "U / Backspace", action: "Undo the focused hunk's decision" },
      { keys: "Enter / Space", action: "On a file header: collapse or expand the file" },
      { keys: "Tab", action: "Through file headers and the focused hunk's buttons" },
    ],
    reducedMotion:
      "Chevron rotation, the settling of a reviewed hunk (its line tints clear) and the progress colour change apply instantly; no motion is essential.",
  },
  dependencies: {
    npm: ["@ui-sdk/react", "lucide-react"],
    kura: ["button", "code-block", "icon-button", "tooltip"],
  },
  related: ["file-changes", "code-block", "terminal", "approval-prompt", "tool-call"],
  tags: [
    "diff",
    "code-review",
    "patch",
    "git",
    "accept-reject",
    "agent",
    "syntax-highlighting",
    "workspace",
  ],
  examples: [
    {
      name: "DiffViewMinimal",
      kind: "minimal",
      title: "Basic",
      description: "One file from a unified diff string, with per-hunk review.",
    },
    {
      name: "DiffViewFull",
      kind: "full",
      title: "Review session",
      description:
        "The agent's whole migration (4 files, 9 hunks) with controlled review state, a scrolling body, pinned file headers and a keyboard legend. Try j, k, a, r, u.",
    },
    {
      name: "DiffViewStructured",
      kind: "variant",
      title: "Structured files",
      description: "Rename, new file and a binary file from structured input; read-only.",
    },
    {
      name: "DiffViewComposition",
      kind: "composition",
      title: "Apply accepted changes",
      description: "A footer bar with a Button acts on the accepted hunks.",
    },
  ],
  agentNotes: [
    `Agent-ready (ui-sdk): createAgent lists the diff by its title with "n of m reviewed" as its value and each change as an item named "<path> change <n>". Actions: accept, reject, undo, acceptAll, rejectAll; onReviewChange gets source: "agent" for them.`,
    "Pass the raw `git diff` string to `diff`; don't pre-split it. Use `files` when you already have structured hunks (raw '+'/'-'/' ' strings are fine as lines).",
    "Review state is keyed by hunk id: `hunk.id` if you set one (do this when hunks can shift, e.g. while an agent keeps editing), else `<path>#<index>`. Export `hunkId(file, hunk, index)` to compute it.",
    'To apply decisions, walk parseUnifiedDiff(diff) and keep hunks whose id is "accepted"; rejected and pending hunks are not applied.',
    "Helpers exported alongside: parseUnifiedDiff, normalizeFiles, wordDiff, countChanges, languageFromPath.",
    "Syntax highlighting uses code-block's synchronous highlighter; the language is inferred from the file extension (override with files[].language).",
    "Very large diffs render every line; collapse big files with defaultCollapsed (e.g. lockfiles) to keep it fast.",
  ],
});
