"use client";

import { createParts } from "@ui-sdk/react/primitive";
import { Check, ChevronRight, CircleSlash2, FileDiff, RotateCcw, X } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useFocusFallback } from "../../hooks/use-focus-fallback";
import { agentSurface } from "../../lib/agent-surface";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";
import { Button } from "../button";
import { type CodeToken, type CodeTokenType, highlightCode } from "../code-block";
import { IconButton } from "../icon-button";
import { Tooltip } from "../tooltip";
import {
  countChanges,
  type DiffFile,
  type DiffFileInput,
  type DiffFileStatus,
  type DiffHunk,
  type DiffLine,
  hunkId,
  intraLineChanges,
  languageFromPath,
  normalizeFiles,
  parseUnifiedDiff,
  type Ranges,
} from "./parse-diff";

export type HunkDecision = "accepted" | "rejected";
/** Review state: hunk id → decision. Hunks that are absent are pending. */
export type DiffReview = Readonly<Record<string, HunkDecision>>;

export interface DiffReviewChange {
  /** File the change happened in (the last file for "Accept all"). */
  path: string;
  /** "agent" when an agent connected through `createAgent` made the decision. */
  source?: "agent";
  /** Hunks whose decision changed. */
  hunkIds: string[];
  /** New decision; "pending" means the decision was undone. */
  decision: HunkDecision | "pending";
}

export interface DiffViewProps extends Omit<React.ComponentProps<"div">, "title" | "children"> {
  /** A unified diff (`git diff`, `git show`, `diff -u`, or a model's patch). Ignored when `files` is given. */
  diff?: string;
  /** Structured files instead of a diff string. Hunk lines may be DiffLine objects or raw `"+added"` / `"-removed"` / `" context"` strings. */
  files?: readonly DiffFileInput[];
  /** Header title. Default "Changes". */
  title?: React.ReactNode;
  /** Show per-hunk Accept / Reject, per-file "Accept file", and the review tally. Default true. */
  reviewable?: boolean;
  /** Review decisions keyed by hunk id (controlled). Hunk ids default to `${path}#${index}`. */
  review?: DiffReview;
  /** Initial decisions when uncontrolled. Default {}. */
  defaultReview?: DiffReview;
  /** Called with the full next review state and what changed. */
  onReviewChange?: (review: DiffReview, change: DiffReviewChange) => void;
  /** Collapsed file paths (controlled). */
  collapsed?: readonly string[];
  /** Initially collapsed file paths when uncontrolled. Default []. */
  defaultCollapsed?: readonly string[];
  onCollapsedChange?: (collapsed: string[]) => void;
  /** Collapse a file once every hunk in it has a decision. Default true. */
  collapseReviewed?: boolean;
  /** After a decision, move focus to the next pending hunk. Default true. */
  autoAdvance?: boolean;
  /** Soft-wrap long lines instead of scrolling sideways. Default false. */
  wrap?: boolean;
  /** Scroll the files inside this height (px); file headers stay pinned while scrolling. */
  maxHeight?: number;
  /** Extra controls at the end of the header (e.g. a "Commit" button). */
  actions?: React.ReactNode;
  /** Rendered when there are no files. Default "No changes". */
  empty?: React.ReactNode;
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

// Same monochrome palette as CodeBlock (override with --kura-syntax-* on a parent).
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

interface PreparedHunk {
  id: string;
  index: number;
  hunk: DiffHunk;
  tokens: CodeToken[][];
  words: Map<number, Ranges>;
}

interface PreparedFile {
  file: DiffFile;
  additions: number;
  deletions: number;
  digits: number;
  hunks: PreparedHunk[];
}

/** Highlight a hunk as two coherent texts (old side, new side) so multi-line strings and comments colour correctly. */
function highlightHunk(lines: readonly DiffLine[], language: string): CodeToken[][] {
  const oldIdx: number[] = [];
  const newIdx: number[] = [];
  lines.forEach((l, i) => {
    if (l.kind !== "add") oldIdx.push(i);
    if (l.kind !== "remove") newIdx.push(i);
  });
  const out: CodeToken[][] = lines.map(() => []);
  const oldTokens = highlightCode(oldIdx.map((i) => lines[i]!.content).join("\n"), language);
  const newTokens = highlightCode(newIdx.map((i) => lines[i]!.content).join("\n"), language);
  newIdx.forEach((i, k) => {
    out[i] = newTokens[k] ?? [];
  });
  oldIdx.forEach((i, k) => {
    if (lines[i]!.kind === "remove") out[i] = oldTokens[k] ?? [];
  });
  return out;
}

/** Split syntax tokens at word-change boundaries. */
interface Segment extends CodeToken {
  changed: boolean;
  /** Segment starts / ends a changed range (for rounded ends on a continuous mark). */
  first?: boolean;
  last?: boolean;
}

function segment(tokens: CodeToken[], ranges: Ranges | undefined): Segment[] {
  if (!ranges?.length) return tokens.map((t) => ({ ...t, changed: false }));
  const out: Segment[] = [];
  let pos = 0;
  for (const t of tokens) {
    let start = 0;
    while (start < t.text.length) {
      const abs = pos + start;
      const inside = ranges.find(([a, b]) => abs >= a && abs < b);
      const nextEdge = inside
        ? inside[1]
        : Math.min(...ranges.map(([a]) => a).filter((a) => a > abs), pos + t.text.length);
      const end = Math.min(t.text.length, nextEdge - pos);
      out.push({
        type: t.type,
        text: t.text.slice(start, end),
        changed: !!inside,
        first: !!inside && abs === inside[0],
        last: !!inside && pos + end === inside[1],
      });
      start = end;
    }
    pos += t.text.length;
  }
  return out;
}

function splitPath(path: string): [string, string] {
  const slash = path.lastIndexOf("/");
  return slash >= 0 ? [path.slice(0, slash + 1), path.slice(slash + 1)] : ["", path];
}

const STATUS_LABEL: Record<DiffFileStatus, string> = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
  renamed: "Renamed",
};

