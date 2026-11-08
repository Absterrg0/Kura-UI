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
        "flex h-7.5 items-center justify-between rounded-kura-md px-2.5 outline-none transition-colors duration-(--kura-duration-fast) focus-visible:shadow-kura-focus",
        active
          ? "bg-kura-hover font-medium text-kura-fg"
          : "text-kura-fg-muted hover:bg-kura-hover hover:text-kura-fg",
      )}
    >
      {children}
      {status === "experimental" && (
        <span className="rounded-full bg-kura-surface-sunken px-1.5 text-[10.5px] text-kura-fg-subtle shadow-kura-xs">
          beta
        </span>
      )}
    </Link>
  );
}
