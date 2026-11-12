import type * as React from "react";
import { componentsByCategory } from "@/lib/catalog";
import { DOCS_PAGES } from "@/lib/docs-pages";
import { SidebarLink } from "./sidebar-link";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1.5 font-medium text-[12.5px] text-kura-fg-subtle">{children}</p>;
}

export function Sidebar() {
  return (
    <aside className="sticky top-[76px] hidden h-[calc(100dvh-76px)] w-52 shrink-0 overflow-y-auto pt-12 pr-2 pb-10 [scrollbar-width:thin] md:pt-16 lg:block">
      <nav aria-label="Docs" className="flex flex-col gap-7 text-[14px]">
        <div className="flex flex-col gap-px">
          <Label>Getting started</Label>
          {DOCS_PAGES.map((p) => (
            <SidebarLink key={p.href} href={p.href}>
              {p.label}
            </SidebarLink>
          ))}
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
