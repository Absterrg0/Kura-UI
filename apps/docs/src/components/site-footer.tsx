import Link from "next/link";
import { GITHUB_URL } from "@/lib/catalog";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Library",
    links: [
      { href: "/components", label: "Components" },
      { href: "/docs", label: "Getting started" },
      { href: "/docs/wiring-events", label: "Wiring agent events" },
      { href: "/docs/hooks", label: "Hooks" },
    ],
  },
  {
    title: "For agents",
    links: [
      { href: "/agents", label: "MCP server and CLI" },
      { href: "/llms.txt", label: "llms.txt" },
      { href: "/r/registry.json", label: "shadcn registry" },
      { href: "/registry/index.json", label: "JSON catalog" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: GITHUB_URL, label: "GitHub" },
      { href: `${GITHUB_URL}/blob/main/DESIGN.md`, label: "Design language" },
      { href: `${GITHUB_URL}/blob/main/AGENTS.md`, label: "Contributing" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer>
      <div className="px-5 md:px-6">
        <span aria-hidden className="kura-leader mx-auto block h-[5px] max-w-[1180px]" />
        <div className="mx-auto grid max-w-[1180px] gap-10 pt-14 pb-12 text-[14px] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="max-w-[16rem] text-kura-fg-subtle leading-relaxed">
              React components for agent interfaces. Open source under MIT.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <p className="font-medium text-kura-fg">{col.title}</p>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => {
                  const className =
                    "rounded-sm text-kura-fg-muted outline-hidden transition-colors hover:text-kura-fg focus-visible:shadow-kura-focus";
                  // A file (llms.txt, the registry JSON) or another site is a plain link: Next
                  // would try to prefetch it as a page and log a 404 for each one.
                  const page = l.href.startsWith("/") && !/\.[a-z]+$/.test(l.href);
                  return (
                    <li key={l.href}>
                      {page ? (
                        <Link href={l.href} className={className}>
                          {l.label}
                        </Link>
                      ) : (
                        <a href={l.href} className={className}>
                          {l.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
