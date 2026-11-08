import { componentsByCategory } from "@/lib/catalog";
import { SidebarLink } from "./sidebar-link";

export function Sidebar() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 pr-4 lg:block">
      <nav className="flex flex-col gap-6 text-sm">
        <div className="flex flex-col gap-0.5">
          <p className="px-2.5 pb-1.5 font-medium text-kura-fg-subtle text-xs">Start</p>
          <SidebarLink href="/docs">Getting started</SidebarLink>
          <SidebarLink href="/agents">Agents</SidebarLink>
          <SidebarLink href="/components">All components</SidebarLink>
        </div>
        {componentsByCategory().map(({ category, items }) => (
          <div key={category.id} className="flex flex-col gap-0.5">
            <p className="px-2.5 pb-1.5 font-medium text-kura-fg-subtle text-xs">
              {category.title}
            </p>
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
