/**
 * Library build. Output mirrors src/ one-file-per-module (tree-shakeable, per-file "use client"),
 * so `@kura-ui/react/<slug>` resolves to dist/components/<slug>/index.js via the `./*` export.
 * New component folders are picked up automatically — never edit package.json exports.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "tsdown";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");

const EXCLUDE = /\.(test|meta|examples)\.tsx?$|\.d\.ts$/;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return /\.tsx?$/.test(d.name) && !EXCLUDE.test(d.name) ? [p] : [];
  });
}

const entries = walk(src);
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
].map((name) => new RegExp(`^${name.replace("/", "\\/")}(\\/.*)?$`));

await build({
  entry: entries.map((e) => relative(root, e)),
  cwd: root,
  outDir: "dist",
  root: "src",
  format: "esm",
  platform: "neutral",
  target: "es2022",
  unbundle: true,
  dts: { tsconfig: "tsconfig.build.json" },
  clean: true,
  hash: false,
  sourcemap: false,
  minify: false,
  deps: { neverBundle: external },
  tsconfig: "tsconfig.build.json",
  logLevel: "warn",
  // Unbundled output keeps each file's directive; rolldown's generic warning does not apply.
  inputOptions: {
    onLog(level, log, defaultHandler) {
      if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
      defaultHandler(level, log);
    },
  },
});

// Styles
mkdirSync(join(dist, "styles"), { recursive: true });
copyFileSync(join(src, "styles/kura.css"), join(dist, "styles/kura.css"));

// Root barrel (generated here only — there is no src/index.ts to keep in sync).
const components = readdirSync(join(src, "components"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(src, "components", d.name, "index.ts")))
  .map((d) => d.name)
  .sort();
const lines = [
  'export * from "./lib/index.js";',
  'export * from "./hooks/index.js";',
  ...components.map((c) => `export * from "./components/${c}/index.js";`),
];
writeFileSync(join(dist, "index.js"), `${lines.join("\n")}\n`);
writeFileSync(join(dist, "index.d.ts"), `${lines.join("\n")}\n`);

// Sanity: every client module kept its directive.
let missing = 0;
for (const entry of entries) {
  const source = readFileSync(entry, "utf8");
  if (!/^\s*["']use client["']/.test(source)) continue;
  const rel = relative(src, entry).replace(/\.tsx?$/, ".js");
  const out = readFileSync(join(dist, rel), "utf8");
  if (!/^\s*["']use client["']/.test(out)) {
    console.error(`✗ "use client" lost in dist/${rel}`);
    missing++;
  }
}
if (missing) process.exit(1);
console.log(`✓ built ${entries.length} modules, ${components.length} components → dist/`);
