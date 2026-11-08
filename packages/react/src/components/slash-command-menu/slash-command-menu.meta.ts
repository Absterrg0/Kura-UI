import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "slash-command-menu",
  name: "SlashCommandMenu",
  category: "input",
  status: "beta",
  description:
    "Inline “/” command menu anchored to the caret of a textarea, with filtering, groups, icons, descriptions and keyboard navigation.",
  whenToUse: [
    "Let users insert prompt templates or run actions by typing “/” in a composer (/summarize, /debug, /clear).",
    "Any textarea or input that needs caret-anchored suggestions triggered by a character (use `trigger` for “@” mentions or “#” tags).",
  ],
  whenNotToUse: [
    "A global ⌘K launcher for navigation and actions — use command-palette.",
    "Choosing a model from a toolbar — use model-picker.",
    "Static clickable starters in an empty chat — use prompt-suggestions.",
  ],
  props: [
    {
      name: "textareaRef",
      type: "React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>",
      required: true,
      description:
        "Ref to the field to watch, e.g. the `ref` you pass to ComposerInput. The menu never takes focus from it.",
    },
    {
      name: "commands",
      type: "readonly SlashCommand[]",
      required: true,
      description:
        "Commands: { id, label, description?, icon?, group?, keywords?, shortcut?, insert?, disabled? }.",
    },
    {
      name: "onSelect",
      type: "(command: SlashCommand, details: SlashCommandSelectDetails) => void",
      description:
        "Called after the typed “/query” has been replaced by `command.insert` (or removed). details.query is what was typed.",
    },
    {
      name: "onOpenChange",
      type: "(open: boolean) => void",
      description: "Called when the menu opens or closes.",
    },
    {
      name: "trigger",
      type: "string",
      default: '"/"',
      description: "Trigger character. Only fires at the start of a line or after whitespace.",
    },
    {
      name: "side",
      type: '"auto" | "top" | "bottom"',
      default: '"auto"',
      description: "auto opens below the caret and flips above when there is no room.",
    },
    {
      name: "emptyMessage",
      type: "string | null",
      default: '"No commands"',
      description: "Shown when nothing matches; null closes the menu instead.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Stop watching the field without unmounting.",
    },
  ],
  parts: [
    {
      name: "SlashCommandMenu",
      dataSlot: "slash-command-menu",
      description:
        "Floating panel portalled to <body>, position: fixed at the trigger character. data-side = top | bottom; scales from the caret corner.",
    },
    {
      name: "SlashCommandMenuGroup",
      dataSlot: "slash-command-menu-group",
      description: "role=group per `group`, labelled by its heading.",
    },
    {
      name: "SlashCommandMenuItem",
      dataSlot: "slash-command-menu-item",
      description:
        "role=option row: icon tile, label (matched text emphasised), description, shortcut. data-active, data-disabled.",
    },
    {
      name: "SlashCommandMenuFooter",
      dataSlot: "slash-command-menu-footer",
      description: "Key hints: ↑↓ navigate, ↵ insert, Esc dismiss.",
    },
  ],
  a11y: {
    role: "listbox",
    notes: [
      "Focus never leaves the textarea. While open, the textarea gets aria-controls, aria-autocomplete=list and aria-activedescendant pointing at the highlighted option, so screen readers read the option as you arrow.",
      "A polite status announces the number of matching commands.",
      "Pointer selection uses mousedown preventDefault so the textarea keeps focus and its caret.",
      "Insertion uses the browser's insertText command where available, so ⌘Z undoes a command like normal typing.",
    ],
    keyboard: [
      { keys: "/", action: "Open (at line start or after a space)" },
      { keys: "ArrowDown / ArrowUp", action: "Move the highlight (wraps, skips disabled)" },
      { keys: "Enter / Tab", action: "Insert the highlighted command" },
      { keys: "Escape", action: "Dismiss for this “/” (typing on does not reopen it)" },
      { keys: "Space / Backspace past /", action: "Closes the menu" },
    ],
    reducedMotion: "The menu fades in without the scale and 2px travel.",
  },
  dependencies: { npm: [], kura: ["kbd"] },
  related: ["composer", "command-palette", "prompt-suggestions"],
  tags: ["slash", "commands", "autocomplete", "mention", "caret", "menu", "composer", "textarea"],
  examples: [
    { name: "SlashCommandMenuMinimal", kind: "minimal", title: "On a plain textarea" },
    {
      name: "SlashCommandMenuFull",
      kind: "full",
      title: "Groups, icons, shortcuts and actions",
      description:
        "Ten commands in four groups, a disabled command, keywords (/tldr finds Summarize) and an action that clears the input.",
    },
    {
      name: "SlashCommandMenuInComposer",
      kind: "composition",
      title: "Inside a composer",
      description:
        "Pass the ComposerInput ref; Enter inserts the command instead of sending while the menu is open.",
    },
  ],
  agentNotes: [
    "Render the menu next to the field (anywhere in the tree); it portals itself to <body> and positions at the caret.",
    "It works with controlled fields: the replacement dispatches a native input event, so React onChange / Composer onValueChange fire.",
    'Use `insert` for prompt templates; omit it for actions and handle them in onSelect (e.g. id === "clear").',
    "Its keydown listener runs before React handlers and stops Enter/Tab/arrows while open, so Composer will not send mid-selection.",
    "getCaretRect(field, offset) is exported if you need caret coordinates for something else.",
  ],
});
