import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { ComponentCard } from "@/components/component-card";
import { CopyButton } from "@/components/copy-button";
import { HeroProof } from "@/components/hero-proof";
import { SectionHeading } from "@/components/section-heading";
import { SwashLink } from "@/components/swash-link";
import { catalog, components } from "@/lib/catalog";

/** Hand-picked for the home shelf: the parts that read best at card size. */
const FEATURED = [
  "composer",
  "agent-orb",
  "tool-call",
  "artifact-card",
  "approval-prompt",
  "audio-waveform",
];

const AGENT_LEDGER = [
  {
    n: "01",
    title: "A manifest per part",
    body: "When to use it, when not to, every prop with its JSON Schema, the anatomy, keyboard map and examples. Checked against the TypeScript source on every commit.",
  },
  {
    n: "02",
    title: "An MCP server",
    body: "search_components, get_component, get_install_instructions, get_design_tokens. Your agent asks; Kura answers with exactly what to install.",
  },
  {
    n: "03",
    title: "llms.txt and markdown",
    body: "Every page has a plain-text twin. llms-full.txt carries the whole store in one fetch.",
  },
  {
    n: "04",
    title: "A CLI that speaks JSON",
    body: "kura search, kura add, kura doctor. Copies the source and its dependencies into your project, shadcn-compatible.",
  },
];

export default function Home() {
  const shelf = FEATURED.flatMap((slug) => components.find((c) => c.slug === slug) ?? []);
  const install = `npx shadcn@latest add ${catalog.homepage}/r/composer.json`;
  return (
    <div className="relative overflow-x-clip">
      {/* Halftone in the top margin, like the edge of a printed sheet. */}
      <div aria-hidden className="halftone pointer-events-none absolute -top-24 left-0 h-80 w-80" />

      <section className="mx-auto grid max-w-[1280px] items-center gap-16 px-5 pt-16 pb-24 md:px-8 lg:grid-cols-[1.08fr_1fr] lg:gap-20 lg:pt-24">
        <div className="flex min-w-0 flex-col">
          <p className="font-kura-mono text-[11px] text-kura-fg-subtle uppercase tracking-[0.16em]">
            Kura, a storehouse · {components.length} parts · MIT
          </p>
          <h1 className="pt-6 font-kura-display text-[clamp(2.6rem,4.9vw,4.4rem)] leading-[0.98] tracking-[-0.025em] text-balance">
            <span className="block">Your agent builds the app.</span>
            <span className="block text-kura-fg-muted">Kura hands it the parts.</span>
          </h1>
          <span aria-hidden className="brush-rule mt-7 w-60 text-kura-fg" />
          <p className="max-w-[34rem] pt-7 text-[18px] text-kura-fg-muted leading-[1.65] text-pretty">
            <strong className="font-medium text-kura-fg">
              Composers, voice, reasoning, tool calls, approvals.
            </strong>{" "}
            The interfaces every AI product needs, made with care, and written so a coding agent can
            find, read and install them on its own.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-9">
            <SwashLink href="/components" tone="shu">
              Browse the store
            </SwashLink>
            <Link
              href="/agents"
              className="group inline-flex items-center gap-1.5 text-[15px] text-kura-fg underline decoration-kura-border-strong underline-offset-[5px] hover:decoration-kura-accent"
            >
              Connect your agent
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="relative mt-10 max-w-[34rem] pb-2.5">
            <div className="flex items-center gap-3 font-kura-mono text-[12.5px] text-kura-fg-muted">
              <span className="text-kura-accent-text">$</span>
              <span className="truncate">{install}</span>
              <CopyButton value={install} label="Copy install command" className="ml-auto" />
            </div>
            <span
              aria-hidden
              className="brush-rule absolute right-0 bottom-0 left-0 h-[5px] text-kura-fg/55"
            />
          </div>
        </div>

        <HeroProof className="mx-auto w-full max-w-[520px] lg:mr-0" />
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-20 md:px-8">
        <SectionHeading
          glyph="部"
          title={
            <>
              Thirty-odd parts.
              <br />
              Each one made properly.
            </>
          }
          lead="Live, not screenshots. Keyboard-complete, calm under reduced motion, honest in light and dark, and every one reads its own manifest."
        />
        <div className="grid grid-cols-1 gap-6 pt-12 sm:grid-cols-2 lg:grid-cols-3">
          {shelf.map((c) => (
            <ComponentCard key={c.slug} component={c} />
          ))}
        </div>
        <div className="flex justify-center pt-12">
          <Link
            href="/components"
            className="group inline-flex items-center gap-1.5 font-kura-display text-[21px] italic underline decoration-2 decoration-kura-accent underline-offset-[6px]"
          >
            Walk the whole store
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-20 md:px-8">
        <SectionHeading
          glyph="働"
          title={
            <>
              Written for the agent
              <br />
              that installs it.
            </>
          }
          lead="Every part ships a typed manifest. The docs, the shadcn registry, llms.txt, the MCP server and the CLI are all generated from it, so they never disagree."
        />
        <div className="grid gap-14 pt-14 lg:grid-cols-[1fr_1fr]">
          <ol className="flex flex-col">
            {AGENT_LEDGER.map((item) => (
              <li
                key={item.n}
                className="grid grid-cols-[3rem_1fr] gap-x-4 border-kura-border border-t py-6 last:border-b"
              >
                <span className="pt-1 font-kura-mono text-[12px] text-kura-accent-text">
                  {item.n}
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-kura-display text-[24px] leading-tight">{item.title}</h3>
                  <p className="text-[15.5px] text-kura-fg-muted leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-col justify-center gap-4">
            <div className="print print-keyline rounded-[10px] p-3">
              <CodeBlock
                lang="bash"
                className="bg-transparent shadow-none"
                code={`# give your agent the store\nclaude mcp add kura -- npx -y @kura-ui/mcp\n\n# then just ask it\n> add a "thinking" trace above the answer while the model streams`}
              />
            </div>
            <p className="px-1 font-kura-display text-[17px] text-kura-fg-muted italic">
              It searches the catalog, reads the manifest, and installs the part with its
              dependencies and tokens.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
