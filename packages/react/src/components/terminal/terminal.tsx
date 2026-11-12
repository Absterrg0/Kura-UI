"use client";

import { createParts } from "@ui-sdk/react/primitive";
import { ArrowDown, Check, ChevronsUpDown, Copy } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useElapsed } from "../../hooks/use-elapsed";
import { agentSurface } from "../../lib/agent-surface";
import { cn } from "../../lib/cn";
import { formatClock, formatDuration } from "../../lib/format";
import { IconButton } from "../icon-button";
import { StatusGlyph } from "../status-glyph";
import { type AnsiColor, AnsiScreen, type AnsiStyle, type ScreenLine } from "./ansi";

export type TerminalStatus = "idle" | "running" | "done" | "failed";

export interface TerminalProps
  extends Omit<React.ComponentProps<"div">, "title" | "children" | "onCopy"> {
  /** The command that was run, shown on the prompt line, e.g. "pnpm test". */
  command?: string;
  /** Output: an array of lines, or one (growing) string. ANSI colour codes and `\r` progress updates are rendered. */
  lines?: readonly string[] | string;
  /** Output as an async stream of chunks (e.g. a child process's stdout). Takes precedence over `lines`. */
  stream?: AsyncIterable<string>;
  /** Called once `stream` has ended. */
  onStreamEnd?: () => void;
  /** Lifecycle. Default: from `exitCode` (0 → done, else failed), "running" while `stream` is open, otherwise "idle". */
  status?: TerminalStatus;
  /** Process exit code, shown as a badge once finished. */
  exitCode?: number | null;
  /** When the command started, for the live clock. Default: when status became "running". */
  startedAt?: Date | number;
  /** Final duration in ms (persisted runs). Default: measured from running → finished. */
  duration?: number;
  /** Working directory shown in the header, e.g. "~/acme/web". */
  cwd?: string;
  /** Header title. Default: the cwd, or "Terminal". */
  title?: React.ReactNode;
  /** Prompt glyph before the command. Default "$". */
  prompt?: string;
  /** Height of the scrolling viewport in px. Default 320. Output sticks to the bottom while you're there. */
  maxHeight?: number;
  /** Collapse to the last N lines with a "Show all N lines" control. */
  maxLines?: number;
  /** Showing every line past `maxLines` (controlled). */
  expanded?: boolean;
  /** Initial expanded state when uncontrolled. Default false. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Soft-wrap long lines. Default true. */
  wrap?: boolean;
  /** Show the copy button (copies the command and plain output). Default true. */
  copyable?: boolean;
  /** Called with the copied text after a successful copy. */
  onCopy?: (text: string) => void;
  /** Show the header row. Default true. */
  header?: boolean;
  /** Extra header controls, e.g. a Stop button. */
  actions?: React.ReactNode;
}

const COLOR_VAR: Record<AnsiColor, string> = {
  black: "var(--kura-terminal-black, var(--kura-fg-subtle))",
  red: "var(--kura-terminal-red, var(--kura-danger-text))",
  green: "var(--kura-terminal-green, var(--kura-success-text))",
  // Monochrome ink: only red and green keep a hue (failures and passes). Ember is never output.
  yellow: "var(--kura-terminal-yellow, var(--kura-fg))",
  blue: "var(--kura-terminal-blue, var(--kura-fg-muted))",
  magenta: "var(--kura-terminal-magenta, var(--kura-fg-muted))",
  cyan: "var(--kura-terminal-cyan, var(--kura-fg-muted))",
  white: "var(--kura-terminal-white, var(--kura-fg))",
  gray: "var(--kura-terminal-gray, var(--kura-fg-subtle))",
};

function spanStyle(s: AnsiStyle): { className?: string; style?: React.CSSProperties } {
  const fg = s.fg && COLOR_VAR[s.fg];
  const bg = s.bg && COLOR_VAR[s.bg];
  const style: React.CSSProperties = {};
  if (s.inverse) {
    style.backgroundColor = fg ?? "var(--kura-fg)";
    style.color = bg ?? "var(--kura-surface-sunken)";
  } else {
    if (fg) style.color = fg;
    // Dim is a colour (ink-3), never an opacity: it has to stay readable in both themes.
    else if (s.dim) style.color = "var(--kura-fg-subtle)";
    if (bg) {
      style.backgroundColor = bg;
      if (!fg) style.color = "var(--kura-surface-sunken)";
    }
  }
  const className = cn(
    s.bold && "font-semibold",
    s.italic && "italic",
    s.underline && "underline underline-offset-2",
    s.strike && "line-through",
    (s.inverse || s.bg) && "rounded-[2px]",
  );
  return {
    className: className || undefined,
    style: Object.keys(style).length ? style : undefined,
  };
}