/** Five dots: green for additions, red for deletions, unlit for the rest. */
function RatioBar({ additions, deletions }: { additions: number; deletions: number }) {
  const total = additions + deletions;
  let add = total ? Math.round((additions / total) * 5) : 0;
  let del = total ? Math.round((deletions / total) * 5) : 0;
  if (additions > 0 && add === 0) add = 1;
  if (deletions > 0 && del === 0) del = 1;
  while (add + del > 5) add > del ? add-- : del--;
  return (
    <span aria-hidden data-slot="diff-view-ratio" className="flex shrink-0 gap-[3px]">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-1 rounded-full",
            i < add ? "bg-kura-success" : i < add + del ? "bg-kura-danger" : "bg-kura-dot-off",
          )}
        />
      ))}
    </span>
  );
}

function Counts({ additions, deletions }: { additions: number; deletions: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 font-kura-mono text-[12px] tabular-nums">
      <span className="text-kura-success-text">+{additions}</span>
      <span className="text-kura-danger-text">−{deletions}</span>
      <span className="sr-only">
        {additions} additions, {deletions} deletions
      </span>
    </span>
  );
}

/**
 * Review an agent's edits: parses unified diffs (or takes structured files) and renders them as
 * collapsible files with old/new line numbers, syntax highlighting and word-level change marks.
 * Each hunk can be accepted or rejected (j/k to move, a/r to decide, u to undo), each file
 * accepted at once, and the header keeps the running tally.
 */
const { Root: DiffViewRoot } = createParts(
  agentSurface("diff-view", ["accept", "reject", "undo", "acceptAll", "rejectAll"]),
  { root: "div" },
);

