import type { Metadata } from "next";
import type { CardData } from "@/components/component-card";
import { ComponentsBrowser } from "@/components/components-browser";
import { PageHeader } from "@/components/docs-shell";
import { catalog, components } from "@/lib/catalog";
import { summaryFor } from "@/lib/summaries";

export const metadata: Metadata = {
  title: "Components",
  description: "Every Kura UI component, with live previews.",
};

/** Small components read best centred; everything else is a panel, cropped by the card. */
const CENTERED = new Set([
  "agent-orb",
  "agent-sigil",
  "dot-rail",
  "reasoning",
  "tool-call",
  "audio-waveform",
  "citation",
  "model-picker",
  "shimmer-text",
  "voice-dictation",
  "attachment",
  "prompt-suggestions",
  "streaming-text",
]);

/** A richer example where the minimal one is too small to read on a card. */
const PREVIEW: Record<string, string> = {
  "agent-sigil": "AgentSigilFull",
  "status-glyph": "StatusGlyphFull",
  "context-meter": "ContextMeterFull",
  "thinking-indicator": "ThinkingIndicatorFull",
  "voice-dictation": "VoiceDictationFull",
  "shimmer-text": "ShimmerTextFull",
};

export default function ComponentsPage() {
  const order = catalog.categories.map((c) => c.id);
  const sorted = [...components].sort(
    (a, b) => order.indexOf(a.category) - order.indexOf(b.category),
  );
  const cards: CardData[] = sorted.map((c) => {
    const ex =
      c.examples.find((e) => e.name === PREVIEW[c.slug]) ??
      c.examples.find((e) => e.kind === "minimal") ??
      c.examples[0];
    return {
      slug: c.slug,
      title: c.title,
      description: summaryFor(c.slug, c.description),
      category: c.category,
      example: ex?.name ?? "",
      fit: CENTERED.has(c.slug) ? "center" : "panel",
    };
  });
  const categories = catalog.categories
    .filter((cat) => components.some((c) => c.category === cat.id))
    .map((cat) => ({ id: cat.id, title: cat.title }));
  return (
    <div className="px-5 pt-14 pb-28 md:px-6 md:pt-20">
      <div className="mx-auto max-w-[1180px]">
        <PageHeader
          title="Components"
          description={`${components.length} React components for agent interfaces, each with a manifest your coding agent can read. Supervision components first.`}
          className="pb-8"
        />
        <ComponentsBrowser cards={cards} categories={categories} />
      </div>
    </div>
  );
}
