import Link from "next/link";
import { catalog, components, GITHUB_URL } from "@/lib/catalog";
import { CommandMenu } from "./command-menu";
import { GithubIcon } from "./icons";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { SwashLink } from "./swash-link";
import { ThemeToggle } from "./theme-toggle";

/** A strip of paper mounted like a print, floating over the page. */
export function SiteHeader() {
  const items = components.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    category: c.category,
    keywords: [
      ...c.tags,
      ...c.whenToUse
        .join(" ")
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 4),
    ].slice(0, 40),
  }));
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
      <div className="print print-keyline mx-auto flex h-14 max-w-[1280px] items-center gap-4 rounded-[9px] pr-2.5 pl-4 md:gap-8 md:pl-5">
        <Link
          href="/"
          aria-label="Kura UI home"
          className="rounded-kura-sm outline-none focus-visible:shadow-kura-focus"
        >
          <Logo />
        </Link>
        <NavLinks />
        <div className="ml-auto flex flex-1 items-center justify-end gap-1 md:flex-none">
          <CommandMenu items={items} categories={catalog.categories} />
          <a
            href={GITHUB_URL}
            aria-label="GitHub"
            className="hidden size-8 items-center justify-center rounded-kura-md text-kura-fg-muted outline-none transition-colors hover:text-kura-accent-text focus-visible:shadow-kura-focus sm:inline-flex"
          >
            <GithubIcon className="size-[18px]" />
          </a>
          <ThemeToggle />
          <SwashLink href="/components" size="sm" className="ml-1 hidden md:inline-flex">
            Browse the store
          </SwashLink>
        </div>
      </div>
    </header>
  );
}
