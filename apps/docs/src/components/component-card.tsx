import type { CatalogComponent } from "@kura/catalog-types";
import Link from "next/link";
import { ExamplePreview } from "./example-preview";

/** A component as a print on the page: the live preview on bright stock, a caption beneath. */
export function ComponentCard({ component }: { component: CatalogComponent }) {
  const minimal = component.examples.find((e) => e.kind === "minimal") ?? component.examples[0];
  return (
    <div data-testid={`card-${component.slug}`} className="group relative flex flex-col">
      <div className="print overflow-hidden rounded-[8px] transition-[translate,box-shadow] duration-300 ease-kura-out group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
        {minimal && (
          <div inert>
            <ExamplePreview slug={component.slug} name={minimal.name} compact className="h-56" />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3 pt-4">
        <h3 className="font-kura-display text-[23px] leading-tight">
          <Link
            href={`/components/${component.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[8px] focus-visible:after:shadow-kura-focus"
          >
            {component.title}
          </Link>
        </h3>
        <span className="font-kura-mono text-[10.5px] text-kura-fg-subtle uppercase tracking-[0.14em]">
          {component.category}
        </span>
      </div>
      <p className="line-clamp-2 pt-1 text-[14.5px] text-kura-fg-muted leading-relaxed">
        {component.description}
      </p>
    </div>
  );
}
