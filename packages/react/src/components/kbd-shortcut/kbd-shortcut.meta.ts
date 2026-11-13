import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "kbd-shortcut",
  name: "KbdShortcut",
  category: "primitives",
  status: "beta",
  description:
    "Labelled keyboard-shortcut hint (“Send” and its keys, ⌘ on Apple and Ctrl elsewhere) that can also bind the shortcut and light its keys while pressed.",
  whenToUse: [
    "Hints under or inside a prompt composer: “Send”, “New line”, “Stop”, each with its keys.",
    "Advertise and bind a global shortcut in one element (e.g. Mod+K for search, Mod+J to toggle a panel).",
    "Empty states and onboarding that teach shortcuts.",
  ],
  whenNotToUse: [
    "Showing a single key or combo without a label or binding — use kbd.",
    "A shortcut inside a tooltip — pass `shortcut` to tooltip or icon-button instead.",
    "Binding a shortcut with no visible hint — call the useHotkey hook directly.",
  ],
  props: [
    {
      name: "keys",
      type: "readonly KeyName[]",
      required: true,
      description:
        'The combo, e.g. ["mod", "enter"]. `mod` renders ⌘ on Apple platforms and Ctrl elsewhere.',
    },
    {
      name: "label",
      type: "React.ReactNode",
      description: 'Short action label shown before the keys, e.g. "Send".',
    },
    {
      name: "onTrigger",
      type: "(event: KeyboardEvent) => void",
      description:
        "Bind the combo on `document` and call this when pressed. Omit for a display-only hint.",
    },
    {
      name: "enabled",
      type: "boolean",
      default: "true",
      description:
        "Enable/disable the binding without hiding the hint (renders dimmed when false).",
    },
    {
      name: "allowInInputs",
      type: "boolean",
      description:
        "Fire while typing in inputs. Defaults to true only when the combo contains a modifier.",
    },
    {
      name: "variant",
      type: '"raised" | "ghost"',
      default: '"raised"',
      description: "Keycap style. Use ghost inside buttons and dense toolbars.",
    },
    { name: "size", type: '"sm" | "md"', default: '"sm"', description: "Keycap size." },
  ],
  parts: [
    {
      name: "KbdShortcut",
      dataSlot: "kbd-shortcut",
      description: "Wrapper; exposes `data-pressed` and `data-bound`.",
    },
    { name: "Label", dataSlot: "kbd-shortcut-label", description: "Optional action label." },
    { name: "Kbd", dataSlot: "kbd", description: "The combo, rendered with the kbd primitive." },
  ],
  a11y: {
    notes: [
      "Renders a semantic <kbd> combo with visually hidden spoken text (e.g. “Command Enter”); individual glyphs are aria-hidden.",
      "The binding is global (document keydown); without a modifier it is ignored while the user types in inputs.",
      "It is a hint, not a control: the action must also be reachable by a focusable button.",
    ],
    keyboard: [
      { keys: "The configured combo", action: "Calls onTrigger and shows the keys pressed" },
    ],
    reducedMotion: "The 1px key press travel is removed; colour change remains.",
  },
  dependencies: { npm: [], kura: ["kbd"] },
  related: ["kbd", "tooltip", "icon-button", "composer", "command-palette"],
  tags: ["keyboard", "shortcut", "hotkey", "hint", "kbd", "composer", "accelerator"],
  examples: [
    { name: "KbdShortcutMinimal", kind: "minimal", title: "Display-only hint" },
    {
      name: "KbdShortcutFull",
      kind: "full",
      title: "Bound shortcut",
      description: "Press the combo: the keys light up and a counter increments.",
    },
    {
      name: "KbdShortcutComposerHints",
      kind: "composition",
      title: "Composer footer hints",
      description: "A row of hints as used under a prompt composer.",
    },
  ],
  agentNotes: [
    "Use `mod` (not `meta`/`ctrl`) for the primary modifier so it is correct on every platform.",
    "Only one mounted KbdShortcut should bind a given combo; render the others display-only (no onTrigger).",
    "Key names follow KeyboardEvent.key plus aliases: mod, cmd, ctrl, alt/option, shift, enter, esc, up/down/left/right, space.",
  ],
});
