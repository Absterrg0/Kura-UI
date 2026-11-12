import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { C, DocsShell, PageHeader, Section } from "@/components/docs-shell";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Agents",
  description:
    "Connect coding agents to Kura UI: MCP server, llms.txt, markdown pages, JSON catalog, shadcn registry, CLI and skills.",
};

const surfaces = [
  ["/llms.txt", "Index of every component with one-line descriptions (llmstxt.org)."],
  ["/llms-full.txt", "The entire library — every manifest, prop table and example — in one file."],
  ["/components/<slug>.md", "Raw markdown twin of every component page."],
  [
    "/registry/index.json",
    "Full machine-readable catalog: meta, JSON-Schema props, examples, source, tokens.",
  ],
  ["/r/<slug>.json", "shadcn registry item (files, dependencies, registryDependencies)."],
  ["/r/registry.json", "shadcn registry index (use as a namespaced registry)."],
];

export default function AgentsPage() {
  const site = catalog.homepage;
  return (
    <DocsShell>
      <div className="max-w-[46rem]">
        <PageHeader
          title="For agents"
          description="Humans browse; agents query. Every surface below is generated from the same component manifests, so they never drift."
        />

        <Section id="mcp" title="MCP server">
          <p className="pb-4 text-[15.5px] text-kura-fg-muted leading-relaxed">
            <C>@kura-ui/mcp</C> is a stdio MCP server. Tools: <C>list_components</C>,{" "}
            <C>search_components</C>, <C>get_component</C>, <C>get_component_source</C>,{" "}
            <C>get_install_instructions</C>, <C>get_design_tokens</C>, <C>get_design_guidelines</C>.
          </p>
          <div className="flex flex-col gap-3">
            <CodeBlock
              lang="bash"
              title="Claude Code"
              code="claude mcp add kura -- npx -y @kura-ui/mcp"
            />
            <CodeBlock
              lang="json"
              title=".cursor/mcp.json"
              code={JSON.stringify(
                { mcpServers: { kura: { command: "npx", args: ["-y", "@kura-ui/mcp"] } } },
                null,
                2,
              )}
            />
            <CodeBlock
              lang="toml"
              title="~/.codex/config.toml"
              code={`[mcp_servers.kura]\ncommand = "npx"\nargs = ["-y", "@kura-ui/mcp"]`}
            />
          </div>
        </Section>

        <Section id="cli" title="CLI">
          <p className="pb-4 text-[15.5px] text-kura-fg-muted leading-relaxed">
            Every command accepts <C>--json</C> so agents can parse results.
          </p>
          <CodeBlock
            lang="bash"
            code={`npx @kura-ui/cli list --category feedback --json
npx @kura-ui/cli search "show that the model is thinking" --json
npx @kura-ui/cli info shimmer-text --json
npx @kura-ui/cli add shimmer-text kbd-shortcut   # copies source + deps, resolves registry deps
npx @kura-ui/cli doctor --json                   # checks Tailwind v4 + Kura tokens`}
          />
        </Section>

        <Section id="shadcn" title="shadcn registry">
          <div className="flex flex-col gap-3">
            <CodeBlock
              lang="bash"
              code={`npx shadcn@latest add ${site}/r/kura-theme.json   # tokens, once\nnpx shadcn@latest add ${site}/r/shimmer-text.json`}
            />
            <p className="text-[15.5px] text-kura-fg-muted">
              Or register the namespace in components.json and use short names:
            </p>
            <CodeBlock
              lang="json"
              title="components.json"
              code={JSON.stringify({ registries: { "@kura": `${site}/r/{name}.json` } }, null, 2)}
            />
            <CodeBlock lang="bash" code="npx shadcn@latest add @kura/shimmer-text" />
          </div>
        </Section>

        <Section id="files" title="Machine-readable files">
          <ul className="divide-y divide-kura-border-subtle border-kura-border border-y text-[14.5px]">
            {surfaces.map(([path, desc]) => (
              <li key={path} className="flex flex-col gap-1 py-3.5 md:flex-row md:gap-6">
                <a
                  href={path?.includes("<") ? undefined : path}
                  className="w-56 shrink-0 rounded-sm font-kura-mono text-[13px] outline-none hover:underline focus-visible:shadow-kura-focus"
                >
                  {path}
                </a>
                <span className="text-kura-fg-muted">{desc}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="skills" title="Skills & rules">
          <p className="pb-4 text-[15.5px] text-kura-fg-muted leading-relaxed">
            The repo ships a Claude Code skill (<C>skills/kura-ui/SKILL.md</C>) and a Cursor rule (
            <C>.cursor/rules/kura-ui.mdc</C>) that teach an agent how to pick, install and compose
            Kura components — copy them into your project.
          </p>
          <CodeBlock
            lang="bash"
            code={`mkdir -p .claude/skills/kura-ui && curl -fsSL https://raw.githubusercontent.com/Absterrg0/Kura-UI/main/skills/kura-ui/SKILL.md -o .claude/skills/kura-ui/SKILL.md`}
          />
        </Section>

        <Section id="manifest" title="The manifest">
          <p className="pb-4 text-[15.5px] text-kura-fg-muted leading-relaxed">
            Each component folder has a <C>&lt;slug&gt;.meta.ts</C>. CI fails if its props drift
            from the TypeScript types, if its dependencies differ from its imports, or if it lacks
            examples and accessibility tests.
          </p>
          <CodeBlock
            code={`export default defineComponent({
  slug: "shimmer-text",
  name: "ShimmerText",
  category: "feedback",
  description: "Animated gradient sweep across text — the canonical “Thinking…” label.",
  whenToUse: ["Show that a model or agent is working…"],
  whenNotToUse: ["Determinate progress — use context-meter."],
  props: [{ name: "active", type: "boolean", default: "true", description: "…" }],
  a11y: { notes: ["…"], reducedMotion: "The sweep is removed." },
  dependencies: { npm: [], kura: [] },
  tags: ["loading", "thinking", "status"],
  examples: [{ name: "ShimmerTextMinimal", kind: "minimal", title: "Thinking label" }],
});`}
          />
        </Section>
      </div>
    </DocsShell>
  );
}
