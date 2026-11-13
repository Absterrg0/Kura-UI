import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "model-picker",
  name: "ModelPicker",
  category: "input",
  status: "beta",
  description:
    "Searchable popover for choosing an AI model, grouped by provider, with context size, speed and cost hints, and capabilities spelled out for the active row.",
  whenToUse: [
    "Let the user switch the model in a chat composer toolbar or a chat header.",
    "Compare models at a glance: vision/tools/reasoning support, context window, speed and price tier.",
    "Any “choose one of N models/agents/providers” selector that benefits from search and grouping.",
  ],
  whenNotToUse: [
    "Running actions or navigating — use command-palette.",
    "Inserting commands while typing a prompt — use slash-command-menu.",
    "Two or three static options without metadata — a segmented control or plain select is enough.",
  ],
  props: [
    {
      name: "models",
      type: "readonly ModelPickerModel[]",
      required: true,
      description:
        "Models: { id, name, provider?, description?, capabilities?, contextWindow?, speed?: 1|2|3, cost?: 1|2|3, badge?, disabled?, icon? }. Grouped by provider in first-seen order.",
    },
    { name: "value", type: "string", description: "Controlled selected model id." },
    {
      name: "defaultValue",
      type: "string",
      description: "Initial id when uncontrolled. Defaults to the first enabled model.",
    },
    {
      name: "onValueChange",
      type: "(id: string, model: ModelPickerModel) => void",
      description: "Called when the user picks a model.",
    },
    { name: "open", type: "boolean", description: "Controlled open state." },
    { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Open state changes." },
    {
      name: "searchable",
      type: "boolean",
      description: "Show the search field. Default: true when there are more than 6 models.",
    },
    {
      name: "placeholder",
      type: "string",
      default: '"Select model"',
      description: "Trigger text when nothing is selected.",
    },
    {
      name: "searchPlaceholder",
      type: "string",
      default: '"Search models…"',
      description: "Search field placeholder.",
    },
    {
      name: "emptyMessage",
      type: "string",
      default: '"No models match"',
      description: "Shown when the search has no results.",
    },
    {
      name: "showDetails",
      type: "boolean",
      default: "true",
      description: "Fixed-height footer describing the highlighted model (no layout shift).",
    },
    {
      name: "side",
      type: '"top" | "bottom"',
      default: '"bottom"',
      description:
        "Preferred popover side; flips on collision. Use top in a bottom-docked composer.",
    },
    {
      name: "align",
      type: '"start" | "center" | "end"',
      default: '"start"',
      description: "Popover alignment relative to the trigger.",
    },
    {
      name: "size",
      type: '"sm" | "md"',
      default: '"sm"',
      description: "Trigger height: sm 28px for toolbars, md 32px.",
    },
    {
      name: "inline",
      type: "boolean",
      default: "false",
      description:
        "Render the list in place and always shown, with no trigger (a settings page, onboarding). Choosing selects and the list stays. open/side/align/size do not apply.",
    },
  ],
  parts: [
    {
      name: "ModelPicker",
      dataSlot: "model-picker",
      description:
        "The trigger button (provider mark, model name, chevron). data-state = open | closed. With `inline`, the in-place list sheet instead (data-inline).",
    },
    {
      name: "ModelPickerContent",
      dataSlot: "model-picker-content",
      description: "Popover surface; scales from the trigger (origin-aware).",
    },
    {
      name: "ModelPickerSearch",
      dataSlot: "model-picker-search",
      description: "Search row; the input is the combobox that owns keyboard navigation.",
    },
    {
      name: "ModelPickerGroup",
      dataSlot: "model-picker-group",
      description: "role=group per provider, labelled by its heading.",
    },
    {
      name: "ModelPickerItem",
      dataSlot: "model-picker-item",
      description:
        "role=option 36px row: the model's sigil, name and badge word, then fixed columns for context, speed (three dots) and cost ($$$), and a check on the selected one. data-active, data-selected, data-disabled. Capabilities are spoken on the row and written in the details strip.",
    },
    {
      name: "ModelPickerDetails",
      dataSlot: "model-picker-details",
      description:
        "Footer with the highlighted model's description (up to two lines) and its capabilities. Fixed height, so moving through the list never shifts it.",
    },
  ],
  a11y: {
    role: "combobox + listbox",
    notes: [
      "The trigger is labelled “Model: <name>”. On open, focus moves to the search combobox (or the listbox when not searchable) and returns to the trigger on close.",
      "Highlighting uses aria-activedescendant, so focus never leaves the search field while navigating.",
      "Options expose aria-selected and aria-disabled; provider groups are role=group with their heading as label.",
      "Capability icons, speed and cost meters carry visually hidden text (“Vision”, “Fast”, “High cost”), so the meta line reads naturally.",
    ],
    keyboard: [
      { keys: "Enter / Space / ArrowDown", action: "Open from the trigger" },
      { keys: "ArrowDown / ArrowUp", action: "Move the highlight (wraps, skips disabled models)" },
      { keys: "Home / End", action: "First / last model (when the search is empty)" },
      { keys: "Enter", action: "Choose the highlighted model and close" },
      { keys: "Escape", action: "Close and return focus to the trigger" },
    ],
    reducedMotion:
      "The popover fades without scale or travel and the chevron flips without rotating; highlight changes are instant in all modes.",
  },
  dependencies: { npm: ["lucide-react"], kura: ["agent-sigil", "popover"] },
  related: ["composer", "command-palette", "slash-command-menu"],
  tags: ["model", "llm", "select", "combobox", "picker", "provider", "dropdown"],
  examples: [
    {
      name: "ModelPickerMinimal",
      kind: "minimal",
      title: "The list",
      description:
        "Shown in place with `inline`: five models in two providers, the selected one checked, and the highlighted model described below.",
    },
    {
      name: "ModelPickerFull",
      kind: "full",
      title: "Searchable, grouped, controlled",
      description:
        "Eight models across providers, a disabled tier, badges, capabilities and a controlled open state.",
    },
    {
      name: "ModelPickerInComposer",
      kind: "composition",
      title: "In a composer toolbar",
      description: "Opens upward from the composer's toolbar.",
    },
  ],
  agentNotes: [
    'Pass `side="top"` inside a composer docked to the bottom of the viewport.',
    "speed: 3 = fast, 1 = slow/thorough. cost: 1 = cheap, 3 = expensive. Omit either to hide it.",
    "`icon` takes a 16px provider logo; without it the model gets a dot sigil from its name.",
    "Use `inline` only where the list itself belongs on the page; in toolbars and composers use the trigger.",
    'formatContextWindow(200000) → "200K" is exported for use elsewhere (e.g. a context-meter).',
  ],
});
