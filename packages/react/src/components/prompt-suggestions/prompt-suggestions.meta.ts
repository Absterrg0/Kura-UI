import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "prompt-suggestions",
  name: "PromptSuggestions",
  category: "input",
  status: "beta",
  description:
    "Starter prompts for empty chat states — keycaps, cards or a list that rise in with a short stagger and fill the composer when clicked.",
  whenToUse: [
    "The empty state of a chat or agent: show 3–6 example prompts the user can start from.",
    "Follow-up suggestions under an answer (“Make it shorter”, “Add sources”) using the chips variant.",
    "Onboarding that teaches what the assistant can do, with a title and a one-line description per prompt.",
  ],
  whenNotToUse: [
    "Commands typed inline in the prompt — use slash-command-menu.",
    "Global actions and navigation — use command-palette.",
    "More than ~8 items or anything that needs search — use command-palette or a list.",
  ],
  props: [
    {
      name: "suggestions",
      type: "readonly PromptSuggestion[]",
      required: true,
      description:
        "Items: { id?, title, description?, icon?, prompt? }. `prompt` defaults to title + description.",
    },
    {
      name: "onSelect",
      type: "(prompt: string, suggestion: PromptSuggestion) => void",
      description: "Called with the prompt text on click — typically sets the composer value.",
    },
    {
      name: "variant",
      type: '"chips" | "cards" | "list"',
      default: '"cards"',
      description:
        "chips = wrapping keycaps (titles only), cards = one sheet of two-column cells with title and description, list = bare rows.",
    },
    {
      name: "stagger",
      type: "number",
      default: "0.04",
      description: "Seconds between items entering (30–50ms reads best). Capped after 8 items.",
    },
    {
      name: "label",
      type: "string",
      default: '"Suggestions"',
      description: "Accessible name of the list.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disable every suggestion.",
    },
  ],
  parts: [
    {
      name: "PromptSuggestions",
      dataSlot: "prompt-suggestions",
      description: "<ul> root; data-variant = chips | cards | list.",
    },
    {
      name: "PromptSuggestionsItem",
      dataSlot: "prompt-suggestions-item",
      description:
        "Each suggestion is a native <button>; an arrow fades in on hover/focus (cards, list).",
    },
    {
      name: "PromptSuggestionsIcon",
      dataSlot: "prompt-suggestions-icon",
      description:
        "Optional icon, bare and 16px, beside the title (cards, list) or inside the keycap (chips).",
    },
  ],
  a11y: {
    notes: [
      "A labelled <ul> of native buttons; each button's name is its title (plus description).",
      "Icons and the hover arrow are aria-hidden.",
      "After filling a composer, move focus to its textarea so the user can edit and send (see the composition example).",
    ],
    keyboard: [
      { keys: "Tab / Shift+Tab", action: "Move between suggestions" },
      { keys: "Enter / Space", action: "Select a suggestion" },
    ],
    reducedMotion:
      "Items fade in together-ish without rising; hover arrows and press travel do not move.",
  },
  dependencies: { npm: ["lucide-react", "motion"], kura: [] },
  related: ["composer", "slash-command-menu", "command-palette"],
  tags: ["suggestions", "starters", "empty-state", "prompts", "chips", "onboarding", "stagger"],
  examples: [
    { name: "PromptSuggestionsMinimal", kind: "minimal", title: "Chips" },
    {
      name: "PromptSuggestionsFull",
      kind: "full",
      title: "Cards with descriptions and refresh",
      description: "Swap the set to see items leave and stagger back in.",
    },
    {
      name: "PromptSuggestionsEmptyChat",
      kind: "composition",
      title: "Empty chat filling a composer",
      description: "Selecting a row fills the composer and focuses it for editing.",
    },
  ],
  agentNotes: [
    "Give items stable `id`s; changing the array with new ids animates the swap (old items fade out, new ones stagger in).",
    "Keep titles under ~6 words; put detail in `description` (cards/list only — chips show the title).",
    "To fill a Composer: control its `value`, call setValue(prompt) in onSelect, then focus the ComposerInput ref.",
    "Hide the suggestions once the conversation has messages; they are an empty-state affordance.",
  ],
});
