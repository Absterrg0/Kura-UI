import Link from "next/link";
import { catalog, components, componentsByCategory } from "@/lib/catalog";
import { DOCS_PAGES } from "@/lib/docs-pages";
import { summaryFor } from "@/lib/summaries";
import { CommandMenu } from "./command-menu";
import { Logo } from "./logo";
import { MobileNav, type NavGroup } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { siteButton } from "./site-button";
import { ThemeToggle } from "./theme-toggle";

/** The floating nav: a sheet on the page grid with logo, links, ⌘K, theme and one primary key. */
export function SiteHeader() {
  const items = components.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: summaryFor(c.slug, c.description),
    category: c.category,
    keywords: c.tags,
  }));
  const groups: NavGroup[] = [
    { title: "Getting started", items: DOCS_PAGES.map((p) => ({ href: p.href, label: p.label })) },
    ...componentsByCategory().map(({ category, items }) => ({
      title: category.title,
      items: items.map((c) => ({ href: `/components/${c.slug}`, label: c.title })),
    })),
  ];
  return (
    <header className="sticky top-0 z-40 px-2 pt-2 md:px-6 md:pt-3">
      <div className="sheet mx-auto flex h-14 max-w-[1180px] items-center gap-2 rounded-kura-xl pr-2 pl-4 md:gap-4 md:pr-3 md:pl-4">
        <Link
          href="/"
          aria-label="Kura UI home"
          className="rounded-lg outline-hidden focus-visible:shadow-kura-focus"
        >
          <Logo />
        </Link>
        <NavLinks />
        <div className="ml-auto flex items-center gap-1.5">
          <CommandMenu items={items} categories={catalog.categories} />
          <ThemeToggle className="hidden md:inline-flex" />
          <Link
            href="/docs"
            className={siteButton({ size: "sm", className: "hidden md:inline-flex" })}
          >
            Get started
          </Link>
          <MobileNav groups={groups} />
        </div>
      </div>
    </header>
  );
}
