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
import { ChevronRight, CornerDownLeft, Search } from "lucide-react";
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

  useHotkey(hotkey, () => setOpen((o) => !o), { enabled: hotkey !== null, allowInInputs: true });

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
    setOpen(false);
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
    } else if (e.key === "Escape" && pages.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      popPage();
    }
  };

  let lastGroup: string | null = null;
  const activeRow = rows.find((r) => r.key === current);

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
          "-translate-x-1/2 fixed top-[min(20vh,160px)] left-1/2 z-50 flex max-h-[min(520px,calc(100vh-120px))] w-[min(640px,calc(100vw-32px))] flex-col overflow-hidden",
          "m-0 rounded-kura-xl border-0 bg-kura-surface-raised p-0 font-kura-sans text-kura-fg shadow-kura-lg outline-none backdrop:bg-transparent",
          "origin-top transition-[opacity,scale] duration-(--kura-duration-base) ease-kura-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none",
          className,
        )}
        {...props}
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <div
          data-slot="command-palette-search"
          className="flex h-13 shrink-0 items-center gap-2.5 px-4 shadow-[inset_0_-1px_0_var(--kura-border-subtle)]"
        >
          <Search aria-hidden className="size-4 shrink-0 text-kura-fg-subtle" />
          {pages.length > 0 && (
            <span
              data-slot="command-palette-breadcrumbs"
              className="flex shrink-0 items-center gap-1"
            >
              {pages.map((p) => (
                <span
                  key={p.id}
                  className="rounded-kura-sm bg-kura-active px-1.5 py-0.5 font-medium text-kura-fg-muted text-xs"
                >
                  {p.title}
                </span>
              ))}
            </span>
          )}
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
              (page
                ? `Search ${page.title.replace(/(…|\.\.\.)$/, "").toLowerCase()}…`
                : placeholder)
            }
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-kura-fg outline-none placeholder:text-kura-fg-subtle"
          />
          <Kbd keys={["esc"]} variant="ghost" size="sm" className="shrink-0 text-kura-fg-subtle" />
        </div>

        <div
          id={listId}
          role="listbox"
          aria-label={page ? page.title : "Commands"}
          aria-busy={isLoading || undefined}
          className="min-h-0 flex-1 scroll-py-2 overflow-y-auto overscroll-contain p-2 [scrollbar-width:thin]"
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
                    className="select-none px-2.5 pt-3 pb-1.5 font-medium text-[11px] text-kura-fg-subtle first:pt-1"
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
                  className="flex h-10 cursor-pointer select-none items-center gap-3 rounded-kura-md px-2.5 text-sm data-active:bg-kura-hover data-disabled:cursor-not-allowed data-disabled:opacity-45"
                >
                  <span
                    aria-hidden
                    className="flex size-4 shrink-0 items-center justify-center text-kura-fg-muted [&_svg]:size-4"
                  >
                    {item.icon}
                  </span>
                  <span className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="truncate text-kura-fg">{item.label}</span>
                    {item.description && (
                      <span className="truncate text-[13px] text-kura-fg-subtle">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {item.shortcut && (
                    <Kbd keys={item.shortcut} variant="ghost" size="sm" className="shrink-0" />
                  )}
                  {nested(item) && (
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-kura-fg-subtle" />
                  )}
                </div>
              </React.Fragment>
            );
          })}
          {isLoading && (
            <div
              data-slot="command-palette-loading"
              aria-hidden
              className="flex flex-col gap-1 pt-1"
            >
              {[0.62, 0.48, 0.55].map((w, i) => (
                <div key={i} className="flex h-10 items-center gap-3 px-2.5">
                  <span className="size-4 animate-kura-pulse rounded-kura-xs bg-kura-active motion-reduce:animate-none" />
                  <span
                    className="h-2.5 animate-kura-pulse rounded-full bg-kura-active motion-reduce:animate-none"
                    style={{ width: `${w * 100}%`, animationDelay: `${i * 120}ms` }}
                  />
                </div>
              ))}
            </div>
          )}
          {!isLoading && rows.length === 0 && (
            <div className="px-3 py-10 text-center text-kura-fg-subtle text-sm">{emptyMessage}</div>
          )}
        </div>

        <div
          data-slot="command-palette-footer"
          className="flex h-10 shrink-0 items-center justify-between gap-3 px-4 text-kura-fg-subtle text-xs shadow-[inset_0_1px_0_var(--kura-border-subtle)]"
        >
          <span className="truncate" aria-live="polite">
            {isLoading
              ? "Loading…"
              : pages.length > 0
                ? "⌫ to go back"
                : `${enabledRows.length} ${enabledRows.length === 1 ? "result" : "results"}`}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {activeRow && nested(activeRow.item) ? "Open" : "Run"}
            <span
              aria-hidden
              className="inline-flex size-[18px] items-center justify-center rounded-kura-xs bg-kura-hover"
            >
              <CornerDownLeft className="size-3" />
            </span>
          </span>
        </div>
      </DialogContent>
    </DialogPrimitive>
  );
}

export interface CommandPaletteTriggerProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  /** Default "Search or ask…". */
  placeholder?: string;
  /** Shortcut shown on the right. Default ["mod", "k"]. */
  shortcut?: readonly KeyName[];
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
      data-slot="command-palette-trigger"
      className={cn(
        "inline-flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-kura-lg bg-kura-surface pr-1.5 pl-3 font-kura-sans text-kura-fg-subtle text-sm shadow-kura-sm outline-none",
        "transition-[box-shadow,color] duration-(--kura-duration-fast) ease-kura-out hover:text-kura-fg-muted focus-visible:shadow-kura-focus",
        className,
      )}
      {...props}
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left">{placeholder}</span>
      <Kbd keys={shortcut} size="sm" />
    </button>
  );
}
