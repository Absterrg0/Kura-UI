// ARIA listbox pattern: the textarea keeps focus and points at the highlighted option with
// aria-activedescendant, so options are intentionally not focusable and have no key handlers.
// biome-ignore-all lint/a11y/useSemanticElements: rich rows cannot be native <option>/<fieldset>.
// biome-ignore-all lint/a11y/useFocusableInteractive: focus stays in the textarea (activedescendant).
// biome-ignore-all lint/a11y/useKeyWithClickEvents: keyboard selection is handled on the textarea.
// biome-ignore-all lint/a11y/noStaticElementInteractions: the panel only prevents mousedown to keep textarea focus.
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";
import type { KeyName } from "../../lib/keys";
import { Kbd } from "../kbd";
import { type CaretRect, getCaretRect } from "./caret-position";

export interface SlashCommand {
  /** Stable id. */
  id: string;
  /** Command name shown in the menu and matched by the query, e.g. "Summarize". */
  label: string;
  /** One line under/next to the label. */
  description?: string;
  /** 16px icon, e.g. a lucide icon. */
  icon?: React.ReactNode;
  /** Group heading, e.g. "Actions". Groups keep first-seen order. */
  group?: string;
  /** Extra words that should match, e.g. ["tl;dr", "shorten"]. */
  keywords?: readonly string[];
  /** Shortcut displayed on the right (display only). */
  shortcut?: readonly KeyName[];
  /**
   * Text that replaces the typed "/query" when chosen, e.g. "Summarize this: ". Omit to just
   * remove the "/query" (action commands such as "/clear").
   */
  insert?: string;
  disabled?: boolean;
}

export interface SlashCommandSelectDetails {
  /** What the user had typed after the trigger. */
  query: string;
}

type Field = HTMLTextAreaElement | HTMLInputElement;

export interface SlashCommandMenuProps
  extends Omit<React.ComponentProps<"div">, "children" | "onSelect"> {
  /** The field to watch: a ref to a <textarea> or <input> (e.g. ComposerInput's `ref`). */
  textareaRef: React.RefObject<Field | null>;
  /** Available commands. */
  commands: readonly SlashCommand[];
  /** Called after the command's `insert` text has replaced the "/query". */
  onSelect?: (command: SlashCommand, details: SlashCommandSelectDetails) => void;
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Trigger character. Default "/". It only triggers at the start of a line or after a space. */
  trigger?: string;
  /** `auto` opens below the caret unless there is no room, then above. Default "auto". */
  side?: "auto" | "top" | "bottom";
  /** Default "No commands". Pass null to close the menu when nothing matches. */
  emptyMessage?: string | null;
  /** Turn the menu off without unmounting it. */
  disabled?: boolean;
}

interface Match {
  start: number;
  end: number;
  query: string;
}

