import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/components/copy-button";
import { C, DocsShell, Prose, Section } from "@/components/docs-shell";
import { ExamplePreview } from "@/components/example-preview";
import { InstallChip } from "@/components/landing/install-chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { components, getComponent } from "@/lib/catalog";

/** "Mod+Enter", "J / K", "Enter / Space" → keycaps, alternatives separated by a slash. */
function Keys({ value }: { value: string }) {
  // A slash inside brackets, as in "ArrowDown (j / k)", stays with its key.
  const alternatives = value.split(/\s+\/\s+(?![^(]*\))/);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {alternatives.map((alternative, i) => {
        const [, combo = alternative, note] = /^(.*?)\s*(\([^)]*\))?$/.exec(alternative) ?? [];
        // "Space, then arrows, then Space" is a sentence, not a key: it is set as words.
        const phrase = combo.includes(",") || combo.trim().split(/\s+/).length > 2;
        return (
          <span key={alternative} className="inline-flex flex-wrap items-center gap-1.5">
            {i > 0 && <span className="text-[12px] text-kura-fg-subtle">or</span>}
            {phrase ? (
              <span className="text-[13px] text-kura-fg-muted">{combo}</span>
            ) : (
              <span className="inline-flex items-center gap-[3px]">
                {combo.split("+").map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-[20px] min-w-[20px] items-center justify-center whitespace-nowrap rounded-[5px] bg-kura-surface px-1.5 font-kura-sans font-medium text-[11px] text-kura-fg-muted shadow-kura-key"
                  >
                    {key.trim()}
                  </kbd>
                ))}
              </span>
            )}
            {note && <span className="text-[12px] text-kura-fg-subtle">{note}</span>}
          </span>
        );
      })}
    </span>
  );
}

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

const link =
  "rounded-md px-2 py-1 text-kura-fg-muted outline-hidden transition-colors hover:text-kura-fg focus-visible:shadow-kura-focus";

