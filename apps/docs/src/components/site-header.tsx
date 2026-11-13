import Link from "next/link";
import { catalog, components, componentsByCategory, GITHUB_URL } from "@/lib/catalog";
import { DOCS_PAGES } from "@/lib/docs-pages";
import { summaryFor } from "@/lib/summaries";
import { CommandMenu } from "./command-menu";
import { CtaLink } from "./cta-link";
import { GithubIcon } from "./icons";
import { Logo } from "./logo";
import { MobileNav, type NavGroup } from "./mobile-nav";
import { NavLinks } from "./nav-links";
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
      <div className="glass mx-auto flex h-14 max-w-[1180px] items-center gap-2 rounded-kura-xl pr-2 pl-3 md:gap-3 md:pr-2.5 md:pl-3.5">
        <Link
          href="/"
          aria-label="Kura UI home"
          className="flex items-center rounded-lg px-1 py-1 outline-hidden focus-visible:shadow-kura-focus"
        >
          <Logo />
        </Link>
        <NavLinks />
        <div className="ml-auto flex items-center gap-1">
          <CommandMenu items={items} categories={catalog.categories} />
          <a
            href={GITHUB_URL}
            aria-label="Kura UI on GitHub"
            className="hidden size-8 items-center justify-center rounded-lg text-kura-fg-muted outline-hidden transition-colors duration-150 hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-kura-focus md:inline-flex"
          >
            <GithubIcon className="size-4" />
          </a>
          <ThemeToggle className="hidden md:inline-flex" />
          <span aria-hidden className="mx-1.5 hidden h-4 w-px bg-kura-border-strong md:block" />
          <CtaLink href="/docs" size="sm" className="hidden md:inline-flex">
            Get started
          </CtaLink>
          <MobileNav groups={groups} />
        </div>
      </div>
    </header>
  );
}
