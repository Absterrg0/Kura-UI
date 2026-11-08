import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Catalog } from "../../../scripts/lib/catalog-types";

const here = dirname(fileURLToPath(import.meta.url));

export function dataFile(name: string): string {
  for (const candidate of [join(here, "../data", name), join(here, "../../data", name)]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`kura: missing data/${name}. Run \`pnpm generate\` in the Kura repo.`);
}

/** Bundled catalog snapshot, or the live one when KURA_REGISTRY_URL is set. */
export async function loadCatalog(): Promise<Catalog> {
  const remote = process.env.KURA_REGISTRY_URL;
  if (remote) {
    try {
      const res = await fetch(`${remote.replace(/\/$/, "")}/registry/index.json`);
      if (res.ok) return (await res.json()) as Catalog;
    } catch {
      // fall back to the bundled snapshot
    }
  }
  return JSON.parse(readFileSync(dataFile("catalog.json"), "utf8")) as Catalog;
}
