import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "streaming-text",
  name: "StreamingText",
  category: "conversation",
  status: "beta",
  description:
    "Token-by-token model output with an even reveal cadence, word-group fade/blur-in and a soft caret. Takes a growing string or an async iterable.",
  whenToUse: [
    "Render an LLM answer while it streams in (AI SDK, OpenAI/Anthropic SSE, a ReadableStream adapted to an async iterable).",
    "Smooth out bursty token delivery so text appears at a calm, even rhythm instead of in jumps.",
    "Show a live caret at the end of text that is still being generated.",
    "Build a custom renderer (markdown, rich text) on top of the `useStreamingText` hook exported from the same folder.",
  ],
  whenNotToUse: [
    "Static text that is already complete — render it directly (StreamingText shows initial text instantly anyway).",
    "A “Thinking…” label before the first token — use shimmer-text (or reasoning for a collapsible trace).",
    "A full chat bubble with avatar and actions — use message, which composes streaming-text.",
    "Streaming code — use code-block with `streaming` so partial lines do not flicker.",
  ],
  props: [
    {
      name: "text",
      type: "string",
      description:
        "The text received so far. Pass a growing string; a change that is not an append restarts the reveal from the common prefix.",
    },
    {
      name: "stream",
      type: "AsyncIterable<string> | null",
      description:
        "An async iterable of chunks (an async generator, AI SDK `textStream`). Takes precedence over `text`. Each iterable is consumed once and shared across re-renders.",
    },
    {
      name: "speed",
      type: "number",
      default: "90",
      description:
        "Minimum reveal cadence in characters per second. Bursts are buffered and released at this rate, faster when a backlog builds up (never more than ~½s behind). `0` disables smoothing.",
    },
    {
      name: "streaming",
      type: "boolean",
      description:
        "More text is still coming: keeps the caret visible and `aria-busy` set. Defaults to true while `stream` is being read, otherwise false.",
    },
    {
      name: "onComplete",
      type: "() => void",
      description:
        "Called once when the stream has ended and every character has been revealed (useful to enable message actions).",
    },
    {
      name: "animation",
      type: '"blur" | "fade" | "none"',
      default: '"blur"',
      description:
        "How each newly revealed word group enters: fade + 3px blur, fade only, or no animation.",
    },
    {
      name: "caret",
      type: "boolean",
      default: "true",
      description:
        "Show a soft pulsing caret at the live edge while streaming. It fades out (without reflow) when the stream completes.",
    },
  ],
  parts: [
    {
      name: "StreamingText",
      dataSlot: "streaming-text",
      description:
        'Root, `white-space: pre-wrap`. `data-status="streaming" | "done"`, `aria-busy` while streaming.',
    },
    {
      name: "Chunk",
      dataSlot: "streaming-text-chunk",
      description:
        "A recently revealed word group, animating in. Chunks merge into one text node ~0.7s after they appear, so long answers stay a single node.",
    },
    {
      name: "Caret",
      dataSlot: "streaming-text-caret",
      description: "Decorative caret (aria-hidden). `data-visible` reflects streaming.",
    },
  ],
  a11y: {
    notes: [
      'The text is real text in the DOM; the root sets `aria-busy` while streaming so a surrounding `role="log"` / live region announces the finished answer instead of every token.',
      'Do not make StreamingText itself a live region — put it inside message / a `role="log"` list.',
      "The caret is decorative (`aria-hidden`).",
    ],
    reducedMotion:
      "Word groups only fade in (no blur) and the caret stops pulsing; the even reveal cadence is kept because it carries meaning (text is still arriving).",
  },
  dependencies: { npm: [], kura: [] },
  related: ["message", "reasoning", "code-block", "shimmer-text"],
  tags: ["streaming", "tokens", "llm", "text", "typewriter", "caret", "chat", "output"],
  examples: [
    {
      name: "StreamingTextMinimal",
      kind: "minimal",
      title: "Async iterable",
      description: "Pass a token generator; bursty delivery is evened out automatically.",
    },
    {
      name: "StreamingTextFull",
      kind: "full",
      title: "Growing string, every prop",
      description:
        "Drive it with a growing `text` + `streaming`, tune `speed`, and react to `onComplete`.",
    },
    {
      name: "StreamingTextComposition",
      kind: "composition",
      title: "Custom renderer with useStreamingText",
      description:
        "Shimmering “Thinking…” until the first token, then a hand-rolled renderer built on the hook, with a Stop button.",
    },
  ],
  agentNotes: [
    "Pass the SAME iterable object across renders (store it in state/ref). Creating a new generator in JSX on every render restarts the stream.",
    "For a growing string, set `streaming` while tokens are still arriving; otherwise the caret hides and `onComplete` fires each time the reveal catches up.",
    "Text present at mount renders instantly — remounting or hydrating a finished message never replays the animation.",
    "For markdown, call `useStreamingText({ stream })` and feed `displayed` to your markdown renderer (or render `settled` + `chunks` yourself to keep the per-chunk fade).",
    'Import the hook from the same entry: `import { StreamingText, useStreamingText } from "@kura-ui/react/streaming-text"`.',
  ],
});