export function DiffView({
  diff,
  files: filesProp,
  title = "Changes",
  reviewable = true,
  review: reviewProp,
  defaultReview,
  onReviewChange,
  collapsed: collapsedProp,
  defaultCollapsed,
  onCollapsedChange,
  collapseReviewed = true,
  autoAdvance = true,
  wrap = false,
  maxHeight,
  actions,
  empty,
  className,
  style,
  onKeyDown,
  ref,
  ...props
}: DiffViewProps) {
  // "Accept all" leaves once everything is decided: focus stays in the diff, on a hunk if one
  // is showing, otherwise on the sheet.
  const rootRef = React.useRef<HTMLElement>(null);
  useFocusFallback(rootRef, () =>
    rootRef.current?.querySelector<HTMLElement>("[data-slot=diff-view-hunk][tabindex='0']"),
  );
  const files = React.useMemo(
    () => (filesProp ? normalizeFiles(filesProp) : diff ? parseUnifiedDiff(diff) : []),
    [filesProp, diff],
  );

  const prepared = React.useMemo<PreparedFile[]>(
    () =>
      files.map((file) => {
        const language = file.language ?? languageFromPath(file.path);
        const { additions, deletions } = countChanges([file]);
        let maxLine = 0;
        const hunks = file.hunks.map((hunk, index) => {
          for (const l of hunk.lines)
            maxLine = Math.max(maxLine, l.oldNumber ?? 0, l.newNumber ?? 0);
          return {
            id: hunkId(file, hunk, index),
            index,
            hunk,
            tokens: highlightHunk(hunk.lines, language),
            words: intraLineChanges(hunk.lines),
          };
        });
        return { file, additions, deletions, digits: Math.max(2, String(maxLine).length), hunks };
      }),
    [files],
  );

  const allHunks = React.useMemo(
    () => prepared.flatMap((p) => p.hunks.map((h) => ({ ...h, path: p.file.path }))),
    [prepared],
  );
  const totals = React.useMemo(() => countChanges(files), [files]);

  const [review, setReview] = useControllableState<DiffReview>({
    value: reviewProp,
    defaultValue: defaultReview ?? {},
  });
  const [collapsedList, setCollapsedList] = useControllableState<readonly string[]>({
    value: collapsedProp,
    defaultValue: defaultCollapsed ?? [],
    onChange: onCollapsedChange as ((v: readonly string[]) => void) | undefined,
  });
  const collapsed = React.useMemo(() => new Set(collapsedList), [collapsedList]);

  const reviewed = allHunks.filter((h) => review[h.id]).length;
  const [announcement, setAnnouncement] = React.useState("");

  // Roving focus between hunks.
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const visibleHunks = allHunks.filter((h) => !collapsed.has(h.path));
  const tabStop =
    activeId && visibleHunks.some((h) => h.id === activeId) ? activeId : visibleHunks[0]?.id;
  const hunkEls = React.useRef(new Map<string, HTMLElement>());
  const fileEls = React.useRef(new Map<string, HTMLElement>());
  const focusRequest = React.useRef<{ kind: "hunk" | "file"; id: string } | null>(null);
  React.useEffect(() => {
    const req = focusRequest.current;
    if (!req) return;
    focusRequest.current = null;
    const el = (req.kind === "hunk" ? hunkEls : fileEls).current.get(req.id);
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView?.({ block: "nearest" });
  });

  const focusHunk = (id: string) => {
    setActiveId(id);
    focusRequest.current = { kind: "hunk", id };
    // Focus now as well when nothing needs to re-render first.
    const el = hunkEls.current.get(id);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView?.({ block: "nearest" });
    }
  };

  const setFileCollapsed = (path: string, value: boolean) =>
    setCollapsedList((prev) => {
      const has = prev.includes(path);
      if (value === has) return prev;
      return value ? [...prev, path] : prev.filter((p) => p !== path);
    });

  const decide = (
    ids: string[],
    decision: HunkDecision | "pending",
    path: string,
    source?: "agent",
  ) => {
    const next: Record<string, HunkDecision> = { ...review };
    let changed = false;
    for (const id of ids) {
      if (decision === "pending") {
        if (id in next) {
          delete next[id];
          changed = true;
        }
      } else if (next[id] !== decision) {
        next[id] = decision;
        changed = true;
      }
    }
    if (!changed) return null;
    setReview(next);
    onReviewChange?.(
      next,
      source ? { path, hunkIds: ids, decision, source } : { path, hunkIds: ids, decision },
    );
    const done = allHunks.filter((h) => next[h.id]).length;
    const verb =
      decision === "pending" ? "Undid" : decision === "accepted" ? "Accepted" : "Rejected";
    setAnnouncement(
      `${verb} ${ids.length === 1 ? "hunk" : `${ids.length} hunks`} in ${path}. ${done} of ${allHunks.length} reviewed.`,
    );
    return next;
  };

  /** After a decision on `fromId`: collapse finished files and move on to the next pending hunk. */
  const afterDecision = (next: DiffReview, fromId: string, path: string) => {
    const fileHunks = allHunks.filter((h) => h.path === path);
    const fileDone = fileHunks.every((h) => next[h.id]);
    const willCollapse = collapseReviewed && fileDone;
    if (willCollapse) setFileCollapsed(path, true);
    if (!autoAdvance) {
      if (willCollapse) focusRequest.current = { kind: "file", id: path };
      return;
    }
    const start = allHunks.findIndex((h) => h.id === fromId);
    const order = [...allHunks.slice(start + 1), ...allHunks.slice(0, start)];
    const target = order.find(
      (h) => !next[h.id] && (!collapsed.has(h.path) || h.path === path) && h.id !== fromId,
    );
    if (target) {
      if (collapsed.has(target.path)) setFileCollapsed(target.path, false);
      setActiveId(target.id);
      focusRequest.current = { kind: "hunk", id: target.id };
    } else if (willCollapse) {
      focusRequest.current = { kind: "file", id: path };
    }
  };

  const decideHunk = (id: string, path: string, decision: HunkDecision | "pending") => {
    const next = decide([id], decision, path);
    if (next && decision !== "pending") afterDecision(next, id, path);
  };

  const decideFile = (path: string, decision: HunkDecision) => {
    const ids = allHunks.filter((h) => h.path === path).map((h) => h.id);
    const next = decide(ids, decision, path);
    if (next && collapseReviewed) {
      setFileCollapsed(path, true);
      focusRequest.current = { kind: "file", id: path };
    }
  };

  const decideAll = (decision: HunkDecision) => {
    const pending = allHunks.filter((h) => !review[h.id]);
    if (!pending.length) return;
    decide(
      pending.map((h) => h.id),
      decision,
      pending[pending.length - 1]!.path,
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return;
    const key = event.key.toLowerCase();
    const current = visibleHunks.find((h) => h.id === tabStop);
    const index = current ? visibleHunks.indexOf(current) : -1;
    if (key === "j" || key === "k") {
      const next = visibleHunks[key === "j" ? index + 1 : index - 1];
      event.preventDefault();
      if (next) focusHunk(next.id);
      else if (index === -1 && visibleHunks[0]) focusHunk(visibleHunks[0].id);
      return;
    }
    if (!reviewable || !current) return;
    // Decisions apply to the hunk that holds focus (not, say, a file header).
    const inHunk = target.closest("[data-slot=diff-view-hunk]");
    if (!inHunk || inHunk.getAttribute("data-hunk-id") !== current.id) return;
    if (key === "a" || key === "r") {
      event.preventDefault();
      decideHunk(current.id, current.path, key === "a" ? "accepted" : "rejected");
    } else if (key === "u" || key === "backspace") {
      event.preventDefault();
      decideHunk(current.id, current.path, "pending");
    }
  };

  const pendingCount = allHunks.length - reviewed;
  const titleId = React.useId();

  // An agent names a change by its file and number ("src/auth.ts change 2") or by its id.
  const hunkLabel = (h: (typeof allHunks)[number]) => `${h.path} change ${h.index + 1}`;
  const onAgentAction = (action: string, [ref]: unknown[]) => {
    if (!reviewable) throw new Error("This diff isn't open for review.");
    if (action === "acceptAll" || action === "rejectAll") {
      const pending = allHunks.filter((h) => !review[h.id]);
      decide(
        pending.map((h) => h.id),
        action === "acceptAll" ? "accepted" : "rejected",
        pending.at(-1)?.path ?? "",
        "agent",
      );
      return;
    }
    const h = allHunks.find((x) => x.id === ref || hunkLabel(x) === ref);
    if (!h) throw new Error(`No change "${String(ref)}".`);
    const decision =
      action === "accept" ? "accepted" : action === "reject" ? "rejected" : "pending";
    decide([h.id], decision, h.path, "agent");
  };

  return (
    <DiffViewRoot
      value={`${reviewed} of ${allHunks.length} reviewed`}
      items={allHunks.map((h) => ({
        value: h.id,
        label: `${hunkLabel(h)}${review[h.id] ? ` (${review[h.id]})` : ""}`,
      }))}
      onAction={onAgentAction}
      aria-labelledby={titleId}
      data-reviewable={reviewable || undefined}
      data-state={allHunks.length === 0 ? "empty" : pendingCount === 0 ? "reviewed" : "pending"}
      className={cn(
        "@container/diff flex min-w-0 flex-col overflow-clip rounded-kura-xl bg-kura-surface font-kura-sans text-[13px] text-kura-fg shadow-kura-sm outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring",
        className,
      )}
      style={{ ...syntaxVars, ...style }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      {...props}
      ref={mergeRefs(rootRef, ref)}
    >
      <div data-slot="diff-view-header" className="flex h-11 shrink-0 items-center gap-3 pr-3 pl-4">
        <span className="flex min-w-0 items-baseline gap-2.5">
          <span id={titleId} className="min-w-[3rem] truncate font-medium tracking-[-0.006em]">
            {title}
          </span>
          <span
            data-slot="diff-view-summary"
            className="flex shrink-0 items-baseline gap-2.5 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums"
          >
            <span className="hidden @[24rem]/diff:inline">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
            {files.length > 0 && (
              <Counts additions={totals.additions} deletions={totals.deletions} />
            )}
          </span>
        </span>
        <span className="flex-1" />
        {reviewable && allHunks.length > 0 && (
          <span
            data-slot="diff-view-progress"
            className="hidden shrink-0 items-center gap-2.5 @[34rem]/diff:flex"
          >
            <span className="font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
              {reviewed} of {allHunks.length} reviewed
            </span>
            {/* One dot per hunk. */}
            <span aria-hidden className="flex max-w-24 flex-wrap gap-[3px]">
              {allHunks.map((h) => (
                <span
                  key={h.id}
                  className={cn(
                    "size-1 shrink-0 rounded-full transition-colors duration-(--kura-duration-base) ease-kura-snap motion-reduce:transition-none",
                    review[h.id] === "accepted"
                      ? "bg-kura-success"
                      : review[h.id] === "rejected"
                        ? "bg-kura-danger"
                        : "bg-kura-dot-off",
                  )}
                />
              ))}
            </span>
          </span>
        )}
        {(actions || (reviewable && pendingCount > 0)) && (
          <span className="flex shrink-0 items-center gap-1">
            {reviewable && pendingCount > 0 && (
              <>
                <Button
                  size="xs"
                  variant="ghost"
                  data-slot="diff-view-reject-all"
                  onClick={() => decideAll("rejected")}
                  className="hidden @[26rem]/diff:inline-flex"
                >
                  Reject all
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  data-slot="diff-view-accept-all"
                  onClick={() => decideAll("accepted")}
                >
                  Accept all
                </Button>
              </>
            )}
            {actions}
          </span>
        )}
      </div>

      <div
        data-slot="diff-view-body"
        className={cn(
          "min-h-0 flex-1",
          maxHeight != null && "overflow-y-auto overscroll-contain [scrollbar-width:thin]",
        )}
        style={maxHeight != null ? { maxHeight } : undefined}
      >
        {prepared.length === 0 && (
          <div
            data-slot="diff-view-empty"
            className="flex h-24 flex-col items-center justify-center gap-1.5 text-kura-fg-subtle"
          >
            {empty ?? (
              <>
                <FileDiff aria-hidden className="size-4" strokeWidth={1.75} />
                <span>No changes</span>
              </>
            )}
          </div>
        )}
        {prepared.map((p, fileIndex) => {
          const { file } = p;
          const open = !collapsed.has(file.path);
          const fileReviewed = p.hunks.filter((h) => review[h.id]).length;
          const filePending = p.hunks.length - fileReviewed;
          const allAccepted =
            p.hunks.length > 0 && p.hunks.every((h) => review[h.id] === "accepted");
          const allRejected =
            p.hunks.length > 0 && p.hunks.every((h) => review[h.id] === "rejected");
          const [dir, base] = splitPath(file.path);
          const bodyId = `diff-${fileIndex}-${base.replace(/[^\w-]/g, "")}`;
          return (
            <section
              key={`${file.oldPath ?? ""}→${file.path}`}
              data-slot="diff-view-file"
              data-status={file.status}
              data-state={open ? "open" : "closed"}
              aria-label={file.path}
              className={cn(fileIndex > 0 && "border-kura-border-subtle border-t")}
            >
              <div
                data-slot="diff-view-file-header"
                className={cn(
                  "sticky top-0 z-[2] flex h-10 items-center gap-2 bg-kura-surface pr-3",
                  open && "shadow-[inset_0_-1px_0_var(--kura-border-subtle)]",
                )}
              >
                <button
                  type="button"
                  ref={(el) => {
                    if (el) fileEls.current.set(file.path, el);
                    else fileEls.current.delete(file.path);
                  }}
                  aria-expanded={open}
                  aria-controls={bodyId}
                  onClick={() => setFileCollapsed(file.path, open)}
                  className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 pl-3 text-left outline-hidden transition-colors duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)] motion-reduce:transition-none"
                >
                  <ChevronRight
                    aria-hidden
                    strokeWidth={1.75}
                    className={cn(
                      "size-3.5 shrink-0 text-kura-fg-subtle transition-transform duration-(--kura-duration-base) ease-kura-out motion-reduce:transition-none",
                      open && "rotate-90",
                    )}
                  />
                  <span
                    data-slot="diff-view-path"
                    className="flex min-w-0 items-baseline font-kura-mono text-[12.5px]"
                  >
                    {file.status === "renamed" && file.oldPath && (
                      <>
                        <span className="min-w-0 truncate text-kura-fg-subtle">{file.oldPath}</span>
                        <span aria-hidden className="shrink-0 px-1.5 text-kura-fg-subtle">
                          →
                        </span>
                        <span className="sr-only"> renamed to </span>
                      </>
                    )}
                    {/* The directory truncates first (from the left); the file name keeps priority. */}
                    {!(file.status === "renamed" && file.oldPath) && dir && (
                      <span className="hidden min-w-0 shrink-[999] truncate text-kura-fg-subtle [direction:rtl] @[24rem]/diff:inline">
                        <span className="[direction:ltr] [unicode-bidi:isolate]">{dir}</span>
                      </span>
                    )}
                    <span
                      className={cn(
                        "min-w-0 truncate font-medium text-kura-fg",
                        file.status === "deleted" &&
                          "text-kura-fg-muted line-through decoration-kura-fg-subtle/60",
                      )}
                    >
                      {file.status === "renamed" && file.oldPath ? file.path : base}
                    </span>
                  </span>
                  {file.status !== "modified" && (
                    <span
                      data-slot="diff-view-file-status"
                      className={cn(
                        "shrink-0 text-[12px]",
                        file.status === "added" && "text-kura-success-text",
                        file.status === "deleted" && "text-kura-danger-text",
                        file.status === "renamed" && "text-kura-fg-subtle",
                      )}
                    >
                      {STATUS_LABEL[file.status]}
                    </span>
                  )}
                  <span className="ml-auto flex shrink-0 items-center gap-2.5 pl-2">
                    {file.binary ? (
                      <span className="font-kura-mono text-[12px] text-kura-fg-subtle">binary</span>
                    ) : (
                      <>
                        <Counts additions={p.additions} deletions={p.deletions} />
                        <span className="hidden @[30rem]/diff:flex">
                          <RatioBar additions={p.additions} deletions={p.deletions} />
                        </span>
                      </>
                    )}
                  </span>
                </button>
                {reviewable && p.hunks.length > 0 && (
                  <span
                    data-slot="diff-view-file-review"
                    className="flex h-6 shrink-0 items-center justify-end @[30rem]/diff:w-[6.75rem]"
                  >
                    {filePending > 0 ? (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => decideFile(file.path, "accepted")}
                        aria-label={`Accept file ${file.path}`}
                      >
                        <Check aria-hidden strokeWidth={2} />
                        <span className="hidden @[30rem]/diff:inline">Accept file</span>
                      </Button>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 pr-1.5 font-medium text-[12px] animate-kura-fade-in",
                          allAccepted
                            ? "text-kura-success-text"
                            : allRejected
                              ? "text-kura-danger-text"
                              : "text-kura-fg-muted",
                        )}
                      >
                        {allRejected ? (
                          <X aria-hidden className="size-3.5" strokeWidth={2} />
                        ) : (
                          <Check aria-hidden className="size-3.5" strokeWidth={2} />
                        )}
                        <span className="hidden @[30rem]/diff:inline">
                          {allAccepted ? "Accepted" : allRejected ? "Rejected" : "Reviewed"}
                        </span>
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div id={bodyId} data-slot="diff-view-file-body" hidden={!open}>
                {open && (
                  <FileBody
                    prepared={p}
                    review={review}
                    reviewable={reviewable}
                    wrap={wrap}
                    tabStop={tabStop}
                    total={allHunks.length}
                    ordinal={(id) => allHunks.findIndex((h) => h.id === id) + 1}
                    registerHunk={(id, el) => {
                      if (el) hunkEls.current.set(id, el);
                      else hunkEls.current.delete(id);
                    }}
                    onFocusHunk={setActiveId}
                    onDecide={(id, d) => decideHunk(id, file.path, d)}
                  />
                )}
              </div>
            </section>
          );
        })}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </DiffViewRoot>
  );
}

