import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "context-meter",
  name: "ContextMeter",
  category: "agent",
  status: "beta",
  description:
    "How full the context window is: a compact rail of dots with a hover breakdown, and ContextPanel, the window as one hundred dots (one per percent).",
  whenToUse: [
    "Show how much of a model's context window a conversation uses (e.g. in a composer footer or chat header).",
    "Break usage down by source — system prompt, tool definitions, attached files, history — in a hover card.",
    "Warn before the context fills up (auto-compaction, truncation) with warning/danger thresholds.",
    "Show any other token budget (per-request output limit, monthly quota) as a bar.",
  ],
  whenNotToUse: [
    "Indeterminate progress or “thinking” — use shimmer-text or reasoning.",
    "Upload or task progress — use dot-rail (or agent-timeline for multi-step work).",
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
        "Breakdown: { id, label, tokens, color? }[], e.g. system / tools / files / history. Enables the hover card and shades the hundred-dot matrix. Colors default to ink tints.",
    },
    {
      name: "warningAt",
      type: "number",
      default: "0.7",
      description: "Fraction (0–1) from which the meter turns from muted to full ink.",
    },
    {
      name: "dangerAt",
      type: "number",
      default: "0.9",
      description:
        "Fraction (0–1) from which the meter reads “nearly full” (it stays ink: a full window is not a failure).",
    },
    {
      name: "valueDisplay",
      type: '"percent" | "tokens" | "none"',
      description: "Value next to the rail: 42% (default) or 84.2k / 200k.",
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
      description: 'Trigger button. `data-level="ok" | "warning" | "danger"`.',
    },
    {
      name: "Bar",
      dataSlot: "context-meter-bar",
      description:
        "A DotRail of the window; muted ink while ok, full ink above the warning threshold.",
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
        "Hover/click card: totals, the window as one hundred dots (one per percent, shaded by segment), legend with tokens and % of the window, free space, footer.",
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
      "Numbers and the rail jump to the new value instead of rolling/growing; the card only fades.",
  },
  dependencies: { npm: [], kura: ["dot-rail", "popover"] },
  related: ["composer", "model-picker", "message", "tool-call"],
  tags: ["tokens", "context-window", "usage", "meter", "budget", "progress", "llm", "limits"],
  examples: [
    {
      name: "ContextMeterMinimal",
      kind: "minimal",
      title: "The hundred dots",
      description:
        "ContextPanel: the window as one hundred dots, shaded by segment, with the legend.",
    },
    {
      name: "ContextMeterFull",
      kind: "full",
      title: "Thread header with a breakdown",
      description:
        "A thread card with the meter and its breakdown on hover. Attach logs to watch the numbers roll past the thresholds.",
    },
    {
      name: "ContextMeterThresholds",
      kind: "state",
      title: "Thresholds",
      description:
        "ok, filling-up and nearly-full meters in a list of threads, each labelled by its thread.",
    },
    {
      name: "ContextMeterInComposer",
      kind: "composition",
      title: "In a composer footer",
      description: "Next to the attach and send IconButtons of a composer.",
    },
  ],
  agentNotes: [
    "Pass `segments` whenever you know the breakdown; the meter then sums them and gets a hover card. Without segments it is a plain reading (no card).",
    "Use the provider's real window size for `max` (e.g. 200000) and recount after every turn — counts roll smoothly between values.",
    'For a quota rather than a context window, set `label` (e.g. "Output").',
  ],
});
