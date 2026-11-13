// ARIA combobox + listbox: the search input keeps focus and points at the highlighted option with
// aria-activedescendant, so options are intentionally not focusable and have no own key handlers.
// biome-ignore-all lint/a11y/useSemanticElements: rich rows cannot be native <option>/<fieldset>.
// biome-ignore-all lint/a11y/useFocusableInteractive: focus stays in the search input (activedescendant).
// biome-ignore-all lint/a11y/useKeyWithClickEvents: keyboard selection is handled by the input.
"use client";

import {
  DialogBackdrop,
  DialogContent,
  Dialog as DialogPrimitive,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react/dialog";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useHotkey } from "../../hooks/use-hotkey";
import { cn } from "../../lib/cn";
import type { KeyName } from "../../lib/keys";
import { Kbd } from "../kbd";

export interface CommandPaletteItem {
  /** Stable id (also used for recents). */
  id: string;
  label: string;
  /** Muted text after the label. */
  description?: string;
  /** 16px icon. */
  icon?: React.ReactNode;
  /** Group heading. Groups keep first-seen order. */
  group?: string;
  /** Extra search terms. */
  keywords?: readonly string[];
  /** Shortcut shown on the right (display only — bind it with useHotkey). */
  shortcut?: readonly KeyName[];
  /** Run the action. The palette closes afterwards unless the item opens a page. */
  onSelect?: () => void;
  /** Open a nested page with these items. */
  children?: readonly CommandPaletteItem[];
  /** Open a nested page whose items load asynchronously (a loading state shows meanwhile). */
  loadChildren?: () => Promise<readonly CommandPaletteItem[]>;
  /** Search placeholder for the nested page. */
  placeholder?: string;
  disabled?: boolean;
}

export interface CommandPaletteProps
  extends Omit<React.ComponentProps<"div">, "children" | "onSelect"> {
  items: readonly CommandPaletteItem[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Global shortcut that toggles the palette. Default ["mod", "k"]. null disables it. */
  hotkey?: readonly KeyName[] | null;
  /** Element that opens the palette (rendered as the dialog trigger), e.g. <CommandPaletteTrigger />. */
  trigger?: React.ReactElement<Record<string, unknown>>;
  /** Controlled recent item ids, most recent first. Shown as “Recent” when the query is empty. */
  recent?: string[];
  /** Initial recent ids when uncontrolled. */
  defaultRecent?: string[];
  onRecentChange?: (ids: string[]) => void;
  /** Max recents shown. Default 4. */
  recentLimit?: number;
  /** Called after any item is selected (in addition to the item's onSelect). */
  onSelect?: (item: CommandPaletteItem) => void;
  /** Called on every query change, e.g. to fetch server results into `items`. */
  onQueryChange?: (query: string) => void;
  /** Show loading rows (e.g. while async results arrive). */
  loading?: boolean;
  /** Default "Search or run a command…". */
  placeholder?: string;
  /** Default "No results". */
  emptyMessage?: string;
  /** Accessible title of the dialog. Default "Command palette". */
  label?: string;
  /**
   * Render the palette in place, always shown, instead of as a modal dialog: for a launcher page,
   * a settings panel or a docs preview. `open`, `trigger` and the dialog title do not apply, and
   * `hotkey` moves focus to its search field.
   */
  inline?: boolean;
}

interface Page {
  id: string;
  title: string;
  items: readonly CommandPaletteItem[];
  placeholder?: string;
  loading: boolean;
}

/** Fuzzy score: contiguous and word-start matches rank higher. 0 = no match. */
export function scoreCommand(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  const idx = t.indexOf(q);
  if (idx > 0 && /[\s\-_/.]/.test(t[idx - 1] ?? "")) return 60;
  if (idx >= 0) return 40;
  // subsequence
  let ti = 0;
  let score = 0;
  let streak = 0;
  for (const ch of q) {
    if (ch === " ") continue;
    const found = t.indexOf(ch, ti);
    if (found === -1) return 0;
    streak = found === ti ? streak + 1 : 0;
    score += 1 + streak + (found === 0 || /[\s\-_/.]/.test(t[found - 1] ?? "") ? 2 : 0);
    ti = found + 1;
  }
  return Math.min(35, score);
}

function itemScore(item: CommandPaletteItem, query: string): number {
  const label = scoreCommand(item.label, query);
  const extra = Math.max(
    scoreCommand(item.description ?? "", query) * 0.5,
    ...(item.keywords ?? []).map((k) => scoreCommand(k, query) * 0.7),
    item.group ? scoreCommand(item.group, query) * 0.3 : 0,
  );
  return Math.max(label, query ? extra : 0);
}

const nested = (i: CommandPaletteItem) => !!(i.children || i.loadChildren);

/**
 * ⌘K command palette for agent actions: fuzzy search, groups, recents, nested pages (with async
 * loading) and shortcut hints. Opens with the hotkey or an optional trigger.
 */
export function CommandPalette({
  items,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  hotkey = ["mod", "k"],
  trigger,
  recent: recentProp,
  defaultRecent,
  onRecentChange,
  recentLimit = 4,
  onSelect,
  onQueryChange,
  loading = false,
  placeholder = "Search or run a command…",
  emptyMessage = "No results",
  label = "Command palette",
  inline = false,
  className,
  ...props
}: CommandPaletteProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [recent, setRecent] = useControllableState<string[]>({
    value: recentProp,
    defaultValue: defaultRecent ?? [],
    onChange: onRecentChange,
  });
  const [query, setQueryState] = React.useState("");
  const [pages, setPages] = React.useState<Page[]>([]);
  const [active, setActive] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pointerOrigin = React.useRef<{ x: number; y: number } | null>(null);
  const baseId = React.useId();
  const listId = `${baseId}-list`;
  const optionId = React.useCallback(
    (key: string) => `${baseId}-o-${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    [baseId],
  );

  const setQuery = (q: string) => {
    setQueryState(q);
    // A new query re-ranks the list: highlight its best match again.
    setActive(null);
    onQueryChange?.(q);
  };

  useHotkey(
    hotkey,
    (e) => {
      if (inline) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      // It closes from anywhere, but does not open on top of another modal.
      if (!open && e.target instanceof Element && e.target.closest('[aria-modal="true"]')) return;
      setOpen((o) => !o);
    },
    { enabled: hotkey !== null, allowInInputs: true },
  );

  // Reset when closed.
  React.useEffect(() => {
    if (open) return;
    setQueryState("");
    setPages([]);
    setActive(null);
    pointerOrigin.current = null;
  }, [open]);

  const page = pages[pages.length - 1];
  const source = page ? page.items : items;
  const isLoading = page ? page.loading : loading;

  // Flatten the whole tree for recents lookup.
  const byId = React.useMemo(() => {
    const map = new Map<string, CommandPaletteItem>();
    const walk = (list: readonly CommandPaletteItem[]) => {
      for (const i of list) {
        map.set(i.id, i);
        if (i.children) walk(i.children);
      }
    };
    walk(items);
    return map;
  }, [items]);

  type Row = { key: string; item: CommandPaletteItem; group: string };
  const rows = React.useMemo<Row[]>(() => {
    const q = query.trim();
    const out: Row[] = [];
    if (!q && !page && recent.length > 0) {
      for (const id of recent.slice(0, recentLimit)) {
        const item = byId.get(id);
        if (item) out.push({ key: `recent:${id}`, item, group: "Recent" });
      }
    }
    const scored = source
      .map((item, index) => ({ item, index, s: itemScore(item, q) }))
      .filter((r) => r.s > 0);
    if (q) scored.sort((a, b) => b.s - a.s || a.index - b.index);
    // Keep groups together, ordered by their best item.
    const order: string[] = [];
    const grouped = new Map<string, CommandPaletteItem[]>();
    for (const { item } of scored) {
      const g = item.group ?? "";
      if (!grouped.has(g)) {
        grouped.set(g, []);
        order.push(g);
      }
      grouped.get(g)?.push(item);
    }
    for (const g of order)
      for (const item of grouped.get(g) ?? []) out.push({ key: item.id, item, group: g });
    return out;
  }, [query, page, recent, recentLimit, byId, source]);

  const enabledRows = React.useMemo(() => rows.filter((r) => !r.item.disabled), [rows]);
  // Derived synchronously so Enter right after typing always hits the best match, even before
  // the effect below has re-synced `active`.
  const current =
    active && enabledRows.some((r) => r.key === active) ? active : (enabledRows[0]?.key ?? null);

  React.useEffect(() => {
    setActive((current) =>
      current && enabledRows.some((r) => r.key === current)
        ? current
        : (enabledRows[0]?.key ?? null),
    );
  }, [enabledRows]);

  React.useEffect(() => {
    if (!active) return;
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: "nearest" });
  }, [active, optionId]);

  const pushPage = (item: CommandPaletteItem) => {
    const next: Page = {
      id: item.id,
      title: item.label,
      items: item.children ?? [],
      placeholder: item.placeholder,
      loading: !item.children && !!item.loadChildren,
    };
    setPages((p) => [...p, next]);
    setQueryState("");
    setActive(null);
    if (!item.children && item.loadChildren) {
      item
        .loadChildren()
        .then((loaded) =>
          setPages((p) =>
            p.map((pg) => (pg === next ? { ...pg, items: loaded, loading: false } : pg)),
          ),
        )
        .catch(() =>
          setPages((p) => p.map((pg) => (pg === next ? { ...pg, items: [], loading: false } : pg))),
        );
    }
    inputRef.current?.focus();
  };

  const popPage = () => {
    setPages((p) => p.slice(0, -1));
    setQueryState("");
    setActive(null);
  };

  const choose = (item: CommandPaletteItem) => {
    if (item.disabled) return;
    setRecent((list) => [item.id, ...list.filter((id) => id !== item.id)].slice(0, 20));
    if (nested(item)) {
      pushPage(item);
      return;
    }
    item.onSelect?.();
    onSelect?.(item);
    if (inline) {
      // In place, the palette stays: it starts again from the top.
      setPages([]);
      setQueryState("");
      setActive(null);
    } else setOpen(false);
  };

  const move = (delta: number | "first" | "last") => {
    if (!enabledRows.length) return;
    const i = enabledRows.findIndex((r) => r.key === current);
    const next =
      delta === "first"
        ? 0
        : delta === "last"
          ? enabledRows.length - 1
          : i === -1
            ? 0
            : (i + delta + enabledRows.length) % enabledRows.length;
    setActive(enabledRows[next]?.key ?? null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Home" && !query) {
      e.preventDefault();
      move("first");
    } else if (e.key === "End" && !query) {
      e.preventDefault();
      move("last");
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows.find((r) => r.key === current);
      if (row) choose(row.item);
    } else if (e.key === "Backspace" && !query && pages.length > 0) {
      e.preventDefault();
      popPage();
    } else if (e.key === "Escape" && inline && !pages.length && query) {
      e.preventDefault();
      setQuery("");
    } else if (e.key === "Escape" && pages.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      popPage();
    }
  };

  let lastGroup: string | null = null;
  const activeRow = rows.find((r) => r.key === current);
  const onPage = pages.length > 0;

  const body = (
    <>
      <div
        data-slot="command-palette-search"
        className="flex h-14 shrink-0 items-center gap-3 px-4 shadow-[inset_0_-1px_0_var(--kura-border-subtle)]"
      >
        {onPage ? (
          <button
            type="button"
            aria-label="Back"
            onClick={() => {
              popPage();
              inputRef.current?.focus();
            }}
            className="-ml-1 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[7px] text-kura-fg-subtle outline-hidden transition-colors duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-hover hover:text-kura-fg focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring motion-reduce:transition-none"
          >
            <ArrowLeft aria-hidden className="size-4" />
          </button>
        ) : (
          <Search aria-hidden className="size-[18px] shrink-0 text-kura-fg-subtle" />
        )}
        {onPage && (
          <span
            data-slot="command-palette-breadcrumbs"
            className="flex shrink-0 items-center gap-1.5 font-medium text-[14px] text-kura-fg-muted"
          >
            {pages.map((p) => (
              <React.Fragment key={p.id}>
                <span className="max-w-40 truncate">{p.title.replace(/(…|\.\.\.)$/, "")}</span>
                <span aria-hidden className="text-kura-fg-subtle">
                  /
                </span>
              </React.Fragment>
            ))}
          </span>
        )}
        {/* focus: the caret is the indicator (the one text field of the palette) */}
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={current ? optionId(current) : undefined}
          aria-label={page ? `Search ${page.title}` : "Search commands"}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder={
            page?.placeholder ??
            (page ? `Search ${page.title.replace(/(…|\.\.\.)$/, "").toLowerCase()}…` : placeholder)
          }
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-kura-fg outline-hidden placeholder:text-kura-fg-subtle"
        />
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label={page ? page.title : "Commands"}
        aria-busy={isLoading || undefined}
        className="min-h-0 flex-1 scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5 [scrollbar-width:thin]"
      >
        {rows.map((row) => {
          const heading = row.group !== lastGroup ? row.group : null;
          lastGroup = row.group;
          const isActive = row.key === current;
          const { item } = row;
          return (
            <React.Fragment key={row.key}>
              {heading !== null && heading !== "" && (
                <div
                  role="presentation"
                  data-slot="command-palette-group"
                  className="select-none px-3 pt-3 pb-1.5 font-medium text-[12px] text-kura-fg-subtle first:pt-1.5"
                >
                  {heading}
                </div>
              )}
              <div
                id={optionId(row.key)}
                role="option"
                aria-selected={isActive}
                aria-disabled={item.disabled || undefined}
                data-slot="command-palette-item"
                data-active={isActive || undefined}
                data-disabled={item.disabled || undefined}
                onPointerMove={(e) => {
                  const o = pointerOrigin.current;
                  if (!o) {
                    pointerOrigin.current = { x: e.clientX, y: e.clientY };
                    return;
                  }
                  if (o.x === e.clientX && o.y === e.clientY) return;
                  if (!item.disabled && !isActive) setActive(row.key);
                }}
                onClick={() => choose(item)}
                className="group/item flex h-10 cursor-pointer select-none items-center gap-3 rounded-[9px] px-3 font-medium text-[14px] text-kura-fg-muted data-active:bg-kura-hover data-active:text-kura-fg data-disabled:cursor-not-allowed data-disabled:opacity-45"
              >
                {item.icon && (
                  <span
                    aria-hidden
                    className="flex size-4 shrink-0 items-center justify-center text-kura-fg-subtle group-data-active/item:text-kura-fg [&_svg]:size-4"
                  >
                    {item.icon}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 items-baseline gap-2.5">
                  <span className="max-w-full shrink-0 truncate">{item.label}</span>
                  {item.description && (
                    <span className="truncate font-normal text-[12.5px] text-kura-fg-subtle">
                      {item.description}
                    </span>
                  )}
                </span>
                {nested(item) ? (
                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-kura-fg-subtle group-data-active/item:text-kura-fg-muted"
                  />
                ) : item.shortcut ? (
                  <Kbd keys={item.shortcut} size="sm" className="shrink-0 pointer-coarse:hidden" />
                ) : (
                  // A row with no shortcut of its own shows the key that runs it while it is active.
                  <Kbd
                    aria-hidden
                    keys={["enter"]}
                    size="sm"
                    className="shrink-0 opacity-0 group-data-active/item:opacity-100 pointer-coarse:hidden"
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
        {isLoading && (
          <div data-slot="command-palette-loading" aria-hidden className="flex flex-col pt-1">
            {[0.42, 0.3, 0.36].map((w, i) => (
              <div key={i} className="flex h-10 items-center pr-3 pl-10">
                <span
                  className="kura-dots h-1.5 animate-kura-pulse motion-reduce:animate-none"
                  style={{ width: `${w * 100}%`, animationDelay: `${i * 120}ms` }}
                />
              </div>
            ))}
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="px-4 py-10 text-center text-[13px] text-kura-fg-subtle">
            {emptyMessage}
          </div>
        )}
      </div>

      <div
        data-slot="command-palette-footer"
        className="flex h-11 shrink-0 items-center gap-4 px-4 text-[12px] text-kura-fg-subtle shadow-[inset_0_1px_0_var(--kura-border-subtle)] pointer-coarse:hidden"
      >
        <span className="flex items-center gap-1.5">
          <Kbd aria-hidden keys={["up", "down"]} size="sm" />
          navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd aria-hidden keys={["enter"]} size="sm" />
          {activeRow && nested(activeRow.item) ? "open" : "select"}
        </span>
        {(onPage || !inline) && (
          <span className="flex items-center gap-1.5">
            <Kbd aria-hidden keys={[onPage ? "backspace" : "esc"]} size="sm" />
            {onPage ? "back" : "close"}
          </span>
        )}
        <span aria-live="polite" className="ml-auto truncate">
          {isLoading ? "Loading…" : null}
          <span className="sr-only">
            {isLoading
              ? ""
              : `${enabledRows.length} ${enabledRows.length === 1 ? "result" : "results"}`}
          </span>
        </span>
      </div>
    </>
  );

  const surface =
    "flex flex-col overflow-hidden rounded-kura-2xl bg-kura-surface font-kura-sans text-kura-fg shadow-kura-popover";

  if (inline) {
    return (
      <div
        data-slot="command-palette"
        data-inline=""
        data-page={page?.id}
        className={cn(surface, "w-full", className)}
        {...props}
      >
        {body}
      </div>
    );
  }

  return (
    <DialogPrimitive open={open} onOpenChange={(next) => setOpen(next)}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogBackdrop
        render={<div data-slot="command-palette-overlay" />}
        // A scrim that dims in both themes: ink at 14% on light, canvas at 70% on dark (via the
        // color-scheme the tokens set), so dark mode darkens instead of washing out to grey.
        className="fixed inset-0 z-50 bg-[light-dark(color-mix(in_oklch,var(--kura-gray-12)_14%,transparent),color-mix(in_oklch,var(--kura-canvas)_72%,transparent))] transition-opacity duration-(--kura-duration-base) ease-kura-out data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
      />
      <DialogContent
        render={<div data-slot="command-palette" />}
        data-page={page?.id}
        initialFocus={() => inputRef.current}
        className={cn(
          surface,
          "-translate-x-1/2 fixed top-[min(20vh,160px)] left-1/2 z-50 m-0 max-h-[min(520px,calc(100vh-min(20vh,160px)-16px))] w-[min(640px,calc(100vw-32px))] border-0 p-0 outline-hidden backdrop:bg-transparent",
          "origin-top transition-[opacity,scale] duration-(--kura-duration-base) ease-kura-snap data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none",
          className,
        )}
        {...props}
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        {body}
      </DialogContent>
    </DialogPrimitive>
  );
}

export interface CommandPaletteTriggerProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  /** Default "Search or ask…". */
  placeholder?: string;
  /**
   * Shortcut printed on the right. Default ["mod", "k"]. Print only a key the palette really
   * binds (its `hotkey`): pass null when it has none.
   */
  shortcut?: readonly KeyName[] | null;
}

/** A search-field-looking button that opens the palette. Pass it as `trigger`. */
export function CommandPaletteTrigger({
  placeholder = "Search or ask…",
  shortcut = ["mod", "k"],
  className,
  ...props
}: CommandPaletteTriggerProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-[9px] bg-kura-surface-sunken pr-1.5 pl-2.5 font-kura-sans text-[13px] text-kura-fg-subtle shadow-kura-sunk outline-hidden",
        "transition-colors duration-(--kura-duration-fast) ease-kura-snap hover:text-kura-fg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring focus-visible:outline-offset-2",
        className,
      )}
      {...props}
      // After the props: as a dialog trigger it is handed ui-sdk's own data-slot, which must not win.
      data-slot="command-palette-trigger"
    >
      <Search aria-hidden className="size-3.5 shrink-0" />
      <span className="flex-1 truncate text-left">{placeholder}</span>
      {/* A key hint is for a keyboard: it is not printed on a touch screen. */}
      {shortcut && <Kbd keys={shortcut} size="sm" className="pointer-coarse:hidden" />}
    </button>
  );
}
