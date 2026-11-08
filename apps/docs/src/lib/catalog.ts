import type { Catalog, CatalogComponent } from "@kura/catalog-types";
import data from "../generated/catalog.json";

/** The generated catalog (`pnpm generate`). Every page is derived from it. */
export const catalog = data as unknown as Catalog;

export const components: CatalogComponent[] = catalog.components;

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
