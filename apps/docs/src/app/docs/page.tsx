import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocsShell, PageHeader, Section } from "@/components/docs-shell";
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
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Docs"
          title="Getting started"
          description="Kura UI needs React 19 and Tailwind CSS v4. Use the npm package, or copy the source with the shadcn CLI."
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
            <p className="text-kura-fg-muted text-sm">
              Each component is its own entry point (
              <code className="font-kura-mono">@kura-ui/react/&lt;slug&gt;</code>) — tree-shakeable,
              with
              <code className="font-kura-mono"> &quot;use client&quot;</code> only where needed.
              Hooks live at <code className="font-kura-mono">@kura-ui/react/hooks</code>, utilities
              (<code className="font-kura-mono">cn</code>, motion presets) at{" "}
              <code className="font-kura-mono">@kura-ui/react/utils</code>.
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
          <p className="text-kura-fg-muted text-sm leading-relaxed">
            Tokens switch under a <code className="font-kura-mono">.dark</code> class or{" "}
            <code className="font-kura-mono">[data-theme=&quot;dark&quot;]</code> on any ancestor
            (works with next-themes). Components never use{" "}
            <code className="font-kura-mono">dark:</code> variants.
          </p>
        </Section>

        <Section id="design" title="3. Design language: Kura Signal">
          <p className="pb-4 text-kura-fg-muted text-sm leading-relaxed">
            Everything is still until the model speaks. Warm paper-and-ink neutrals, one jade
            “signal” accent reserved for AI activity, hairline borders, layered shadows and short,
            interruptible motion. Full guide in{" "}
            <a
              className="underline"
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
                className="flex items-center gap-2 rounded-full bg-kura-surface py-1 pr-3 pl-1 text-xs shadow-kura-xs"
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

        <Section id="hooks" title="Hooks">
          <div className="flex flex-col gap-3">
            {catalog.hooks.map((h) => (
              <div key={h.name} className="rounded-kura-xl bg-kura-surface p-4 shadow-kura-sm">
                <h3 className="font-kura-mono text-sm">{h.name}</h3>
                <p className="pt-1 pb-3 text-kura-fg-muted text-sm">{h.description}</p>
                <CodeBlock
                  lang="ts"
                  code={`import { ${h.name} } from "${h.importPath}";\n\n${h.example}`}
                />
              </div>
            ))}
          </div>
        </Section>

        <p className="pt-6 text-kura-fg-muted text-sm">
          Next:{" "}
          <Link href="/components" className="underline">
            browse components
          </Link>{" "}
          or{" "}
          <Link href="/agents" className="underline">
            connect your agent
          </Link>
          .
        </p>
      </div>
    </DocsShell>
  );
}
