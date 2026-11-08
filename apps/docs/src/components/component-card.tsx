import type { CatalogComponent } from "@kura/catalog-types";
import Link from "next/link";
import { ExamplePreview } from "./example-preview";

export function ComponentCard({ component }: { component: CatalogComponent }) {
  const minimal = component.examples.find((e) => e.kind === "minimal") ?? component.examples[0];
  return (
    <div
      data-testid={`card-${component.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-sm transition-shadow duration-(--kura-duration-base) hover:shadow-kura-md"
    >
      {minimal && (
        <div inert className="border-kura-border-subtle border-b">
          <ExamplePreview slug={component.slug} name={minimal.name} compact className="h-48" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-[15px]">
            <Link
              href={`/components/${component.slug}`}
              className="outline-none after:absolute after:inset-0 after:rounded-kura-xl focus-visible:after:shadow-kura-focus"
            >
              {component.title}
            </Link>
          </h3>
          <span className="rounded-full bg-kura-surface-sunken px-2 py-0.5 text-kura-fg-subtle text-[11px] shadow-kura-xs">
            {component.category}
          </span>
        </div>
        <p className="line-clamp-2 text-kura-fg-muted text-sm leading-relaxed">
          {component.description}
        </p>
      </div>
    </div>
  );
}
