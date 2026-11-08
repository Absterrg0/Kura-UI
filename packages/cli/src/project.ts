/** Project detection shared by `add`, `init` and `doctor`. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

export interface ProjectInfo {
  root: string;
  /** Directory the `@/` alias points to (src/ or the root). */
  base: string;
  /** Import alias prefix, e.g. "@/" or "~/". */
  alias: string;
  packageManager: "pnpm" | "yarn" | "bun" | "npm";
  packageJson: Record<string, Record<string, string> | undefined> | null;
  /** Global CSS file that imports tailwindcss, if found. */
  globalCss: string | null;
}

function readJson(file: string): unknown {
  try {
    // tolerate comments/trailing commas in tsconfig
    const text = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:"'])\/\/.*$/gm, "$1")
      .replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const CSS_CANDIDATES = [
  "app/globals.css",
  "src/app/globals.css",
  "styles/globals.css",
  "src/styles/globals.css",
  "src/index.css",
  "src/styles.css",
  "src/global.css",
  "src/styles/global.css",
  "app/app.css",
  "app/tailwind.css",
];

export function findGlobalCss(root: string): string | null {
  for (const c of CSS_CANDIDATES) {
    const f = join(root, c);
    if (existsSync(f) && /@import\s+["']tailwindcss["']/.test(readFileSync(f, "utf8"))) return f;
  }
  // shallow scan
  for (const dir of ["", "src", "app", "src/app", "styles"]) {
    const d = join(root, dir);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      if (!f.endsWith(".css")) continue;
      const p = join(d, f);
      if (/@import\s+["']tailwindcss["']/.test(readFileSync(p, "utf8"))) return p;
    }
  }
  return null;
}

export function detectProject(cwd: string): ProjectInfo {
  const root = cwd;
  const packageJson = readJson(join(root, "package.json")) as ProjectInfo["packageJson"];
  let alias = "@/";
  let base = existsSync(join(root, "src")) ? join(root, "src") : root;
  const tsconfig = (readJson(join(root, "tsconfig.json")) ??
    readJson(join(root, "jsconfig.json"))) as {
    compilerOptions?: { paths?: Record<string, string[]>; baseUrl?: string };
  } | null;
  const paths = tsconfig?.compilerOptions?.paths ?? {};
  for (const [key, targets] of Object.entries(paths)) {
    if (!key.endsWith("/*") || !targets[0]) continue;
    const target = targets[0].replace(/\*$/, "").replace(/^\.\//, "");
    if (key === "@/*" || key === "~/*" || (key.length <= 4 && /^[@~#]/.test(key))) {
      alias = key.slice(0, -1);
      base = join(root, tsconfig?.compilerOptions?.baseUrl ?? ".", target);
      break;
    }
  }
  const pm = existsSync(join(root, "pnpm-lock.yaml"))
    ? "pnpm"
    : existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb"))
      ? "bun"
      : existsSync(join(root, "yarn.lock"))
        ? "yarn"
        : "npm";
  return { root, base, alias, packageManager: pm, packageJson, globalCss: findGlobalCss(root) };
}

export function installedVersion(p: ProjectInfo, name: string): string | undefined {
  return p.packageJson?.dependencies?.[name] ?? p.packageJson?.devDependencies?.[name];
}

export const rel = (p: ProjectInfo, file: string) => relative(p.root, file) || ".";