interface FileBodyProps {
  prepared: PreparedFile;
  review: DiffReview;
  reviewable: boolean;
  wrap: boolean;
  tabStop: string | undefined;
  total: number;
  ordinal: (id: string) => number;
  registerHunk: (id: string, el: HTMLElement | null) => void;
  onFocusHunk: (id: string) => void;
  onDecide: (id: string, decision: HunkDecision | "pending") => void;
}

function FileBody({
  prepared,
  review,
  reviewable,
  wrap,
  tabStop,
  total,
  ordinal,
  registerHunk,
  onFocusHunk,
  onDecide,
}: FileBodyProps) {
  const { file, hunks, digits } = prepared;
  if (file.binary || hunks.length === 0) {
    const note = file.binary
      ? "Binary file not shown."
      : file.status === "renamed"
        ? "File renamed without content changes."
        : file.status === "deleted"
          ? "Empty file deleted."
          : file.status === "added"
            ? "Empty file added."
            : "No content changes.";
    return (
      <div className="flex h-10 items-center bg-kura-surface-sunken px-3.5 text-kura-fg-subtle">
        {note}
      </div>
    );
  }
  const gutter = `calc(${digits}ch + 1.25rem)`;
  return (
    <div className="flex flex-col font-kura-mono text-[12.5px] leading-5">
      {hunks.map((h, k) => {
        const decision = review[h.id];
        const active = tabStop === h.id;
        const range =
          h.hunk.newLines > 0
            ? `lines ${h.hunk.newStart}–${h.hunk.newStart + h.hunk.newLines - 1}`
            : `at line ${h.hunk.oldStart}`;
        return (
          // biome-ignore lint/a11y/useSemanticElements: a hunk is a focusable review region (roving tabindex), not a form fieldset
          <div
            key={h.id}
            ref={(el) => registerHunk(h.id, el)}
            data-slot="diff-view-hunk"
            data-hunk-id={h.id}
            data-review={decision ?? "pending"}
            data-active={active || undefined}
            role="group"
            aria-label={`Change ${ordinal(h.id)} of ${total}, ${file.path} ${range}, ${decision ?? "pending review"}`}
            tabIndex={active ? 0 : -1}
            onFocus={() => onFocusHunk(h.id)}
            className="group/hunk relative scroll-mt-10 outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-kura-ring"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-0.5 bg-kura-accent opacity-0 transition-opacity duration-(--kura-duration-fast) ease-kura-out group-focus-within/hunk:opacity-100 motion-reduce:transition-none"
            />
            <div
              data-slot="diff-view-hunk-header"
              className={cn(
                "flex h-8 items-center gap-3 bg-kura-surface-sunken pr-3 font-kura-mono text-[12px] text-kura-fg-subtle transition-colors duration-(--kura-duration-fast) ease-kura-out group-focus-within/hunk:bg-kura-accent-subtle/60 motion-reduce:transition-none",
                k > 0 && "border-kura-border-subtle border-t",
              )}
            >
              <span className="flex min-w-0 flex-1 items-baseline gap-2.5 pl-3.5">
                <span className="min-w-0 truncate tabular-nums @[30rem]/diff:shrink-0 @[30rem]/diff:overflow-visible">
                  @@ −{h.hunk.oldStart},{h.hunk.oldLines} +{h.hunk.newStart},{h.hunk.newLines} @@
                </span>
                {h.hunk.section && (
                  <span className="hidden min-w-0 truncate text-kura-fg-muted @[30rem]/diff:inline">
                    {h.hunk.section}
                  </span>
                )}
              </span>
              {reviewable && (
                <span
                  data-slot="diff-view-hunk-actions"
                  className="flex shrink-0 items-center gap-1 font-kura-sans"
                >
                  {decision ? (
                    <>
                      <span
                        data-slot="diff-view-hunk-state"
                        className={cn(
                          "inline-flex items-center gap-1 px-1 font-medium text-[12px] animate-kura-fade-in",
                          decision === "accepted"
                            ? "text-kura-success-text"
                            : "text-kura-danger-text",
                        )}
                      >
                        {decision === "accepted" ? (
                          <Check aria-hidden className="size-3.5" strokeWidth={2} />
                        ) : (
                          <X aria-hidden className="size-3.5" strokeWidth={2} />
                        )}
                        {decision === "accepted" ? "Accepted" : "Rejected"}
                      </span>
                      <IconButton
                        size="xs"
                        label="Undo decision"
                        shortcut={["u"]}
                        icon={<RotateCcw strokeWidth={1.75} />}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onDecide(h.id, "pending")}
                      />
                    </>
                  ) : (
                    <>
                      <Tooltip content="Reject change" shortcut={["r"]}>
                        <Button
                          size="xs"
                          variant="ghost"
                          aria-label="Reject change"
                          tabIndex={active ? 0 : -1}
                          onClick={() => onDecide(h.id, "rejected")}
                        >
                          <X aria-hidden strokeWidth={2} />
                          <span className="hidden @[30rem]/diff:inline">Reject</span>
                        </Button>
                      </Tooltip>
                      <Tooltip content="Accept change" shortcut={["a"]}>
                        <Button
                          size="xs"
                          variant="secondary"
                          aria-label="Accept change"
                          tabIndex={active ? 0 : -1}
                          onClick={() => onDecide(h.id, "accepted")}
                        >
                          <Check aria-hidden strokeWidth={2} />
                          <span className="hidden @[30rem]/diff:inline">Accept</span>
                        </Button>
                      </Tooltip>
                    </>
                  )}
                </span>
              )}
            </div>
            <HunkLines label={`Code of change ${ordinal(h.id)}`}>
              <div className={wrap ? "w-full" : "w-max min-w-full"}>
                {h.hunk.lines.map((line, i) => (
                  <Line
                    key={i}
                    line={line}
                    tokens={h.tokens[i] ?? []}
                    ranges={h.words.get(i)}
                    gutter={gutter}
                    wrap={wrap}
                    struck={decision === "rejected" && line.kind === "add"}
                    settled={decision != null}
                  />
                ))}
              </div>
            </HunkLines>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The lines of one hunk. Long lines scroll sideways, so when they overflow the region joins the
 * tab order and can be scrolled with the arrow keys.
 */
function HunkLines({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    check();
    // Mono metrics change when the web font arrives; measure again then.
    document.fonts?.ready.then(check).catch(() => {});
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, []);
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would add form semantics to code
    <div
      ref={ref}
      data-slot="diff-view-lines"
      role="group"
      aria-label={label}
      tabIndex={overflows ? 0 : undefined}
      className="overflow-x-auto outline-hidden [scrollbar-width:thin] focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]"
    >
      {children}
    </div>
  );
}

const Line = React.memo(function Line({
  line,
  tokens,
  ranges,
  gutter,
  wrap,
  struck,
  settled,
}: {
  line: DiffLine;
  tokens: CodeToken[];
  ranges: Ranges | undefined;
  gutter: string;
  wrap: boolean;
  struck: boolean;
  /** The hunk has been decided: its lines go quiet (no tints), so pending hunks stand out. */
  settled: boolean;
}) {
  const add = line.kind === "add";
  const remove = line.kind === "remove";
  const parts = segment(tokens, ranges);
  return (
    <div
      data-slot="diff-view-line"
      data-kind={line.kind}
      data-settled={settled || undefined}
      className={cn(
        "flex transition-colors duration-(--kura-duration-base) ease-kura-snap motion-reduce:transition-none",
        !settled && add && "bg-kura-success/[0.08]",
        !settled && remove && "bg-kura-danger/[0.07]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "shrink-0 select-none pr-2 text-right text-kura-fg-muted tabular-nums",
          !settled && add && "bg-kura-success/[0.1]",
          !settled && remove && "bg-kura-danger/[0.09]",
        )}
        style={{ width: gutter }}
      >
        {line.oldNumber}
      </span>
      <span
        aria-hidden
        className={cn(
          "shrink-0 select-none pr-2 text-right text-kura-fg-muted tabular-nums",
          !settled && add && "bg-kura-success/[0.1]",
          !settled && remove && "bg-kura-danger/[0.09]",
        )}
        style={{ width: gutter }}
      >
        {line.newNumber}
      </span>
      <span
        aria-hidden
        className={cn(
          "w-6 shrink-0 select-none text-center",
          add && "text-kura-success-text",
          remove && "text-kura-danger-text",
        )}
      >
        {add ? "+" : remove ? "−" : ""}
      </span>
      {(add || remove) && <span className="sr-only">{add ? "added: " : "removed: "}</span>}
      <span
        className={cn(
          "pr-4",
          wrap
            ? "min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]"
            : "flex-none whitespace-pre",
          struck && "line-through decoration-kura-fg-subtle/70",
        )}
      >
        {parts.length === 0
          ? "​"
          : parts.map((t, i) => (
              <span
                key={i}
                className={cn(
                  // A changed word is full ink on its tint, whatever its token colour.
                  !settled && t.changed ? "text-kura-fg" : tokenClass[t.type],
                  t.first && "rounded-l-[3px]",
                  t.last && "rounded-r-[3px]",
                  !settled && t.changed && add && "bg-kura-success/25",
                  !settled && t.changed && remove && "bg-kura-danger/20",
                )}
              >
                {t.text}
              </span>
            ))}
        {line.noNewline && (
          <span
            className="ml-2 select-none font-kura-sans text-[11px] text-kura-fg-subtle"
            title="No newline at end of file"
          >
            <CircleSlash2
              aria-hidden
              className="inline size-3 -translate-y-px"
              strokeWidth={1.75}
            />
            <span className="sr-only">No newline at end of file</span>
          </span>
        )}
      </span>
    </div>
  );
});

export type {
  DiffFile,
  DiffFileInput,
  DiffFileStatus,
  DiffHunk,
  DiffHunkInput,
  DiffLine,
  DiffLineKind,
} from "./parse-diff";
export {
  countChanges,
  hunkId,
  languageFromPath,
  normalizeFiles,
  parseUnifiedDiff,
  wordDiff,
} from "./parse-diff";
