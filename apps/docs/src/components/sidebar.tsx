import type * as React from "react";
import { componentsByCategory } from "@/lib/catalog";
import { SidebarLink } from "./sidebar-link";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-2 font-kura-mono text-[10.5px] text-kura-fg-subtle uppercase tracking-[0.16em]">
      {children}
    </p>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-[84px] hidden h-[calc(100dvh-84px)] w-56 shrink-0 overflow-y-auto pt-12 pr-2 pb-10 [scrollbar-width:thin] lg:block">
      <nav className="flex flex-col gap-7 text-[14px]">
        <div className="flex flex-col gap-px">
          <Label>Start</Label>
          <SidebarLink href="/docs">Getting started</SidebarLink>
          <SidebarLink href="/agents">For agents</SidebarLink>
          <SidebarLink href="/components">The whole store</SidebarLink>
        </div>
        {componentsByCategory().map(({ category, items }) => (
          <div key={category.id} className="flex flex-col gap-px">
            <Label>{category.title}</Label>
            {items.map((c) => (
              <SidebarLink key={c.slug} href={`/components/${c.slug}`} status={c.status}>
                {c.title}
              </SidebarLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
