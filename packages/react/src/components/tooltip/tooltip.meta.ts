import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "tooltip",
  name: "Tooltip",
  category: "primitives",
  status: "stable",
  description:
    "Short label on hover or focus with an optional shortcut, origin-aware motion and instant skip between tooltips.",
  whenToUse: [
    "Name an icon-only control or reveal its shortcut.",
    "Brief supplementary hints (a few words).",
  ],
  whenNotToUse: [
    "Interactive or rich content (links, buttons, forms) — use popover.",
    "Essential information — it is invisible on touch devices; put it in the UI.",
    "Labelling icon buttons — icon-button already includes a tooltip.",
  ],
  props: [
    {
      name: "content",
      type: "React.ReactNode",
      required: true,
      description: "The label. Keep it to a few words.",
    },
    {
      name: "children",
      type: "React.ReactElement",
      required: true,
      description: "The trigger: one focusable element that accepts a ref.",
    },
    {
      name: "shortcut",
      type: "readonly KeyName[]",
      description: 'Keys shown after the label, e.g. ["mod", "enter"].',
    },
    {
      name: "side",
      type: '"top" | "right" | "bottom" | "left"',
      default: '"top"',
      description: "Preferred side.",
    },
    {
      name: "align",
      type: '"start" | "center" | "end"',
      default: '"center"',
      description: "Alignment on that side.",
    },
    {
      name: "delayDuration",
      type: "number",
      default: "500",
      description:
        "Hover delay in ms before opening. Inside a TooltipProvider, defaults to the provider's.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Render only the trigger.",
    },
    { name: "contentClassName", type: "string", description: "Classes for the floating bubble." },
  ],
  parts: [
    {
      name: "TooltipProvider",
      description: "Optional shared provider so moving between tooltips skips the delay.",
    },
    { name: "TooltipRoot", description: "The ui-sdk Root, for fully custom compositions." },
    { name: "TooltipTrigger", description: "The ui-sdk Trigger." },
    {
      name: "TooltipContent",
      dataSlot: "tooltip-content",
      description: "Styled floating bubble; accepts `shortcut`.",
      props: [
        {
          name: "shortcut",
          type: "readonly KeyName[]",
          description: "Keys shown after the label.",
        },
      ],
    },
  ],
  a11y: {
    role: "tooltip",
    notes: [
      "Opens on hover after a delay and immediately on keyboard focus; the trigger gets aria-describedby.",
      "Never the only way to reach information; not shown on touch.",
    ],
    keyboard: [
      { keys: "Tab", action: "Focus the trigger and open" },
      { keys: "Escape", action: "Close" },
    ],
    reducedMotion: "Scale and travel are removed; only a fast fade remains.",
  },
  dependencies: { npm: ["@ui-sdk/react"], kura: ["kbd"] },
  related: ["icon-button", "popover", "kbd"],
  tags: ["tooltip", "hint", "label", "hover", "overlay"],
  examples: [
    { name: "TooltipMinimal", kind: "minimal", title: "Basic" },
    { name: "TooltipFull", kind: "full", title: "Shortcut, sides and shared provider" },
    {
      name: "TooltipEditorToolbar",
      kind: "composition",
      title: "Editor toolbar with shared delay",
      description:
        "Tooltip parts under one TooltipProvider, so moving across the formatting toolbar skips the open delay.",
    },
  ],
  agentNotes: [
    "The child must forward refs and accept event props (Kura Button/IconButton do). Wrap plain text in a <button>.",
    "<Tooltip> (and IconButton) creates its own provider only when standalone; inside a <TooltipProvider> it joins it, so wrapping a toolbar in TooltipProvider makes moving between sibling tooltips instant.",
  ],
});
