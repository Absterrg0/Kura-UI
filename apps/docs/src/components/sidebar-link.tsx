"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { cn } from "@/lib/cn";

export function SidebarLink({
  href,
  children,
  status,
}: {
  href: string;
  children: React.ReactNode;
  status?: string;
}) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-8 items-center justify-between rounded-[6px] px-3 outline-none transition-colors duration-(--kura-duration-fast) focus-visible:shadow-kura-focus",
        active ? "text-kura-fg" : "text-kura-fg-muted hover:bg-kura-hover hover:text-kura-fg",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-full bg-kura-shu"
        />
      )}
      <span className={cn(active && "font-medium")}>{children}</span>
      {status === "experimental" && (
        <span className="font-kura-mono text-[9.5px] text-kura-warning-text uppercase tracking-wider">
          exp
        </span>
      )}
    </Link>
  );
}
