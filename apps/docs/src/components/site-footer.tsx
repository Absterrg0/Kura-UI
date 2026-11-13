import Link from "next/link";
import { GITHUB_URL } from "@/lib/catalog";
import { FooterWordmark } from "./footer-wordmark";
import { Logo } from "./logo";

const LINKS = [
  { href: "/components", label: "Components" },
  { href: "/docs", label: "Docs" },
  { href: "/agents", label: "Agents" },
  { href: "/llms.txt", label: "llms.txt" },
  { href: "/r/registry.json", label: "Registry" },
  { href: GITHUB_URL, label: "GitHub" },
];

/** The footer: the name set large in dots, then one quiet row of links. */
export function SiteFooter() {
  const link =
    "rounded-sm text-kura-fg-muted outline-hidden transition-colors hover:text-kura-fg focus-visible:shadow-kura-focus";
  return (
    <footer className="overflow-hidden px-5 pt-10 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <span aria-hidden className="kura-leader block h-[5px]" />
        <FooterWordmark className="mt-10 md:mt-14" />
        <span aria-hidden className="kura-leader mt-8 block h-[5px] md:mt-12" />
        <div className="flex flex-col gap-6 py-8 text-[14px] md:flex-row md:items-center md:justify-between">
          <Link href="/" aria-label="Kura UI home" className="flex w-fit items-center rounded-lg">
            <Logo />
          </Link>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {LINKS.map((l) => {
                // A file (llms.txt, the registry JSON) or another site is a plain link: Next
                // would try to prefetch it as a page and log a 404 for each one.
                const page = l.href.startsWith("/") && !/\.[a-z]+$/.test(l.href);
                return (
                  <li key={l.href}>
                    {page ? (
                      <Link href={l.href} className={link}>
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className={link}>
                        {l.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
          <p className="text-kura-fg-subtle">Open source under MIT, 2026</p>
        </div>
      </div>
    </footer>
  );
}
