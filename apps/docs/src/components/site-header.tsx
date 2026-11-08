import Link from "next/link";
import { catalog, components, GITHUB_URL } from "@/lib/catalog";
import { CommandMenu } from "./command-menu";
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
    <header className="sticky top-0 z-40 border-kura-border-subtle border-b bg-kura-canvas/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4 md:px-6">
        <Link href="/" className="rounded-kura-sm outline-none focus-visible:shadow-kura-focus">
          <Logo />
        </Link>
        <NavLinks />
        <div className="ml-auto flex flex-1 items-center justify-end gap-1.5 md:flex-none">
          <CommandMenu items={items} categories={catalog.categories} />
          <a
            href={GITHUB_URL}
            className="hidden h-8 items-center rounded-kura-md px-2 text-kura-fg-muted text-sm hover:bg-kura-hover hover:text-kura-fg sm:inline-flex"
          >
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
