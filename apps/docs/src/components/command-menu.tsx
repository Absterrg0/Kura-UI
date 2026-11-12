"use client";

import type { CatalogCategory } from "@kura/catalog-types";
import { useHotkey } from "@kura-ui/react/hooks";
import { Kbd } from "@kura-ui/react/kbd";
import { Command } from "cmdk";
import {
  Anchor,
  BookOpen,
  FileText,
  LayoutGrid,
  Search,
  SquareTerminal,
  Workflow,
} from "lucide-react";
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

/**
 * Ranks title and slug matches first, then tags. A query word matches a word that starts with it,
 * or with its stem ("approve" finds "approval"); every query word has to match something, so a
 * search narrows the list instead of fuzzily matching nearly everything.
 */
function rank(value: string, search: string, keywords: string[] = []): number {
  const q = search.trim().toLowerCase();
  if (!q) return 1;
  const v = value.toLowerCase();
  const words = v.split(/[\s\-/.]+/);
  const tags = keywords.map((k) => k.toLowerCase());
  const stem = (t: string) => (t.length >= 5 ? t.slice(0, -1) : t);
  const tokens = q.split(/\s+/);
  let total = 0;
  for (const t of tokens) {
    const st = stem(t);
    let s = 0;
    if (v.startsWith(t)) s = 1;
    else if (words.some((w) => w.startsWith(t))) s = 0.9;
    else if (words.some((w) => w.startsWith(st))) s = 0.8;
    else if (v.includes(t)) s = 0.6;
    else if (tags.some((k) => k.startsWith(st))) s = 0.3;
    if (!s) return 0;
    total += s;
  }
  return total / tokens.length;
}

export function CommandMenu({
  items,
  categories,
}: {
  items: CommandItemData[];
  categories: CatalogCategory[];
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();
  // Each time the palette opens it starts empty.
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);
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
        className="group flex size-9 cursor-pointer items-center justify-center gap-2 rounded-[9px] text-[13px] text-kura-fg-subtle outline-hidden transition-colors hover:text-kura-fg max-md:hover:bg-kura-hover md:h-8 md:w-auto md:justify-start md:bg-kura-surface-sunken md:pr-1.5 md:pl-2.5 md:shadow-kura-sunk lg:w-52"
      >
        <Search className="size-4 md:size-3.5" />
        <span className="hidden flex-1 truncate whitespace-nowrap text-left md:block">Search</span>
        <span className="sr-only md:hidden">Search components</span>
        <Kbd keys={["mod", "k"]} size="sm" className="hidden md:inline-flex" />
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-kura-canvas/80 data-[state=closed]:animate-kura-fade-out data-[state=open]:animate-kura-fade-in" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed top-[14vh] left-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 origin-top overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-popover data-[state=closed]:animate-kura-pop-out data-[state=open]:animate-kura-pop-in"
          >
            <Dialog.Title className="sr-only">Search Kura UI</Dialog.Title>
            <Command
              label="Search Kura UI"
              loop
              filter={rank}
              className="flex flex-col [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-kura-fg-subtle"
            >
              <div className="flex items-center gap-2 border-kura-border-subtle border-b px-4">
                <Search className="size-4 text-kura-fg-subtle" />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Find a component, hook or page…"
                  className="h-12 flex-1 bg-transparent text-[14px] outline-hidden placeholder:text-kura-fg-subtle"
                />
                <Kbd size="sm">Esc</Kbd>
              </div>
              <Command.List className="max-h-[min(420px,60vh)] scroll-py-2 overflow-y-auto p-1.5">
                <Command.Empty className="px-4 py-10 text-center text-[13px] text-kura-fg-subtle text-balance">
                  No components match. Ask your agent:{" "}
                  <span className="font-kura-mono">kura search</span>
                </Command.Empty>
                <Command.Group heading="Pages">
                  {[
                    { href: "/docs", label: "Getting started", icon: BookOpen },
                    { href: "/docs/wiring-events", label: "Wiring agent events", icon: Workflow },
                    { href: "/docs/hooks", label: "Hooks", icon: Anchor },
                    { href: "/components", label: "All components", icon: LayoutGrid },
                    {
                      href: "/agents",
                      label: "For agents: MCP, llms.txt, CLI",
                      icon: SquareTerminal,
                    },
                    { href: "/llms.txt", label: "llms.txt", icon: FileText },
                  ].map((p) => (
                    <Item key={p.href} value={p.label} onSelect={() => go(p.href)}>
                      <p.icon className="size-4 shrink-0 text-kura-fg-subtle" />
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
      className="group flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[9px] px-2.5 text-[13px] data-[selected=true]:bg-kura-hover"
    >
      {props.children}
      <Kbd
        aria-hidden
        keys={["enter"]}
        size="sm"
        className="ml-auto shrink-0 opacity-0 group-data-[selected=true]:opacity-100"
      />
    </Command.Item>
  );
}
