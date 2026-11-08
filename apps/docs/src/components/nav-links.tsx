"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/docs", label: "Docs" },
  { href: "/components", label: "Components" },
  { href: "/agents", label: "For agents" },
];

/** The current page is marked with a stroke of ink; others get a faint wash on hover. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative isolate inline-flex h-9 items-center px-4 text-[14px] outline-none transition-colors focus-visible:shadow-kura-focus",
              active ? "text-kura-fg-inverted" : "text-kura-fg-muted hover:text-kura-fg",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "swash absolute -inset-x-1 inset-y-0.5 -z-10 bg-kura-ink transition-opacity duration-200",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-[0.08]",
              )}
            />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
