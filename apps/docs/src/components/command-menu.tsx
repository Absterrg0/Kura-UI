"use client";

import type { CatalogCategory } from "@kura/catalog-types";
import { useHotkey } from "@kura-ui/react/hooks";
import { Kbd } from "@kura-ui/react/kbd";
import { Command } from "cmdk";
import { ArrowRight, BookOpen, Bot, Box, FileText, LayoutGrid, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import * as React from "react";

export interface CommandItemData {
  slug: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
}

export function CommandMenu({
  items,
  categories,
}: {
  items: CommandItemData[];
  categories: CatalogCategory[];
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  useHotkey(["mod", "k"], () => setOpen((o) => !o));
  useHotkey(["/"], () => setOpen(true));

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="search-trigger"
        className="group flex h-9 w-9 cursor-pointer items-center justify-center gap-2 rounded-[6px] bg-kura-hover text-[13.5px] text-kura-fg-subtle outline-none transition-colors hover:bg-kura-active hover:text-kura-fg-muted focus-visible:shadow-kura-focus sm:w-full sm:justify-start sm:px-3 md:w-52"
      >
        <Search className="size-3.5" />
        <span className="hidden flex-1 truncate whitespace-nowrap text-left sm:block">
          Search the store…
        </span>
        <span className="sr-only sm:hidden">Search the store</span>
        <Kbd keys={["mod", "k"]} size="sm" variant="ghost" className="hidden sm:inline-flex" />
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-kura-canvas/60 backdrop-blur-[2px] data-[state=closed]:animate-kura-fade-out data-[state=open]:animate-kura-fade-in" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed top-[14vh] left-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 origin-top overflow-hidden rounded-kura-xl bg-kura-overlay shadow-kura-lg backdrop-blur-2xl backdrop-saturate-150 data-[state=closed]:animate-kura-pop-out data-[state=open]:animate-kura-pop-in"
          >
            <Dialog.Title className="sr-only">Search Kura UI</Dialog.Title>
            <Command
              label="Search Kura UI"
              loop
              className="flex flex-col [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-kura-fg-subtle [&_[cmdk-group-heading]]:text-xs"
            >
              <div className="flex items-center gap-2 border-kura-border-subtle border-b px-4">
                <Search className="size-4 text-kura-fg-subtle" />
                <Command.Input
                  autoFocus
                  placeholder="Find a component, hook or page… (try “voice” or “thinking”)"
                  className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-kura-fg-subtle"
                />
                <Kbd size="sm">Esc</Kbd>
              </div>
              <Command.List className="max-h-[min(420px,60vh)] scroll-py-2 overflow-y-auto p-1.5">
                <Command.Empty className="py-10 text-center text-kura-fg-subtle text-sm">
                  No components match. Ask your agent:{" "}
                  <span className="font-kura-mono">kura search</span>
                </Command.Empty>
                <Command.Group heading="Pages">
                  {[
                    { href: "/docs", label: "Getting started", icon: BookOpen },
                    { href: "/components", label: "All components", icon: LayoutGrid },
                    { href: "/agents", label: "Agents: MCP, llms.txt, CLI", icon: Bot },
                    { href: "/llms.txt", label: "llms.txt", icon: FileText },
                  ].map((p) => (
                    <Item key={p.href} value={p.label} onSelect={() => go(p.href)}>
                      <p.icon className="size-4 text-kura-fg-subtle" />
                      {p.label}
                    </Item>
                  ))}
                </Command.Group>
                {categories.map((cat) => {
                  const group = items.filter((i) => i.category === cat.id);
                  if (!group.length) return null;
                  return (
                    <Command.Group key={cat.id} heading={cat.title}>
                      {group.map((item) => (
                        <Item
                          key={item.slug}
                          value={`${item.title} ${item.slug}`}
                          keywords={item.keywords}
                          onSelect={() => go(`/components/${item.slug}`)}
                        >
                          <Box className="size-4 text-kura-fg-subtle" />
                          <span className="shrink-0">{item.title}</span>
                          <span className="truncate text-kura-fg-subtle text-xs">
                            {item.description}
                          </span>
                        </Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function Item(props: React.ComponentProps<typeof Command.Item>) {
  return (
    <Command.Item
      {...props}
      className="group flex h-10 cursor-pointer select-none items-center gap-2.5 rounded-kura-md px-3 text-sm data-[selected=true]:bg-kura-hover"
    >
      {props.children}
      <ArrowRight className="ml-auto size-3.5 shrink-0 text-kura-fg-subtle opacity-0 group-data-[selected=true]:opacity-100" />
    </Command.Item>
  );
}
