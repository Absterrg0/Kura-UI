import type { CatalogComponent } from "@kura/catalog-types";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ExamplePreview } from "./example-preview";

/** A live example in a titled card, for the home showcase grid. */
export function ShowcaseCard({
  component,
  kind = "minimal",
  className,
  stageClassName,
}: {
  component: CatalogComponent;
  kind?: string;
  className?: string;
  stageClassName?: string;
}) {
  const ex =
    component.examples.find((e) => e.kind === kind) ??
    component.examples.find((e) => e.kind === "minimal") ??
    component.examples[0];
  return (
    <section
      className={cn(
        "group flex flex-col overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-sm",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-4">
        <div className="min-w-0">
          <h3 className="font-medium text-[14px] tracking-[-0.01em]">
            <Link
              href={`/components/${component.slug}`}
              className="outline-none hover:underline focus-visible:shadow-kura-focus"
            >
              {component.title}
            </Link>
          </h3>
          <p className="line-clamp-1 text-[13px] text-kura-fg-muted">{component.description}</p>
        </div>
        <Link
          href={`/components/${component.slug}`}
          aria-label={`Open ${component.title}`}
          className="mt-0.5 shrink-0 rounded-kura-sm p-0.5 text-kura-fg-subtle opacity-0 outline-none transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
        >
          <ArrowUpRight className="size-4" />
        </Link>
      </header>
      {ex && (
        <ExamplePreview
          slug={component.slug}
          name={ex.name}
          replay={false}
          compact
          dots={false}
          className={cn("flex-1 p-5", stageClassName)}
        />
      )}
    </section>
  );
}
