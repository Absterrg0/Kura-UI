/**
 * pnpm generate — rebuilds every generated artifact from the component folders:
 *
 *   apps/docs/src/generated/{catalog.json,examples.tsx}   docs index (auto-discovers components)
 *   apps/docs/public/registry/index.json                  full machine-readable catalog
 *   apps/docs/public/r/<name>.json, r/registry.json        shadcn registry items
 *   registry.json                                          shadcn registry index (repo root)
 *   apps/docs/public/llms.txt, llms-full.txt               llmstxt.org
 *   apps/docs/public/components/<slug>.md                  raw markdown per docs page
 *   packages/{mcp,cli}/data/*                              catalog + design guide for MCP/CLI
 *
 * Everything here is gitignored and deterministic. Never hand-edit the outputs.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import {
  type ComponentFolder,
  extractExamples,
  libItemName,
  listComponentFolders,
  listHookModules,
  listLibModules,
  loadHooks,
  loadMeta,
  moduleExports,
  parseMetaType,
  rewriteForRegistry,
} from "./lib/analyze";
import type {
  Catalog,
  CatalogComponent,
  CatalogFile,
  CatalogHook,
  ComponentMeta,
  JsonSchemaProp,
} from "./lib/catalog-types";
import {
  CATEGORIES,
  DOCS_GENERATED,
  DOCS_PUBLIC,
  NPM_PACKAGE,
  REACT_DIR,
  ROOT,
  SITE_URL,
  SRC,
} from "./lib/config";
import { componentMarkdown, llmsFullTxt, llmsTxt } from "./lib/markdown";
import { parseTokens } from "./lib/tokens";

const started = performance.now();
let written = 0;

function write(file: string, content: string) {
  mkdirSync(dirname(file), { recursive: true });
  if (existsSync(file) && readFileSync(file, "utf8") === content) return;
  writeFileSync(file, content);
  written++;
}
const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;

/** Remove generated files that no longer correspond to an item (e.g. a deleted component). */
function prune(dir: string, keep: Set<string>) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) if (!keep.has(f)) rmSync(join(dir, f), { recursive: true });
}

// "PromptQueue" → "Prompt queue": sentence case, like every other label in Kura.
const titleCase = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, (_, a: string, b: string) => `${a} ${b.toLowerCase()}`);
const itemUrl = (name: string) => (name === "utils" ? "utils" : `${SITE_URL}/r/${name}.json`);
const pkg = JSON.parse(readFileSync(join(REACT_DIR, "package.json"), "utf8"));

// ------------------------------------------------------------------------------------------------
// 1. Load
// ------------------------------------------------------------------------------------------------
const folders = listComponentFolders();
const metas: Array<{ folder: ComponentFolder; meta: ComponentMeta }> = [];
const loadErrors: string[] = [];
for (const folder of folders) {
  const { meta, error } = await loadMeta(folder);
  if (error || !meta) loadErrors.push(`${folder.slug}: ${error}`);
  else metas.push({ folder, meta });
}
if (loadErrors.length) {
  // Skip broken folders instead of failing: one half-written component must not block the docs
  // index for everyone else. `pnpm validate:meta` (and so `pnpm check`) still fails on them.
  // Set KURA_STRICT=1 to fail here too.
  const log = process.env.KURA_STRICT ? console.error : console.warn;
  log(
    `${process.env.KURA_STRICT ? "✗" : "⚠"} generate: skipped ${loadErrors.length} component(s) with invalid meta\n  ${loadErrors.join("\n  ")}`,
  );
  log("  Run `pnpm validate:meta` for the full report.");
  if (process.env.KURA_STRICT) process.exit(1);
}
const hookMetas = await loadHooks();
const css = parseTokens();

// ------------------------------------------------------------------------------------------------
// 2. Registry items for lib + hooks + theme
// ------------------------------------------------------------------------------------------------
interface RegistryItem {
  $schema: string;
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: Array<{ path: string; type: string; target: string; content?: string }>;
  cssVars?: unknown;
  css?: unknown;
  categories?: string[];
  docs?: string;
  meta?: Record<string, unknown>;
}
const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";
const items: RegistryItem[] = [];
const problems: string[] = [];

items.push({
  $schema: ITEM_SCHEMA,
  name: "kura-theme",
  type: "registry:theme",
  title: "Kura Theme",
  description:
    "Kura design tokens for the dot language: monochrome ink, sheet and well surfaces, ember, the dot utilities, radii, motion easings and keyframes (light + dark).",
  cssVars: css.registry.cssVars,
  css: css.registry.css,
});

function fileEntry(abs: string, type: CatalogFile["type"], target: string) {
  const r = rewriteForRegistry(abs);
  for (const p of r.problems) problems.push(`${relative(ROOT, abs)}: ${p}`);
  return { r, file: { target, type, content: r.content } satisfies CatalogFile };
}

