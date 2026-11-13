"use client";

import type { CatalogCategory } from "@kura/catalog-types";
import { useHotkey, useIsApplePlatform } from "@kura-ui/react/hooks";
import { Kbd } from "@kura-ui/react/kbd";
import { Tooltip } from "@kura-ui/react/tooltip";
import { Command } from "cmdk";
import { ArrowLeft, Copy, Keyboard, Search, SunMoon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import * as React from "react";
import { SITE_URL } from "@/lib/catalog";
import { GITHUB_SHORTCUT, GO, HELP_SHORTCUT, THEME_SHORTCUT } from "@/lib/shortcuts";
import { GithubIcon } from "./icons";

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

/** A key sequence as small keycaps, e.g. G then C. */
export function Keys({ keys, className }: { keys: readonly string[]; className?: string }) {
  return (
    <span aria-hidden className={className ?? "flex shrink-0 items-center gap-1"}>
      {keys.map((k, i) => (
        <Kbd key={`${k}-${i}`} size="sm" className="min-w-[20px] text-[11px]">
          {k}
        </Kbd>
      ))}
    </span>
  );
}

const INSTALL = `npx shadcn@latest add ${SITE_URL}/r/run-header.json`;

/** Clicks the nav's theme switch, so a shortcut gets the same spreading transition. */
function toggleTheme() {
  document.querySelector<HTMLButtonElement>("header [data-testid=theme-toggle]")?.click();
}

/** Typing somewhere, or inside a live component with keys of its own: site shortcuts stand back. */
function busyTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return true;
  return target.closest("[data-slot], [role=dialog]") != null;
}

type Page = "root" | "shortcuts";

