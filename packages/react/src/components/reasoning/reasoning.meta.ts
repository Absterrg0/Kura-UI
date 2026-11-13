import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "reasoning",
  name: "Reasoning",
  category: "agent",
  status: "beta",
  description:
    "Collapsible thinking trace: the chasing glyph and a “Thinking… 12s” label while active that settle into “Thought for 14s”, revealing muted reasoning text.",
  whenToUse: [
    "Show a reasoning model's chain of thought / thinking blocks (Claude extended thinking, o-series reasoning summaries) above the answer.",
    "Indicate that the model is thinking, with elapsed time, before the first answer token arrives.",
    "Keep a finished trace available but out of the way (collapsed to one line).",
  ],
  whenNotToUse: [
    "A bare “Thinking…” label with no trace to reveal — use thinking-indicator (or shimmer-text).",
    "A sequence of discrete agent steps with states — use agent-timeline.",
    "A single tool invocation with arguments and results — use tool-call.",
  ],
  props: [
    {
      name: "active",
      type: "boolean",
      default: "false",
      description:
        "The model is still thinking: the glyph chases and an elapsed timer ticks. Turning it false settles the label and (with autoCollapse) collapses the trace.",
    },
    {
      name: "duration",
      type: "number",
      description:
        "Seconds spent thinking, if you know it (e.g. stored with the message). Otherwise measured while `active`.",
    },
    { name: "open", type: "boolean", description: "Expanded (controlled)." },
    {
      name: "defaultOpen",
      type: "boolean",
      description:
        "Initial expanded state when uncontrolled. Defaults to `active`: open while thinking, closed for finished traces.",
    },
    {
      name: "onOpenChange",
      type: "(open: boolean) => void",
      description:
        "Called when the trace is expanded/collapsed (by the reader or by auto-collapse).",
    },
    {
      name: "autoCollapse",
      type: "boolean",
      default: "true",
      description:
        "Collapse when `active` turns false — skipped if the reader toggled it while it was active.",
    },
    {
      name: "formatLabel",
      type: "(state: { active: boolean; seconds: number }) => React.ReactNode",
      description:
        "Custom label (i18n, “Planning…”). Default “Thinking… 12s” / “Thought for 14s” / “Thought for a moment”.",
    },
  ],
  parts: [
    {
      name: "Reasoning",
      dataSlot: "reasoning",
      description: 'Root. `data-status="active" | "done"`, `data-state="open" | "closed"`.',
    },
    {
      name: "Trigger",
      dataSlot: "reasoning-trigger",
      description:
        "Button with the label and a chevron that rotates 90° when open (aria-expanded, aria-controls).",
    },
    {
      name: "Label",
      dataSlot: "reasoning-label",
      description:
        "The label, after a StatusGlyph: running while active, done (a solid disc) after, so the label never moves. Seconds are tabular.",
    },
    {
      name: "Content",
      dataSlot: "reasoning-content",
      description:
        "Muted, pre-wrapped trace behind a left hairline. Animates grid-template-rows 0fr↔1fr (interruptible) and is inert when closed.",
    },
  ],
  a11y: {
    notes: [
      "The trigger is a real button with aria-expanded/aria-controls.",
      "A visually hidden status region says “Thinking” and then “Thought for 14s” — the ticking seconds are never announced.",
      "When collapsed, the trace is `inert`: out of the tab order and the accessibility tree.",
    ],
    keyboard: [{ keys: "Enter / Space", action: "Expand or collapse the trace" }],
    reducedMotion:
      "The running glyph holds still, the chevron snaps, and the trace only fades (no height travel).",
  },
  dependencies: { npm: ["lucide-react"], kura: ["status-glyph"] },
  related: ["shimmer-text", "thinking-indicator", "message", "streaming-text", "agent-timeline"],
  tags: ["reasoning", "thinking", "chain-of-thought", "collapsible", "trace", "llm", "timer"],
  examples: [
    {
      name: "ReasoningMinimal",
      kind: "minimal",
      title: "Finished trace",
      description: "A finished “Thought for 14s” trace, opened with defaultOpen.",
    },
    {
      name: "ReasoningFull",
      kind: "full",
      title: "Live thinking that auto-collapses",
      description:
        "Streams the trace with StreamingText while active (controlled open), then collapses to “Thought for Ns”.",
    },
    {
      name: "ReasoningInMessage",
      kind: "composition",
      title: "Above an assistant answer",
      description: "Inside a Message, with a custom label.",
    },
  ],
  agentNotes: [
    "Keep the component mounted from the first thinking token to the end; flip `active` instead of swapping components, so the timer and collapse work.",
    "Persist the measured duration with the message and pass it as `duration` when re-rendering history.",
    "Put a StreamingText (caret={false}) inside for a live trace; plain text or markdown for a stored one.",
  ],
});