const quiet =
  "inline-flex h-9 items-center gap-1.5 rounded-kura-lg px-3 text-[13px] text-kura-fg-muted";

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
    <DocsShell toc={false}>
      <article data-testid="component-page" className="max-w-[56rem]">
        <header className="flex flex-col gap-4 pb-10">
          <div className="flex items-center justify-between gap-4">
            <nav aria-label="Breadcrumb" className="text-[13.5px] text-kura-fg-subtle">
              <Link
                href="/components"
                className="rounded-sm outline-hidden hover:text-kura-fg focus-visible:shadow-kura-focus"
              >
                Components
              </Link>
              <span aria-hidden className="px-1.5">
                /
              </span>
              <span className="capitalize">{c.category}</span>
            </nav>
            <span className="-mr-2 flex items-center text-[13.5px]">
              <a href={`/components/${c.slug}.md`} className={link}>
                Markdown
              </a>
              <a href={`/r/${c.slug}.json`} className={link}>
                JSON
              </a>
            </span>
          </div>
          <h1 className="font-semibold text-[34px] leading-[1.08] tracking-[-0.03em] md:text-[40px]">
            {c.title}
          </h1>
          <p className="max-w-2xl text-[17px] text-kura-fg-muted leading-relaxed text-pretty">
            <Prose>{c.description}</Prose>
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 pt-2">
            <InstallChip command={c.install.shadcn} />
            <span className={`${quiet} pr-1`}>
              Copy for agents
              <CopyButton fetchUrl={`/components/${c.slug}.md`} label="Copy markdown" />
            </span>
          </div>
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
                  <h2 id={`ex-${ex.name}`} className="font-semibold text-[18px] tracking-[-0.02em]">
                    {ex.title}
                  </h2>
                  {ex.description && (
                    <p className="text-[15px] text-kura-fg-muted">
                      <Prose>{ex.description}</Prose>
                    </p>
                  )}
                </div>
              )}
              {i === 0 && (
                <h2 id={`ex-${ex.name}`} className="sr-only">
                  {ex.title}
                </h2>
              )}
              {/* The stage is the page with one hairline round it: the component is the only box. */}
              <Tabs
                defaultValue="preview"
                className="overflow-hidden rounded-kura-xl shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]"
              >
                <div className="flex items-center justify-between px-2.5 pt-2.5">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="code">Code</TabsTrigger>
                  </TabsList>
                  <span className="pr-2 text-[12.5px] text-kura-fg-subtle capitalize">
                    {ex.kind}
                  </span>
                </div>
                <TabsContent value="preview" forceMount className="data-[state=inactive]:hidden">
                  {/* An example with its own Replay key does not get the stage's as well. */}
                  <ExamplePreview
                    slug={c.slug}
                    name={ex.name}
                    replay={!/\bReplay\b/.test(ex.code)}
                  />
                </TabsContent>
                <TabsContent value="code" className="p-2.5">
                  <CodeBlock code={ex.code} />
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
              <p className="text-[14px] text-kura-fg-muted leading-relaxed">
                Copies the source into <C>components/kura/{c.slug}</C> with its dependencies (
                {c.registryDependencies.join(", ")}). Tokens come from the <C>kura-theme</C> item.
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
              <h3 className="pb-2 font-medium text-[14.5px]">Use it for</h3>
              <ul className="flex flex-col border-kura-border border-t">
                {c.whenToUse.map((w) => (
                  <li
                    key={w}
                    className="border-kura-border-subtle border-b py-3 text-[14.5px] leading-relaxed"
                  >
                    <Prose>{w}</Prose>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="pb-2 font-medium text-[14.5px]">Reach for something else when</h3>
              <ul className="flex flex-col border-kura-border border-t">
                {c.whenNotToUse.map((w) => (
                  <li
                    key={w}
                    className="border-kura-border-subtle border-b py-3 text-[14.5px] text-kura-fg-muted leading-relaxed"
                  >
                    <Prose>{w}</Prose>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="props" title="Props">
          {c.props.length ? (
            // A real table on wide screens; on a phone each row stacks into its own block.
            <table className="block w-full border-kura-border border-t text-left md:table">
              <thead className="hidden text-[12.5px] text-kura-fg-subtle md:table-header-group">
                <tr className="border-kura-border-subtle border-b">
                  <th className="py-3 pr-4 font-normal">Prop</th>
                  <th className="px-4 py-3 font-normal">Type</th>
                  <th className="px-4 py-3 font-normal">Default</th>
                  <th className="py-3 pl-4 font-normal">Description</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group">
                {c.props.map((p) => (
                  <tr
                    key={p.name}
                    className="flex flex-col gap-1.5 border-kura-border-subtle border-b py-3.5 align-top last:border-0 md:table-row md:py-0"
                  >
                    <td className="font-kura-mono text-[13px] max-md:[overflow-wrap:anywhere] md:w-[13rem] md:whitespace-nowrap md:py-3.5 md:pr-4">
                      {p.name}
                      {p.required && (
                        <span className="text-kura-fg-subtle" title="required">
                          *
                        </span>
                      )}
                    </td>
                    <td className="font-kura-mono text-[12px] text-kura-fg-muted max-md:[overflow-wrap:anywhere] md:w-[12rem] md:px-4 md:py-3.5">
                      {p.type}
                    </td>
                    <td
                      className={
                        p.default
                          ? "font-kura-mono text-[12px] text-kura-fg-muted max-md:[overflow-wrap:anywhere] md:w-[6.5rem] md:px-4 md:py-3.5"
                          : "font-kura-mono text-[12px] text-kura-fg-muted max-md:hidden md:w-[6.5rem] md:px-4 md:py-3.5"
                      }
                    >
                      {p.default && (
                        <span className="font-kura-sans text-kura-fg-subtle md:hidden">
                          Default{" "}
                        </span>
                      )}
                      {p.default ?? "—"}
                    </td>
                    <td className="min-w-0 text-[14px] text-kura-fg-muted leading-relaxed [overflow-wrap:anywhere] md:py-3.5 md:pl-4">
                      <Prose>{p.description}</Prose>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-kura-fg-muted text-sm">
              No props beyond the root element&apos;s native attributes.
            </p>
          )}
          <p className="pt-3 text-kura-fg-subtle text-sm">
            All native attributes of the root element, <C>className</C> and <C>ref</C> pass through.
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
                  <span className="flex w-56 shrink-0 flex-col gap-0.5 font-kura-mono text-[13px]">
                    {p.name}
                    {p.dataSlot && (
                      <code className="text-[11.5px] text-kura-fg-subtle [overflow-wrap:anywhere]">
                        {p.dataSlot}
                      </code>
                    )}
                  </span>
                  <span className="flex-1 text-kura-fg-muted">
                    <Prose>{p.description}</Prose>
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        <Section id="accessibility" title="Accessibility">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-kura-fg-muted text-sm leading-relaxed [overflow-wrap:anywhere] marker:text-kura-fg-subtle">
            {c.a11y.role && (
              <li>
                Role: <C>{c.a11y.role}</C>
              </li>
            )}
            {c.a11y.notes.map((n) => (
              <li key={n}>
                <Prose>{n}</Prose>
              </li>
            ))}
            <li>
              <span className="text-kura-fg">Reduced motion:</span>{" "}
              <Prose>{c.a11y.reducedMotion}</Prose>
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
                    <td className="py-2 pr-4">
                      <Keys value={k.keys} />
                    </td>
                    <td className="py-2 text-kura-fg-muted">
                      <Prose>{k.action}</Prose>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {!!c.agentNotes?.length && (
          <Section id="agents" title="Notes for agents">
            <ul className="sheet flex list-disc flex-col gap-2 rounded-kura-xl bg-kura-surface p-5 pl-9 text-[14.5px] leading-relaxed [overflow-wrap:anywhere] marker:text-kura-fg-subtle">
              {c.agentNotes.map((n) => (
                <li key={n}>
                  <Prose>{n}</Prose>
                </li>
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
                    className="inline-flex h-8 items-center rounded-[9px] bg-kura-raised px-[11px] font-kura-mono text-[12.5px] text-kura-fg shadow-kura-raised outline-hidden transition-colors duration-150 hover:bg-kura-raised-hover focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring active:translate-y-px motion-reduce:transition-none"
                  >
                    {r.slug}
                  </Link>
                ) : (
                  <span
                    key={r.slug}
                    className="inline-flex h-8 items-center px-1 font-kura-mono text-[12.5px] text-kura-fg-subtle"
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
