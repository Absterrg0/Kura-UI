import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "file-changes",
  name: "FileChanges",
  category: "workspace",
  status: "experimental",
  description:
    "The files an agent touched: a compact folder tree or flat list with A/M/D/R status, +/− counts, live “editing” markers and selection.",
  whenToUse: [
    "Show which files a coding agent has changed during or after a run (a sidebar next to the conversation or a diff).",
    "Indicate live activity: which file the agent is reading or editing right now.",
    "A file picker for a review screen: select a file to show its diff in diff-view.",
  ],
  whenNotToUse: [
    "Showing the actual line changes — use diff-view (pair them: FileChanges as navigation, DiffView as content).",
    "A step-by-step log of the agent's actions — use agent-timeline or task-list.",
    "A general file browser or editor tree with create/rename/drag — this is a read-only change list.",
  ],
  props: [
    {
      name: "files",
      type: "readonly FileChange[]",
      required: true,
      description:
        '`{ path, status: "A" | "M" | "D" | "R", oldPath?, additions?, deletions?, state?: "reading" | "editing" }`. Paths are repo-relative with "/" separators.',
    },
    { name: "title", type: "React.ReactNode", default: '"Changes"', description: "Header title." },
    {
      name: "view",
      type: '"tree" | "list"',
      description:
        "tree = folders (single-child chains compacted like VS Code, folders first); list = flat, file name then dimmed directory. Controlled.",
    },
    {
      name: "defaultView",
      type: '"tree" | "list"',
      default: '"tree"',
      description: "Initial view when uncontrolled.",
    },
    {
      name: "onViewChange",
      type: '(view: "tree" | "list") => void',
      description: "Called when the header toggle switches views.",
    },
    {
      name: "viewToggle",
      type: "boolean",
      default: "true",
      description: "Show the tree/list toggle in the header.",
    },
    {
      name: "selectedPath",
      type: "string | null",
      description: "The selected file path (controlled). Pass null for no selection.",
    },
    {
      name: "defaultSelectedPath",
      type: "string | null",
      default: "null",
      description: "Initially selected file when uncontrolled.",
    },
    {
      name: "onSelect",
      type: "(path: string) => void",
      description: "Called when a file is chosen by click, Enter or Space.",
    },
    {
      name: "defaultCollapsed",
      type: "readonly string[]",
      description: 'Folder paths collapsed initially, e.g. ["src/auth/__tests__"].',
    },
    { name: "maxHeight", type: "number", description: "Scroll the rows inside this height (px)." },
    { name: "actions", type: "React.ReactNode", description: "Extra header controls." },
    {
      name: "empty",
      type: "React.ReactNode",
      description: "Rendered when `files` is empty. Default an icon + “No changes yet”.",
    },
  ],
  parts: [
    {
      name: "FileChanges",
      dataSlot: "file-changes",
      description: '`data-view="tree" | "list"`.',
    },
    {
      name: "Header",
      dataSlot: "file-changes-header",
      description:
        "Title, summary (`file-changes-summary`: “7 files +33 −38”), actions, view toggle.",
    },
    {
      name: "Rows",
      dataSlot: "file-changes-rows",
      description: 'role="tree" (tree view) or role="listbox" (list view).',
    },
    {
      name: "Folder",
      dataSlot: "file-changes-folder",
      description:
        'treeitem with aria-expanded, `data-state="open" | "closed"`; collapsed folders show their file count and a pulsing dot if a file inside is being edited.',
    },
    {
      name: "File",
      dataSlot: "file-changes-file",
      description:
        'treeitem/option with aria-selected, `data-status="A" | "M" | "D" | "R"`, `data-state="reading" | "editing"`, `data-selected`. Selected rows get bg-kura-active.',
    },
    {
      name: "Name",
      dataSlot: "file-changes-name",
      description: "Mono file name; struck through when deleted.",
    },
    {
      name: "Counts",
      dataSlot: "file-changes-counts",
      description: "+N −M in mono, or “editing” (with the running glyph) / “reading”.",
    },
    {
      name: "Status",
      dataSlot: "file-changes-status",
      description:
        "Status letter: A green, M subtle ink, D red, R muted; sr-only word (“, modified”).",
    },
    {
      name: "Guide",
      dataSlot: "file-changes-guide",
      description: "Hairline indent guides in the tree.",
    },
  ],
  a11y: {
    role: "tree | listbox",
    notes: [
      "Tree view is a WAI-ARIA tree (treeitems with aria-level/posinset/setsize, aria-expanded on folders, aria-selected on files); list view is a listbox of options.",
      "One roving tab stop: Tab enters the list at the selected (or first) row.",
      "Each file's accessible name includes its status word and live state (“client.ts … , modified, being edited”).",
      "The view toggle buttons use aria-pressed and have tooltips.",
    ],
    keyboard: [
      { keys: "ArrowDown / ArrowUp", action: "Next / previous row" },
      { keys: "ArrowRight", action: "Expand a folder, or move into it" },
      { keys: "ArrowLeft", action: "Collapse a folder, or move to the parent folder" },
      { keys: "Home / End", action: "First / last row" },
      { keys: "Enter / Space", action: "Select a file, or toggle a folder" },
    ],
    reducedMotion: "The editing glyph stops chasing; row fade-in and chevron rotation are instant.",
  },
  dependencies: { npm: ["lucide-react"], kura: ["icon-button", "status-glyph"] },
  related: ["diff-view", "terminal", "agent-timeline", "task-list", "run-header"],
  tags: ["files", "changes", "git", "tree", "agent", "status", "sidebar", "workspace"],
  examples: [
    {
      name: "FileChangesMinimal",
      kind: "minimal",
      title: "Changed files",
      description: "Seven files from the auth migration as a folder tree, one still being edited.",
    },
    {
      name: "FileChangesFull",
      kind: "full",
      title: "Live run",
      description:
        "Files join the changeset as the agent edits them — the active one carries the running glyph and an “editing” marker — then the run settles. Controlled selection.",
    },
    {
      name: "FileChangesList",
      kind: "variant",
      title: "Flat list",
      description: "List view: file name first, directory dimmed.",
    },
    {
      name: "FileChangesComposition",
      kind: "composition",
      title: "With DiffView",
      description:
        "FileChanges as navigation; DiffView shows the selected file parsed from the same unified diff.",
    },
  ],
  agentNotes: [
    "Map git porcelain codes directly: A/M/D/R (treat C copies as A, T type changes as M).",
    'Set `state: "editing"` on the file the agent is writing and clear it when done — the row shows the running glyph, and so do collapsed ancestor folders.',
    "Selection is single and files-only; folders toggle. Use onSelect to drive a DiffView or editor beside it.",
    "Counts are optional; omit additions/deletions when unknown rather than passing 0.",
  ],
});
