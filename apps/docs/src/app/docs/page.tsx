import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { C, DocsShell, PageHeader, Section } from "@/components/docs-shell";
import { catalog } from "@/lib/catalog";

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
              code={`import { ShimmerText } from "@kura-ui/react/shimmer-text";\n\nexport function Status() {\n  return <ShimmerText>Thinking…</ShimmerText>;\n}`}
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
            code={`${catalog.install.shadcnTheme}\nnpx shadcn@latest add ${catalog.homepage}/r/shimmer-text.json`}
          />
        </Section>

        <Section id="dark-mode" title="2. Dark mode">
          <p className="text-[15.5px] text-kura-fg-muted leading-relaxed">
            Tokens switch under a <C>.dark</C> class or <C>[data-theme=&quot;dark&quot;]</C> on any
            ancestor (works with next-themes). Components never use <C>dark:</C> variants.
          </p>
        </Section>

        <Section id="design" title="3. Design language">
          <p className="pb-4 text-[15.5px] text-kura-fg-muted leading-relaxed">
            Everything is still until the model speaks. Neutral greys, hairline borders and one blue
            signal colour reserved for AI activity: streaming, listening, running, waiting on you.
            Geist for text, Geist Mono for data, and short, interruptible motion. Full guide in{" "}
            <a
              className="underline underline-offset-4 hover:text-kura-fg"
              href="https://github.com/Absterrg0/Kura-UI/blob/main/DESIGN.md"
            >
              DESIGN.md
            </a>
            .
          </p>
          <div className="grid grid-cols-6 gap-1.5 pb-4 sm:grid-cols-12" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div
                  className="h-10 rounded-kura-sm shadow-kura-xs"
                  style={{ background: `var(--kura-gray-${i + 1})` }}
                />
                <span className="text-center font-kura-mono text-kura-fg-subtle text-[10px]">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pb-4">
            {["accent", "accent-subtle", "ink", "danger", "success", "warning"].map((n) => (
              <div
                key={n}
                className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 font-kura-mono text-[12px] text-kura-fg-muted shadow-[inset_0_0_0_1px_var(--kura-border)]"
              >
                <span
                  className="size-5 rounded-full shadow-kura-xs"
                  style={{ background: `var(--kura-${n})` }}
                />
                {n}
              </div>
            ))}
          </div>
          <CodeBlock
            lang="ts"
            title="Motion presets — @kura-ui/react/utils"
            code={`springs = ${JSON.stringify(t.motion.springs, null, 2)}\n\ndurations = ${JSON.stringify(t.motion.durations)}\neasings   = ${JSON.stringify(t.motion.easings)}`}
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
