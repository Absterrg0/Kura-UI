import Link from "next/link";
import { catalog, components, GITHUB_URL } from "@/lib/catalog";
import { CommandMenu } from "./command-menu";
import { GithubIcon } from "./icons";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

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
    <header className="sticky top-0 z-40 border-kura-border-subtle border-b bg-kura-canvas/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-6 px-4 md:px-6">
        <Link
          href="/"
          aria-label="Kura UI home"
          className="rounded-kura-sm outline-none focus-visible:shadow-kura-focus"
        >
          <Logo />
        </Link>
        <NavLinks />
        <div className="ml-auto flex items-center gap-1.5">
          <CommandMenu items={items} categories={catalog.categories} />
          <a
            href={GITHUB_URL}
            aria-label="GitHub"
            className="inline-flex size-8 items-center justify-center rounded-kura-md text-kura-fg-muted outline-none transition-colors hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-kura-focus"
          >
            <GithubIcon className="size-4" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