const libFiles = new Map<string, CatalogFile[]>();
for (const name of listLibModules()) {
  if (name === "define-component") continue;
  const { r, file } = fileEntry(
    join(SRC, "lib", `${name}.ts`),
    "registry:lib",
    `lib/kura/${name}.ts`,
  );
  libFiles.set(name, [file]);
  items.push({
    $schema: ITEM_SCHEMA,
    name: libItemName(name),
    type: "registry:lib",
    title: `Kura ${name}`,
    description: `Kura shared library module lib/${name}.`,
    dependencies: [...r.npm].sort(),
    registryDependencies: [...r.registry].sort().map(itemUrl),
    files: [
      {
        path: `registry/kura/lib/${name}.ts`,
        type: "registry:lib",
        target: file.target,
        content: file.content,
      },
    ],
  });
}

const hookFiles = new Map<string, CatalogFile[]>();
for (const name of listHookModules()) {
  const { r, file } = fileEntry(
    join(SRC, "hooks", `${name}.ts`),
    "registry:hook",
    `hooks/kura/${name}.ts`,
  );
  hookFiles.set(name, [file]);
  const described = hookMetas.filter((h) => h.file === name);
  items.push({
    $schema: ITEM_SCHEMA,
    name,
    type: "registry:hook",
    title: described.map((h) => h.name).join(", ") || name,
    description: described.map((h) => h.description).join(" ") || `Kura hook ${name}.`,
    dependencies: [...r.npm].sort(),
    registryDependencies: [...r.registry].sort().map(itemUrl),
    files: [
      {
        path: `registry/kura/hooks/${name}.ts`,
        type: "registry:hook",
        target: file.target,
        content: file.content,
      },
    ],
  });
}

// ------------------------------------------------------------------------------------------------
// 3. Components
// ------------------------------------------------------------------------------------------------
function jsonSchemaFor(meta: ComponentMeta): CatalogComponent["propsJsonSchema"] {
  const properties: Record<string, JsonSchemaProp> = {};
  for (const p of meta.props) {
    const parsed = parseMetaType(p.type);
    const prop: JsonSchemaProp = { description: p.description, "x-ts-type": p.type };
    if (parsed.literals) {
      prop.type = "string";
      prop.enum = parsed.literals;
    } else if (parsed.base) {
      prop.type = parsed.base;
    } else if (/\[\]$/.test(p.type.replace(/^readonly /, ""))) {
      prop.type = "array";
    }
    if (p.default !== undefined) {
      try {
        prop.default = JSON.parse(p.default);
      } catch {
        prop.default = p.default;
      }
    }
    properties[p.name] = prop;
  }
  return {
    type: "object",
    properties,
    required: meta.props.filter((p) => p.required).map((p) => p.name),
    additionalProperties: true,
  };
}

const components: CatalogComponent[] = [];
for (const { folder, meta } of metas) {
  const npm = new Set<string>();
  const registry = new Set<string>();
  const files: CatalogFile[] = [];
  for (const abs of folder.shipped) {
    const rel = relative(folder.dir, abs);
    const { r, file } = fileEntry(abs, "registry:ui", `components/kura/${folder.slug}/${rel}`);
    for (const d of r.npm) npm.add(d);
    for (const d of r.registry) if (d !== folder.slug) registry.add(d);
    files.push(file);
  }
  const registryDependencies = ["kura-theme", ...[...registry].sort()];

  const exampleCode = existsSync(folder.files.examples)
    ? extractExamples(folder.files.examples, folder.slug)
    : new Map<string, string>();
  const exports = existsSync(folder.files.index) ? moduleExports(folder.files.index) : [];

  const shadcnUrl = `${SITE_URL}/r/${folder.slug}.json`;
  components.push({
    ...meta,
    title: titleCase(meta.name),
    importPath: `${NPM_PACKAGE}/${folder.slug}`,
    exports: exports.sort(),
    docsUrl: `${SITE_URL}/components/${folder.slug}`,
    markdownUrl: `${SITE_URL}/components/${folder.slug}.md`,
    registryUrl: shadcnUrl,
    install: {
      shadcn: `npx shadcn@latest add ${shadcnUrl}`,
      cli: `npx @kura-ui/cli add ${folder.slug}`,
      npm: `npm install ${NPM_PACKAGE}`,
    },
    registryDependencies,
    propsJsonSchema: jsonSchemaFor(meta),
    examples: meta.examples.map((ex) => ({ ...ex, code: exampleCode.get(ex.name) ?? "" })),
    files,
  });

  items.push({
    $schema: ITEM_SCHEMA,
    name: folder.slug,
    type: "registry:ui",
    title: titleCase(meta.name),
    description: meta.description,
    dependencies: [...npm].sort(),
    registryDependencies: registryDependencies.map(itemUrl),
    files: files.map((f) => ({
      path: `registry/kura/${relative("components/kura", f.target)}`,
      type: f.type,
      target: f.target,
      content: f.content,
    })),
    categories: [meta.category, ...meta.tags.slice(0, 4)],
    docs: `Docs: ${SITE_URL}/components/${folder.slug} · Markdown for agents: ${SITE_URL}/components/${folder.slug}.md`,
    meta: {
      kura: { status: meta.status, whenToUse: meta.whenToUse, whenNotToUse: meta.whenNotToUse },
    },
  });
}

