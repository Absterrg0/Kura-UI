import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "button",
  name: "Button",
  category: "primitives",
  status: "stable",
  description:
    "The Kura button: ink on paper. Seven variants (including a brush swash), four sizes, loading state, asChild, a 1px press and a signal focus ring.",
  whenToUse: [
    "Any clickable action: submit, confirm, cancel, open.",
    "Links that should look like buttons (use asChild with your router's Link).",
    'The one hero action on a landing or empty state, painted as a brush swash (variant="brush").',
  ],
  whenNotToUse: [
    "Icon-only actions — use icon-button (it enforces an accessible label and adds a tooltip).",
    "Approve/deny decisions for agent actions — use approval-prompt.",
  ],
  props: [
    {
      name: "variant",
      type: '"primary" | "secondary" | "ghost" | "outline" | "accent" | "danger" | "brush"',
      default: '"primary"',
      description:
        "primary = ink call to action; secondary = a sheet of bright stock with a hairline edge; outline / ghost = quiet; accent = deep vermilion, the AI signal (max one per view); danger = beni red, destructive; brush = the ink laid down as one brush swash behind the label (hero actions only).",
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
      description:
        'Function returning the class string, for non-button elements. The brush stroke is an element, so for `brush` use <Button variant="brush" asChild> instead.',
    },
    {
      name: "BrushStroke",
      dataSlot: "button-brush",
      description:
        'Internal: the aria-hidden swash layer rendered behind the label when variant="brush" (CSS mask over a block of ink).',
    },
  ],
  a11y: {
    notes: [
      'Defaults to type="button" so it never submits forms by accident; pass type="submit" explicitly.',
      "Disabled and loading buttons use the native disabled attribute.",
      "Focus ring: 1px canvas gap + 2px signal ring, only on :focus-visible.",
      "Text contrast: accent rests on the deep vermilion and danger uses paper/ink text, both ≥ 4.5:1 in light and dark. The brush label sits on solid ink.",
      "The brush stroke is decorative (aria-hidden); the accessible name is the label text.",
    ],
    keyboard: [
      { keys: "Enter / Space", action: "Activate" },
      { keys: "Tab", action: "Move focus" },
    ],
    reducedMotion:
      "The 1px press travel (and the brush's slight press rotation) are dropped; color transitions remain.",
  },
  dependencies: { npm: ["radix-ui"], kura: ["spinner"] },
  related: ["icon-button", "kbd-shortcut", "tooltip"],
  tags: ["button", "action", "cta", "submit", "link", "loading", "brush"],
  examples: [
    { name: "ButtonMinimal", kind: "minimal", title: "Primary" },
    { name: "ButtonFull", kind: "full", title: "Variants, sizes, loading" },
    {
      name: "ButtonBrushHero",
      kind: "composition",
      title: "Brush swash hero action",
      description:
        "A mounted card with a display-serif line, one brush button for the hero action and a ghost button beside it.",
    },
    { name: "ButtonAsLink", kind: "composition", title: "As a link (asChild)" },
  ],
  agentNotes: [
    "Use `accent` only for the single most AI-specific action in view (e.g. “Run agent”). Default to `primary`.",
    "Icons inside are auto-sized; do not add size classes unless you need a non-default size.",
    "Use `brush` at most once per view, for the hero action (landing, empty state, onboarding). Inside toolbars, dialogs and forms use `primary`.",
    'Recolor the brush with CSS variables, not bg classes: `className="[--kura-brush:var(--kura-accent-hover)] [--kura-brush-hover:var(--kura-accent-text)] text-kura-accent-fg"` paints it vermilion.',
    "`brush` widens its horizontal padding because the stroke tapers; keep labels to 1–4 words.",
  ],
});
