import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "border-beam",
  name: "BorderBeam",
  category: "effects",
  status: "beta",
  description:
    "A brush-red stroke that travels around its parent's border — a quiet “an agent is working in here” signal for composers, cards and panels.",
  whenToUse: [
    "A composer, card or panel whose content an agent is currently editing or generating.",
    "A running tool call or background task row that should read as live without a spinner.",
    "Highlighting the one container on screen that is waiting for or producing AI output.",
  ],
  whenNotToUse: [
    "Small inline 'thinking' feedback — use thinking-indicator or shimmer-text.",
    "Filling a background with colour — use mesh-gradient or aurora.",
    "Focus or selection states — use the focus ring (shadow-kura-focus), not a beam.",
    "Several beams on one screen at once: it is a signal; more than one or two becomes noise.",
  ],
  props: [
    {
      name: "active",
      type: "boolean",
      default: "true",
      description:
        "Show the beam. Toggling fades it in/out over 480ms and pauses the animation while hidden — keep it mounted.",
    },
    { name: "duration", type: "number", default: "6", description: "Seconds per lap." },
    {
      name: "size",
      type: "number",
      default: "0.25",
      description: "Beam length as a share of the lap, 0.05–0.9.",
    },
    { name: "width", type: "number", default: "1", description: "Ring thickness in px." },
    {
      name: "colors",
      type: "readonly string[]",
      description:
        "CSS colours from tail to head. Default: a dry vermilion tail (transparent → accent 18% → accent 55% → accent) gathering into a seal-red `--kura-shu` head. Tokens and color-mix() work.",
    },
    {
      name: "glow",
      type: "boolean",
      default: "false",
      description:
        "Add a softly blurred copy of the stroke so it bleeds into the surface like ink on washi (not clipped by the parent unless it has overflow-hidden). Keep it subtle: no neon.",
    },
    {
      name: "reverse",
      type: "boolean",
      default: "false",
      description: "Travel counter-clockwise.",
    },
    {
      name: "offset",
      type: "number",
      default: "0",
      description:
        "Starting position as a share of the lap, 0–1. Use 0.5 on a second beam to run two beams opposite each other.",
    },
  ],
  parts: [
    {
      name: "BorderBeam",
      dataSlot: "border-beam",
      description:
        "Absolutely positioned overlay (`inset-0`, `rounded-[inherit]`, pointer-events none). `data-active` mirrors `active`.",
    },
    {
      name: "Glow",
      dataSlot: "border-beam-glow",
      description: "Ink-bleed layer: a lightly blurred, thicker ring; only rendered with `glow`.",
    },
    {
      name: "Ring",
      dataSlot: "border-beam-ring",
      description: "The masked conic gradient ring that carries the animation.",
    },
  ],
  a11y: {
    notes: [
      "Purely decorative (aria-hidden). Pair it with real text — a role=status label such as “Editing 3 files…” — so the busy state is not conveyed by motion alone.",
      "It never intercepts pointer events, so the container stays fully interactive.",
    ],
    keyboard: [],
    reducedMotion:
      "The beam stops travelling and becomes a static, softly tinted ring (head colour at 45%) so the container still reads as active.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["thinking-indicator", "shimmer-text", "composer", "tool-call", "mesh-gradient"],
  tags: ["border", "beam", "glow", "loading", "busy", "agent", "conic-gradient", "css", "brush"],
  examples: [
    {
      name: "BorderBeamMinimal",
      kind: "minimal",
      title: "Card with a beam",
      description: "Drop it inside any relative, rounded element.",
    },
    {
      name: "BorderBeamFull",
      kind: "full",
      title: "Composer with two beams",
      description:
        "Glow, width, size, speed, a second opposite beam via offset, and toggling active.",
    },
    {
      name: "BorderBeamAgentTask",
      kind: "composition",
      title: "Running task row",
      description: "ShimmerText status, a Stop Button and a beam that fades out when stopped.",
    },
  ],
  agentNotes: [
    "The parent must be `relative` (or otherwise positioned) and should carry the border radius; the beam uses `rounded-[inherit]`.",
    "Render it as the last child so it paints above the content edge; it does not take space.",
    "Pure CSS: no 'use client' needed. Styles are injected once via a React 19 hoisted <style>.",
    "Keep it mounted and flip `active` instead of conditionally rendering, so it fades rather than pops.",
    "On wide, short elements the beam speeds up along the short sides (it is an angle sweep); prefer size 0.2–0.35 there.",
  ],
});