function score(cmd: SlashCommand, q: string): number {
  if (!q) return 1;
  const label = cmd.label.toLowerCase();
  if (label.startsWith(q)) return 4;
  if (label.split(/[\s-_/]+/).some((w) => w.startsWith(q))) return 3;
  if (label.includes(q)) return 2;
  const extra = [cmd.description ?? "", ...(cmd.keywords ?? [])].join(" ").toLowerCase();
  return extra.includes(q) ? 1 : 0;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replace a range of a (possibly React-controlled) field, keeping native undo where possible. */
function replaceRange(field: Field, start: number, end: number, text: string): void {
  field.focus();
  field.setSelectionRange(start, end);
  let ok = false;
  try {
    ok =
      typeof document.execCommand === "function" &&
      document.execCommand(text ? "insertText" : "delete", false, text);
  } catch {
    ok = false;
  }
  if (!ok || field.value.slice(start, start + text.length) !== text) {
    field.setRangeText(text, start, end, "end");
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

const MENU_WIDTH = 320;
const GAP = 6;

/**
 * An inline "/" command menu anchored to the caret of a textarea. It never takes focus: typing
 * keeps filtering, ↑↓ move the highlight, Enter or Tab inserts, Escape dismisses.
 */
export function SlashCommandMenu({
  textareaRef,
  commands,
  onSelect,
  onOpenChange,
  trigger = "/",
  side = "auto",
  emptyMessage = "No commands",
  disabled = false,
  className,
  style,
  ...props
}: SlashCommandMenuProps) {
  const [match, setMatch] = React.useState<Match | null>(null);
  const [active, setActive] = React.useState<string | null>(null);
  const [caret, setCaret] = React.useState<CaretRect | null>(null);
  const [placement, setPlacement] = React.useState<"top" | "bottom">("bottom");
  const dismissedAt = React.useRef<number | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  // First pointer position seen over the open menu. A menu that opens under a resting cursor
  // receives a synthetic move; only real movement after that may change the highlight.
  const pointerOrigin = React.useRef<{ x: number; y: number } | null>(null);
  const baseId = React.useId();
  const listId = `${baseId}-list`;
  const optionId = React.useCallback(
    (id: string) => `${baseId}-opt-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    [baseId],
  );

  const query = match?.query.toLowerCase() ?? "";
  const results = React.useMemo(() => {
    if (!match) return [];
    return commands
      .map((cmd, index) => ({ cmd, index, s: score(cmd, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.index - b.index)
      .map((r) => r.cmd);
  }, [commands, match, query]);

  const groups = React.useMemo(() => {
    const map = new Map<string, SlashCommand[]>();
    for (const cmd of results) {
      const key = cmd.group ?? "";
      const list = map.get(key);
      if (list) list.push(cmd);
      else map.set(key, [cmd]);
    }
    return [...map.entries()];
  }, [results]);
  const ordered = React.useMemo(() => groups.flatMap(([, list]) => list), [groups]);
  const enabled = React.useMemo(() => ordered.filter((c) => !c.disabled), [ordered]);
  const open = !!match && !disabled && (results.length > 0 || emptyMessage !== null);

  // Detect "/query" right before the caret.
  const detect = React.useCallback(() => {
    const field = textareaRef.current;
    if (!field || disabled) {
      setMatch(null);
      return;
    }
    const caretPos = field.selectionStart ?? 0;
    if (caretPos !== field.selectionEnd) {
      setMatch(null);
      return;
    }
    const before = field.value.slice(0, caretPos);
    const re = new RegExp(`(^|\\s)${escapeRegExp(trigger)}([^\\s${escapeRegExp(trigger)}]{0,32})$`);
    const m = re.exec(before);
    if (!m) {
      dismissedAt.current = null;
      setMatch(null);
      return;
    }
    const q = m[2] ?? "";
    const start = caretPos - q.length - trigger.length;
    if (dismissedAt.current === start) {
      setMatch(null);
      return;
    }
    setMatch((prev) =>
      prev && prev.start === start && prev.end === caretPos && prev.query === q
        ? prev
        : { start, end: caretPos, query: q },
    );
  }, [textareaRef, trigger, disabled]);

  // Watch the field. Input is observed on `document` (after React's own root listener) so a
  // controlled field has committed its new value before we react to it.
  React.useEffect(() => {
    const field = textareaRef.current;
    if (!field) return;
    const onInput = (e: Event) => {
      if (e.target === field) detect();
    };
    const onSelectionChange = () => {
      if (document.activeElement === field) detect();
    };
    const onBlur = () => setMatch(null);
    document.addEventListener("input", onInput);
    field.addEventListener("click", detect);
    field.addEventListener("blur", onBlur);
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("input", onInput);
      field.removeEventListener("click", detect);
      field.removeEventListener("blur", onBlur);
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [textareaRef, detect]);

  // Keep the highlight valid.
  React.useEffect(() => {
    if (!open) {
      setActive(null);
      pointerOrigin.current = null;
      return;
    }
    setActive((current) =>
      current && enabled.some((c) => c.id === current) ? current : (enabled[0]?.id ?? null),
    );
  }, [open, enabled]);

  const openRef = React.useRef(open);
  React.useEffect(() => {
    if (openRef.current !== open) {
      openRef.current = open;
      onOpenChange?.(open);
    }
  }, [open, onOpenChange]);

  // Position at the trigger character, flipping above when there is no room below.
  const reposition = React.useCallback(() => {
    const field = textareaRef.current;
    if (!field || !match) return;
    const rect = getCaretRect(field, match.start);
    if (!rect) return;
    setCaret(rect);
    const menuHeight = menuRef.current?.offsetHeight ?? 280;
    const below = window.innerHeight - (rect.top + rect.height);
    const above = rect.top;
    setPlacement(
      side === "auto" ? (below < menuHeight + GAP + 8 && above > below ? "top" : "bottom") : side,
    );
  }, [textareaRef, match, side]);

  React.useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  React.useEffect(() => {
    if (!open) return;
    const onChange = () => reposition();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [open, reposition]);

  const choose = React.useCallback(
    (cmd: SlashCommand) => {
      const field = textareaRef.current;
      if (!field || !match || cmd.disabled) return;
      const q = match.query;
      setMatch(null);
      dismissedAt.current = null;
      replaceRange(field, match.start, match.end, cmd.insert ?? "");
      onSelect?.(cmd, { query: q });
    },
    [textareaRef, match, onSelect],
  );

  // Keyboard: handled on the field itself, before React handlers (e.g. Composer's Enter).
  React.useEffect(() => {
    const field = textareaRef.current;
    if (!field || !open) return;
    const onKeyDown = (event: Event) => {
      const e = event as KeyboardEvent;
      if (e.isComposing) return;
      const move = (delta: number) => {
        if (enabled.length === 0) return;
        const i = enabled.findIndex((c) => c.id === active);
        const next = enabled[(i + delta + enabled.length) % enabled.length];
        if (next) setActive(next.id);
      };
      let handled = true;
      switch (e.key) {
        case "ArrowDown":
          move(1);
          break;
        case "ArrowUp":
          move(-1);
          break;
        case "Enter":
        case "Tab": {
          if (e.shiftKey && e.key === "Enter") {
            handled = false;
            break;
          }
          const cmd = enabled.find((c) => c.id === active);
          if (cmd) choose(cmd);
          else handled = false;
          break;
        }
        case "Escape":
          dismissedAt.current = match?.start ?? null;
          setMatch(null);
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    field.addEventListener("keydown", onKeyDown);
    return () => field.removeEventListener("keydown", onKeyDown);
  }, [textareaRef, open, enabled, active, choose, match]);

  // ARIA wiring on the field we do not own.
  React.useEffect(() => {
    const field = textareaRef.current;
    if (!field) return;
    if (open) {
      field.setAttribute("aria-controls", listId);
      field.setAttribute("aria-autocomplete", "list");
      if (active) field.setAttribute("aria-activedescendant", optionId(active));
      else field.removeAttribute("aria-activedescendant");
    } else {
      field.removeAttribute("aria-controls");
      field.removeAttribute("aria-activedescendant");
      field.removeAttribute("aria-autocomplete");
    }
  }, [textareaRef, open, active, listId, optionId]);

  React.useEffect(() => {
    if (!active) return;
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: "nearest" });
  }, [active, optionId]);

  if (!open || typeof document === "undefined") return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const left = caret ? Math.max(8, Math.min(caret.left - 10, vw - MENU_WIDTH - 8)) : 0;
  const positioned: React.CSSProperties = caret
    ? placement === "bottom"
      ? { left, top: caret.top + caret.height + GAP }
      : { left, bottom: window.innerHeight - caret.top + GAP }
    : { left: 0, top: 0, visibility: "hidden" };

  return createPortal(
    <div
      ref={menuRef}
      data-slot="slash-command-menu"
      data-side={placement}
      data-state="open"
      onMouseDown={(e) => e.preventDefault()}
      style={{ ...positioned, width: MENU_WIDTH, ...style }}
      className={cn(
        "fixed z-50 flex max-h-[min(18rem,50vh)] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-kura-xl bg-kura-raised font-kura-sans text-kura-fg shadow-kura-popover",
        "animate-kura-pop-in data-[side=bottom]:origin-top-left data-[side=top]:origin-bottom-left",
        className,
      )}
      {...props}
    >
      <div
        id={listId}
        role="listbox"
        aria-label="Commands"
        className="scroll-py-1 overflow-y-auto overscroll-contain p-1 [scrollbar-width:thin]"
      >
        {results.length === 0 && (
          <div className="px-3 py-5 text-center text-[13px] text-kura-fg-subtle">
            {emptyMessage}
          </div>
        )}
        {groups.map(([group, list]) => {
          const headingId = `${baseId}-g-${group.replace(/\W/g, "_") || "default"}`;
          return (
            <div
              key={group || "__default"}
              role="group"
              aria-labelledby={group ? headingId : undefined}
              data-slot="slash-command-menu-group"
              className="not-first:mt-1"
            >
              {group && (
                <div
                  id={headingId}
                  className="select-none px-2 pt-1.5 pb-1 text-[12px] text-kura-fg-subtle"
                >
                  {group}
                </div>
              )}
              {list.map((cmd) => {
                const isActive = cmd.id === active;
                return (
                  <div
                    key={cmd.id}
                    id={optionId(cmd.id)}
                    role="option"
                    aria-selected={isActive}
                    aria-disabled={cmd.disabled || undefined}
                    data-slot="slash-command-menu-item"
                    data-active={isActive || undefined}
                    data-disabled={cmd.disabled || undefined}
                    onPointerMove={(e) => {
                      const origin = pointerOrigin.current;
                      if (!origin) {
                        pointerOrigin.current = { x: e.clientX, y: e.clientY };
                        return;
                      }
                      if (origin.x === e.clientX && origin.y === e.clientY) return;
                      if (!cmd.disabled && !isActive) setActive(cmd.id);
                    }}
                    onClick={() => choose(cmd)}
                    className="flex cursor-pointer select-none items-center gap-2.5 rounded-[9px] px-1.5 py-1.5 data-active:bg-kura-hover data-disabled:cursor-not-allowed data-disabled:opacity-45"
                  >
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center text-kura-fg-muted [&_svg]:size-4"
                    >
                      {cmd.icon ?? (
                        <span className="font-kura-mono text-[11px] leading-none">{trigger}</span>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-[13px] leading-5">
                        <Highlight text={cmd.label} query={query} />
                      </span>
                      {cmd.description && (
                        <span className="truncate text-kura-fg-subtle text-xs leading-4">
                          {cmd.description}
                        </span>
                      )}
                    </span>
                    {cmd.shortcut && <Kbd keys={cmd.shortcut} size="sm" className="shrink-0" />}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div
        data-slot="slash-command-menu-footer"
        aria-hidden
        className="flex h-9 shrink-0 items-center gap-3 px-3 text-[12px] text-kura-fg-subtle shadow-[inset_0_1px_0_var(--kura-border-subtle)]"
      >
        <span className="inline-flex items-center gap-1">
          <Kbd keys={["up"]} size="sm" />
          <Kbd keys={["down"]} size="sm" />
          navigate
        </span>
        <span className="inline-flex items-center gap-1">
          <Kbd keys={["enter"]} size="sm" />
          insert
        </span>
        <span className="inline-flex items-center gap-1">
          <Kbd keys={["esc"]} size="sm" />
          dismiss
        </span>
      </div>
      <span role="status" className="sr-only">
        {results.length === 0
          ? (emptyMessage ?? "")
          : `${results.length} ${results.length === 1 ? "command" : "commands"} available`}
      </span>
    </div>,
    document.body,
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query);
  if (i === -1) return <>{text}</>;
  return (
    <>
      <span className="text-kura-fg-muted">{text.slice(0, i)}</span>
      <span className="text-kura-fg">{text.slice(i, i + query.length)}</span>
      <span className="text-kura-fg-muted">{text.slice(i + query.length)}</span>
    </>
  );
}
