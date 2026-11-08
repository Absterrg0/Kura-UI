import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "context-meter",
  name: "ContextMeter",
  category: "agent",
  status: "beta",
  description:
    "Token / context-window usage as a compact ring or bar with warning and danger thresholds, rolling numbers and a segmented breakdown card.",
  whenToUse: [
    "Show how much of a model's context window a conversation uses (e.g. in a composer footer or chat header).",
    "Break usage down by source — system prompt, tool definitions, attached files, history — in a hover card.",
    "Warn before the context fills up (auto-compaction, truncation) with warning/danger thresholds.",
    "Show any other token budget (per-request output limit, monthly quota) as a bar.",
  ],
  whenNotToUse: [
    "Indeterminate progress or “thinking” — use shimmer-text or reasoning.",
    "Upload or task progress — use a progress bar (or agent-timeline for multi-step work).",
    "Billing/cost dashboards with history — use a chart.",
  ],
  props: [
    {
      name: "max",
      type: "number",
      required: true,
      description: "Context window size in tokens, e.g. 200000.",
    },
    { name: "used", type: "number", description: "Tokens used. Default: the sum of `segments`." },
    {
      name: "segments",
      type: "readonly ContextSegment[]",
      description:
        "Breakdown: { id, label, tokens, color? }[], e.g. system / tools / files / history. Enables the hover card and the segmented bar. Colors default to ink tints.",
    },
    {
      name: "variant",
      type: '"ring" | "bar"',
      default: '"ring"',
      description:
        "ring = 18px donut + value for tight toolbars; bar = horizontal (segmented) bar + value.",
    },
    {
      name: "warningAt",
      type: "number",
      default: "0.7",
      description: "Fraction (0–1) from which the meter is amber.",
    },
    {
      name: "dangerAt",
      type: "number",
      default: "0.9",
      description: "Fraction (0–1) from which the meter is red.",
    },
    {
      name: "valueDisplay",
      type: '"percent" | "tokens" | "none"',
      description:
        "Value next to the meter: 42% or 84.2k / 200k. Default percent for ring, tokens for bar.",
    },
    {
      name: "label",
      type: "string",
      default: '"Context"',
      description: "Name used in the accessible label and the card title (“Context window”).",
    },
    {
      name: "footer",
      type: "React.ReactNode",
      description:
        "Note at the bottom of the card. Defaults to a warning sentence at warning/danger levels.",
    },
    { name: "open", type: "boolean", description: "Hover card open (controlled)." },
    {
      name: "onOpenChange",
      type: "(open: boolean) => void",
      description: "Called when the hover card opens or closes.",
    },
  ],
  parts: [
    {
      name: "ContextMeter",
      dataSlot: "context-meter",
      description: 'Trigger button. `data-variant`, `data-level="ok" | "warning" | "danger"`.',
    },
    { name: "Ring", dataSlot: "context-meter-ring", description: "SVG donut (aria-hidden)." },
    {
      name: "Bar",
      dataSlot: "context-meter-bar",
      description:
        "Track + fill; segmented by `segments` while level is ok, a single amber/red fill above the thresholds.",
    },
    {
      name: "Value",
      dataSlot: "context-meter-value",
      description: "Mono tabular value that rolls to new numbers.",
    },
    {
      name: "Card",
      dataSlot: "context-meter-card",
      description:
        "Hover/click card: totals, segmented bar, legend with tokens and % of the window, free space, footer.",
    },
    { name: "Segment", dataSlot: "context-meter-segment", description: "One legend row." },
  ],
  a11y: {
    notes: [
      "The meter is a button whose accessible name carries the full reading: “Context: 84,210 of 200,000 tokens used (42%, filling up)”.",
      "The breakdown opens on hover (300ms delay) and on click/Enter, without moving focus; Escape closes it.",
      "Levels are conveyed in text (name + card footer), not only by colour.",
    ],
    keyboard: [
      { keys: "Enter / Space", action: "Open or close the breakdown card" },
      { keys: "Escape", action: "Close the card" },
    ],
    reducedMotion:
      "Numbers, ring and bar jump to the new value instead of rolling/growing; the card only fades.",
  },
  dependencies: { npm: [], kura: ["popover"] },
  related: ["composer", "model-picker", "message", "tool-call"],
  tags: ["tokens", "context-window", "usage", "meter", "budget", "progress", "llm", "limits"],
  examples: [
    {
      name: "ContextMeterMinimal",
      kind: "minimal",
      title: "Ring",
      description: "Used and max; nothing else needed.",
    },
    {
      name: "ContextMeterFull",
      kind: "full",
      title: "Ring and bar with a breakdown",
      description:
        "Segments, thresholds, value display and a footer. Add tokens to watch the numbers roll into warning and danger.",
    },
    {
      name: "ContextMeterThresholds",
      kind: "state",
      title: "Thresholds",
      description: "ok, warning and danger bars.",
    },
    {
      name: "ContextMeterInComposer",
      kind: "composition",
      title: "In a composer footer",
      description: "Next to an IconButton send action.",
    },
  ],
  agentNotes: [
    "Pass `segments` whenever you know the breakdown; the meter then sums them and gets a hover card. Without segments it is a plain reading (no card).",
    "Use the provider's real window size for `max` (e.g. 200000) and recount after every turn — counts roll smoothly between values.",
    'For a quota rather than a context window, set `label` (e.g. "Output") and use variant="bar".',
  ],
});
