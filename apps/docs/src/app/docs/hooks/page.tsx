import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { C, DocsShell, PageHeader } from "@/components/docs-shell";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Hooks",
  description:
    "The shared hooks behind Kura UI components: controllable state, reduced motion, hotkeys, elapsed clocks and audio.",
};

export default function HooksPage() {
  return (
    <DocsShell>
      <div className="max-w-[46rem]">
        <PageHeader
          title="Hooks"
          description="The hooks Kura components are built on, exported for your own parts of the interface. Import them from @kura-ui/react/hooks, or add one with the shadcn CLI."
        />
        <nav aria-label="On this page" className="flex flex-wrap gap-2 pb-4">
          {catalog.hooks.map((h) => (
            <a
              key={h.name}
              href={`#${h.name}`}
              className="rounded-[10px] px-2.5 py-1 font-kura-mono text-[12.5px] text-kura-fg-muted shadow-[inset_0_0_0_1px_var(--kura-border)] outline-hidden hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-kura-focus"
            >
              {h.name}
            </a>
          ))}
        </nav>
        {catalog.hooks.map((h) => (
          <section
            key={h.name}
            id={h.name}
            className="scroll-mt-24 border-kura-border-subtle border-b py-12 last:border-0"
          >
            <h2 className="font-kura-mono font-medium text-[18px] tracking-[-0.01em]">
              <a
                href={`#${h.name}`}
                className="rounded-sm outline-hidden hover:underline hover:underline-offset-4 focus-visible:shadow-kura-focus"
              >
                {h.name}
              </a>
            </h2>
            <p className="pt-2 text-[15.5px] text-kura-fg-muted leading-relaxed">{h.description}</p>
            <dl className="mt-5 grid gap-x-6 gap-y-3 text-[14.5px] sm:grid-cols-[6rem_1fr]">
              <dt className="text-kura-fg-subtle">Signature</dt>
              <dd className="min-w-0 break-words font-kura-mono text-[13px] leading-relaxed">
                {h.signature}
              </dd>
              <dt className="text-kura-fg-subtle">Returns</dt>
              <dd className="text-kura-fg-muted leading-relaxed">{h.returns}</dd>
              {!!h.notes?.length && (
                <>
                  <dt className="text-kura-fg-subtle">Notes</dt>
                  <dd className="text-kura-fg-muted leading-relaxed">{h.notes.join(" ")}</dd>
                </>
              )}
              <dt className="text-kura-fg-subtle">Install</dt>
              <dd className="min-w-0 break-all font-kura-mono text-[13px] text-kura-fg-muted">
                <C>npx shadcn@latest add {h.registryUrl}</C>
              </dd>
            </dl>
            <CodeBlock
              lang="tsx"
              className="mt-6"
              code={`import { ${h.name} } from "${h.importPath}";\n\n${h.example}`}
            />
          </section>
        ))}
      </div>
    </DocsShell>
  );
}
