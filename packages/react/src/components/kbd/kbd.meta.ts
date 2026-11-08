import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "kbd",
  name: "Kbd",
  category: "primitives",
  status: "stable",
  description:
    "Keyboard key or key combo, platform-aware (⌘ on Apple, Ctrl elsewhere) and hydration-safe.",
  whenToUse: [
    "Show a key or combo inline in text, menus, tooltips or docs.",
    "Building blocks for shortcut hints inside other components.",
  ],
  whenNotToUse: [
    "A labelled hint that should also bind the shortcut — use kbd-shortcut.",
    "A shortcut inside a tooltip — pass `shortcut` to tooltip.",
  ],
  props: [
    {
      name: "keys",
      type: "readonly KeyName[]",
      description: 'Combo to render, e.g. ["mod", "k"]. When omitted, children render as one key.',
    },
    {
      name: "variant",
      type: '"raised" | "ghost"',
      default: '"raised"',
      description: "raised = standalone keycap; ghost = inline inside buttons, tooltips and menus.",
    },
    { name: "size", type: '"sm" | "md"', default: '"md"', description: "18px or 22px tall." },
    {
      name: "pressed",
      type: "boolean",
      default: "false",
      description: "Render the pressed state.",
    },
  ],
  parts: [
    {
      name: "Kbd",
      dataSlot: "kbd",
      description: "Outer <kbd>. For combos it contains sr-only label text.",
    },
    {
      name: "Key",
      dataSlot: "kbd-key",
      description: "One nested <kbd> per key in a combo (aria-hidden).",
    },
  ],
  a11y: {
    notes: [
      "Combos include visually hidden text with one spoken label (“Command K”); the glyph keys are aria-hidden.",
      "Platform detection runs after hydration, so server HTML shows Ctrl and updates to ⌘ on Apple devices.",
    ],
    reducedMotion: "Pressed state does not translate.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["kbd-shortcut", "tooltip", "command-palette"],
  tags: ["keyboard", "key", "shortcut", "kbd", "hotkey"],
  examples: [
    { name: "KbdMinimal", kind: "minimal", title: "Single key" },
    { name: "KbdFull", kind: "full", title: "Combos, variants, sizes" },
  ],
  agentNotes: ["Use `mod` for the primary modifier; never hard-code ⌘ or Ctrl glyphs."],
});
