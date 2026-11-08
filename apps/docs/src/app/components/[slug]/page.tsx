import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type * as React from "react";
import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/components/copy-button";
import { DocsShell, Section } from "@/components/docs-shell";
import { ExamplePreview } from "@/components/example-preview";
import { Seal } from "@/components/seal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { components, getComponent } from "@/lib/catalog";
import { CATEGORY_SEAL } from "@/lib/category-seal";

export const dynamicParams = false;

export function generateStaticParams() {
  return components.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getComponent(slug);
  if (!c) return {};
  return {
    title: c.title,
    description: c.description,
    alternates: { types: { "text/markdown": `/components/${slug}.md` } },
  };
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "warning";
}) {
  const tones = {
    neutral: "text-kura-fg-muted",
    accent: "text-kura-accent-text",
    warning: "text-kura-warning-text",
  };
  return (
    <span
      className={`rounded-[4px] px-1.5 py-0.5 font-kura-mono text-[10.5px] uppercase tracking-[0.12em] shadow-[inset_0_0_0_1px_currentColor] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComponent(slug);
  if (!c) notFound();

  const named = c.exports.filter(
    (e) =>
      /^[A-Z]/.test(e) &&
      !e.endsWith("Props") &&
      !/^[A-Z][A-Za-z]*(Variant|Size|Value|Input)$/.test(e),
  );
  const usage = `import { ${named.join(", ")} } from "${c.importPath}";`;
  const related = (c.related ?? []).map((r) => ({ slug: r, exists: !!getComponent(r) }));

  return (
    <DocsShell>
      <article data-testid="component-page" className="mx-auto max-w-4xl">
        <header className="relative flex flex-col gap-5 pb-12">
          <nav
            aria-label="Breadcrumb"
            className="font-kura-mono text-[11px] text-kura-fg-subtle uppercase tracking-[0.16em]"
          >
            <Link href="/components" className="hover:text-kura-fg">
              The store
            </Link>
            <span className="px-2">/</span>
            <span>{c.category}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-4 pr-20">
            <h1 className="font-kura-display text-[clamp(2.6rem,5vw,3.9rem)] leading-none tracking-[-0.02em]">
              {c.title}
            </h1>
            <Pill
              tone={
                c.status === "stable"
                  ? "accent"
                  : c.status === "experimental"
                    ? "warning"
                    : "neutral"
              }
            >
              {c.status}
            </Pill>
          </div>
          <span aria-hidden className="brush-rule w-40 text-kura-shu" />
          <p className="max-w-2xl font-kura-display text-[20px] text-kura-fg-muted italic leading-[1.5]">
            {c.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[13px] text-kura-fg-muted">
            <span className="inline-flex items-center gap-1 font-kura-mono text-[12px]">
              {c.importPath}
              <CopyButton value={usage} label="Copy import" />
            </span>
            <span className="inline-flex items-center gap-1">
              Copy page for agents
              <CopyButton fetchUrl={`/components/${c.slug}.md`} label="Copy markdown" />
            </span>
            <a
              href={`/components/${c.slug}.md`}
              className="font-kura-mono text-[12px] underline decoration-kura-border-strong underline-offset-4 hover:text-kura-fg hover:decoration-kura-accent"
            >
              .md
            </a>
            <a
              href={`/r/${c.slug}.json`}
              className="font-kura-mono text-[12px] underline decoration-kura-border-strong underline-offset-4 hover:text-kura-fg hover:decoration-kura-accent"
            >
              registry.json
            </a>
          </div>
          <Seal
            glyph={CATEGORY_SEAL[c.category] ?? "部"}
            tilt={5}
            className="absolute top-6 right-0 size-14"
          />
        </header>

        <div className="flex flex-col gap-12">
          {c.examples.map((ex, i) => (
            <section
              key={ex.name}
              aria-labelledby={`ex-${ex.name}`}
              className="flex flex-col gap-3"
            >
              {i > 0 && (
                <div className="flex flex-col gap-1">
                  <h2 id={`ex-${ex.name}`} className="font-kura-display text-[24px] leading-tight">
                    {ex.title}
                  </h2>
                  {ex.description && (
                    <p className="text-[14.5px] text-kura-fg-muted">{ex.description}</p>
                  )}
                </div>
              )}
              {i === 0 && (
                <h2 id={`ex-${ex.name}`} className="sr-only">
                  {ex.title}
                </h2>
              )}
              <Tabs defaultValue="preview" className="print overflow-hidden rounded-[9px]">
                <div className="flex items-center justify-between border-kura-border-subtle border-b bg-kura-surface px-2.5 py-1">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="code">Code</TabsTrigger>
                  </TabsList>
                  <span className="pr-1.5 font-kura-mono text-[10.5px] text-kura-fg-subtle uppercase tracking-[0.14em]">
                    {ex.kind}
                  </span>
                </div>
                <TabsContent value="preview" forceMount className="data-[state=inactive]:hidden">
                  <ExamplePreview slug={c.slug} name={ex.name} />
                </TabsContent>
                <TabsContent value="code" className="bg-kura-surface-sunken">
                  <CodeBlock code={ex.code} className="rounded-none shadow-none" />
                </TabsContent>
              </Tabs>
            </section>
          ))}
        </div>

        <Section id="installation" title="Installation">
          <Tabs defaultValue="shadcn" className="flex flex-col gap-3">
            <TabsList className="self-start">
              <TabsTrigger value="shadcn">shadcn</TabsTrigger>
              <TabsTrigger value="cli">Kura CLI</TabsTrigger>
              <TabsTrigger value="npm">npm</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            <TabsContent value="shadcn" className="flex flex-col gap-2">
              <CodeBlock lang="bash" code={c.install.shadcn} />
              <p className="text-kura-fg-subtle text-sm">
                Copies the source into{" "}
                <code className="font-kura-mono">components/kura/{c.slug}</code> with its
                dependencies ({c.registryDependencies.join(", ")}). Tokens come from the{" "}
                <code className="font-kura-mono">kura-theme</code> item.
              </p>
            </TabsContent>
            <TabsContent value="cli">
              <CodeBlock
                lang="bash"
                code={`${c.install.cli}\n# agents: add --json for machine-readable output`}
              />
            </TabsContent>
            <TabsContent value="npm" className="flex flex-col gap-2">
              <CodeBlock lang="bash" code={c.install.npm} />
              <CodeBlock
                lang="css"
                code={`/* app/globals.css */\n@import "tailwindcss";\n@import "@kura-ui/react/styles.css";`}
              />
              <CodeBlock code={usage} />
            </TabsContent>
            <TabsContent value="manual" className="flex flex-col gap-2">
              <p className="text-kura-fg-muted text-sm">
                Install npm dependencies
                {c.dependencies.npm.length
                  ? `: ${c.dependencies.npm.join(", ")}`
                  : " (none beyond React)"}
                , then copy these files.
              </p>
              {c.files.map((f) => (
                <CodeBlock key={f.target} code={f.content} title={f.target} />
              ))}
            </TabsContent>
          </Tabs>
        </Section>

        <Section id="usage-guidance" title="When to use it">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="pb-3 font-kura-mono text-[11px] text-kura-accent-text uppercase tracking-[0.14em]">
                Use it for
              </h3>
              <ul className="flex flex-col border-kura-border border-t">
                {c.whenToUse.map((w) => (
                  <li
                    key={w}
                    className="border-kura-border-subtle border-b py-3 text-[14.5px] leading-relaxed"
                  >
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="pb-3 font-kura-mono text-[11px] text-kura-fg-subtle uppercase tracking-[0.14em]">
                Reach for something else when
              </h3>
              <ul className="flex flex-col border-kura-border border-t">
                {c.whenNotToUse.map((w) => (
                  <li
                    key={w}
                    className="border-kura-border-subtle border-b py-3 text-[14.5px] text-kura-fg-muted leading-relaxed"
                  >
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="props" title="Props">
          {c.props.length ? (
            <div className="overflow-x-auto border-kura-border border-t">
              <table className="w-full text-left text-sm">
                <thead className="border-kura-border-subtle border-b font-kura-mono text-[10.5px] text-kura-fg-subtle uppercase tracking-[0.12em]">
                  <tr>
                    <th className="py-3 pr-4 font-normal">Prop</th>
                    <th className="px-4 py-3 font-normal">Type</th>
                    <th className="px-4 py-3 font-normal">Default</th>
                    <th className="px-4 py-3 font-normal">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {c.props.map((p) => (
                    <tr
                      key={p.name}
                      className="border-kura-border-subtle border-b align-top last:border-0"
                    >
                      <td className="whitespace-nowrap py-3.5 pr-4 font-kura-mono text-[13px]">
                        {p.name}
                        {p.required && (
                          <span className="text-kura-accent-text" title="required">
                            *
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-kura-mono text-[12px] text-kura-fg-muted">
                        {p.type}
                      </td>
                      <td className="px-4 py-3.5 font-kura-mono text-[12px] text-kura-fg-muted">
                        {p.default ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[14px] text-kura-fg-muted leading-relaxed">
                        {p.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-kura-fg-muted text-sm">
              No props beyond the root element&apos;s native attributes.
            </p>
          )}
          <p className="pt-3 text-kura-fg-subtle text-sm">
            All native attributes of the root element,{" "}
            <code className="font-kura-mono">className</code> and{" "}
            <code className="font-kura-mono">ref</code> pass through.
          </p>
        </Section>

        {!!c.parts?.length && (
          <Section id="anatomy" title="Anatomy">
            <ol className="flex flex-col divide-y divide-kura-border-subtle border-kura-border border-y">
              {c.parts.map((p) => (
                <li
                  key={p.name}
                  className="flex flex-col gap-1 py-3.5 text-[14px] md:flex-row md:items-baseline md:gap-4"
                >
                  <span className="w-48 shrink-0 font-kura-mono text-[13px]">{p.name}</span>
                  <span className="flex-1 text-kura-fg-muted">{p.description}</span>
                  {p.dataSlot && (
                    <code className="font-kura-mono text-kura-fg-subtle text-xs">
                      data-slot=&quot;{p.dataSlot}&quot;
                    </code>
                  )}
                </li>
              ))}
            </ol>
          </Section>
        )}

        <Section id="accessibility" title="Accessibility">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-kura-fg-muted text-sm leading-relaxed marker:text-kura-fg-subtle">
            {c.a11y.role && (
              <li>
                Role: <code className="font-kura-mono">{c.a11y.role}</code>
              </li>
            )}
            {c.a11y.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
            <li>
              <span className="text-kura-fg">Reduced motion:</span> {c.a11y.reducedMotion}
            </li>
          </ul>
          {!!c.a11y.keyboard?.length && (
            <table className="mt-4 w-full max-w-xl text-left text-sm">
              <thead className="text-kura-fg-subtle text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">Keys</th>
                  <th className="py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {c.a11y.keyboard.map((k) => (
                  <tr key={k.keys} className="border-kura-border-subtle border-t">
                    <td className="py-2 pr-4 font-kura-mono text-[13px]">{k.keys}</td>
                    <td className="py-2 text-kura-fg-muted">{k.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {!!c.agentNotes?.length && (
          <Section id="agents" title="Notes for agents">
            <ul className="print print-keyline flex flex-col gap-3 rounded-[9px] p-6 text-[14.5px] leading-relaxed [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:top-[0.6em] [&>li]:before:left-0 [&>li]:before:size-1.5 [&>li]:before:rounded-full [&>li]:before:bg-kura-shu">
              {c.agentNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Section>
        )}

        {related.length > 0 && (
          <Section id="related" title="Related">
            <div className="flex flex-wrap gap-2">
              {related.map((r) =>
                r.exists ? (
                  <Link
                    key={r.slug}
                    href={`/components/${r.slug}`}
                    className="rounded-[6px] bg-kura-surface px-3 py-1.5 font-kura-mono text-[12.5px] shadow-kura-xs hover:text-kura-accent-text"
                  >
                    {r.slug}
                  </Link>
                ) : (
                  <span
                    key={r.slug}
                    className="rounded-[6px] px-3 py-1.5 font-kura-mono text-[12.5px] text-kura-fg-subtle shadow-kura-xs"
                    title="Coming soon"
                  >
                    {r.slug}
                  </span>
                ),
              )}
            </div>
          </Section>
        )}
      </article>
    </DocsShell>
  );
}
