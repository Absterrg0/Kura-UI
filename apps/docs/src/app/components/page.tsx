import type { Metadata } from "next";
import { ComponentCard } from "@/components/component-card";
import { DocsShell, PageHeader } from "@/components/docs-shell";
import { Seal } from "@/components/seal";
import { components, componentsByCategory } from "@/lib/catalog";
import { CATEGORY_SEAL } from "@/lib/category-seal";

export const metadata: Metadata = {
  title: "The store",
  description: "Every Kura UI component, with live previews.",
};

export default function ComponentsPage() {
  return (
    <DocsShell>
      <PageHeader
        glyph="部"
        eyebrow={`${components.length} parts, seven shelves`}
        title="The whole store."
        description="Every part, live. Each one carries a manifest your agent can read, and new ones appear here as soon as their folder exists."
      />
      <div className="flex flex-col gap-20">
        {componentsByCategory().map(({ category, items }) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <div className="flex items-end gap-4 border-kura-border border-b pb-4">
              <Seal glyph={CATEGORY_SEAL[category.id] ?? "部"} tilt={-4} className="size-9" />
              <h2
                id={`cat-${category.id}`}
                className="font-kura-display text-[32px] leading-none tracking-[-0.015em]"
              >
                {category.title}
              </h2>
              <p className="ml-auto hidden pb-0.5 font-kura-display text-[16px] text-kura-fg-muted italic md:block">
                {category.description}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 pt-8 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((c) => (
                <ComponentCard key={c.slug} component={c} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </DocsShell>
  );
}
