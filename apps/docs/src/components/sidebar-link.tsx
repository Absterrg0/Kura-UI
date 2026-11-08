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
        "flex h-8 items-center justify-between rounded-kura-md px-2.5 outline-none transition-colors duration-(--kura-duration-fast) focus-visible:shadow-kura-focus",
        active ? "bg-kura-hover font-medium text-kura-fg" : "text-kura-fg-muted hover:text-kura-fg",
      )}
    >
      {children}
      {status === "experimental" && (
        <span className="size-1.5 rounded-full bg-kura-warning" title="experimental">
          <span className="sr-only">(experimental)</span>
        </span>
      )}
    </Link>
  );
}
