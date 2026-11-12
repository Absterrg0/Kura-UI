"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { NAV, useIsActive } from "./nav-links";
import { siteButton } from "./site-button";
import { ThemeToggle } from "./theme-toggle";

export interface NavGroup {
  title: string;
  items: { href: string; label: string }[];
}

/** Phones: a menu button that opens a full-height sheet with the main links and the docs index. */
export function MobileNav({ groups }: { groups: NavGroup[] }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const isActive = useIsActive();
  // biome-ignore lint/correctness/useExhaustiveDependencies: close whenever the route changes
  React.useEffect(() => setOpen(false), [pathname]);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open menu"
        className="inline-flex size-9 items-center justify-center rounded-lg text-kura-fg-muted outline-none transition-colors hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-kura-focus md:hidden"
      >
        <Menu className="size-[18px]" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-kura-canvas/60 backdrop-blur-sm data-[state=closed]:animate-kura-fade-out data-[state=open]:animate-kura-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-2 top-2 bottom-2 z-50 flex flex-col overflow-hidden rounded-2xl bg-kura-overlay shadow-kura-lg data-[state=closed]:animate-kura-pop-out data-[state=open]:animate-kura-pop-in"
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className="flex h-14 shrink-0 items-center justify-between border-kura-border-subtle border-b pr-2.5 pl-4">
            <Logo />
            <Dialog.Close
              aria-label="Close menu"
              className="inline-flex size-9 items-center justify-center rounded-lg text-kura-fg-muted outline-none hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-kura-focus"
            >
              <X className="size-[18px]" />
            </Dialog.Close>
          </div>
          <nav aria-label="Menu" className="flex-1 overflow-y-auto px-4 pt-3 pb-6">
            <ul className="flex flex-col">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={!("external" in l) && isActive(l.href) ? "page" : undefined}
                    className="flex h-12 items-center border-kura-border-subtle border-b font-medium text-[17px] tracking-[-0.01em] outline-none focus-visible:shadow-kura-focus aria-[current=page]:text-kura-fg [&:not([aria-current])]:text-kura-fg-muted"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {groups.map((g) => (
              <div key={g.title} className="pt-6">
                <p className="pb-1.5 font-medium text-[12.5px] text-kura-fg-subtle">{g.title}</p>
                <ul className="grid grid-cols-2 gap-x-3">
                  {g.items.map((i) => (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        aria-current={pathname === i.href ? "page" : undefined}
                        className={cn(
                          "flex h-9 items-center truncate text-[14.5px] outline-none focus-visible:shadow-kura-focus",
                          pathname === i.href ? "font-medium text-kura-fg" : "text-kura-fg-muted",
                        )}
                      >
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2 border-kura-border-subtle border-t p-3">
            <Link href="/docs" className={siteButton({ className: "flex-1" })}>
              Get started
            </Link>
            <ThemeToggle size="md" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
