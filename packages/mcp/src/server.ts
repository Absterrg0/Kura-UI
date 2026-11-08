import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Catalog } from "../../../scripts/lib/catalog-types";
import {
  installInstructions,
  listComponents,
  resolveClosure,
  searchComponents,
} from "../../../scripts/lib/search";
import { readDataText } from "./catalog";

const text = (value: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
    },
  ],
});
const fail = (message: string) => ({
  content: [{ type: "text" as const, text: message }],
  isError: true,
});

export function createServer(catalog: Catalog): McpServer {
  const server = new McpServer(
    { name: "kura-ui", version: catalog.version },
    {
      instructions:
        "Kura UI is a React 19 + Tailwind v4 library of AI-native components. Workflow: search_components (natural language) → get_component (read whenToUse/whenNotToUse, props, examples) → get_install_instructions → write code using the examples. Use design tokens (bg-kura-*, text-kura-*) instead of raw colors.",
    },
  );
  const slugs = catalog.components.map((c) => c.slug);
  const categories = catalog.categories.map((c) => c.id);

  server.registerTool(
    "list_components",
    {
      title: "List Kura components",
      description: `List all Kura UI components (slug, name, category, status, description, tags). Optionally filter by category (${categories.join(", ")}) or tag.`,
      inputSchema: {
        category: z
          .string()
          .optional()
          .describe(`One of: ${categories.join(", ")}`),
        tag: z.string().optional().describe("Exact tag, e.g. 'voice' or 'loading'"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ category, tag }) =>
      text({
        total: catalog.components.length,
        components: listComponents(catalog, { category, tag }),
        hooks: catalog.hooks.map((h) => ({ name: h.name, description: h.description })),
      }),
  );

  server.registerTool(
    "search_components",
    {
      title: "Search Kura components",
      description:
        "Find the right component for a need described in natural language (e.g. 'show the model is thinking', 'mic button with waveform'). Ranks by name, tags, whenToUse and description; penalises matches against whenNotToUse.",
      inputSchema: {
        query: z.string().min(2).describe("What the UI needs to do"),
        limit: z.number().int().min(1).max(25).optional().describe("Max results (default 8)"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, limit }) => {
      const results = searchComponents(catalog, query, limit ?? 8);
      return text({
        query,
        results,
        hint: results.length
          ? "Call get_component with the best slug to read whenToUse/whenNotToUse before choosing."
          : "No match. Call list_components to browse everything.",
      });
    },
  );

  server.registerTool(
    "get_component",
    {
      title: "Get a Kura component",
      description:
        "Full manifest for one component: description, whenToUse, whenNotToUse, props (with JSON Schema), anatomy, accessibility and keyboard map, dependencies, related components, agent notes and copy-pasteable examples.",
      inputSchema: {
        slug: z.string().describe(`Component slug, e.g. ${slugs.slice(0, 3).join(", ")}`),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ slug }) => {
      const c = catalog.components.find((x) => x.slug === slug);
      if (!c) return fail(`Unknown slug "${slug}". Valid: ${slugs.join(", ")}`);
      const { files: _files, ...rest } = c;
      return text(rest);
    },
  );

  server.registerTool(
    "get_component_source",
    {
      title: "Get component source",
      description:
        "Source files of a component, with imports rewritten to shadcn-style aliases (@/components/kura/…, @/hooks/kura/…, @/lib/utils). Set includeDependencies to also get the hooks and lib files it needs.",
      inputSchema: {
        slug: z.string(),
        includeDependencies: z
          .boolean()
          .optional()
          .describe("Include Kura hooks/libs/components it imports (default false)"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ slug, includeDependencies }) => {
      const c = catalog.components.find((x) => x.slug === slug);
      if (!c) return fail(`Unknown slug "${slug}". Valid: ${slugs.join(", ")}`);
      if (!includeDependencies) return text({ slug, files: c.files });
      const closure = resolveClosure(catalog, [slug]);
      return text({
        slug,
        npmDependencies: closure.npm,
        files: [
          ...closure.components.flatMap((x) => x.files),
          ...closure.hooks.flatMap((h) => catalog.hooks.find((x) => x.file === h)?.files ?? []),
          ...closure.libs.flatMap((l) => catalog.libs.find((x) => x.name === l)?.files ?? []),
        ].filter((f, i, all) => all.findIndex((g) => g.target === f.target) === i),
      });
    },
  );

  server.registerTool(
    "get_install_instructions",
    {
      title: "Install instructions",
      description:
        "Exact steps to install a component: via the shadcn registry, the Kura CLI, the npm package, or a manual copy (with every file inlined) for a given framework.",
      inputSchema: {
        slug: z.string(),
        method: z.enum(["shadcn", "cli", "npm", "manual"]).optional().describe("Default shadcn"),
        framework: z
          .enum(["next", "vite", "remix", "astro", "other"])
          .optional()
          .describe("Default next"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ slug, method, framework }) => {
      try {
        return text(installInstructions(catalog, slug, method ?? "shadcn", framework ?? "next"));
      } catch (err) {
        return fail((err as Error).message);
      }
    },
  );

  server.registerTool(
    "get_design_tokens",
    {
      title: "Design tokens",
      description:
        "Kura design tokens: OKLCH colors (light/dark), Tailwind utility names (bg-kura-*, shadow-kura-*, rounded-kura-*), radii, shadows, motion springs/durations/easings, and optionally the raw kura.css.",
      inputSchema: {
        includeCss: z.boolean().optional().describe("Include the full kura.css source"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ includeCss }) =>
      text({ ...catalog.tokens, ...(includeCss ? { css: readDataText("kura.css") } : {}) }),
  );

  server.registerTool(
    "get_design_guidelines",
    {
      title: "Design guidelines",
      description:
        "The Kura Signal design language (DESIGN.md): principles, color usage, typography, motion rules, reduced motion, focus, density and anti-patterns. Read before building UI with Kura.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => text(readDataText("DESIGN.md")),
  );

  return server;
}
