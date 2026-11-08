import Link from "next/link";
import { GITHUB_URL } from "@/lib/catalog";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-kura-border-subtle border-t">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-10 text-kura-fg-muted text-sm md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <Logo className="text-kura-fg" />
          <span className="text-kura-fg-subtle">
            MIT · Built for humans and the agents that work with them.
          </span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/llms.txt" className="hover:text-kura-fg">
            llms.txt
          </Link>
          <Link href="/registry/index.json" className="hover:text-kura-fg">
            Catalog JSON
          </Link>
          <Link href="/r/registry.json" className="hover:text-kura-fg">
            shadcn registry
          </Link>
          <a href={GITHUB_URL} className="hover:text-kura-fg">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
