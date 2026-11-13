"use client";

import { Tooltip } from "@kura-ui/react/tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { shortcutFor } from "@/lib/shortcuts";
import { Keys } from "./command-menu";

export const NAV = [
  { href: "/components", label: "Components" },
  { href: "/docs", label: "Docs" },
  { href: "/agents", label: "Agents" },
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
        const active = isActive(l.href);
        return (
          <Tooltip
            key={l.href}
            side="bottom"
            content={
              <span className="flex items-center gap-2">
                Go to {l.label}
                <Keys keys={shortcutFor(l.href) ?? []} />
              </span>
            }
          >
            <Link
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-[14px] outline-hidden transition-colors duration-150 focus-visible:shadow-kura-focus",
                active ? "text-kura-fg" : "text-kura-fg-muted hover:text-kura-fg",
              )}
            >
              {l.label}
            </Link>
          </Tooltip>
        );
      })}
    </nav>
  );
}
