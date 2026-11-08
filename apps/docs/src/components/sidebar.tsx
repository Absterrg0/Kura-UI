import type * as React from "react";
import { componentsByCategory } from "@/lib/catalog";
import { SidebarLink } from "./sidebar-link";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="px-2.5 pb-1 font-medium text-[12px] text-kura-fg-subtle">{children}</p>;
}

export function Sidebar() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 overflow-y-auto pt-10 pr-2 pb-10 [scrollbar-width:thin] lg:block">
      <nav className="flex flex-col gap-6 text-[13.5px]">
        <div className="flex flex-col gap-px">
          <Label>Getting started</Label>
          <SidebarLink href="/docs">Introduction</SidebarLink>
          <SidebarLink href="/agents">Agents</SidebarLink>
          <SidebarLink href="/components">All components</SidebarLink>
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
