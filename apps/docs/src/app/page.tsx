import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { CtaLink } from "@/components/cta-link";
import { AgentDemo } from "@/components/landing/agent-demo";
import { AgentTerminal } from "@/components/landing/agent-terminal";
import { BuiltRight } from "@/components/landing/built-right";
import { CtaBand } from "@/components/landing/cta-band";
import { EmberLight } from "@/components/landing/ember-light";
import { FeatureBento } from "@/components/landing/feature-bento";
import { HeroField } from "@/components/landing/hero-field";
import { HeroStage } from "@/components/landing/hero-stage";
import { InstallChip } from "@/components/landing/install-chip";
import { Stagger, StaggerItem } from "@/components/motion";
import { catalog, components } from "@/lib/catalog";

// The four things generated from each component's manifest (the paragraph above them and the
// transcript beside them say what a manifest holds).
const AGENT_SURFACES = [
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
        className="relative px-4 pt-14 md:px-6 md:pt-20 lg:pt-24"
      >
        {/* Reaches up under the glass nav, so the nav has something to frost. */}
        <HeroField anchorId="hero-title" className="-top-[84px] h-[760px]" />
        <Stagger
          onLoad
          gap={0.08}
          className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <StaggerItem>
            <h1
              id="hero-title"
              className="font-semibold text-[42px] leading-[1.02] tracking-[-0.035em] text-balance sm:text-[56px] lg:text-[72px]"
            >
              Components for agent interfaces.
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="max-w-[40rem] pt-6 text-[16px] sm:text-[17px] text-kura-fg-muted leading-relaxed text-pretty md:text-[18px]">
              Open-source React components for agent runs, plans, terminals, diffs and approvals.
              Copy them into your app, or let your coding agent install them.
            </p>
          </StaggerItem>
          <StaggerItem className="pt-9">
            <CtaLink href="/components" meta={components.length}>
              Browse components
            </CtaLink>
          </StaggerItem>
          <StaggerItem className="max-w-full pt-5">
            <InstallChip command={install} />
          </StaggerItem>
        </Stagger>

        <div className="relative isolate mx-auto mt-20 max-w-[1180px] md:mt-24">
          {/* The ember rises with the stage, never ahead of it. */}
          <HeroStage backdrop={<EmberLight className="-top-[150px] -z-10" />} />
        </div>
      </section>

      {/* Every part of the run */}
      <section aria-labelledby="parts" className="px-4 pt-36 md:px-6 md:pt-44">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead id="parts" title="Every part of the run.">
            The parts around the stage above: the conversation, the files it touched, each tool
            call, the browser, what is queued and where you can roll back to. All live, all driven
            by plain props.
          </SectionHead>
          <FeatureBento />
          <div className="flex justify-center pt-10">
            <Link
              href="/components"
              className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[15px] text-kura-fg-muted outline-hidden transition-colors hover:text-kura-fg focus-visible:shadow-kura-focus"
            >
              See all components
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>
        </div>
      </section>

      {/* Your agent can use it */}
      <section aria-labelledby="use" className="px-4 pt-36 md:px-6 md:pt-44">
        <div className="mx-auto max-w-[1180px]">
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
        <div className="mx-auto grid max-w-[1180px] items-start gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-16">
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
            <dl className="mt-9 flex flex-col">
              {AGENT_SURFACES.map(([name, desc]) => (
                <div
                  key={name}
                  className="relative grid gap-1 pt-[19px] pb-3.5 before:absolute before:inset-x-0 before:top-0 before:h-[5px] before:kura-leader sm:grid-cols-[8.5rem_1fr] sm:gap-4"
                >
                  <dt className="font-medium text-[14.5px]">{name}</dt>
                  <dd className="text-[14.5px] text-kura-fg-muted">{desc}</dd>
                </div>
              ))}
            </dl>
            <span aria-hidden className="kura-leader block h-[5px]" />
            <Link
              href="/agents"
              className="group mt-7 inline-flex items-center gap-1.5 rounded-lg py-1 text-[15px] text-kura-fg outline-hidden focus-visible:shadow-kura-focus"
            >
              Set up your agent
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>
          {/* Beside the list the terminal takes its height, so the two columns end level. */}
          <AgentTerminal className="lg:h-full" />
        </div>
      </section>

      {/* Built right */}
      <section aria-labelledby="built" className="px-4 pt-36 md:px-6 md:pt-44">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead id="built" title="Built right.">
            The parts that usually get skipped are done for you, and checked in CI for every
            component.
          </SectionHead>
          <BuiltRight />
        </div>
      </section>

      <CtaBand install={install} count={components.length} />
    </div>
  );
}
