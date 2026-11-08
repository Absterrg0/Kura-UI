"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/docs", label: "Docs" },
  { href: "/components", label: "Components" },
  { href: "/agents", label: "Agents" },
];

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
            className={cn(
              "rounded-kura-md px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:shadow-kura-focus",
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
