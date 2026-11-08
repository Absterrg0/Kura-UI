import type { Metadata } from "next";
import { ComponentCard } from "@/components/component-card";
import { DocsShell, PageHeader } from "@/components/docs-shell";
import { components, componentsByCategory } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Components",
  description: "Every Kura UI component, with live previews.",
};

export default function ComponentsPage() {
  return (
    <DocsShell>
      <PageHeader
        title="Components"
        description={`${components.length} components, each with a manifest your agent can read. Generated from the source — new components appear here automatically.`}
      />
      <div className="flex flex-col gap-12">
        {componentsByCategory().map(({ category, items }) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <div className="flex items-baseline justify-between gap-4 pb-4">
              <h2 id={`cat-${category.id}`} className="font-medium text-lg tracking-tight">
                {category.title}
              </h2>
              <p className="hidden text-kura-fg-subtle text-sm md:block">{category.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
