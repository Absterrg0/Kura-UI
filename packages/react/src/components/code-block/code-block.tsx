"use client";

import { Check, ChevronsDownUp, ChevronsUpDown, Copy, WrapText } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { IconButton } from "../icon-button";
import { type CodeToken, type CodeTokenType, highlightCode } from "./highlight";

export interface CodeBlockProps extends Omit<React.ComponentProps<"div">, "children" | "onCopy"> {
  /** The source to show. For diffs, pass unified-diff lines prefixed with `+`, `-` or a space. */
  code: string;
  /** Language id for highlighting and the header label, e.g. "tsx", "python", "bash", "json". */
  language?: string;
  /** File name shown in the header, e.g. "app/page.tsx". */
  filename?: string;
  /** Show a line-number gutter. Default false. */
  lineNumbers?: boolean;
  /** 1-based line numbers to emphasise, e.g. `[3, 4, 5]`. */
  highlightLines?: readonly number[];
  /** Treat `+` / `-` prefixed lines as additions and removals. Default true when language is "diff". */
  diff?: boolean;
  /** Code is still arriving: the unfinished last line stays unhighlighted until its newline lands, and a caret marks the live edge. */
  streaming?: boolean;
  /** Soft-wrap long lines (controlled). */
  wrap?: boolean;
  /** Initial wrap state when uncontrolled. Default false. */
  defaultWrap?: boolean;
  onWrapChange?: (wrap: boolean) => void;
  /** Collapse taller code to this height in px, with a “Show all N lines” control. */
  maxHeight?: number;
  /** Expanded past `maxHeight` (controlled). */
  expanded?: boolean;
  /** Initial expanded state when uncontrolled. Default false. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Show the copy button. Default true. */
  copyable?: boolean;
  /** Called with the copied text after a successful copy. */
  onCopy?: (code: string) => void;
  /** Show the filename/language header with its actions. Default true. */
  header?: boolean;
  /** Extra header actions, rendered before wrap and copy (e.g. an “Apply” button). */
  actions?: React.ReactNode;
}

type LineKind = "context" | "add" | "remove" | "meta";

interface Line {
  tokens: CodeToken[];
  kind: LineKind;
  /** Unfinished trailing line while streaming. */
  pending?: boolean;
}

const tokenClass: Record<CodeTokenType, string | undefined> = {
  plain: undefined,
  keyword: "text-(--kura-code-keyword)",
  string: "text-(--kura-code-string)",
  comment: "text-(--kura-code-comment)",
  number: "text-(--kura-code-constant)",
  constant: "text-(--kura-code-constant)",
  function: "text-(--kura-code-function)",
  type: "text-(--kura-code-type)",
  tag: "text-(--kura-code-tag)",
  attr: "text-(--kura-code-attr)",
  property: "text-(--kura-code-property)",
  variable: "text-(--kura-code-constant)",
  punctuation: "text-(--kura-code-punctuation)",
  operator: "text-(--kura-code-punctuation)",
};

/*
 * Monochrome ink. Structure is carried by grey value alone: names, tags and literals stay ink;
 * keywords, strings, types and attributes recede to fg-muted; punctuation and comments to
 * fg-subtle. No hue, so code sits in the same three inks as the rest of the interface and flips
 * with the theme. Override any of them with --kura-syntax-* on a parent.
 */
const syntaxVars = {
  "--kura-code-keyword": "var(--kura-syntax-keyword, var(--kura-fg-muted))",
  "--kura-code-string": "var(--kura-syntax-string, var(--kura-fg-muted))",
  "--kura-code-constant": "var(--kura-syntax-constant, var(--kura-fg))",
  "--kura-code-function": "var(--kura-syntax-function, var(--kura-fg))",
  "--kura-code-type": "var(--kura-syntax-type, var(--kura-fg-muted))",
  "--kura-code-tag": "var(--kura-syntax-tag, var(--kura-fg))",
  "--kura-code-attr": "var(--kura-syntax-attr, var(--kura-fg-muted))",
  "--kura-code-property": "var(--kura-syntax-property, var(--kura-fg))",
  "--kura-code-comment": "var(--kura-syntax-comment, var(--kura-fg-subtle))",
  "--kura-code-punctuation": "var(--kura-syntax-punctuation, var(--kura-fg-subtle))",
} as React.CSSProperties;

