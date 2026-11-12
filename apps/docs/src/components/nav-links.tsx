"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GITHUB_URL } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export const NAV = [
  { href: "/components", label: "Components" },
  { href: "/docs", label: "Docs" },
  { href: "/agents", label: "For agents" },
  { href: GITHUB_URL, label: "GitHub", external: true },
] as const;

export function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const isActive = useIsActive();
  return (
    <nav aria-label="Main" className="hidden items-center md:flex">
      {NAV.map((l) => {
        const active = !("external" in l) && isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-[14px] outline-hidden transition-colors duration-150 focus-visible:shadow-kura-focus",
              active ? "text-kura-fg" : "text-kura-fg-muted hover:text-kura-fg",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
