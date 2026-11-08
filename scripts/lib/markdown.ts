/** Markdown renderers for /components/<slug>.md, llms.txt and llms-full.txt. */
import type { Catalog, CatalogComponent, CatalogHook } from "./catalog-types";

const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function table(headers: string[], rows: string[][]): string {
  if (!rows.length) return "";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.map(esc).join(" | ")} |`),
  ].join("\n");
}

export function componentMarkdown(c: CatalogComponent): string {
  const out: string[] = [];
  out.push(`# ${c.title}`);
  out.push("");
  out.push(`> ${c.description}`);
  out.push("");
  out.push(
    `- **Slug:** \`${c.slug}\` · **Category:** ${c.category} · **Status:** ${c.status}`,
    `- **Import:** \`import { ${c.exports.filter((e) => /^[A-Z]/.test(e) && !e.endsWith("Props")).join(", ")} } from "${c.importPath}";\``,
    `- **Docs:** ${c.docsUrl}`,
    `- **Registry item:** ${c.registryUrl}`,
    `- **Tags:** ${c.tags.join(", ")}`,
  );
  out.push("");
  out.push("## Install");
  out.push("");
  out.push("```bash");
  out.push(`# shadcn registry (copies source into your project)`);
  out.push(c.install.shadcn);
  out.push(`# Kura CLI (same, plus dependency resolution and --json output)`);
  out.push(c.install.cli);
  out.push(`# npm package`);
  out.push(c.install.npm);
  out.push("```");
  out.push("");
  out.push("## When to use");
  out.push("");
  for (const w of c.whenToUse) out.push(`- ${w}`);
  out.push("");
  out.push("## When not to use");
  out.push("");
  for (const w of c.whenNotToUse) out.push(`- ${w}`);
  out.push("");
  out.push("## Props");
  out.push("");
  out.push(
    table(
      ["Prop", "Type", "Default", "Required", "Description"],
      c.props.map((p) => [
        `\`${p.name}\``,
        `\`${p.type}\``,
        p.default ? `\`${p.default}\`` : "—",
        p.required ? "yes" : "no",
        p.description,
      ]),
    ) || "_No props beyond native element attributes._",
  );
  out.push("");
  out.push("Native attributes of the root element, `className` and `ref` are passed through.");
  out.push("");
  if (c.parts?.length) {
    out.push("## Anatomy");
    out.push("");
    for (const p of c.parts) {
      out.push(
        `- **${p.name}**${p.dataSlot ? ` (\`data-slot="${p.dataSlot}"\`)` : ""} — ${p.description}`,
      );
      for (const pp of p.props ?? []) {
        out.push(
          `  - \`${pp.name}\`: \`${pp.type}\`${pp.default ? ` = \`${pp.default}\`` : ""} — ${pp.description}`,
        );
      }
    }
    out.push("");
  }
  out.push("## Accessibility");
  out.push("");
  if (c.a11y.role) out.push(`- Role: \`${c.a11y.role}\``);
  for (const n of c.a11y.notes) out.push(`- ${n}`);
  out.push(`- Reduced motion: ${c.a11y.reducedMotion}`);
  out.push("");
  if (c.a11y.keyboard?.length) {
    out.push(
      table(
        ["Keys", "Action"],
        c.a11y.keyboard.map((k) => [k.keys, k.action]),
      ),
    );
    out.push("");
  }
  if (c.agentNotes?.length) {
    out.push("## Notes for agents");
    out.push("");
    for (const n of c.agentNotes) out.push(`- ${n}`);
    out.push("");
  }
  out.push("## Examples");
  out.push("");
  for (const ex of c.examples) {
    out.push(`### ${ex.title} (${ex.kind})`);
    out.push("");
    if (ex.description) {
      out.push(ex.description);
      out.push("");
    }
    out.push("```tsx");
    out.push(ex.code.trimEnd());
    out.push("```");
    out.push("");
  }
  out.push("## Dependencies");
  out.push("");
  out.push(
    `- npm: ${c.dependencies.npm.length ? c.dependencies.npm.map((d) => `\`${d}\``).join(", ") : "none"}`,
  );
  out.push(
    `- Kura registry items: ${c.registryDependencies.length ? c.registryDependencies.map((d) => `\`${d}\``).join(", ") : "none"}`,
  );
  if (c.related?.length) out.push(`- Related: ${c.related.map((r) => `\`${r}\``).join(", ")}`);
  out.push("");
  return out.join("\n");
}

export function hookMarkdown(h: CatalogHook): string {
  return [
    `### ${h.name}`,
    "",
    h.description,
    "",
    "```ts",
    `import { ${h.name} } from "${h.importPath}";`,
    h.signature,
    "```",
    "",
    `Returns: ${h.returns}`,
    "",
    ...(h.notes ?? []).map((n) => `- ${n}`),
    "",
    "```tsx",
    h.example,
    "```",
    "",
  ].join("\n");
}