const LINE_HEIGHT = 20;

function useLines(code: string, language: string, diff: boolean, streaming: boolean): Line[] {
  // While streaming, only complete lines are tokenized; the tail is plain text. Memoized on the
  // stable prefix so new characters on the last line never re-colour earlier lines.
  const cut = streaming ? code.lastIndexOf("\n") + 1 : code.length;
  const stable = code.slice(0, cut);
  const tail = code.slice(cut);

  const stableLines = React.useMemo(() => {
    if (!stable) return [] as Line[];
    const body = streaming ? stable.slice(0, -1) : stable;
    if (!diff) {
      return highlightCode(body, language).map((tokens) => ({
        tokens,
        kind: "context" as LineKind,
      }));
    }
    const raw = body.split("\n");
    const kinds: LineKind[] = raw.map((l) =>
      l.startsWith("+++") || l.startsWith("---") || l.startsWith("@@")
        ? "meta"
        : l.startsWith("+")
          ? "add"
          : l.startsWith("-")
            ? "remove"
            : "context",
    );
    const lang = language === "diff" ? "text" : language;
    const stripped = raw
      .map((l, i) => (kinds[i] === "meta" ? "" : /^[+\- ]/.test(l) ? l.slice(1) : l))
      .join("\n");
    const tokens = highlightCode(stripped, lang);
    return raw.map((l, i) => ({
      kind: kinds[i]!,
      tokens: kinds[i] === "meta" ? [{ type: "comment" as const, text: l }] : (tokens[i] ?? []),
    }));
  }, [stable, language, diff, streaming]);

  if (!streaming) return stableLines;
  const pendingKind: LineKind = diff
    ? tail.startsWith("+")
      ? "add"
      : tail.startsWith("-")
        ? "remove"
        : "context"
    : "context";
  const pendingText = diff && /^[+\- ]/.test(tail) ? tail.slice(1) : tail;
  return [
    ...stableLines,
    { tokens: [{ type: "plain", text: pendingText }], kind: pendingKind, pending: true },
  ];
}

/**
 * Syntax-highlighted code with a filename/language header, copy with confirmation, line
 * numbers, highlighted lines, unified-diff rendering, soft-wrap toggle and a collapsible max
 * height. Highlighting is synchronous and dependency-free, and `streaming` keeps partially
 * received code from flickering.
 */
