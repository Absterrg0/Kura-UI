import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "citation",
  name: "Citation",
  category: "conversation",
  status: "beta",
  description:
    "Inline numbered citation keycap that links to its source and previews title, domain and snippet on hover or focus, plus a Sources strip or list.",
  whenToUse: [
    "Attribute sentences of a model's answer to retrieved sources (RAG, web search, file search) with inline [1] [2] keys.",
    "Preview a source without leaving the answer: hover or keyboard-focus the key to see title, domain and the snippet used.",
    "List all sources behind an answer under it, as a compact strip of tiles or a numbered list (`Sources`).",
  ],
  whenNotToUse: [
    "Plain links in prose with no source metadata — use an <a>.",
    "Footnotes in long-form documents that must print — use real footnotes.",
    "Showing the search tool call itself (query, results JSON) — use tool-call.",
  ],
  props: [
    {
      name: "index",
      type: "number",
      required: true,
      description: "1-based citation number printed on the key and in the card corner.",
    },
    {
      name: "source",
      type: "CitationSource",
      required: true,
      description:
        "{ title, url, snippet?, favicon?, siteName?, date? }. The domain is derived from `url`; without `favicon` no icon is drawn (no third-party favicon service is called).",
    },
    {
      name: "display",
      type: '"number" | "domain"',
      default: '"number"',
      description: "The key shows the number, or a favicon + site name.",
    },
    {
      name: "openDelay",
      type: "number",
      default: "250",
      description: "Hover delay in ms before the preview opens (keyboard focus opens immediately).",
    },
    { name: "open", type: "boolean", description: "Preview open (controlled)." },
    {
      name: "onOpenChange",
      type: "(open: boolean) => void",
      description: "Called when the preview opens or closes.",
    },
  ],
  parts: [
    {
      name: "Citation",
      dataSlot: "citation",
      description:
        'The key: a real <a target="_blank"> to the source, `data-state="open" | "closed"`. Sized in em so it scales with the surrounding text.',
    },
    {
      name: "Preview",
      dataSlot: "citation-preview",
      description:
        "The hover card (ui-sdk HoverCard content, origin-aware pop-in, opens above the key).",
    },
    {
      name: "CitationCard",
      dataSlot: "citation-card",
      description:
        "Preview body: favicon, site · date, index, title link with an ↗ nudge, 3-line snippet. Reusable on its own.",
      props: [
        { name: "source", type: "CitationSource", required: true, description: "Source to show." },
        { name: "index", type: "number", description: "Number shown in the corner." },
      ],
    },
    {
      name: "Favicon",
      dataSlot: "citation-favicon",
      description: "16px favicon (aria-hidden); rendered only when the source has one.",
    },
    {
      name: "Sources",
      dataSlot: "citation-sources",
      description: "Sources behind an answer. `data-variant`.",
      props: [
        {
          name: "sources",
          type: "readonly CitationSource[]",
          required: true,
          description: "In citation order (index = position + 1).",
        },
        {
          name: "variant",
          type: '"strip" | "list"',
          default: '"strip"',
          description: "strip = horizontally scrolling tiles; list = numbered rows with snippets.",
        },
        {
          name: "label",
          type: "React.ReactNode",
          default: '"Sources"',
          description: "Heading (with a count). null hides it.",
        },
      ],
    },
    { name: "Source", dataSlot: "citation-source", description: "One <li> in Sources." },
  ],
  a11y: {
    notes: [
      "Each key is a link named “Source 2: <title> (<domain>)”, so it makes sense out of context and in a links list.",
      "The preview opens on hover (with delay) and on keyboard focus, without moving focus; Escape or blur closes it. It never contains information that is not also reachable by following the link.",
      "Sources is an ordered list labelled by its heading.",
      'Links open in a new tab (`target="_blank" rel="noreferrer"`).',
    ],
    keyboard: [
      { keys: "Tab", action: "Focus a citation — its preview opens" },
      { keys: "Enter", action: "Open the source in a new tab" },
      { keys: "Escape", action: "Close the preview" },
    ],
    reducedMotion:
      "The preview only fades (no scale/translate) and the ↗ nudge on hover is removed.",
  },
  dependencies: { npm: ["@ui-sdk/react", "lucide-react"], kura: [] },
  related: ["message", "streaming-text", "tool-call"],
  tags: [
    "citation",
    "sources",
    "rag",
    "references",
    "footnote",
    "hover-card",
    "search",
    "attribution",
  ],
  examples: [
    {
      name: "CitationMinimal",
      kind: "minimal",
      title: "One citation",
      description: "A numbered key at the end of a sentence.",
    },
    {
      name: "CitationFull",
      kind: "full",
      title: "Citations with a sources strip",
      description: "Number and domain keys, a custom open delay, and the Sources strip below.",
    },
    {
      name: "CitationSourcesList",
      kind: "variant",
      title: "Sources list",
      description: "Numbered rows with site, date and snippet.",
    },
    {
      name: "CitationInMessage",
      kind: "composition",
      title: "In an assistant message",
      description: "Citations inside a Message with a label-less strip.",
    },
  ],
  agentNotes: [
    "Place the citation directly after the punctuation-free end of the claim, inside the same text node's parent (it is inline and em-sized).",
    "Reuse the same index for repeated citations of the same source; Sources numbering is by array position.",
    "Pass favicons you already have (e.g. from your search API); the component never fetches favicons itself.",
    'Import Sources from the same entry: `import { Citation, Sources } from "@kura-ui/react/citation"`.',
  ],
});
