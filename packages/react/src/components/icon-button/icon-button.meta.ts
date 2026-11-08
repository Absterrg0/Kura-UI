import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "icon-button",
  name: "IconButton",
  category: "primitives",
  status: "stable",
  description:
    "Square icon-only button with a mandatory accessible label and an automatic tooltip (with optional shortcut).",
  whenToUse: [
    "Toolbar and composer actions: attach, mic, send, stop, copy, retry.",
    "Any action represented only by an icon.",
  ],
  whenNotToUse: [
    "Actions that need a visible text label — use button.",
    "Toggles with on/off state in a group — compose button with aria-pressed.",
  ],
  props: [
    {
      name: "label",
      type: "string",
      required: true,
      description: "Accessible name and tooltip text.",
    },
    {
      name: "icon",
      type: "React.ReactNode",
      required: true,
      description: "The icon element, e.g. <ArrowUp /> from lucide-react.",
    },
    {
      name: "tooltip",
      type: "boolean",
      default: "true",
      description: "Show label (and shortcut) in a tooltip.",
    },
    {
      name: "shortcut",
      type: "readonly KeyName[]",
      description: "Shortcut shown in the tooltip (display only).",
    },
    {
      name: "tooltipSide",
      type: '"top" | "right" | "bottom" | "left"',
      default: '"top"',
      description: "Tooltip side.",
    },
    {
      name: "variant",
      type: '"primary" | "secondary" | "ghost" | "outline" | "accent" | "danger"',
      default: '"ghost"',
      description: "Same variants as button; defaults to ghost.",
    },
    {
      name: "size",
      type: '"xs" | "sm" | "md" | "lg"',
      default: '"md"',
      description: "24 / 28 / 32 / 40px square.",
    },
  ],
  a11y: {
    notes: [
      "`label` becomes aria-label, so the control always has an accessible name.",
      "The tooltip opens on focus, so keyboard users see the label and shortcut too.",
    ],
    keyboard: [{ keys: "Enter / Space", action: "Activate" }],
    reducedMotion: "Inherits button: no press scale; tooltip fades without travel.",
  },
  dependencies: { npm: [], kura: ["button", "tooltip"] },
  related: ["button", "tooltip", "kbd-shortcut"],
  tags: ["button", "icon", "toolbar", "action", "tooltip"],
  examples: [
    { name: "IconButtonMinimal", kind: "minimal", title: "Basic" },
    { name: "IconButtonFull", kind: "full", title: "Composer toolbar" },
  ],
  agentNotes: [
    "Never pass aria-label; use `label`. The shortcut is display-only — bind it with useHotkey or kbd-shortcut.",
  ],
});
