import type * as React from "react";
import { Sidebar } from "./sidebar";

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1320px] gap-10 px-4 md:px-6">
      <Sidebar />
      <div className="min-w-0 flex-1 pt-10 pb-10">{children}</div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 pb-10">
      {eyebrow && <div className="font-medium text-[13px] text-kura-fg-subtle">{eyebrow}</div>}
      <h1 className="font-semibold text-[32px] leading-tight tracking-[-0.035em] md:text-[36px]">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-[16px] text-kura-fg-muted leading-relaxed">{description}</p>
      )}
      {children}
    </header>
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
    <section id={id} className="scroll-mt-20 pt-12">
      <h2 className="pb-4 font-semibold text-[20px] tracking-[-0.025em]">
        <a href={`#${id}`} className="outline-none hover:underline focus-visible:shadow-kura-focus">
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}
