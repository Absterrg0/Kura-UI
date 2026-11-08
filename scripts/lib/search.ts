/** Catalog search + install instructions, shared by @kura-ui/mcp and @kura-ui/cli. */
import type { Catalog, CatalogComponent } from "./catalog-types";

const STOP = new Set(
  "a an the and or for of to in on with without that this is are be it as at by from i we you my our your want need show make add use using build component components ui".split(
    " ",
  ),
);

/** Light synonym expansion so natural-language queries hit the right tags. */
const SYNONYMS: Record<string, string[]> = {
  loading: ["thinking", "progress", "busy", "spinner"],
  thinking: ["loading", "reasoning", "status"],
  waiting: ["loading", "thinking"],
  shortcut: ["hotkey", "keyboard", "kbd"],
  hotkey: ["shortcut", "keyboard"],
  keyboard: ["kbd", "shortcut"],
  voice: ["audio", "speech", "microphone", "dictation"],
  mic: ["microphone", "voice", "audio"],
  speech: ["voice", "dictation", "transcription"],
  chat: ["message", "conversation", "composer"],
  prompt: ["composer", "input"],
  input: ["composer", "prompt"],
  gradient: ["shader", "background", "effect"],
  background: ["shader", "gradient", "effect"],
  animation: ["motion", "shimmer", "effect"],
  hover: ["tooltip"],
  menu: ["popover", "dropdown", "command"],
  dropdown: ["popover", "menu"],
  agent: ["tool", "approval", "timeline", "status"],
  approve: ["approval", "permission", "confirm"],
  permission: ["approval", "confirm"],
  confirm: ["approval", "permission"],
  allow: ["approval", "permission"],
  source: ["citation", "reference"],
  sources: ["citation", "reference"],
  cite: ["citation"],
  reference: ["citation"],
  artifact: ["document", "preview", "canvas"],
  document: ["artifact", "preview"],
  generated: ["artifact"],
  syntax: ["code", "highlight"],
  tokens: ["context", "usage"],
  steps: ["timeline", "plan"],
  plan: ["timeline", "steps"],
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function stem(t: string): string {
  return t.replace(/(ing|ers|er|es|s|ed)$/, "");
}

export interface SearchResult {
  slug: string;
  name: string;
  title: string;
  category: string;
  description: string;
  score: number;
  /** Which fields matched — helps an agent explain its choice. */
  matched: string[];
  importPath: string;
  install: CatalogComponent["install"];
}

export function searchComponents(catalog: Catalog, query: string, limit = 8): SearchResult[] {
  const base = tokenize(query);
  const terms = new Map<string, number>();
  for (const t of base) terms.set(stem(t), 1);
  for (const t of base)
    for (const s of SYNONYMS[t] ?? []) if (!terms.has(stem(s))) terms.set(stem(s), 0.5);
  if (!terms.size) return [];

  const results: SearchResult[] = [];
  for (const c of catalog.components) {
    // Internal primitives are installed as dependencies, never recommended on their own.
    if (c.category === "primitives") continue;
    const fields: Array<[string, string, number]> = [
      ["slug", `${c.slug} ${c.name}`, 5],
      ["tags", c.tags.join(" "), 3],
      ["whenToUse", c.whenToUse.join(" "), 2],
      ["description", c.description, 1.5],
      ["category", c.category, 1],
      ["agentNotes", (c.agentNotes ?? []).join(" "), 0.3],
    ];
    let score = 0;
    const matched = new Set<string>();
    for (const [field, text, weight] of fields) {
      const words = new Set(tokenize(text).map(stem));
      for (const [term, w] of terms) {
        if (words.has(term)) {
          score += weight * w;
          matched.add(field);
        }
      }
    }
    // A query that matches a "when not to use" line strongly is a hint to pick something else.
    const notWords = new Set(tokenize(c.whenNotToUse.join(" ")).map(stem));
    let negative = 0;
    for (const [term] of terms) if (notWords.has(term)) negative += 0.4;
    score -= Math.min(negative, score * 0.4);
    if (c.status === "stable") score *= 1.05;
    if (score > 0.4) {
      results.push({
        slug: c.slug,
        name: c.name,
        title: c.title,
        category: c.category,
        description: c.description,
        score: Math.round(score * 100) / 100,
        matched: [...matched],
        importPath: c.importPath,
        install: c.install,
      });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function listComponents(catalog: Catalog, filter: { category?: string; tag?: string } = {}) {
  return catalog.components
    .filter((c) => !filter.category || c.category === filter.category)
    .filter((c) => !filter.tag || c.tags.includes(filter.tag))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      title: c.title,
      category: c.category,
      status: c.status,
      description: c.description,
      tags: c.tags,
    }));
}

export type InstallMethod = "shadcn" | "npm" | "manual" | "cli";
export type Framework = "next" | "vite" | "remix" | "astro" | "other";

/** Resolve a component's full dependency closure (Kura items, npm packages). */
export function resolveClosure(catalog: Catalog, slugs: string[]) {
  const components = new Map<string, CatalogComponent>();
  const hooks = new Set<string>();
  const libs = new Set<string>();
  const npm = new Set<string>();
  const visit = (slug: string) => {
    if (components.has(slug)) return;
    const c = catalog.components.find((x) => x.slug === slug);
    if (!c) throw new Error(`Unknown component "${slug}". Run list_components to see valid slugs.`);
    components.set(slug, c);
    for (const d of c.dependencies.npm) npm.add(d);
    for (const dep of c.registryDependencies) {
      if (dep === "kura-theme" || dep === "utils") continue;
      if (dep.startsWith("kura-")) libs.add(dep.slice(5));
      else if (dep.startsWith("use-")) hooks.add(dep);
      else visit(dep);
    }
  };
  for (const s of slugs) visit(s);
  // hooks/libs can depend on libs too
  for (const h of hooks) {
    for (const f of catalog.hooks.find((x) => x.file === h)?.files ?? []) {
      for (const m of f.content.matchAll(/@\/lib\/kura\/([\w-]+)/g)) libs.add(m[1]!);
      for (const m of f.content.matchAll(/from "([^."@/][^"]*|@[^/"]+\/[^"]+)"/g)) {
        const name = m[1]!.startsWith("@")
          ? m[1]!.split("/").slice(0, 2).join("/")
          : m[1]!.split("/")[0]!;
        if (name !== "react" && name !== "react-dom") npm.add(name);
      }
    }
  }
  npm.add("clsx");
  npm.add("tailwind-merge");
  return {
    components: [...components.values()],
    hooks: [...hooks],
    libs: [...libs],
    npm: [...npm].sort(),
  };
}

export function installInstructions(
  catalog: Catalog,
  slug: string,
  method: InstallMethod = "shadcn",
  framework: Framework = "next",
): string {
  const c = catalog.components.find((x) => x.slug === slug);
  if (!c) throw new Error(`Unknown component "${slug}"`);
  const cssFile =
    framework === "next"
      ? "app/globals.css"
      : framework === "vite"
        ? "src/index.css"
        : framework === "astro"
          ? "src/styles/global.css"
          : "your global CSS file";
  const lines: string[] = [
    `# Install ${c.title} (${c.slug}) — method: ${method}, framework: ${framework}`,
    "",
  ];
  const prereq = [
    "Prerequisites: React 19 and Tailwind CSS v4 (CSS-first config).",
    framework === "next" ? 'Next.js: components with hooks already include "use client".' : "",
  ].filter(Boolean);
  lines.push(...prereq, "");
  if (method === "shadcn") {
    lines.push(
      "```bash",
      `${catalog.install.shadcnTheme}   # once per project: tokens`,
      c.install.shadcn,
      "```",
      "",
    );
    lines.push(
      `Files land in components/kura/${c.slug}/. Import: import { ${c.name} } from "@/components/kura/${c.slug}";`,
    );
  } else if (method === "cli") {
    lines.push(
      "```bash",
      `npx @kura-ui/cli add ${c.slug}`,
      "```",
      "",
      `Then: import { ${c.name} } from "@/components/kura/${c.slug}";`,
    );
  } else if (method === "npm") {
    lines.push(
      "```bash",
      catalog.install.npm,
      "```",
      "",
      `In ${cssFile}:`,
      "```css",
      '@import "tailwindcss";',
      catalog.install.css,
      "```",
      "",
    );
    lines.push("```tsx", `import { ${c.name} } from "${c.importPath}";`, "```");
  } else {
    const closure = resolveClosure(catalog, [slug]);
    lines.push(`1. Install npm packages: npm install ${closure.npm.join(" ")}`);
    lines.push(
      `2. Ensure a cn() helper exists at @/lib/utils (clsx + tailwind-merge, shadcn convention).`,
    );
    lines.push(
      `3. Add the Kura tokens: copy kura.css (get_design_tokens returns it) next to ${cssFile} and @import it after tailwindcss.`,
    );
    lines.push("4. Create these files (paths relative to your src/ alias root `@/`):", "");
    const files = [
      ...closure.components.flatMap((x) => x.files),
      ...closure.hooks.flatMap((h) => catalog.hooks.find((x) => x.file === h)?.files ?? []),
    ];
    const seen = new Set<string>();
    for (const f of files) {
      if (seen.has(f.target)) continue;
      seen.add(f.target);
      lines.push(`### ${f.target}`, "```tsx", f.content.trimEnd(), "```", "");
    }
    for (const lib of closure.libs) {
      for (const f of catalog.libs.find((l) => l.name === lib)?.files ?? []) {
        if (seen.has(f.target)) continue;
        seen.add(f.target);
        lines.push(`### ${f.target}`, "```ts", f.content.trimEnd(), "```", "");
      }
    }
  }
  lines.push(
    "",
    "Usage:",
    "```tsx",
    c.examples.find((e) => e.kind === "minimal")?.code.trimEnd() ?? "",
    "```",
  );
  return lines.join("\n");
}
