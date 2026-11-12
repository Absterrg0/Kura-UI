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

/** The floating pill nav: logo, links, ⌘K, theme and one primary action. Sticky on every page. */
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
    <header className="sticky top-0 z-40 bg-[linear-gradient(to_bottom,var(--kura-canvas)_30%,transparent)] px-2 pt-2 pb-1 md:px-4 md:pt-3">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-2 rounded-2xl bg-(--site-chrome) pr-2 pl-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_0_0_1px_var(--kura-border),0_8px_32px_-12px_rgb(0_0_0/0.35)] backdrop-blur-xl backdrop-saturate-150 md:gap-4 md:pr-2.5 md:pl-5">
        <Link
          href="/"
          aria-label="Kura UI home"
          className="rounded-lg outline-none focus-visible:shadow-kura-focus"
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
