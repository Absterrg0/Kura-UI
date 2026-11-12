import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { AgentDemo } from "@/components/landing/agent-demo";
import { AgentTerminal } from "@/components/landing/agent-terminal";
import { BuiltRight } from "@/components/landing/built-right";
import { CtaBand } from "@/components/landing/cta-band";
import { EmberLight } from "@/components/landing/ember-light";
import { FeatureBento } from "@/components/landing/feature-bento";
import { HeroStage } from "@/components/landing/hero-stage";
import { InstallChip } from "@/components/landing/install-chip";
import { siteButton } from "@/components/site-button";
import { catalog } from "@/lib/catalog";

const WORKS_WITH = [
  "Claude Agent SDK",
  "Vercel AI SDK",
  "OpenAI Agents SDK",
  "shadcn/ui",
  "Tailwind CSS v4",
];

const AGENT_SURFACES = [
  ["Typed manifests", "When to use it, every prop, anatomy, keyboard map."],
  ["shadcn registry", "Every component is an item your agent adds by URL."],
  ["MCP server", "Search, read and install from inside the agent's loop."],
  ["CLI", "kura list, search, info and add, all with --json."],
  ["llms.txt", "The whole library as plain text, one fetch away."],
] as const;

function SectionHead({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-5 pb-12 md:pb-16 lg:grid-cols-2 lg:items-end lg:gap-16">
      <h2
        id={id}
        className="font-semibold text-[36px] leading-[1.05] tracking-[-0.03em] text-balance md:text-[48px]"
      >
        {title}
      </h2>
      <p className="max-w-xl text-[17px] text-kura-fg-muted leading-relaxed lg:pb-1.5">
        {children}
      </p>
    </div>
  );
}

export default function Home() {
  const install = `npx shadcn@latest add ${catalog.homepage}/r/run-header.json`;
  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section
        aria-labelledby="hero-title"
        className="relative px-4 pt-14 md:px-6 md:pt-16 lg:pt-[72px]"
      >
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1
            id="hero-title"
            className="font-semibold text-[42px] leading-[1.02] tracking-[-0.035em] text-balance sm:text-[56px] lg:text-[72px]"
          >
            Components for agent interfaces.
          </h1>
          <p className="max-w-[40rem] pt-6 text-[16px] sm:text-[17px] text-kura-fg-muted leading-relaxed text-pretty md:text-[18px]">
            Open-source React components for agent runs, plans, terminals, diffs and approvals. Copy
            them into your app, or let your coding agent install them.
          </p>
          <div className="flex w-full flex-col items-center gap-3 pt-9 sm:w-auto sm:flex-row">
            <Link href="/components" className={siteButton({ className: "w-full sm:w-auto" })}>
              Browse components
            </Link>
            <Link
              href="/docs"
              className={siteButton({ variant: "dark", className: "w-full sm:w-auto" })}
            >
              Get started
            </Link>
          </div>
          <InstallChip command={install} className="mt-5" />
        </div>

        <div className="relative isolate mx-auto mt-14 max-w-[1240px] md:mt-16">
          <EmberLight className="-top-[120px] -z-10 max-md:-top-[56px] max-md:origin-top max-md:scale-[0.55]" />
          <HeroStage />
        </div>
      </section>

      {/* Works with */}
      <section aria-label="Works with" className="px-4 pt-20 md:px-6 md:pt-24">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5">
          <p className="text-center text-[13.5px] text-kura-fg-subtle">
            Plain props and callbacks. Wire them to any agent loop.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {WORKS_WITH.map((w) => (
              <li
                key={w}
                className="font-semibold text-[15.5px] text-kura-fg-muted tracking-[-0.015em]"
              >
                {w}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Every part of the run */}
      <section aria-labelledby="parts" className="px-4 pt-36 md:px-6 md:pt-44">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead id="parts" title="Every part of the run.">
            Plans, diffs, terminals, traces and approvals as composable React components. Each one
            is keyboard-complete, themeable and driven by plain props.
          </SectionHead>
          <FeatureBento />
          <div className="flex justify-center pt-10">
            <Link
              href="/components"
              className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[15px] text-kura-fg-muted outline-none transition-colors hover:text-kura-fg focus-visible:shadow-kura-focus"
            >
              See all components
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>
        </div>
      </section>

      {/* Your agent can use it */}
      <section aria-labelledby="use" className="px-4 pt-36 md:px-6 md:pt-44">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead id="use" title="Your agent can use it, too.">
            Kura is built on Vercel's UI SDK. Every component tells an agent what it shows and what
            it can do, so an in-app assistant works through the same UI your users see. Approvals
            still wait for a person.
          </SectionHead>
          <AgentDemo />
        </div>
      </section>

      {/* Your agent can install it */}
      <section aria-labelledby="agents" className="px-4 pt-36 md:px-6 md:pt-44">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <h2
              id="agents"
              className="font-semibold text-[36px] leading-[1.05] tracking-[-0.03em] text-balance md:text-[48px]"
            >
              Your agent can install it.
            </h2>
            <p className="max-w-md pt-5 text-[17px] text-kura-fg-muted leading-relaxed">
              Every component ships a typed manifest. The registry, MCP server, CLI and llms.txt are
              generated from it, so your coding agent picks the right part and installs it
              correctly.
            </p>
            <dl className="mt-9 flex flex-col border-kura-border-subtle border-t">
              {AGENT_SURFACES.map(([name, desc]) => (
                <div
                  key={name}
                  className="grid gap-1 border-kura-border-subtle border-b py-3.5 sm:grid-cols-[8.5rem_1fr] sm:gap-4"
                >
                  <dt className="font-medium text-[14.5px]">{name}</dt>
                  <dd className="text-[14.5px] text-kura-fg-muted">{desc}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/agents"
              className="group mt-7 inline-flex items-center gap-1.5 rounded-lg py-1 text-[15px] text-kura-fg outline-none focus-visible:shadow-kura-focus"
            >
              Set up your agent
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>
          <AgentTerminal className="lg:h-full" />
        </div>
      </section>

      {/* Built right */}
      <section aria-labelledby="built" className="px-4 pt-36 md:px-6 md:pt-44">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead id="built" title="Built right.">
            The parts that usually get skipped are done for you, and checked in CI for every
            component.
          </SectionHead>
          <BuiltRight />
        </div>
      </section>

      <CtaBand install={install} />
    </div>
  );
}
