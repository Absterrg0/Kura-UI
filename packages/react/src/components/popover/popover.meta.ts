import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "popover",
  name: "Popover",
  category: "primitives",
  status: "stable",
  description:
    "Floating panel (opaque raised surface, hairline ring, soft shadow) anchored to a trigger, with focus management and origin-aware motion.",
  whenToUse: [
    "Small interactive panels: settings for a composer, a model's details, a share menu, a filter form.",
    "Content anchored to a control that should not navigate away.",
  ],
  whenNotToUse: [
    "Plain hover labels — use tooltip.",
    "Choosing a model — use model-picker. Slash commands — use slash-command-menu. Global search — use command-palette.",
    "Blocking decisions — use a dialog or approval-prompt.",
  ],
  props: [
    { name: "open", type: "boolean", description: "Controlled open state." },
    { name: "defaultOpen", type: "boolean", description: "Initial open state when uncontrolled." },
    {
      name: "onOpenChange",
      type: "(open: boolean) => void",
      description: "Called when the open state changes.",
    },
    {
      name: "modal",
      type: "boolean",
      default: "false",
      description: "Trap focus and block outside interaction.",
    },
  ],
  parts: [
    { name: "Popover", dataSlot: "popover", description: "Root; owns open state." },
    {
      name: "PopoverTrigger",
      dataSlot: "popover-trigger",
      description: "Toggles the popover. Use asChild with a Button.",
    },
    {
      name: "PopoverAnchor",
      dataSlot: "popover-anchor",
      description: "Optional alternative positioning anchor.",
    },
    {
      name: "PopoverContent",
      dataSlot: "popover-content",
      description: "The floating panel (portalled). Accepts side, align, sideOffset.",
      props: [
        {
          name: "inline",
          type: "boolean",
          default: "false",
          description: "Render without a portal (inside dialogs).",
        },
      ],
    },
    {
      name: "PopoverClose",
      dataSlot: "popover-close",
      description: "Closes the popover. Use asChild with a Button.",
    },
  ],
  a11y: {
    role: "dialog",
    notes: [
      "Trigger gets aria-expanded and aria-controls; focus moves into the content on open and returns on close.",
      "Give the content an accessible name (aria-label or a heading with aria-labelledby).",
    ],
    keyboard: [
      { keys: "Enter / Space", action: "Toggle from the trigger" },
      { keys: "Escape", action: "Close and return focus" },
      { keys: "Tab", action: "Move through content" },
    ],
    reducedMotion: "Scale and travel are removed; content fades.",
  },
  dependencies: { npm: ["@ui-sdk/react"], kura: [] },
  related: ["tooltip", "model-picker", "slash-command-menu"],
  tags: ["popover", "overlay", "floating", "panel", "menu", "dropdown"],
  examples: [
    {
      name: "PopoverMinimal",
      kind: "minimal",
      title: "A usage card",
      description: "Starts open (`defaultOpen`); the trigger or Esc closes it.",
    },
    { name: "PopoverFull", kind: "full", title: "Controlled settings panel" },
    {
      name: "PopoverShareChat",
      kind: "composition",
      title: "Share a chat",
      description:
        "A chat header whose Share button opens a visibility picker and a copy-link row.",
    },
  ],
  agentNotes: [
    "Always use `<PopoverTrigger asChild><Button …/></PopoverTrigger>` to avoid nested buttons.",
  ],
});
