import { Button } from "@kura-ui/react/button";
import { ShimmerText } from "@kura-ui/react/shimmer-text";
import { ArrowRight, Bot, Braces, FileText, Terminal } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { ComponentCard } from "@/components/component-card";
import { CopyButton } from "@/components/copy-button";
import { HeroDemo } from "@/components/hero-demo";
import { catalog, components } from "@/lib/catalog";

const agentFeatures = [
  {
    icon: Braces,
    title: "A manifest per component",
    body: "whenToUse, whenNotToUse, props with JSON Schema, anatomy, a11y and examples — validated against the TypeScript source on every commit.",
  },
  {
    icon: Bot,
    title: "MCP server",
    body: "search_components, get_component, get_install_instructions, get_design_tokens. Your agent asks; Kura answers with exactly what to install.",
  },
  {
    icon: FileText,
    title: "llms.txt + markdown",
    body: "Every docs page has a raw .md twin. llms-full.txt carries the whole library in one fetch.",
  },
  {
    icon: Terminal,
    title: "CLI with --json",
    body: "kura search, kura add, kura doctor. Copies source plus dependencies, shadcn-compatible, machine-readable output.",
  },
];

/** Hand-picked for the home grid: one per category, each with a minimal example that reads at card size. */
const FEATURED = [
  "agent-orb",
  "composer",
  "agent-timeline",
  "artifact-card",
  "audio-waveform",
  "mesh-gradient",
];

export default function Home() {
  const picked = FEATURED.flatMap((slug) => components.find((c) => c.slug === slug) ?? []);
  const gallery =
    picked.length >= 3 ? picked : components.filter((c) => c.category !== "primitives").slice(0, 6);
  const install = `npx shadcn@latest add ${catalog.homepage}/r/shimmer-text.json`;
  return (
    <div className="overflow-x-clip">
      <section className="mx-auto grid max-w-[1400px] items-center gap-12 px-4 pt-16 pb-20 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        <div className="flex flex-col gap-6">
          <ShimmerText
            className="font-kura-mono text-kura-fg-muted text-xs tracking-wide"
            duration={2.6}
          >
            v{catalog.version} · {components.length} components · agent-ready
          </ShimmerText>
          <h1 className="max-w-xl text-balance font-medium text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Interfaces for working with machines.
          </h1>
          <p className="max-w-lg text-pretty text-kura-fg-muted text-lg leading-relaxed">
            Kura UI is an open-source React toolkit of AI-native surfaces — composers, voice,
            shaders and agent harnesses — quiet by default, alive when the model speaks. Built so
            your coding agent picks the right component, every time.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="lg">
              <Link href="/components">
                Browse components <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/agents">Connect your agent</Link>
            </Button>
          </div>
          <div className="flex h-10 max-w-lg items-center gap-2 rounded-kura-lg bg-kura-surface pr-1.5 pl-3 font-kura-mono text-kura-fg-muted text-xs shadow-kura-xs">
            <span className="text-kura-accent-text">$</span>
            <span className="truncate">{install}</span>
            <CopyButton value={install} label="Copy install command" className="ml-auto" />
          </div>
        </div>
        <HeroDemo />
      </section>

      <section className="border-kura-border-subtle border-y bg-kura-surface-sunken/60">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-16 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <p className="font-kura-mono text-kura-accent-text text-xs">
              Agents are the primary users
            </p>
            <h2 className="text-balance font-medium text-3xl tracking-tight">
              Discoverable, explainable, installable — by a model.
            </h2>
            <p className="text-kura-fg-muted leading-relaxed">
              Every component ships a typed manifest. The docs, the shadcn registry, llms.txt, the
              MCP server and the CLI are all generated from it, so they can never disagree.
            </p>
            <Link href="/agents" className="inline-flex items-center gap-1 text-sm hover:underline">
              Agent integration guide <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {agentFeatures.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-2 rounded-kura-xl bg-kura-surface p-5 shadow-kura-sm"
              >
                <f.icon className="size-4 text-kura-accent-text" />
                <h3 className="font-medium text-[15px]">{f.title}</h3>
                <p className="text-kura-fg-muted text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-6">
        <div className="flex items-end justify-between gap-4 pb-8">
          <div>
            <h2 className="font-medium text-3xl tracking-tight">Components</h2>
            <p className="pt-2 text-kura-fg-muted">
              Live, not screenshots. Each one reads its own manifest.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/components">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((c) => (
            <ComponentCard key={c.slug} component={c} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-8 px-4 pb-24 md:px-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="font-medium text-2xl tracking-tight">Ask your agent</h2>
          <p className="text-kura-fg-muted leading-relaxed">
            Add the MCP server and describe what you need. The agent searches the catalog, reads the
            manifest, and installs the component with its dependencies and tokens.
          </p>
        </div>
        <CodeBlock
          lang="bash"
          code={`claude mcp add kura -- npx -y @kura-ui/mcp\n\n# then, in your agent:\n> add a "thinking" label to the chat while the model streams`}
        />
      </section>
    </div>
  );
}
