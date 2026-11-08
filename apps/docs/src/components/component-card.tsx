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
        <div inert className="border-kura-border-subtle border-b bg-kura-surface-sunken/40">
          <ExamplePreview slug={component.slug} name={minimal.name} compact className="h-48" />
        </div>
      )}
      <div className="flex flex-col gap-1 p-4">
        <h3 className="font-medium text-[14px] tracking-[-0.01em]">
          <Link
            href={`/components/${component.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-kura-xl focus-visible:after:shadow-kura-focus"
          >
            {component.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-[13px] text-kura-fg-muted leading-relaxed">
          {component.description}
        </p>
      </div>
    </div>
  );
}
