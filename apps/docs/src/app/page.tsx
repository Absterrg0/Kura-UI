import { Button } from "@kura-ui/react/button";
import { ArrowRight, Bot, Braces, FileText, Terminal } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/components/copy-button";
import { ShowcaseCard } from "@/components/showcase-card";
import { catalog, components, getComponent } from "@/lib/catalog";

const AGENT_FEATURES = [
  {
    icon: Braces,
    title: "A manifest per component",
    body: "When to use it and when not to, every prop as JSON Schema, anatomy, keyboard map and examples, checked against the TypeScript source.",
  },
  {
    icon: Bot,
    title: "MCP server",
    body: "search_components, get_component, get_install_instructions. Your agent asks; Kura answers with exactly what to install.",
  },
  {
    icon: FileText,
    title: "llms.txt",
    body: "Every page has a markdown twin. llms-full.txt carries the whole library in one fetch.",
  },
  {
    icon: Terminal,
    title: "CLI with --json",
    body: "kura search, add and doctor. Copies source and dependencies into your project, shadcn-compatible.",
  },
];

function pick(slug: string) {
  const c = getComponent(slug);
  if (!c) throw new Error(`Missing component ${slug}`);
  return c;
}

export default function Home() {
  const install = `npx shadcn@latest add ${catalog.homepage}/r/composer.json`;
  return (
    <div className="relative overflow-x-clip">
      <div
        aria-hidden
        className="hero-grid pointer-events-none absolute inset-x-0 top-0 h-[560px]"
      />

      <section className="relative mx-auto flex max-w-[1320px] flex-col items-center px-4 pt-20 pb-16 text-center md:px-6 md:pt-28">
        <Link
          href="/components/artifact-card"
          className="group inline-flex items-center gap-2 rounded-full bg-kura-surface py-1 pr-3 pl-1 text-[13px] text-kura-fg-muted shadow-kura-xs transition-colors hover:text-kura-fg"
        >
          <span className="rounded-full bg-kura-accent-subtle px-2 py-0.5 font-medium text-[12px] text-kura-accent-text">
            New
          </span>
          Artifact Card
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <h1 className="max-w-3xl pt-6 font-semibold text-[clamp(2.5rem,5.6vw,4.25rem)] leading-[1.02] tracking-[-0.045em] text-balance">
          The interface layer for AI products
        </h1>
        <p className="max-w-[38rem] pt-5 text-[17px] text-kura-fg-muted leading-relaxed text-pretty">
          Composers, voice, reasoning, tool calls and approvals. {components.length} open-source
          React components, built with care, that your coding agent can find, read and install.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-8">
          <Button asChild size="lg">
            <Link href="/docs">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/components">Browse components</Link>
          </Button>
        </div>
        <div className="mt-6 flex h-9 max-w-full items-center gap-2 rounded-full bg-kura-surface pr-1 pl-4 font-kura-mono text-[12.5px] text-kura-fg-muted shadow-kura-xs">
          <span className="truncate">{install}</span>
          <CopyButton value={install} label="Copy install command" />
        </div>
      </section>

      <section
        aria-label="Live components"
        className="mx-auto grid max-w-[1320px] grid-cols-1 gap-4 px-4 md:grid-cols-2 md:px-6 xl:grid-cols-3"
      >
        <div className="flex flex-col gap-4">
          <ShowcaseCard component={pick("composer")} kind="full" stageClassName="min-h-56" />
          <ShowcaseCard component={pick("approval-prompt")} />
          <ShowcaseCard component={pick("context-meter")} kind="full" />
        </div>
        <div className="flex flex-col gap-4">
          <ShowcaseCard component={pick("agent-orb")} stageClassName="min-h-64" />
          <ShowcaseCard component={pick("tool-call")} kind="state" />
          <ShowcaseCard component={pick("audio-waveform")} kind="full" />
        </div>
        <div className="flex flex-col gap-4 md:col-span-2 xl:col-span-1">
          <ShowcaseCard component={pick("agent-timeline")} kind="full" />
          <ShowcaseCard component={pick("reasoning")} kind="full" />
          <ShowcaseCard component={pick("artifact-card")} />
        </div>
        <div className="flex justify-center pt-4 md:col-span-2 xl:col-span-3">
          <Button asChild variant="ghost">
            <Link href="/components">
              See all {components.length} components <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 pt-28 md:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <p className="font-medium text-[13px] text-kura-accent-text">Built for agents</p>
            <h2 className="font-semibold text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.08] tracking-[-0.035em] text-balance">
              Your coding agent reads the docs too.
            </h2>
            <p className="max-w-lg text-[16px] text-kura-fg-muted leading-relaxed">
              Every component ships a typed manifest. The docs, the shadcn registry, llms.txt, the
              MCP server and the CLI are all generated from it, so they never disagree.
            </p>
            <div className="pt-2">
              <CodeBlock
                lang="bash"
                code={`claude mcp add kura -- npx -y @kura-ui/mcp\n\n# then ask your agent:\n> add a reasoning trace above the answer while the model streams`}
              />
            </div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-kura-xl bg-kura-border-subtle shadow-kura-xs sm:grid-cols-2">
            {AGENT_FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-2 bg-kura-surface p-6">
                <f.icon className="size-[18px] text-kura-fg-muted" strokeWidth={1.75} />
                <h3 className="pt-2 font-medium text-[15px] tracking-[-0.01em]">{f.title}</h3>
                <p className="text-[14px] text-kura-fg-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