/** Incrementally feeds append-only text into a screen, re-parsing only when the text was replaced. */
function useScreen(text: string) {
  const ref = React.useRef<{ fed: string; screen: AnsiScreen } | null>(null);
  if (!ref.current || !text.startsWith(ref.current.fed)) {
    ref.current = { fed: "", screen: new AnsiScreen() };
  }
  const cur = ref.current;
  if (text.length > cur.fed.length) {
    cur.screen.write(text.slice(cur.fed.length));
    cur.fed = text;
  }
  return cur.screen;
}

const Row = React.memo(function Row({
  screen,
  line,
  cursor,
}: {
  screen: AnsiScreen;
  line: ScreenLine;
  version: number;
  cursor: boolean;
}) {
  const spans = screen.spans(line);
  return (
    <div data-slot="terminal-line" className="min-h-5">
      {spans.map((s, i) => {
        const { className, style } = spanStyle(s.style);
        return className || style ? (
          <span key={i} className={className} style={style}>
            {s.text}
          </span>
        ) : (
          <React.Fragment key={i}>{s.text}</React.Fragment>
        );
      })}
      {cursor && <Cursor />}
    </div>
  );
});

function Cursor() {
  return (
    <span
      aria-hidden
      data-slot="terminal-cursor"
      className="ml-px inline-block h-[15px] w-[7.5px] translate-y-[3px] bg-kura-fg/75 animate-kura-pulse motion-reduce:animate-none"
    />
  );
}

const { Root: TerminalRoot } = createParts(agentSurface("terminal", []), {
  root: "div",
});

/**
 * Streamed command output that looks and behaves like a real terminal: a prompt line, ANSI
 * colours mapped to Kura tokens, carriage-return progress bars, a live clock and exit-code badge,
 * stick-to-bottom scrolling with "Jump to latest", a collapsed tail with "Show all N lines", and
 * copy of the plain text.
 */