export function llmsTxt(catalog: Catalog): string {
  const lines: string[] = [];
  lines.push("# Kura UI");
  lines.push("");
  lines.push(`> ${catalog.description}`);
  lines.push("");
  lines.push(
    "Kura UI is a React 19 + Tailwind CSS v4 component library for AI interfaces, designed to be chosen and installed by coding agents. Every component has a machine-readable manifest (when to use, when not to use, props, a11y, examples).",
  );
  lines.push("");
  lines.push("Setup (npm):");
  lines.push(`- \`${catalog.install.npm}\``);
  lines.push(`- In your global CSS after \`@import "tailwindcss";\`: \`${catalog.install.css}\``);
  lines.push(
    `- Import per component: \`import { ShimmerText } from "@kura-ui/react/shimmer-text";\``,
  );
  lines.push("");
  lines.push("Setup (copy source, shadcn-compatible):");
  lines.push(`- Theme tokens once: \`${catalog.install.shadcnTheme}\``);
  lines.push(`- Then any component: \`npx shadcn@latest add ${catalog.homepage}/r/<slug>.json\``);
  lines.push("");
  lines.push("Machine-readable:");
  lines.push(
    `- [Full catalog JSON (all meta, JSON-Schema props, examples, source)](${catalog.homepage}/registry/index.json)`,
  );
  lines.push(`- [Everything in one markdown file](${catalog.homepage}/llms-full.txt)`);
  lines.push(
    `- MCP server: \`npx -y @kura-ui/mcp\` (tools: list_components, search_components, get_component, get_component_source, get_install_instructions, get_design_tokens, get_design_guidelines)`,
  );
  lines.push(`- CLI: \`npx @kura-ui/cli search "<what you need>" --json\``);
  lines.push("");
  for (const cat of catalog.categories) {
    const items = catalog.components.filter((c) => c.category === cat.id);
    if (!items.length) continue;
    lines.push(`## ${cat.title}`);
    lines.push("");
    for (const c of items) lines.push(`- [${c.title}](${c.markdownUrl}): ${c.description}`);
    lines.push("");
  }
  lines.push("## Hooks");
  lines.push("");
  for (const h of catalog.hooks) lines.push(`- \`${h.name}\` (${h.importPath}): ${h.description}`);
  lines.push("");
  lines.push("## Optional");
  lines.push("");
  lines.push(`- [Agent integration guide](${catalog.homepage}/agents)`);
  lines.push(`- [Design language](${catalog.homepage}/docs#design)`);
  lines.push("");
  return lines.join("\n");
}

export function llmsFullTxt(catalog: Catalog, design: string): string {
  const parts: string[] = [llmsTxt(catalog), "---", ""];
  for (const c of catalog.components) {
    parts.push(componentMarkdown(c), "---", "");
  }
  parts.push("# Hooks", "");
  for (const h of catalog.hooks) parts.push(hookMarkdown(h));
  parts.push("---", "", design);
  return parts.join("\n");
}