export function CodeBlock({
  code,
  language = "text",
  filename,
  lineNumbers = false,
  highlightLines,
  diff: diffProp,
  streaming = false,
  wrap: wrapProp,
  defaultWrap = false,
  onWrapChange,
  maxHeight,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  copyable = true,
  onCopy,
  header = true,
  actions,
  className,
  style,
  ...props
}: CodeBlockProps) {
  const diff = diffProp ?? language === "diff";
  const [wrap, setWrap] = useControllableState({
    value: wrapProp,
    defaultValue: defaultWrap,
    onChange: onWrapChange,
  });
  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const lines = useLines(code, language, diff, streaming);
  const highlighted = React.useMemo(() => new Set(highlightLines ?? []), [highlightLines]);

  // Collapse: measure the natural height so expanding can transition to an exact max-height.
  const contentRef = React.useRef<HTMLElement>(null);
  const [fullHeight, setFullHeight] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el || maxHeight == null) return;
    const measure = () => setFullHeight(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxHeight]);
  const estimated = lines.length * LINE_HEIGHT + 24;
  const natural = fullHeight || estimated;
  const collapsible = maxHeight != null && natural > maxHeight + LINE_HEIGHT;
  const collapsed = collapsible && !expanded;
  const hiddenLines = collapsible
    ? Math.max(0, lines.length - Math.floor((maxHeight - 12) / LINE_HEIGHT))
    : 0;

  // Copy with confirmation.
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.(code);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable (insecure context); the button simply does nothing.
    }
  };

  const digits = Math.max(2, String(lines.length).length);
  const label = filename ?? (language !== "text" ? language : "Code");

  return (
    <div
      data-slot="code-block"
      data-language={language}
      data-streaming={streaming || undefined}
      data-wrap={wrap}
      data-state={collapsible ? (expanded ? "expanded" : "collapsed") : undefined}
      className={cn(
        "group/code relative flex flex-col overflow-hidden font-kura-mono text-[13px] text-kura-fg",
        header
          ? "rounded-kura-xl bg-kura-surface shadow-kura-surface"
          : "rounded-kura-lg bg-kura-surface-sunken shadow-kura-sunk",
        className,
      )}
      style={{ ...syntaxVars, ...style }}
      {...props}
    >
      {header && (
        <div
          data-slot="code-block-header"
          className="flex h-11 shrink-0 items-center gap-2 pr-1.5 pl-4"
        >
          {/* A path reads as a path: mono, the folder dimmed and the file name in ink. A bare
              language label stays quiet. */}
          <span
            data-slot="code-block-title"
            className="flex min-w-0 flex-1 items-baseline font-kura-mono text-[12.5px]"
          >
            {filename ? (
              <>
                {filename.includes("/") && (
                  <span className="min-w-0 shrink-[999] truncate text-kura-fg-subtle [direction:rtl]">
                    <span className="[direction:ltr] [unicode-bidi:isolate]">
                      {filename.slice(0, filename.lastIndexOf("/") + 1)}
                    </span>
                  </span>
                )}
                <span className="min-w-0 truncate text-kura-fg">
                  {filename.slice(filename.lastIndexOf("/") + 1)}
                </span>
              </>
            ) : (
              <span className="truncate text-[12px] text-kura-fg-subtle">
                {language !== "text" ? language : ""}
              </span>
            )}
          </span>
          {/* A filename with an extension already says the language; only a bare name needs it. */}
          {filename && language !== "text" && !/\.[a-z0-9]+$/i.test(filename) && (
            <span
              data-slot="code-block-language"
              className="select-none px-1.5 font-kura-mono text-[12px] text-kura-fg-subtle"
            >
              {language}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            {actions}
            {collapsible && (
              <IconButton
                size="sm"
                label={expanded ? "Collapse code" : "Expand code"}
                aria-expanded={expanded}
                icon={expanded ? <ChevronsDownUp /> : <ChevronsUpDown />}
                onClick={() => setExpanded(!expanded)}
              />
            )}
            <IconButton
              size="sm"
              label={wrap ? "Disable line wrap" : "Wrap lines"}
              aria-pressed={wrap}
              icon={<WrapText />}
              className="aria-pressed:bg-kura-active aria-pressed:text-kura-fg"
              onClick={() => setWrap(!wrap)}
            />
            {copyable && (
              <IconButton
                size="sm"
                label={copied ? "Copied" : "Copy code"}
                data-copied={copied}
                onClick={copy}
                icon={
                  <span className="relative grid size-3.5 place-items-center [&>svg]:col-start-1 [&>svg]:row-start-1">
                    <Copy
                      className={cn(
                        "size-3.5 transition-[opacity,scale,filter] duration-(--kura-duration-fast) ease-kura-out motion-reduce:transition-opacity",
                        copied &&
                          "scale-75 opacity-0 blur-[2px] motion-reduce:scale-100 motion-reduce:blur-none",
                      )}
                    />
                    <Check
                      className={cn(
                        "size-3.5 text-kura-success-text transition-[opacity,scale,filter] duration-(--kura-duration-fast) ease-kura-out motion-reduce:transition-opacity",
                        !copied &&
                          "scale-75 opacity-0 blur-[2px] motion-reduce:scale-100 motion-reduce:blur-none",
                      )}
                    />
                  </span>
                }
              />
            )}
          </span>
          <span className="sr-only" role="status" aria-live="polite">
            {copied ? "Copied to clipboard" : ""}
          </span>
        </div>
      )}

      <div
        data-slot="code-block-body"
        className={cn(
          "relative",
          header &&
            "mx-1.5 mb-1.5 overflow-hidden rounded-kura-lg bg-kura-surface-sunken shadow-kura-sunk",
          maxHeight != null &&
            "overflow-hidden transition-[max-height] duration-(--kura-duration-slow) ease-kura-out motion-reduce:transition-none",
        )}
        style={
          maxHeight != null
            ? { maxHeight: collapsed ? maxHeight : collapsible ? natural : undefined }
            : undefined
        }
      >
        <section
          ref={contentRef}
          aria-label={`${label} code`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable code must be keyboard-scrollable
          tabIndex={0}
          className={cn(
            "overflow-x-auto py-3 leading-5 outline-hidden [scrollbar-width:thin]",
            "focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]",
          )}
        >
          <code
            data-slot="code-block-code"
            className={cn("block", wrap ? "w-full" : "w-max min-w-full")}
          >
            {lines.map((line, index) => {
              const n = index + 1;
              const isHighlighted = highlighted.has(n);
              const last = index === lines.length - 1;
              return (
                <span
                  key={index}
                  data-slot="code-block-line"
                  data-line={n}
                  data-highlighted={isHighlighted || undefined}
                  data-diff={diff ? line.kind : undefined}
                  className={cn(
                    "flex px-4",
                    isHighlighted && "bg-kura-hover",
                    line.kind === "add" && "bg-kura-success/10",
                    line.kind === "remove" && "bg-kura-danger/10",
                  )}
                >
                  {lineNumbers && (
                    <span
                      aria-hidden
                      data-slot="code-block-line-number"
                      className="mr-4 shrink-0 select-none text-right text-kura-fg-subtle tabular-nums"
                      style={{ width: `${digits}ch` }}
                    >
                      {n}
                    </span>
                  )}
                  {diff && (
                    <span
                      aria-hidden
                      className={cn(
                        "mr-3 w-[1ch] shrink-0 select-none",
                        line.kind === "add" && "text-kura-success-text",
                        line.kind === "remove" && "text-kura-danger-text",
                      )}
                    >
                      {line.kind === "add" ? "+" : line.kind === "remove" ? "−" : " "}
                    </span>
                  )}
                  {diff && (line.kind === "add" || line.kind === "remove") && (
                    <span className="sr-only">{line.kind === "add" ? "added: " : "removed: "}</span>
                  )}
                  <span
                    className={cn(
                      "min-w-0 flex-1",
                      wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
                      line.pending && "text-kura-fg-muted",
                    )}
                  >
                    {line.tokens.length === 0 && !line.pending
                      ? "​"
                      : line.tokens.map((t, i) => (
                          <span key={i} className={tokenClass[t.type]}>
                            {t.text}
                          </span>
                        ))}
                    {streaming && last && (
                      <span
                        aria-hidden
                        data-slot="code-block-caret"
                        className="ml-px inline-block h-[1.15em] w-[0.55em] translate-y-[0.2em] rounded-[2px] bg-kura-fg/70 animate-kura-pulse motion-reduce:animate-none"
                      />
                    )}
                  </span>
                </span>
              );
            })}
          </code>
        </section>

        {collapsed && (
          <div
            data-slot="code-block-expand"
            className="absolute inset-x-0 bottom-0 flex justify-center bg-kura-surface-sunken py-2 shadow-[0_-1px_0_var(--kura-border-subtle)]"
          >
            <button
              type="button"
              aria-expanded={false}
              onClick={() => setExpanded(true)}
              className={cn(
                "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[8px] bg-kura-raised px-2.5 font-kura-sans text-kura-fg-muted text-xs shadow-kura-raised outline-hidden",
                "transition-[color,background-color,transform] duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-raised-hover hover:text-kura-fg focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring focus-visible:outline-offset-2 active:translate-y-px motion-reduce:active:translate-y-0",
              )}
            >
              <ChevronsUpDown aria-hidden className="size-3" />
              Show {hiddenLines} more {hiddenLines === 1 ? "line" : "lines"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
