import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "decode-text",
  name: "DecodeText",
  category: "effects",
  status: "beta",
  description:
    "Text reveal that scrambles glyphs and resolves them left to right, like an AI decoding — width-stable, with the final text read to screen readers at once.",
  whenToUse: [
    "Revealing a short status or result the agent just produced: “Plan ready”, “Connected to runner-07”.",
    "Hero taglines or section headings that should arrive with a technical, machine-like flourish.",
    "IDs, hashes, timings and other mono data appearing after a computation.",
  ],
  whenNotToUse: [
    "Streaming a model's answer token by token — use streaming-text.",
    "An in-progress label — use shimmer-text or thinking-indicator.",
    "Paragraphs or anything longer than a line or two: the effect becomes noise and per-glyph DOM gets heavy.",
    "Text that changes many times a second (live counters) — render it plainly.",
  ],
  props: [
    {
      name: "children",
      type: "string",
      required: true,
      description: "The final text (a plain string). Changing it replays the reveal.",
    },
    {
      name: "startOn",
      type: '"mount" | "view"',
      default: '"mount"',
      description:
        "When the first reveal runs: immediately, or the first time ≥ 40% of it scrolls into view (a dim, still scramble shows until then).",
    },
    {
      name: "trigger",
      type: "string | number | boolean",
      description: "Replay whenever this value changes — a counter, an id or a boolean.",
    },
    {
      name: "duration",
      type: "number",
      default: "1000",
      description: "Milliseconds for the reveal to sweep the whole text (ease-out).",
    },
    {
      name: "spread",
      type: "number",
      default: "6",
      description:
        "How many characters ahead of the resolved edge scramble actively, in the accent colour.",
    },
    {
      name: "glyphs",
      type: "string",
      description:
        'Characters used for scrambling. Default "A–Z 0–9 #%&*+=/<>". Try "01" for binary or a single "·" for a quiet reveal.',
    },
    {
      name: "as",
      type: '"span" | "p" | "div" | "h1" | "h2" | "h3" | "code"',
      default: '"span"',
      description: "Element to render.",
    },
    {
      name: "onComplete",
      type: "() => void",
      description: "Called when a reveal finishes (not called under reduced motion).",
    },
  ],
  parts: [
    {
      name: "DecodeText",
      dataSlot: "decode-text",
      description: "Root element. `data-state` = pending | running | done.",
    },
    {
      name: "Glyphs",
      dataSlot: "decode-text-glyphs",
      description: "The visual (aria-hidden) text; plain text once done.",
    },
    {
      name: "Char",
      dataSlot: "decode-text-char",
      description:
        "One glyph slot while decoding. `data-state` = pending | active | done; `data-char` holds the final character.",
    },
  ],
  a11y: {
    notes: [
      "The final text is always present in a visually hidden span, so screen readers read it immediately and once; the scrambling glyphs are aria-hidden.",
      "Not a live region. Wrap it in role=status if a replay (new text) should be announced.",
      "Each glyph reserves the width of its final character, so the line never reflows while decoding.",
    ],
    keyboard: [],
    reducedMotion: "No scramble: the final text renders immediately.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["streaming-text", "shimmer-text", "thinking-indicator"],
  tags: ["text", "reveal", "scramble", "decode", "typewriter", "animation", "mono", "hacker"],
  examples: [
    { name: "DecodeTextMinimal", kind: "minimal", title: "Decode on mount" },
    {
      name: "DecodeTextFull",
      kind: "full",
      title: "Triggers, glyph sets and fonts",
      description:
        'Replay via `trigger`, text changes, `startOn="view"`, a binary glyph set and a proportional font.',
    },
    {
      name: "DecodeTextAgentHandshake",
      kind: "composition",
      title: "Agent connection status",
      description: "A status card that decodes its new state inside a polite live region.",
    },
  ],
  agentNotes: [
    "Pass a plain string child. For mixed formatting, wrap several DecodeTexts.",
    "Monospace (`font-kura-mono`) gives the cleanest look; proportional fonts work because each glyph keeps its final width.",
    "Use `trigger` to replay without changing the text (e.g. when a card re-opens); change `children` to decode new text.",
    "Keep it to one or two lines and ≤ 1.5s — it should feel like arrival, not waiting.",
  ],
});
