import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "command-palette",
  name: "CommandPalette",
  category: "input",
  status: "beta",
  description:
    "⌘K command palette for agent actions: fuzzy search, groups, recents, nested pages with async loading, and shortcut hints.",
  whenToUse: [
    "A global launcher for agent actions: run/stop an agent, switch agents, add context, change settings.",
    "Navigating many commands or entities (files, threads, workflows) by typing.",
    "Multi-step choices as nested pages (“Change theme…” → Light / Dark), including lists fetched on demand.",
  ],
  whenNotToUse: [
    "Commands typed inline inside a prompt — use slash-command-menu.",
    "Choosing a model — use model-picker.",
    "A handful of starter prompts in an empty chat — use prompt-suggestions.",
  ],
  props: [
    {
      name: "items",
      type: "readonly CommandPaletteItem[]",
      required: true,
      description:
        "Items: { id, label, description?, icon?, group?, keywords?, shortcut?, onSelect?, children?, loadChildren?, placeholder?, disabled? }. children/loadChildren open a nested page.",
    },
    { name: "open", type: "boolean", description: "Controlled open state." },
    { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Open state changes." },
    {
      name: "hotkey",
      type: "readonly KeyName[] | null",
      default: '["mod", "k"]',
      description: "Global toggle shortcut (works in inputs). null disables it.",
    },
    {
      name: "trigger",
      type: "React.ReactElement",
      description: "Element rendered as the dialog trigger, e.g. <CommandPaletteTrigger />.",
    },
    {
      name: "recent",
      type: "string[]",
      description:
        "Controlled recent item ids (most recent first), shown as “Recent” when the query is empty.",
    },
    { name: "defaultRecent", type: "string[]", description: "Initial recents when uncontrolled." },
    {
      name: "onRecentChange",
      type: "(ids: string[]) => void",
      description: "Called when an item is used (persist it to localStorage if you like).",
    },
    { name: "recentLimit", type: "number", default: "4", description: "Max recents shown." },
    {
      name: "onSelect",
      type: "(item: CommandPaletteItem) => void",
      description: "Called after any leaf item runs (in addition to item.onSelect).",
    },
    {
      name: "onQueryChange",
      type: "(query: string) => void",
      description: "Every query change — fetch server results into `items` and toggle `loading`.",
    },
    {
      name: "loading",
      type: "boolean",
      default: "false",
      description:
        "Show skeleton rows and aria-busy (root page). Nested pages with loadChildren handle this themselves.",
    },
    {
      name: "placeholder",
      type: "string",
      default: '"Search or run a command…"',
      description: "Search placeholder on the root page.",
    },
    {
      name: "emptyMessage",
      type: "string",
      default: '"No results"',
      description: "Shown when nothing matches.",
    },
    {
      name: "label",
      type: "string",
      default: '"Command palette"',
      description: "Accessible dialog title (visually hidden).",
    },
  ],
  parts: [
    {
      name: "CommandPalette",
      dataSlot: "command-palette",
      description:
        "Modal dialog surface (opaque raised surface over a dimming scrim, origin-top pop). data-page = current nested page id.",
    },
    {
      name: "CommandPaletteSearch",
      dataSlot: "command-palette-search",
      description: "Search row with breadcrumbs for nested pages.",
    },
    {
      name: "CommandPaletteGroup",
      dataSlot: "command-palette-group",
      description: "Group heading (Recent first).",
    },
    {
      name: "CommandPaletteItem",
      dataSlot: "command-palette-item",
      description:
        "role=option row: icon, label, description, shortcut or chevron. data-active, data-disabled.",
    },
    {
      name: "CommandPaletteLoading",
      dataSlot: "command-palette-loading",
      description: "Skeleton rows while loading.",
    },
    {
      name: "CommandPaletteFooter",
      dataSlot: "command-palette-footer",
      description: "Result count and the Enter action (Run / Open).",
    },
    {
      name: "CommandPaletteTrigger",
      dataSlot: "command-palette-trigger",
      description: "Search-field-styled button with the shortcut; pass it as `trigger`.",
      props: [
        {
          name: "placeholder",
          type: "string",
          default: '"Search or ask…"',
          description: "Button text.",
        },
        {
          name: "shortcut",
          type: "readonly KeyName[]",
          default: '["mod", "k"]',
          description: "Shortcut keys shown on the right.",
        },
      ],
    },
  ],
  a11y: {
    role: "dialog > combobox + listbox",
    notes: [
      "A modal Radix dialog with a visually hidden title; focus moves to the search input on open and returns to the trigger on close.",
      "The input is a combobox using aria-activedescendant, so screen readers read the highlighted option while focus stays in the field.",
      "The listbox is aria-busy while loading; the footer's result count is a polite live region.",
      "Nested pages are announced through the input's label (“Search Change theme…”) and shown as breadcrumbs.",
    ],
    keyboard: [
      { keys: "Mod+K", action: "Toggle the palette (configurable)" },
      { keys: "ArrowDown / ArrowUp", action: "Move the highlight (wraps, skips disabled)" },
      { keys: "Home / End", action: "First / last item (empty query)" },
      { keys: "Enter", action: "Run the item or open its page" },
      { keys: "Backspace (empty query) / Escape", action: "Go back one page" },
      { keys: "Escape (root page)", action: "Close" },
    ],
    reducedMotion: "The dialog and overlay fade without scale; skeleton rows stop pulsing.",
  },
  dependencies: { npm: ["@ui-sdk/react", "lucide-react"], kura: ["kbd"] },
  related: ["slash-command-menu", "model-picker", "kbd-shortcut", "prompt-suggestions"],
  tags: ["command-palette", "cmdk", "search", "launcher", "keyboard", "actions", "menu", "agent"],
  examples: [
    { name: "CommandPaletteMinimal", kind: "minimal", title: "With a trigger" },
    {
      name: "CommandPaletteFull",
      kind: "full",
      title: "Agent actions, recents and nested pages",
      description:
        "Controlled open state, Mod+K, recents, a nested “Switch agent…” page and an async “Run workflow…” page.",
    },
    {
      name: "CommandPaletteAsyncSearch",
      kind: "composition",
      title: "Server-side search",
      description:
        "onQueryChange fetches results into `items` while `loading` shows skeleton rows.",
    },
  ],
  agentNotes: [
    "Mount one palette near the app root; it portals itself. Only one instance should bind ⌘K — pass hotkey={null} to others.",
    "Use `children` for static sub-pages and `loadChildren` for fetched ones (the loading state is automatic).",
    "Persist recents with recent/onRecentChange (e.g. localStorage); recents resolve ids anywhere in the item tree.",
    "Shortcuts on items are display-only; bind them with useHotkey so they also work when the palette is closed.",
    "scoreCommand(text, query) is exported if you need the same fuzzy ranking elsewhere.",
  ],
});
