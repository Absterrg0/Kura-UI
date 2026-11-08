import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "button",
  name: "Button",
  category: "primitives",
  status: "stable",
  description:
    "The Kura button: six variants, four sizes, loading state, asChild, tactile press and a signal focus ring.",
  whenToUse: [
    "Any clickable action: submit, confirm, cancel, open.",
    "Links that should look like buttons (use asChild with your router's Link).",
  ],
  whenNotToUse: [
    "Icon-only actions — use icon-button (it enforces an accessible label and adds a tooltip).",
    "Approve/deny decisions for agent actions — use approval-prompt.",
  ],
  props: [
    {
      name: "variant",
      type: '"primary" | "secondary" | "ghost" | "outline" | "accent" | "danger"',
      default: '"primary"',
      description:
        "primary = solid ink call to action; secondary = soft grey fill; outline = surface with a hairline; ghost = no chrome until hover; accent = the AI signal color (max one per view); danger = destructive.",
    },
    {
      name: "size",
      type: '"xs" | "sm" | "md" | "lg"',
      default: '"md"',
      description: "Height 24 / 28 / 32 / 40px.",
    },
    {
      name: "loading",
      type: "boolean",
      default: "false",
      description:
        "Shows a spinner, sets aria-busy and disables the button while keeping its width.",
    },
    {
      name: "asChild",
      type: "boolean",
      default: "false",
      description: "Render the single child element (e.g. <a> or <Link>) with button styles.",
    },
  ],
  parts: [
    {
      name: "buttonVariants",
      description: "Function returning the class string, for non-button elements.",
    },
  ],
  a11y: {
    notes: [
      'Defaults to type="button" so it never submits forms by accident; pass type="submit" explicitly.',
      "Disabled and loading buttons use the native disabled attribute.",
      "Focus ring: 1px canvas gap + 2px signal ring, only on :focus-visible.",
    ],
    keyboard: [
      { keys: "Enter / Space", action: "Activate" },
      { keys: "Tab", action: "Move focus" },
    ],
    reducedMotion: "The 0.98 press scale is disabled; color transitions remain.",
  },
  dependencies: { npm: ["radix-ui"], kura: ["spinner"] },
  related: ["icon-button", "kbd-shortcut", "tooltip"],
  tags: ["button", "action", "cta", "submit", "link", "loading"],
  examples: [
    { name: "ButtonMinimal", kind: "minimal", title: "Primary" },
    { name: "ButtonFull", kind: "full", title: "Variants, sizes, loading" },
    { name: "ButtonAsLink", kind: "composition", title: "As a link (asChild)" },
  ],
  agentNotes: [
    "Use `accent` only for the single most AI-specific action in view (e.g. “Run agent”). Default to `primary`.",
    "Icons inside are auto-sized; do not add size classes unless you need a non-default size.",
  ],
});
