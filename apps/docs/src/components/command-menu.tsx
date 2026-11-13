"use client";

import type { CatalogCategory } from "@kura/catalog-types";
import { useHotkey, useIsApplePlatform } from "@kura-ui/react/hooks";
import { Kbd } from "@kura-ui/react/kbd";
import { Tooltip } from "@kura-ui/react/tooltip";
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
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Whatever had focus when the palette opened gets it back when it closes.
  const opener = React.useRef<HTMLElement | null>(null);
  const show = (next: boolean | ((o: boolean) => boolean)) =>
    setOpen((o) => {
      const value = typeof next === "function" ? next(o) : next;
      if (value && !o) opener.current = document.activeElement as HTMLElement | null;
      return value;
    });
  const router = useRouter();
  // Each time the palette opens it starts empty.
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);
  useHotkey(["mod", "k"], (e) => {
    // Pressed inside another modal (a palette in an example): the site search stays behind it
    // rather than stacking on top. A popover is a dialog too, but not a modal one: from there
    // the key works as usual.
    const modal = e.target instanceof Element && e.target.closest('[aria-modal="true"]');
    if (!open && modal) return;
    show((o) => !o);
  });
  useHotkey(["/"], () => show(true));

  const apple = useIsApplePlatform();
  // Which of the shortcut's keys are down right now, so the keycaps in the nav press with them.
  const [held, setHeld] = React.useState({ mod: false, k: false });
  React.useEffect(() => {
    const sync = (e: KeyboardEvent) => {
      const mod = apple ? e.metaKey : e.ctrlKey;
      const k = e.type === "keydown" ? mod && e.key.toLowerCase() === "k" : false;
      setHeld((h) => (h.mod === mod && h.k === k ? h : { mod, k }));
    };
    const clear = () => setHeld({ mod: false, k: false });
    window.addEventListener("keydown", sync);
    window.addEventListener("keyup", sync);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", sync);
      window.removeEventListener("keyup", sync);
      window.removeEventListener("blur", clear);
    };
  }, [apple]);

  const go = (href: string) => {
    setOpen(false);
    // A file (llms.txt) is opened by the browser; only pages go through the router.
    if (/\.[a-z]+$/.test(href)) window.location.assign(href);
    else router.push(href);
  };

  return (
    <>
      <Tooltip content="Search" side="bottom">
        <button
          type="button"
          onClick={() => show(true)}
          data-testid="search-trigger"
          aria-label="Search"
          aria-keyshortcuts={apple ? "Meta+K" : "Control+K"}
          className="group/search flex h-8 cursor-pointer items-center gap-1 rounded-[9px] px-2 text-kura-fg-subtle outline-hidden transition-colors duration-150 hover:bg-kura-hover hover:text-kura-fg focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring max-md:size-9 max-md:justify-center max-md:px-0"
        >
          <Search className="size-4 md:mr-1 md:size-3.5" />
          {/* The keys themselves: each one goes down while it is held, so the shortcut teaches itself. */}
          <Kbd
            aria-hidden
            pressed={held.mod}
            className="hidden h-[22px] min-w-[26px] text-[11.5px] md:inline-flex group-hover/search:text-kura-fg-muted"
          >
            {apple ? "⌘" : "Ctrl"}
          </Kbd>
          <Kbd
            aria-hidden
            pressed={held.k}
            className="hidden h-[22px] min-w-[22px] text-[11.5px] md:inline-flex group-hover/search:text-kura-fg-muted"
          >
            K
          </Kbd>
        </button>
      </Tooltip>
      <Dialog.Root open={open} onOpenChange={show}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-kura-canvas/80 data-[state=closed]:animate-kura-fade-out data-[state=open]:animate-kura-fade-in" />
          <Dialog.Content
            // It is a modal: say so, for screen readers and for a palette deciding whether it
            // may open on top.
            aria-modal="true"
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              inputRef.current?.focus();
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              opener.current?.focus();
            }}
            className="fixed top-[14vh] left-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 origin-top overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-popover data-[state=closed]:animate-kura-pop-out data-[state=open]:animate-kura-pop-in"
          >
            <Dialog.Title className="sr-only">Search Kura UI</Dialog.Title>
            <Command
              label="Search Kura UI"
              loop
              // Ctrl+K toggles the palette here; cmdk's vim keys would take it for "previous item".
              vimBindings={false}
              filter={rank}
              className="flex flex-col [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-kura-fg-subtle"
            >
              <div className="flex items-center gap-2 border-kura-border-subtle border-b px-4">
                <Search className="size-4 text-kura-fg-subtle" />
                {/* focus: the caret is the indicator (the one text field of a dialog) */}
                <Command.Input
                  ref={inputRef}
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
                    { href: "/docs", label: "Introduction", icon: BookOpen },
                    { href: "/docs/wiring-events", label: "Wiring agent events", icon: Workflow },
                    { href: "/docs/hooks", label: "Hooks", icon: Anchor },
                    { href: "/components", label: "All components", icon: LayoutGrid },
                    {
                      href: "/agents",
                      label: "Agents: MCP, llms.txt, CLI",
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
