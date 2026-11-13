import { AgentSigil } from "@kura-ui/react/agent-sigil";
import { DotRail } from "@kura-ui/react/dot-rail";
import { StatusGlyph } from "@kura-ui/react/status-glyph";
import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { C, DocsShell, PageHeader, Section } from "@/components/docs-shell";
import { catalog } from "@/lib/catalog";

const STATES = [
  ["queued", "Queued"],
  ["running", "Running"],
  ["waiting", "Needs you"],
  ["done", "Done"],
  ["failed", "Failed"],
  ["skipped", "Skipped"],
  ["paused", "Paused"],
] as const;

const AGENTS = ["explorer", "test-writer", "reviewer", "migrator"];

const INKS = [
  ["canvas", "canvas"],
  ["sheet", "surface"],
  ["well", "surface-sunken"],
  ["ink", "fg"],
  ["ink-2", "fg-muted"],
  ["ink-3", "fg-subtle"],
  ["ember", "ember"],
  ["green", "success"],
  ["red", "danger"],
] as const;

export const metadata: Metadata = {
  title: "Getting started",
  description:
    "Install Kura UI with npm or the shadcn registry, set up the tokens and learn the design language.",
};

export default function DocsPage() {
  const t = catalog.tokens;
  return (
    <DocsShell>
      <div className="max-w-[46rem]">
        <PageHeader
          title="Introduction"
          description="Kura UI needs React 19 and Tailwind CSS v4. Take the npm package, or copy the source into your project with the shadcn CLI."
        />

        <Section id="npm" title="1a. Install from npm">
          <div className="flex flex-col gap-3">
            <CodeBlock lang="bash" code="npm install @kura-ui/react" />
            <CodeBlock
              lang="css"
              title="app/globals.css"
              code={`@import "tailwindcss";\n@import "@kura-ui/react/styles.css";`}
            />
            <CodeBlock
              code={`import { StatusGlyph } from "@kura-ui/react/status-glyph";\n\nexport function Status() {\n  return <StatusGlyph status="running" />;\n}`}
            />
            <p className="text-[15.5px] text-kura-fg-muted leading-relaxed">
              Each component is its own entry point (<C>@kura-ui/react/&lt;slug&gt;</C>),
              tree-shakeable, with <C>&quot;use client&quot;</C> only where needed. Hooks live at{" "}
              <C>@kura-ui/react/hooks</C>, utilities (<C>cn</C>, motion presets) at{" "}
              <C>@kura-ui/react/utils</C>.
            </p>
          </div>
        </Section>

        <Section id="shadcn" title="1b. Or copy the source (shadcn)">
          <CodeBlock
            lang="bash"
            code={`${catalog.install.shadcnTheme}\nnpx shadcn@latest add ${catalog.homepage}/r/status-glyph.json`}
          />
        </Section>

        <Section id="dark-mode" title="2. Dark mode">
          <p className="text-[15.5px] text-kura-fg-muted leading-relaxed">
            Tokens switch under a <C>.dark</C> class or <C>[data-theme=&quot;dark&quot;]</C> on any
            ancestor (works with next-themes). Components never use <C>dark:</C> variants.
          </p>
        </Section>

        <Section id="design" title="3. Design language">
          <p className="pb-6 text-[15.5px] text-kura-fg-muted leading-relaxed">
            Agents emit tokens, so everything measured or stateful is drawn in dots. Status is a dot
            glyph, every agent has a dot sigil for a face, and progress is a row of dots. Text is
            monochrome ink; ember appears only where a person is needed. Geist for words, Geist Mono
            for data. Full guide in{" "}
            <a
              className="underline underline-offset-4 hover:text-kura-fg"
              href="https://github.com/Absterrg0/Kura-UI/blob/main/DESIGN.md"
            >
              DESIGN.md
            </a>
            .
          </p>
          <ul className="grid grid-cols-4 gap-x-2 gap-y-5 pb-7 sm:grid-cols-7">
            {STATES.map(([status, label]) => (
              <li key={status} className="flex flex-col items-center gap-2.5">
                <StatusGlyph status={status} size="lg" label={null} />
                <span className="text-[12.5px] text-kura-fg-muted">{label}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-5 pb-7">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {AGENTS.map((name) => (
                <span key={name} className="flex items-center gap-2 text-[13px] text-kura-fg-muted">
                  <AgentSigil name={name} />
                  {name}
                </span>
              ))}
            </div>
            <DotRail value={0.62} live />
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2.5 pb-6">
            {INKS.map(([name, token]) => (
              <li
                key={name}
                className="flex items-center gap-2 font-kura-mono text-[12px] text-kura-fg-muted"
              >
                <span
                  aria-hidden
                  className="size-3 rounded-full shadow-[0_0_0_1px_var(--kura-border-strong)]"
                  style={{ background: `var(--kura-${token})` }}
                />
                {name}
              </li>
            ))}
          </ul>
          <CodeBlock
            lang="ts"
            title="Motion presets — @kura-ui/react/utils"
            code={`springs = ${JSON.stringify(t.motion.springs, null, 2)}\n\ndurations = ${JSON.stringify(t.motion.durations)}\neasings = ${JSON.stringify(t.motion.easings, null, 2)}`}
          />
        </Section>

        <p className="pt-12 text-[15px] text-kura-fg-muted">
          Next:{" "}
          <Link
            href="/docs/wiring-events"
            className="underline underline-offset-4 hover:text-kura-fg"
          >
            wire your agent&apos;s events to components
          </Link>
          ,{" "}
          <Link href="/docs/hooks" className="underline underline-offset-4 hover:text-kura-fg">
            the hooks
          </Link>{" "}
          or{" "}
          <Link href="/agents" className="underline underline-offset-4 hover:text-kura-fg">
            connect your agent
          </Link>
          .
        </p>
      </div>
    </DocsShell>
  );
}
