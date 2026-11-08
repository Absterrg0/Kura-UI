import type * as React from "react";
import type { Kanji } from "@/lib/kanji";
import { SectionHeading } from "./section-heading";
import { Sidebar } from "./sidebar";

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1280px] gap-12 px-5 md:px-8">
      <Sidebar />
      <div className="min-w-0 flex-1 pt-12 pb-10">{children}</div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  glyph,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  glyph?: Kanji;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-12">
      {eyebrow && (
        <div className="font-kura-mono text-[11px] text-kura-fg-subtle uppercase tracking-[0.16em]">
          {eyebrow}
        </div>
      )}
      <SectionHeading as="h1" glyph={glyph} title={title} lead={description} />
      {children}
    </div>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 pt-14">
      <h2 className="flex items-baseline gap-3 pb-5 font-kura-display text-[30px] leading-none tracking-[-0.015em]">
        <a
          href={`#${id}`}
          className="outline-none hover:text-kura-accent-text focus-visible:shadow-kura-focus"
        >
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}
