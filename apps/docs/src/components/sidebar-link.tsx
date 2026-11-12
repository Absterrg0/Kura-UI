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
        "relative flex h-8 items-center justify-between rounded-lg px-3 outline-none transition-colors duration-150 focus-visible:shadow-kura-focus",
        active
          ? "bg-kura-hover font-medium text-kura-fg shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]"
          : "text-kura-fg-muted hover:text-kura-fg",
      )}
    >
      {children}
      {status === "experimental" && <span className="text-[11px] text-kura-fg-subtle">beta</span>}
    </Link>
  );
}