export function Terminal({
  command,
  lines,
  stream,
  onStreamEnd,
  status: statusProp,
  exitCode,
  startedAt,
  duration,
  cwd,
  title,
  prompt = "$",
  maxHeight = 320,
  maxLines,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  wrap = true,
  copyable = true,
  onCopy,
  header = true,
  actions,
  className,
  style,
  ...props
}: TerminalProps) {
  // --- output ---------------------------------------------------------------------------------
  const [streamed, setStreamed] = React.useState("");
  const [streamOpen, setStreamOpen] = React.useState(() => stream != null);
  const onStreamEndRef = React.useRef(onStreamEnd);
  onStreamEndRef.current = onStreamEnd;
  React.useEffect(() => {
    if (!stream) return;
    let cancelled = false;
    setStreamed("");
    setStreamOpen(true);
    (async () => {
      try {
        for await (const chunk of stream) {
          if (cancelled) return;
          setStreamed((prev) => prev + chunk);
        }
      } catch {
        // A failing stream ends the output; the caller reports the error via status/exitCode.
      }
      if (cancelled) return;
      setStreamOpen(false);
      onStreamEndRef.current?.();
    })();
    return () => {
      cancelled = true;
    };
  }, [stream]);

  const text = stream ? streamed : typeof lines === "string" ? lines : (lines ?? []).join("\n");
  const screen = useScreen(text);

  const status: TerminalStatus =
    statusProp ??
    (exitCode != null
      ? exitCode === 0
        ? "done"
        : "failed"
      : stream && streamOpen
        ? "running"
        : "idle");
  const running = status === "running";

  // Drop the empty line after a trailing newline, except where the cursor sits while running.
  let rows = screen.lines;
  if (rows.length > 0 && rows[rows.length - 1]!.text === "" && (!running || !command))
    rows = rows.slice(0, -1);
  if (rows.length === 1 && rows[0]!.text === "" && !running) rows = [];
  const total = rows.length;

  // --- timing ---------------------------------------------------------------------------------
  const runStart = React.useRef<number | null>(null);
  if (running && runStart.current == null) runStart.current = Date.now();
  const since = startedAt ?? runStart.current;
  const elapsed = useElapsed(since, running, 1000);
  const shownDuration = duration ?? (status === "done" || status === "failed" ? elapsed : null);

  // --- collapse -------------------------------------------------------------------------------
  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const collapsed = maxLines != null && total > maxLines && !expanded;
  const visible = collapsed ? rows.slice(total - maxLines) : rows;

  // --- stick to bottom ------------------------------------------------------------------------
  const viewport = React.useRef<HTMLDivElement>(null);
  const stuck = React.useRef(true);
  const [atBottom, setAtBottom] = React.useState(true);
  const [unseen, setUnseen] = React.useState(0);
  const lastTotal = React.useRef(total);
  const lastVersion = rows[rows.length - 1]?.version ?? 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the last line changes (lastVersion) or the collapse changes the height
  React.useLayoutEffect(() => {
    const el = viewport.current;
    const added = total - lastTotal.current;
    lastTotal.current = total;
    if (!el) return;
    if (stuck.current) el.scrollTop = el.scrollHeight;
    else if (added > 0) setUnseen((n) => n + added);
  }, [total, lastVersion, collapsed]);
  const onScroll = () => {
    const el = viewport.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    stuck.current = bottom;
    setAtBottom(bottom);
    if (bottom) setUnseen(0);
  };
  const jumpToLatest = () => {
    const el = viewport.current;
    if (!el) return;
    stuck.current = true;
    setAtBottom(true);
    setUnseen(0);
    el.scrollTo?.({ top: el.scrollHeight, behavior: "smooth" });
    if (!el.scrollTo) el.scrollTop = el.scrollHeight;
  };

  // --- copy -----------------------------------------------------------------------------------
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(copyTimer.current), []);
  const copy = async () => {
    const out = [
      command ? `${prompt} ${command}` : null,
      ...rows.map((l) => l.text.replace(/\s+$/, "")),
    ]
      .filter((l) => l != null)
      .join("\n");
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      onCopy?.(out);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (insecure context): nothing to do.
    }
  };

  // --- announcements (only on finish, never per line) -----------------------------------------
  const [announcement, setAnnouncement] = React.useState("");
  const prevStatus = React.useRef(status);
  React.useEffect(() => {
    if (prevStatus.current === status) return;
    prevStatus.current = status;
    const what = command ?? "Command";
    if (status === "running") setAnnouncement(`${what} running`);
    else if (status === "done")
      setAnnouncement(`${what} finished${exitCode != null ? `, exit code ${exitCode}` : ""}`);
    else if (status === "failed")
      setAnnouncement(`${what} failed${exitCode != null ? `, exit code ${exitCode}` : ""}`);
  }, [status, command, exitCode]);

  const finished = status === "done" || status === "failed";
  const heading = title ?? cwd ?? "Terminal";

  return (
    <TerminalRoot
      value={`${status}${exitCode != null ? `, exit ${exitCode}` : ""}`}
      aria-label={command ? `Terminal: ${command}` : "Terminal"}
      data-status={status}
      data-state={
        maxLines != null && total > maxLines ? (expanded ? "expanded" : "collapsed") : undefined
      }
      className={cn(
        "@container/terminal relative flex min-w-0 flex-col overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans text-kura-fg shadow-kura-sm",
        className,
      )}
      style={style}
      {...props}
    >
      {header && (
        <div data-slot="terminal-header" className="flex h-11 shrink-0 items-center gap-2.5 px-4">
          {status !== "idle" && (
            <StatusGlyph
              status={status === "running" ? "running" : status === "done" ? "done" : "failed"}
              size="sm"
              label={null}
            />
          )}
          <span
            data-slot="terminal-title"
            className="min-w-0 truncate font-semibold text-[13px] tracking-[-0.01em]"
          >
            {heading}
          </span>
          {title != null && cwd && (
            <span className="hidden min-w-0 truncate font-kura-mono text-[12px] text-kura-fg-subtle @[24rem]/terminal:inline">
              {cwd}
            </span>
          )}
          <span className="flex-1" />
          <span
            data-slot="terminal-meta"
            className="flex shrink-0 items-center gap-2 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums"
          >
            {running && elapsed != null && (
              <span data-slot="terminal-elapsed" className="min-w-[4ch] text-right">
                {formatClock(elapsed)}
              </span>
            )}
            {finished && shownDuration != null && (
              <span data-slot="terminal-elapsed">{formatDuration(shownDuration)}</span>
            )}
            {finished && exitCode != null && (
              <span
                data-slot="terminal-exit-code"
                className={cn(
                  "animate-kura-fade-in",
                  exitCode === 0 ? "text-kura-fg-subtle" : "text-kura-danger-text",
                )}
              >
                exit {exitCode}
              </span>
            )}
          </span>
          {(copyable || actions) && (
            <span className="-mr-2.5 flex shrink-0 items-center gap-0.5">
              {actions}
              {copyable && (
                <IconButton
                  size="sm"
                  label={copied ? "Copied" : "Copy output"}
                  data-copied={copied}
                  onClick={copy}
                  icon={
                    <span className="relative grid size-3.5 place-items-center [&>svg]:col-start-1 [&>svg]:row-start-1">
                      <Copy
                        className={cn(
                          "size-3.5 transition-[opacity,scale] duration-(--kura-duration-fast) ease-kura-out motion-reduce:transition-opacity",
                          copied && "scale-75 opacity-0 motion-reduce:scale-100",
                        )}
                      />
                      <Check
                        className={cn(
                          "size-3.5 text-kura-success-text transition-[opacity,scale] duration-(--kura-duration-fast) ease-kura-out motion-reduce:transition-opacity",
                          !copied && "scale-75 opacity-0 motion-reduce:scale-100",
                        )}
                      />
                    </span>
                  }
                />
              )}
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "relative mx-1.5 mb-1.5 min-h-0 flex-1 overflow-hidden rounded-kura-lg bg-kura-surface-sunken shadow-kura-sunk",
          !header && "mt-1.5",
        )}
      >
        <div
          ref={viewport}
          data-slot="terminal-output"
          role="log"
          aria-live="off"
          aria-label={command ? `Output of ${command}` : "Terminal output"}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: the scrollable log must be keyboard-scrollable
          tabIndex={0}
          onScroll={onScroll}
          className={cn(
            "h-full overflow-y-auto overscroll-contain px-3.5 py-3 font-kura-mono text-[12.5px] text-kura-fg-muted leading-5 outline-hidden [scrollbar-width:thin] [tab-size:4]",
            "focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]",
            wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre",
          )}
          style={{ maxHeight }}
        >
          <div className={wrap ? undefined : "w-max min-w-full"}>
            {command && (
              <div data-slot="terminal-command" className="min-h-5 text-kura-fg">
                <span aria-hidden className="mr-2 select-none text-kura-fg-subtle">
                  {prompt}
                </span>
                <span className="font-medium">{command}</span>
                {running && total === 0 && <Cursor />}
              </div>
            )}
            {collapsed && (
              <button
                type="button"
                data-slot="terminal-expand"
                aria-expanded={false}
                onClick={() => setExpanded(true)}
                className="my-1 flex h-6 w-full cursor-pointer items-center gap-2 rounded-kura-sm px-1.5 -mx-1.5 font-kura-sans text-[12px] text-kura-fg-subtle outline-hidden transition-colors duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover hover:text-kura-fg-muted focus-visible:shadow-kura-focus motion-reduce:transition-none"
                style={{ width: "calc(100% + 0.75rem)" }}
              >
                <ChevronsUpDown aria-hidden className="size-3.5" strokeWidth={1.75} />
                Show all {total} lines
                <span className="h-px flex-1 bg-kura-border-subtle" />
              </button>
            )}
            {visible.map((line, i) => (
              <Row
                key={collapsed ? total - maxLines + i : i}
                screen={screen}
                line={line}
                version={line.version}
                cursor={running && i === visible.length - 1 && (total > 0 || !command)}
              />
            ))}
            {!command && total === 0 && !running && (
              <div className="font-kura-sans text-[13px] text-kura-fg-subtle">No output</div>
            )}
            {expanded && maxLines != null && total > maxLines && (
              <button
                type="button"
                data-slot="terminal-collapse"
                aria-expanded
                onClick={() => setExpanded(false)}
                className="mt-1 inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-kura-sm px-1.5 -mx-1.5 font-kura-sans text-[12px] text-kura-fg-subtle outline-hidden hover:bg-kura-hover hover:text-kura-fg-muted focus-visible:shadow-kura-focus"
              >
                Show last {maxLines} lines
              </button>
            )}
          </div>
        </div>
        {!atBottom && (
          <button
            type="button"
            data-slot="terminal-jump"
            onClick={jumpToLatest}
            className={cn(
              "absolute bottom-3 left-1/2 inline-flex h-7 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-[9px] bg-kura-raised px-2.5 text-[12px] text-kura-fg-muted shadow-kura-popover outline-hidden animate-kura-pop-in",
              "transition-colors duration-(--kura-duration-fast) ease-kura-out hover:text-kura-fg focus-visible:shadow-kura-focus motion-reduce:transition-none",
            )}
          >
            <ArrowDown aria-hidden className="size-3.5" strokeWidth={1.75} />
            {unseen > 0 ? `${unseen} new ${unseen === 1 ? "line" : "lines"}` : "Jump to latest"}
          </button>
        )}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
        {copied ? " Copied to clipboard" : ""}
      </span>
    </TerminalRoot>
  );
}
