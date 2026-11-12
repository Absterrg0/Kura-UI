"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { cn } from "@/lib/cn";

export function SidebarLink({ href, children }: { href: string; children: React.ReactNode }) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-8 items-center rounded-lg px-3 outline-hidden transition-colors duration-150 focus-visible:shadow-kura-focus",
        // You are here: one ink dot in the margin, nothing boxed.
        active
          ? "font-medium text-kura-fg before:absolute before:top-1/2 before:left-0 before:size-1 before:-translate-y-1/2 before:rounded-full before:bg-kura-fg"
          : "text-kura-fg-muted hover:text-kura-fg",
      )}
    >
      {children}
    </Link>
  );
}
