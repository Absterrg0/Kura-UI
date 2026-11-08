import Link from "next/link";
import { GITHUB_URL } from "@/lib/catalog";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-kura-border-subtle border-t">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-10 text-[13px] text-kura-fg-muted md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <Logo className="text-kura-fg" />
          <span className="text-kura-fg-subtle">Open source under MIT.</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/docs" className="hover:text-kura-fg">
            Docs
          </Link>
          <Link href="/components" className="hover:text-kura-fg">
            Components
          </Link>
          <Link href="/agents" className="hover:text-kura-fg">
            Agents
          </Link>
          <a href="/llms.txt" className="hover:text-kura-fg">
            llms.txt
          </a>
          <a href={GITHUB_URL} className="hover:text-kura-fg">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
