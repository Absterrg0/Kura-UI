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
        'An absolutely positioned, aria-hidden layer: one SVG path of whole ember dots on a 7px grid, measured to its box, that shrink in quarter-pixel steps away from the top-right corner (no wash, no mask). `data-state="visible" | "hidden"`.',
    },
  ],
  a11y: {
    notes: [
      "Purely decorative and aria-hidden. Never the only signal: pair it with a status-glyph and text that say the thing is waiting.",
      "Keep text out of its densest corner so contrast stays above 4.5:1.",
    ],
    reducedMotion:
      "Nothing in it moves. It still fades in and out: an opacity fade is not travel, and it is how ember leaves the screen.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["approval-prompt", "status-glyph", "dot-rail"],
  tags: ["halftone", "dots", "attention", "ember", "light"],
  examples: [
    { name: "HalftoneMinimal", kind: "minimal", title: "Needs you" },
    {
      name: "HalftoneFull",
      kind: "full",
      title: "Leaves when you decide",
      description:
        "Deny or Deploy: the halftone fades, the glyph changes and the label returns to ink, together.",
    },
    {
      name: "HalftoneComposition",
      kind: "composition",
      title: "A run waiting on one agent",
      description:
        "A smaller `reach` on a run panel; the waiting row carries ember on its glyph and its label.",
    },
  ],
  agentNotes: [
    "The parent must be `relative isolate` (the halftone is `absolute inset-0 -z-10`), and should round its own corners; the halftone inherits the radius and keeps its dots inside it.",
    "It measures its box on the client (ResizeObserver) and fades in once drawn, so it renders nothing on the server and never cuts a dot at an edge or the rounded corner.",
    "Smaller boxes need a smaller `reach` (about 0.35–0.45 on a list panel) so the dots stay out of the text.",
    "Toggle `visible` rather than unmounting, so it fades.",
  ],
});
