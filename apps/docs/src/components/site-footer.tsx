import Link from "next/link";
import { GITHUB_URL } from "@/lib/catalog";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[1280px] px-4 pt-24 pb-12 md:px-6">
      <span aria-hidden className="brush-rule text-kura-fg/70" />
      <div className="flex flex-col gap-8 pt-10 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-sm font-kura-display text-[17px] text-kura-fg-muted italic leading-snug">
            A storehouse of interfaces for working with machines. Open source, MIT.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-kura-fg-muted">
          <Link href="/docs" className="hover:text-kura-fg">
            Docs
          </Link>
          <Link href="/components" className="hover:text-kura-fg">
            Components
          </Link>
          <Link href="/agents" className="hover:text-kura-fg">
            For agents
          </Link>
          <a href="/llms.txt" className="hover:text-kura-fg">
            llms.txt
          </a>
          <a href="/registry/index.json" className="hover:text-kura-fg">
            Catalog
          </a>
          <a href={GITHUB_URL} className="hover:text-kura-fg">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
