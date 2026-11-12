import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "halftone",
  name: "Halftone",
  category: "feedback",
  status: "beta",
  description:
    "Kura's one light: an ember halftone, dots that shrink as they fade from the top-right corner of the thing that needs a person.",
  whenToUse: [
    "Mark the single surface on screen that is waiting on a person (an approval, a blocked step) and fade it out once they decide.",
    "A panel that is blocked on a person other than an approval, e.g. a browser session paused for a login.",
  ],
  whenNotToUse: [
    'Decoration on ordinary panels: ember means "this needs you" and nothing else.',
    "More than one ember halftone on a screen at once; if several things wait, mark the newest.",
    "State inside a row — use status-glyph.",
  ],
  props: [
    {
      name: "visible",
      type: "boolean",
      default: "true",
      description: "Fade it out without unmounting, e.g. once the person has decided.",
    },
    {
      name: "reach",
      type: "number",
      default: "0.62",
      description: "How far the dots reach across the box, 0–1. Keep text clear of it.",
    },
  ],
  parts: [
    {
      name: "Halftone",
      dataSlot: "halftone",
      description:
        'An absolutely positioned, aria-hidden layer of three dot sizes (no wash). `data-state="visible" | "hidden"`.',
    },
  ],
  a11y: {
    notes: [
      "Purely decorative and aria-hidden. Never the only signal: pair it with a status-glyph and text that say the thing is waiting.",
      "Keep text out of its densest corner so contrast stays above 4.5:1.",
    ],
    reducedMotion: "It appears and disappears without the fade.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["approval-prompt", "status-glyph", "dot-rail"],
  tags: ["halftone", "dots", "attention", "ember", "light"],
  examples: [
    { name: "HalftoneMinimal", kind: "minimal", title: "Needs you" },
    { name: "HalftoneFull", kind: "full", title: "Reach and fading out" },
    {
      name: "HalftoneComposition",
      kind: "composition",
      title: "A blocked step",
      description: "With StatusGlyph and Button: the light leaves when the person decides.",
    },
  ],
  agentNotes: [
    "The parent must be `relative isolate` (the halftone is `absolute inset-0 -z-10`), and should round its own corners; the halftone inherits the radius.",
    "Needs the `kura-dots` utility from Kura's stylesheet.",
    "Toggle `visible` rather than unmounting, so it fades.",
  ],
});
