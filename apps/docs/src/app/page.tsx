import { Button } from "@kura-ui/react/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/components/copy-button";
import { ExamplePreview } from "@/components/example-preview";
import { Hero } from "@/components/hero";
import { catalog, components, getComponent } from "@/lib/catalog";

/** The run, told in six moments. Each shows one component, live and large. */
const STORY = [
  {
    n: "01",
    slug: "task-list",
    title: "Plan in the open",
    body: "The agent's todo list as it thinks: what's done, what's running, what failed and why. Sub-tasks, live timers, a folded history.",
  },
  {
    n: "02",
    slug: "diff-view",
    title: "Review every hunk",
    body: "Accept or reject the agent's edits hunk by hunk, with syntax highlighting, word-level changes and j/k/a/r on the keyboard. Parses real unified diffs.",
  },
  {
    n: "03",
    slug: "approval-prompt",
    title: "Say yes before it runs",
    body: "Risky commands wait for a human. Risk level, the exact command, details on demand, ⌘↵ to approve and Esc to deny.",
  },
  {
    n: "04",
    slug: "trace-waterfall",
    title: "See where the time went",
    body: "Every model call, tool and subagent on one time axis. Running spans grow live; select one for its input, output, tokens and cost.",
  },
  {
    n: "05",
    slug: "browser-session",
    title: "Follow it through the web",
    body: "Computer-use made legible: the page, the agent's cursor and target, and a step log. Take over when it needs you.",
  },
  {
    n: "06",
    slug: "prompt-queue",
    title: "Steer without stopping",
    body: "Queue follow-ups while the agent works. Reorder, edit, or send one now to interrupt and redirect the run.",
  },
];

function fullExample(slug: string) {
  const c = getComponent(slug);
  const ex =
    c?.examples.find((e) => e.kind === "full") ??
    c?.examples.find((e) => e.kind === "composition") ??
    c?.examples[0];
  return c && ex ? { c, ex } : null;
}

export default function Home() {
  const install = `npx shadcn@latest add ${catalog.homepage}/r/diff-view.json`;
  const agentCount = components.filter(
    (c) => c.category === "agent" || c.category === "workspace",
  ).length;
  return (
    <div className="overflow-x-clip">
      <section className="mx-auto max-w-[1320px] px-4 pt-16 md:px-6 md:pt-24">
        <div className="grid gap-8 pb-12 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16">
          <h1 className="font-semibold text-[clamp(2.6rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.05em] text-balance">
            Interfaces for agents that do real work.
          </h1>
          <div className="flex flex-col gap-6 lg:pb-2">
            <p className="max-w-[34rem] text-[17px] text-kura-fg-muted leading-relaxed text-pretty">
              Runs, plans, terminals, diffs, traces and approvals. {agentCount} open-source React
              components for supervising coding and computer-use agents, with a manifest your own
              agent can install from.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button asChild size="lg">
                <Link href="/docs">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/components">Browse components</Link>
              </Button>
              <span className="hidden h-10 items-center gap-1 rounded-kura-lg pr-1 pl-3 font-kura-mono text-[12px] text-kura-fg-subtle shadow-kura-xs xl:inline-flex">
                <span className="max-w-[17rem] truncate">{install}</span>
                <CopyButton value={install} label="Copy install command" />
              </span>
            </div>
          </div>
        </div>
        <Hero />
      </section>

      <section aria-label="What Kura covers" className="mx-auto max-w-[1320px] px-4 pt-36 md:px-6">
        <div className="flex flex-col gap-32">
          {STORY.map((s) => {
            const found = fullExample(s.slug);
            if (!found) return null;
            return (
              <article
                key={s.slug}
                className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.5fr)] lg:gap-14"
              >
                <div className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
                  <span className="font-kura-mono text-[13px] text-kura-fg-subtle">{s.n}</span>
                  <h2 className="font-semibold text-[clamp(1.9rem,3vw,2.5rem)] leading-[1.04] tracking-[-0.04em] text-balance">
                    {s.title}
                  </h2>
                  <p className="max-w-md text-[16px] text-kura-fg-muted leading-relaxed">
                    {s.body}
                  </p>
                  <Link
                    href={`/components/${s.slug}`}
                    className="group mt-2 inline-flex w-fit items-center gap-1.5 font-kura-mono text-[13px] text-kura-fg outline-none hover:text-kura-accent-text focus-visible:shadow-kura-focus"
                  >
                    &lt;{found.c.name} /&gt;
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                <div className="rounded-[20px] bg-kura-surface-sunken p-2 shadow-[0_0_0_1px_var(--kura-border)]">
                  <ExamplePreview
                    slug={s.slug}
                    name={found.ex.name}
                    dots={false}
                    className="min-h-[22rem] rounded-[14px] bg-kura-canvas p-6 shadow-[0_0_0_1px_var(--kura-border-subtle)] md:p-10"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 pt-40 md:px-6">
        <div className="grid gap-12 border-kura-border-subtle border-t pt-16 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.5fr)] lg:gap-14">
          <div className="flex flex-col gap-4">
            <span className="font-kura-mono text-[13px] text-kura-fg-subtle">Install</span>
            <h2 className="font-semibold text-[clamp(1.9rem,3vw,2.5rem)] leading-[1.04] tracking-[-0.04em] text-balance">
              Your agent can install it, too.
            </h2>
            <p className="max-w-md text-[16px] text-kura-fg-muted leading-relaxed">
              Every component ships a typed manifest: when to use it, when not to, every prop, the
              anatomy and the keyboard map. The registry, llms.txt, the MCP server and the CLI are
              generated from it.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild variant="secondary">
                <Link href="/agents">Agent setup</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/components">
                  All {components.length} components <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
          <CodeBlock
            lang="bash"
            code={`# give your coding agent the catalog\nclaude mcp add kura -- npx -y @kura-ui/mcp\n\n# then ask for what you need\n> add per-hunk review for the agent's edits, and a terminal for its test runs\n\n# or install directly\n${install}`}
          />
        </div>
      </section>
    </div>
  );
}
