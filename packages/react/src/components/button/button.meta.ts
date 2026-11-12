import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "button",
  name: "Button",
  category: "primitives",
  status: "stable",
  description:
    "The Kura button on ui-sdk: six variants, four sizes, loading, asChild, tactile press, a signal focus ring. Agents can press it; data-agent-confirm makes a person decide.",
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
        "Shows a spinner, sets aria-busy and aria-disabled and ignores presses while keeping focus and its width. An onClick that returns a Promise does the same until it settles.",
    },
    {
      name: "focusableWhenDisabled",
      type: "boolean",
      default: "false",
      description:
        "Keep a disabled button in the tab order with aria-disabled, so it can hold focus and show a tooltip that says why. Presses still do nothing.",
    },
    {
      name: "onClick",
      type: "(event: React.MouseEvent<HTMLElement>, details?: { source: string }) => unknown",
      description:
        'Runs on press. details.source says how: "mouse", "keyboard", "touch"… or "agent" when an agent pressed it through createAgent. Return a Promise to keep the button busy until it settles.',
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
      "Disabled buttons use the native disabled attribute; loading and focusableWhenDisabled buttons stay focusable with aria-disabled.",
      'Agent-ready: built on the ui-sdk Button, so createAgent lists it by its text with a press action. Add data-agent-confirm="<what it does>" to make an agent\'s press wait for a person.',
      "Focus ring: 1px canvas gap + 2px signal ring, only on :focus-visible.",
    ],
    keyboard: [
      { keys: "Enter / Space", action: "Activate" },
      { keys: "Tab", action: "Move focus" },
    ],
    reducedMotion: "The 0.98 press scale is disabled; color transitions remain.",
  },
  dependencies: { npm: ["@ui-sdk/react"], kura: ["spinner"] },
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
    "Destructive or costly actions an agent might trigger (delete, deploy, pay, send) should carry data-agent-confirm with a plain sentence of what happens; the agent's press then waits for the person.",
  ],
});
