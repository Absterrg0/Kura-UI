import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Catalog } from "../../../scripts/lib/catalog-types";

const here = dirname(fileURLToPath(import.meta.url));

function dataFile(name: string): string {
  for (const candidate of [join(here, "../data", name), join(here, "../../data", name)]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Kura MCP: missing data/${name}. Run \`pnpm generate\` in the Kura repo.`);
}

/**
 * Load the catalog. Uses KURA_REGISTRY_URL (e.g. https://kura-ui.dev) when set so the server
 * always reflects the live registry; otherwise the snapshot bundled at publish time.
 */
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

export function readDataText(name: string): string {
  return readFileSync(dataFile(name), "utf8");
}
