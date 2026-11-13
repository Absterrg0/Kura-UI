import type * as React from "react";
import { cn } from "@/lib/cn";
import { Sidebar } from "./sidebar";

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 md:px-6">
      <div className="mx-auto flex max-w-[1180px] gap-12">
        <Sidebar />
        <div className="min-w-0 flex-1 pt-12 pb-28 md:pt-16">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 pb-4", className)}>
      <h1 className="font-semibold text-[34px] leading-[1.08] tracking-[-0.03em] md:text-[40px]">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-[17px] text-kura-fg-muted leading-relaxed text-pretty">
          {description}
        </p>
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
    <section id={id} className="scroll-mt-24 pt-14">
      <h2 className="pb-4 font-semibold text-[22px] tracking-[-0.02em]">
        <a
          href={`#${id}`}
          className="rounded-sm outline-hidden hover:underline hover:decoration-kura-border-strong hover:underline-offset-4 focus-visible:shadow-kura-focus"
        >
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}

/**
 * Inline code in prose. A name stays in one piece (`@kura-ui/react` never splits at its hyphen);
 * pass `wrap` for something long enough to need a second line, like a whole command.
 */
export function C({ children, wrap = false }: { children: React.ReactNode; wrap?: boolean }) {
  return (
    <code
      className={cn(
        "rounded-[5px] bg-kura-hover px-1 py-px font-kura-mono text-[0.88em] text-kura-fg",
        wrap ? "[overflow-wrap:anywhere]" : "whitespace-nowrap",
      )}
    >
      {children}
    </code>
  );
}

/** Manifest prose with `backtick` spans rendered as inline code. */
export function Prose({ children }: { children: string }) {
  const parts = children.split(/`([^`]+)`/);
  return <>{parts.map((part, i) => (i % 2 ? <C key={`${i}-${part}`}>{part}</C> : part))}</>;
}
