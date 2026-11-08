import type { Catalog, CatalogComponent } from "@kura/catalog-types";
import data from "../generated/catalog.json";

/** The generated catalog (`pnpm generate`). Every page is derived from it. */
export const catalog = data as unknown as Catalog;

/** Internal building blocks (buttons, tooltips…) ship with the library but aren't listed. */
export const INTERNAL_CATEGORY = "primitives";

/** The components the docs present: everything except internal primitives. */
export const components: CatalogComponent[] = catalog.components.filter(
  (c) => c.category !== INTERNAL_CATEGORY,
);

export function getComponent(slug: string): CatalogComponent | undefined {
  return components.find((c) => c.slug === slug);
}

export function componentsByCategory() {
  return catalog.categories
    .map((category) => ({
      category,
      items: components.filter((c) => c.category === category.id),
    }))
    .filter((g) => g.items.length > 0);
}

export const GITHUB_URL = "https://github.com/Absterrg0/Kura-UI";
export const SITE_URL = catalog.homepage;
