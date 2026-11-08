import type * as React from "react";
import { Sidebar } from "./sidebar";

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1400px] gap-10 px-4 md:px-6">
      <Sidebar />
      <div className="min-w-0 flex-1 py-10">{children}</div>
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
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 pb-8">
      {eyebrow && <div className="text-kura-fg-subtle text-sm">{eyebrow}</div>}
      <h1 className="font-medium text-3xl tracking-tight md:text-4xl">{title}</h1>
      {description && (
        <p className="max-w-2xl text-kura-fg-muted text-lg leading-relaxed">{description}</p>
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
    <section id={id} className="scroll-mt-20 py-6">
      <h2 className="pb-4 font-medium text-xl tracking-tight">
        <a href={`#${id}`} className="outline-none hover:underline focus-visible:shadow-kura-focus">
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}