// Hooks for the catalog
const hooks: CatalogHook[] = hookMetas.map((h) => ({
  ...h,
  importPath: `${NPM_PACKAGE}/hooks`,
  registryUrl: `${SITE_URL}/r/${h.file}.json`,
  files: hookFiles.get(h.file) ?? [],
}));

if (problems.length) {
  console.error(`✗ generate: import problems\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

// ------------------------------------------------------------------------------------------------
// 4. Catalog
// ------------------------------------------------------------------------------------------------
const catalog: Catalog = {
  name: "kura-ui",
  version: pkg.version,
  homepage: SITE_URL,
  description:
    "Agent-first, AI-native React components — composers, voice, shaders and agent surfaces.",
  install: {
    npm: `npm install ${NPM_PACKAGE}`,
    css: `@import "${NPM_PACKAGE}/styles.css";`,
    shadcnTheme: `npx shadcn@latest add ${SITE_URL}/r/kura-theme.json`,
    cliInit: "npx @kura-ui/cli init",
  },
  categories: CATEGORIES,
  components,
  hooks,
  libs: [...libFiles].map(([name, files]) => ({
    name,
    registryUrl: `${SITE_URL}/r/${libItemName(name)}.json`,
    files,
  })),
  tokens: css.tokens,
};

// ------------------------------------------------------------------------------------------------
// 5. Write
// ------------------------------------------------------------------------------------------------
const design = existsSync(join(ROOT, "DESIGN.md"))
  ? readFileSync(join(ROOT, "DESIGN.md"), "utf8")
  : "";

// shadcn registry
const rDir = join(DOCS_PUBLIC, "r");
for (const item of items) write(join(rDir, `${item.name}.json`), json(item));
const registryIndex = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "kura-ui",
  homepage: SITE_URL,
  items: items.map(({ $schema: _s, files, ...rest }) => ({
    ...rest,
    files: files?.map(({ content: _c, ...f }) => f),
  })),
};
write(join(rDir, "registry.json"), json(registryIndex));
prune(rDir, new Set([...items.map((i) => `${i.name}.json`), "registry.json"]));
write(
  join(ROOT, "registry.json"),
  json({
    ...registryIndex,
    items: registryIndex.items.map((item) => {
      const comp = components.find((c) => c.slug === item.name);
      return {
        ...item,
        // Source paths in this repo (for humans); installable items live at <homepage>/r/<name>.json
        files: item.files?.map((f) => ({
          ...f,
          path: comp
            ? `packages/react/src/components/${item.name}/${f.path.split("/").pop()}`
            : f.path.replace("registry/kura/", "packages/react/src/"),
        })),
      };
    }),
  }),
);

// catalog
write(join(DOCS_PUBLIC, "registry/index.json"), json(catalog));

// llms + markdown pages
write(join(DOCS_PUBLIC, "llms.txt"), llmsTxt(catalog));
write(join(DOCS_PUBLIC, "llms-full.txt"), llmsFullTxt(catalog, design));
const mdDir = join(DOCS_PUBLIC, "components");
for (const c of components) write(join(mdDir, `${c.slug}.md`), componentMarkdown(c));
prune(mdDir, new Set(components.map((c) => `${c.slug}.md`)));

// docs index
write(join(DOCS_GENERATED, "catalog.json"), json(catalog));
const exampleLines = components.map((c) => {
  const entries = c.examples
    .map(
      (ex) =>
        `    ${ex.name}: dynamic(() => import("@kura/components/${c.slug}/${c.slug}.examples").then((m) => m.${ex.name})),`,
    )
    .join("\n");
  return `  "${c.slug}": {\n${entries}\n  },`;
});
write(
  join(DOCS_GENERATED, "examples.tsx"),
  `// GENERATED by \`pnpm generate\` — do not edit.\n"use client";\n\nimport dynamic from "next/dynamic";\nimport type { ComponentType } from "react";\n\nexport const examples: Record<string, Record<string, ComponentType>> = {\n${exampleLines.join("\n")}\n};\n`,
);

// MCP + CLI data
for (const pkgDir of ["packages/mcp/data", "packages/cli/data"]) {
  write(join(ROOT, pkgDir, "catalog.json"), json(catalog));
  write(join(ROOT, pkgDir, "DESIGN.md"), design);
  write(join(ROOT, pkgDir, "kura.css"), css.source);
}

console.log(
  `✓ generate: ${components.length} components, ${hooks.length} hooks, ${items.length} registry items (${written} files updated) in ${Math.round(performance.now() - started)}ms`,
);