export function CommandMenu({
  items,
  categories,
}: {
  items: CommandItemData[];
  categories: CatalogCategory[];
}) {
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState<Page>("root");
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Whatever had focus when the palette opened gets it back when it closes.
  const opener = React.useRef<HTMLElement | null>(null);
  const show = (next: boolean | ((o: boolean) => boolean), on: Page = "root") =>
    setOpen((o) => {
      const value = typeof next === "function" ? next(o) : next;
      if (value && !o) {
        opener.current = document.activeElement as HTMLElement | null;
        setPage(on);
      }
      return value;
    });
  const router = useRouter();
  // Each time the palette opens, or turns a page, it starts empty.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on open and on page change
  React.useEffect(() => {
    setQuery("");
  }, [open, page]);
  useHotkey(["mod", "k"], (e) => {
    // Pressed inside another modal (a palette in an example): the site search stays behind it
    // rather than stacking on top. A popover is a dialog too, but not a modal one: from there
    // the key works as usual.
    const modal = e.target instanceof Element && e.target.closest('[aria-modal="true"]');
    if (!open && modal) return;
    show((o) => !o);
  });

  const go = (href: string, external = false) => {
    setOpen(false);
    // A file (llms.txt) or another site is opened by the browser; only pages use the router.
    if (external || /\.[a-z]+$/.test(href) || href.startsWith("http")) window.location.assign(href);
    else router.push(href);
  };
  const theme = () => {
    setOpen(false);
    // Once the palette has gone, so the transition does not carry it.
    setTimeout(toggleTheme, 180);
  };
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(INSTALL);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 650);
  };

  // The site's own shortcuts: / to search, ? for the list, T for the theme, and G then a letter
  // to go somewhere. None of them fire while typing or inside a live component.
  React.useEffect(() => {
    let leader: ReturnType<typeof setTimeout> | null = null;
    const onKey = (e: KeyboardEvent) => {
      if (open || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      if (busyTarget(e.target)) return;
      const key = e.key.toUpperCase();
      if (leader) {
        clearTimeout(leader);
        leader = null;
        const to =
          key === GITHUB_SHORTCUT.keys[1]
            ? { href: GITHUB_SHORTCUT.href, external: true }
            : GO.find((g) => g.keys[1] === key);
        if (to) {
          e.preventDefault();
          go(to.href, to.external);
        }
        return;
      }
      if (key === "G") {
        leader = setTimeout(() => {
          leader = null;
        }, 1200);
      } else if (e.key === "/") {
        e.preventDefault();
        show(true);
      } else if (e.key === HELP_SHORTCUT[0]) {
        e.preventDefault();
        show(true, "shortcuts");
      } else if (key === THEME_SHORTCUT[0]) {
        toggleTheme();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (leader) clearTimeout(leader);
    };
  });

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
  const mod = apple ? "⌘" : "Ctrl";

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
            {mod}
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
      <Dialog.Root open={open} onOpenChange={(o) => show(o)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-kura-canvas/70 backdrop-blur-[2px] data-[state=closed]:animate-kura-fade-out data-[state=open]:animate-kura-fade-in" />
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
            className="fixed top-[12vh] left-1/2 z-50 flex w-[min(640px,calc(100vw-24px))] -translate-x-1/2 origin-top flex-col overflow-hidden rounded-[18px] bg-kura-surface shadow-kura-popover data-[state=closed]:animate-kura-pop-out data-[state=open]:animate-kura-pop-in"
          >
            <Dialog.Title className="sr-only">
              {page === "shortcuts" ? "Keyboard shortcuts" : "Search Kura UI"}
            </Dialog.Title>
            <Command
              label={page === "shortcuts" ? "Keyboard shortcuts" : "Search Kura UI"}
              loop
              // Ctrl+K toggles the palette here; cmdk's vim keys would take it for "previous item".
              vimBindings={false}
              filter={rank}
              onKeyDown={(e) => {
                // Backspace on an empty field goes back from the shortcut list.
                if (page !== "root" && e.key === "Backspace" && !query) {
                  e.preventDefault();
                  setPage("root");
                }
                if (page === "root" && e.key === "?" && !query) {
                  e.preventDefault();
                  setPage("shortcuts");
                }
              }}
              className="flex min-h-0 flex-col [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-kura-fg-subtle"
            >
              <div className="flex h-14 items-center gap-3 border-kura-border-subtle border-b px-4">
                {page === "shortcuts" ? (
                  <button
                    type="button"
                    aria-label="Back"
                    onClick={() => setPage("root")}
                    className="-ml-1 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-kura-fg-subtle hover:bg-kura-hover hover:text-kura-fg"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                ) : (
                  <Search className="size-[18px] shrink-0 text-kura-fg-subtle" />
                )}
                {/* focus: the caret is the indicator (the one text field of a dialog) */}
                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder={
                    page === "shortcuts"
                      ? "Search shortcuts…"
                      : "Search components, pages and commands…"
                  }
                  className="h-full flex-1 bg-transparent text-[15px] outline-hidden placeholder:text-kura-fg-subtle"
                />
              </div>
              <Command.List className="max-h-[min(440px,58vh)] scroll-py-2 overflow-y-auto p-1.5">
                <Command.Empty className="px-4 py-10 text-center text-[13px] text-kura-fg-subtle text-balance">
                  Nothing matches. Ask your agent:{" "}
                  <span className="font-kura-mono">kura search</span>
                </Command.Empty>
                {page === "root" ? (
                  <>
                    <Command.Group heading="Go to">
                      {GO.map((g) => (
                        <Item
                          key={g.href}
                          value={g.label}
                          icon={<g.icon />}
                          keys={g.keys}
                          onSelect={() => go(g.href, g.external)}
                        >
                          {g.label}
                        </Item>
                      ))}
                      <Item
                        value="GitHub repository"
                        icon={<GithubIcon />}
                        keys={GITHUB_SHORTCUT.keys}
                        onSelect={() => go(GITHUB_SHORTCUT.href, true)}
                      >
                        GitHub
                      </Item>
                    </Command.Group>
                    <Command.Group heading="Actions">
                      <Item
                        value="Toggle theme light dark"
                        icon={<SunMoon />}
                        keys={THEME_SHORTCUT}
                        onSelect={theme}
                      >
                        Switch theme
                      </Item>
                      <Item
                        value="Copy install command"
                        icon={<Copy />}
                        keys={["↵"]}
                        onSelect={copy}
                      >
                        {copied ? "Copied" : "Copy the install command"}
                      </Item>
                      <Item
                        value="Keyboard shortcuts"
                        icon={<Keyboard />}
                        keys={HELP_SHORTCUT}
                        onSelect={() => setPage("shortcuts")}
                      >
                        Keyboard shortcuts
                      </Item>
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
                              <span className="truncate font-normal text-[12.5px] text-kura-fg-subtle">
                                {item.description}
                              </span>
                            </Item>
                          ))}
                        </Command.Group>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <Command.Group heading="Anywhere">
                      <Item value="Search" keys={[mod, "K"]} onSelect={() => setPage("root")}>
                        Search
                      </Item>
                      <Item value="Search slash" keys={["/"]} onSelect={() => setPage("root")}>
                        Search, without the modifier
                      </Item>
                      <Item value="Switch theme" keys={THEME_SHORTCUT} onSelect={theme}>
                        Switch theme
                      </Item>
                      <Item value="Keyboard shortcuts" keys={HELP_SHORTCUT} onSelect={() => {}}>
                        This list
                      </Item>
                    </Command.Group>
                    <Command.Group heading="Go to">
                      {GO.map((g) => (
                        <Item
                          key={g.href}
                          value={`go ${g.label}`}
                          keys={g.keys}
                          onSelect={() => go(g.href, g.external)}
                        >
                          {g.label}
                        </Item>
                      ))}
                      <Item
                        value="go GitHub"
                        keys={GITHUB_SHORTCUT.keys}
                        onSelect={() => go(GITHUB_SHORTCUT.href, true)}
                      >
                        GitHub
                      </Item>
                    </Command.Group>
                    <Command.Group heading="In the palette">
                      {(
                        [
                          ["Move", ["↑", "↓"]],
                          ["Open", ["↵"]],
                          ["Back to search", ["⌫"]],
                          ["Close", ["Esc"]],
                        ] as const
                      ).map(([label, keys]) => (
                        <Item
                          key={label}
                          value={`palette ${label}`}
                          keys={keys}
                          onSelect={() => {}}
                        >
                          {label}
                        </Item>
                      ))}
                    </Command.Group>
                    <Command.Group heading="In a diff or an approval">
                      {(
                        [
                          ["Next and previous change", ["J", "K"]],
                          ["Accept, reject", ["A", "R"]],
                          ["Approve", [mod, "↵"]],
                          ["Deny", ["Esc"]],
                        ] as const
                      ).map(([label, keys]) => (
                        <Item
                          key={label}
                          value={`component ${label}`}
                          keys={keys}
                          onSelect={() => {}}
                        >
                          {label}
                        </Item>
                      ))}
                    </Command.Group>
                  </>
                )}
              </Command.List>
              <div className="flex h-11 shrink-0 items-center gap-4 border-kura-border-subtle border-t px-3.5 text-[12px] text-kura-fg-subtle">
                <span className="flex items-center gap-1.5">
                  <Keys keys={["↑", "↓"]} />
                  navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <Keys keys={["↵"]} />
                  select
                </span>
                <span className="flex items-center gap-1.5">
                  <Keys keys={[page === "root" ? "Esc" : "⌫"]} />
                  {page === "root" ? "close" : "back"}
                </span>
                {page === "root" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPage("shortcuts");
                      inputRef.current?.focus();
                    }}
                    className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-md py-1 pr-1 pl-1.5 outline-hidden transition-colors hover:text-kura-fg focus-visible:shadow-kura-focus"
                  >
                    <Keys keys={HELP_SHORTCUT} />
                    all shortcuts
                  </button>
                )}
              </div>
            </Command>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function Item({
  icon,
  keys,
  children,
  ...props
}: React.ComponentProps<typeof Command.Item> & {
  icon?: React.ReactNode;
  keys?: readonly string[];
}) {
  return (
    <Command.Item
      {...props}
      className="group flex h-10 cursor-pointer select-none items-center gap-3 rounded-[10px] px-3 font-medium text-[14px] text-kura-fg-muted data-[selected=true]:bg-kura-hover data-[selected=true]:text-kura-fg [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {icon && (
        <span className="flex text-kura-fg-subtle group-data-[selected=true]:text-kura-fg">
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-baseline gap-2.5">{children}</span>
      {keys ? (
        <Keys keys={keys} />
      ) : (
        <Keys
          keys={["↵"]}
          className="flex shrink-0 opacity-0 group-data-[selected=true]:opacity-100"
        />
      )}
    </Command.Item>
  );
}
