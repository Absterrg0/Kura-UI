"use client";

import { ChevronRight, FileDiff, List, ListTree } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { IconButton } from "../icon-button";
import { StatusGlyph } from "../status-glyph";

export type FileChangeStatus = "A" | "M" | "D" | "R";

export interface FileChange {
  /** Path relative to the repo root, e.g. "src/auth/client.ts". */
  path: string;
  /** A = added, M = modified, D = deleted, R = renamed. */
  status: FileChangeStatus;
  /** Previous path for renames. */
  oldPath?: string;
  additions?: number;
  deletions?: number;
  /** The agent is touching this file right now. */
  state?: "reading" | "editing";
}

export interface FileChangesProps extends Omit<React.ComponentProps<"div">, "title" | "onSelect"> {
  /** The files the agent touched. */
  files: readonly FileChange[];
  /** Header title. Default "Changes". */
  title?: React.ReactNode;
  /** "tree" groups by folder (single-child folders compacted, like VS Code); "list" is flat. Controlled. */
  view?: "tree" | "list";
  /** Initial view when uncontrolled. Default "tree". */
  defaultView?: "tree" | "list";
  onViewChange?: (view: "tree" | "list") => void;
  /** Show the tree/list toggle in the header. Default true. */
  viewToggle?: boolean;
  /** The selected file (controlled). */
  selectedPath?: string | null;
  /** Initially selected file when uncontrolled. */
  defaultSelectedPath?: string | null;
  /** Called when a file is selected (click, Enter or Space). */
  onSelect?: (path: string) => void;
  /** Folder paths collapsed initially, e.g. ["src/auth/__tests__"]. */
  defaultCollapsed?: readonly string[];
  /** Scroll the rows inside this height (px). */
  maxHeight?: number;
  /** Extra header controls. */
  actions?: React.ReactNode;
  /** Rendered when `files` is empty. Default "No changes yet". */
  empty?: React.ReactNode;
}

const STATUS_CLASS: Record<FileChangeStatus, string> = {
  A: "text-kura-success-text",
  M: "text-kura-fg-subtle",
  D: "text-kura-danger-text",
  R: "text-kura-fg-muted",
};
const STATUS_WORD: Record<FileChangeStatus, string> = {
  A: "added",
  M: "modified",
  D: "deleted",
  R: "renamed",
};

interface FolderNode {
  kind: "folder";
  /** Full path, e.g. "src/auth". */
  path: string;
  /** Display name; compacted chains read "src/auth". */
  name: string;
  children: TreeNode[];
}
interface FileNode {
  kind: "file";
  path: string;
  name: string;
  file: FileChange;
}
type TreeNode = FolderNode | FileNode;

function buildTree(files: readonly FileChange[]): TreeNode[] {
  const root: FolderNode = { kind: "folder", path: "", name: "", children: [] };
  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let node = root;
    parts.slice(0, -1).forEach((part) => {
      const path = node.path ? `${node.path}/${part}` : part;
      let next = node.children.find((c): c is FolderNode => c.kind === "folder" && c.path === path);
      if (!next) {
        next = { kind: "folder", path, name: part, children: [] };
        node.children.push(next);
      }
      node = next;
    });
    node.children.push({
      kind: "file",
      path: file.path,
      name: parts[parts.length - 1] ?? file.path,
      file,
    });
  }
  const compact = (n: TreeNode): TreeNode => {
    if (n.kind === "file") return n;
    let folder = n;
    while (folder.children.length === 1 && folder.children[0]!.kind === "folder") {
      const only = folder.children[0] as FolderNode;
      folder = { ...only, name: `${folder.name}/${only.name}` };
    }
    const children = folder.children
      .map(compact)
      .sort((a, b) =>
        a.kind !== b.kind ? (a.kind === "folder" ? -1 : 1) : a.name.localeCompare(b.name),
      );
    return { ...folder, children };
  };
  return root.children
    .map(compact)
    .sort((a, b) =>
      a.kind !== b.kind ? (a.kind === "folder" ? -1 : 1) : a.name.localeCompare(b.name),
    );
}

interface Row {
  node: TreeNode;
  depth: number;
  posinset: number;
  setsize: number;
}

function flatten(nodes: TreeNode[], collapsed: Set<string>, depth = 0, out: Row[] = []): Row[] {
  nodes.forEach((node, i) => {
    out.push({ node, depth, posinset: i + 1, setsize: nodes.length });
    if (node.kind === "folder" && !collapsed.has(node.path))
      flatten(node.children, collapsed, depth + 1, out);
  });
  return out;
}

function folderStats(node: FolderNode): { files: number; live: boolean } {
  let files = 0;
  let live = false;
  const walk = (n: TreeNode) => {
    if (n.kind === "file") {
      files++;
      if (n.file.state === "editing") live = true;
    } else n.children.forEach(walk);
  };
  walk(node);
  return { files, live };
}

function Counts({ file }: { file: FileChange }) {
  if (file.state === "editing")
    return (
      <span className="inline-flex items-center gap-1.5 text-kura-fg-muted">
        <StatusGlyph status="running" size="sm" label={null} />
        editing
      </span>
    );
  if (file.state === "reading") return <span className="text-kura-fg-subtle">reading</span>;
  if (file.additions == null && file.deletions == null) return null;
  return (
    <>
      {file.additions != null && file.additions > 0 && (
        <span className="text-kura-success-text">+{file.additions}</span>
      )}
      {file.deletions != null && file.deletions > 0 && (
        <span className="text-kura-danger-text">−{file.deletions}</span>
      )}
    </>
  );
}

/**
 * What the agent touched: a compact tree (or flat list) of changed files with status letters
 * (A/M/D/R in semantic colour), +/− counts, a live "editing" marker on files being written, a
 * summary header, single selection and full tree keyboard navigation.
 */
export function FileChanges({
  files,
  title = "Changes",
  view: viewProp,
  defaultView = "tree",
  onViewChange,
  viewToggle = true,
  selectedPath: selectedProp,
  defaultSelectedPath = null,
  onSelect,
  defaultCollapsed,
  maxHeight,
  actions,
  empty,
  className,
  ...props
}: FileChangesProps) {
  const [view, setView] = useControllableState({
    value: viewProp,
    defaultValue: defaultView,
    onChange: onViewChange,
  });
  const [selected, setSelected] = useControllableState<string | null>({
    value: selectedProp,
    defaultValue: defaultSelectedPath,
  });
  const [collapsed, setCollapsed] = React.useState(() => new Set(defaultCollapsed ?? []));

  const tree = React.useMemo(() => buildTree(files), [files]);
  const rows: Row[] = React.useMemo(
    () =>
      view === "tree"
        ? flatten(tree, collapsed)
        : [...files]
            .sort((a, b) => a.path.localeCompare(b.path))
            .map((file, i, all) => ({
              node: {
                kind: "file" as const,
                path: file.path,
                name: file.path.slice(file.path.lastIndexOf("/") + 1),
                file,
              },
              depth: 0,
              posinset: i + 1,
              setsize: all.length,
            })),
    [view, tree, collapsed, files],
  );

  const totals = React.useMemo(
    () =>
      files.reduce(
        (acc, f) => ({
          additions: acc.additions + (f.additions ?? 0),
          deletions: acc.deletions + (f.deletions ?? 0),
        }),
        { additions: 0, deletions: 0 },
      ),
    [files],
  );

  // Roving focus.
  const [focusKey, setFocusKey] = React.useState<string | null>(null);
  const rowKey = (r: Row) => `${r.node.kind}:${r.node.path}`;
  const tabStop =
    rows.find((r) => rowKey(r) === focusKey) ??
    rows.find((r) => r.node.path === selected && r.node.kind === "file") ??
    rows[0];
  const rowEls = React.useRef(new Map<string, HTMLElement>());
  const focusRow = (r: Row | undefined) => {
    if (!r) return;
    const key = rowKey(r);
    setFocusKey(key);
    rowEls.current.get(key)?.focus();
  };

  const toggleFolder = (path: string, open?: boolean) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      const isOpen = !next.has(path);
      if ((open ?? !isOpen) === isOpen) return prev;
      if (isOpen) next.add(path);
      else next.delete(path);
      return next;
    });

  const select = (path: string) => {
    setSelected(path);
    onSelect?.(path);
  };

  const onKeyDown = (event: React.KeyboardEvent, row: Row, index: number) => {
    const { node } = row;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusRow(rows[index + 1]);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusRow(rows[index - 1]);
        break;
      case "Home":
        event.preventDefault();
        focusRow(rows[0]);
        break;
      case "End":
        event.preventDefault();
        focusRow(rows[rows.length - 1]);
        break;
      case "ArrowRight":
        if (node.kind !== "folder") return;
        event.preventDefault();
        if (collapsed.has(node.path)) toggleFolder(node.path, true);
        else focusRow(rows[index + 1]);
        break;
      case "ArrowLeft": {
        event.preventDefault();
        if (node.kind === "folder" && !collapsed.has(node.path)) {
          toggleFolder(node.path, false);
          break;
        }
        for (let k = index - 1; k >= 0; k--)
          if (rows[k]!.depth < row.depth) {
            focusRow(rows[k]);
            break;
          }
        break;
      }
      case "Enter":
      case " ":
        event.preventDefault();
        if (node.kind === "folder") toggleFolder(node.path);
        else select(node.path);
        break;
    }
  };

  const isTree = view === "tree";

  return (
    <div
      data-slot="file-changes"
      data-view={view}
      className={cn(
        "@container/files flex min-w-0 flex-col overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans text-[13px] text-kura-fg shadow-kura-sm",
        className,
      )}
      {...props}
    >
      <div
        data-slot="file-changes-header"
        className="flex h-11 shrink-0 items-center gap-2.5 pr-1.5 pl-4"
      >
        <span className="min-w-[3rem] truncate font-medium tracking-[-0.006em]">{title}</span>
        <span
          data-slot="file-changes-summary"
          className="flex shrink-0 items-baseline gap-2 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums"
        >
          <span className="hidden truncate @[20rem]/files:inline">
            {files.length} {files.length === 1 ? "file" : "files"}
          </span>
          {(totals.additions > 0 || totals.deletions > 0) && (
            <span className="flex shrink-0 gap-1.5">
              <span className="text-kura-success-text">+{totals.additions}</span>
              <span className="text-kura-danger-text">−{totals.deletions}</span>
              <span className="sr-only">
                {totals.additions} additions, {totals.deletions} deletions
              </span>
            </span>
          )}
        </span>
        <span className="flex-1" />
        {actions}
        {viewToggle && files.length > 0 && (
          <span className="flex shrink-0 items-center gap-0.5">
            <IconButton
              size="xs"
              label="Tree view"
              aria-pressed={isTree}
              icon={<ListTree strokeWidth={1.75} />}
              className="aria-pressed:bg-kura-active aria-pressed:text-kura-fg"
              onClick={() => setView("tree")}
            />
            <IconButton
              size="xs"
              label="List view"
              aria-pressed={!isTree}
              icon={<List strokeWidth={1.75} />}
              className="aria-pressed:bg-kura-active aria-pressed:text-kura-fg"
              onClick={() => setView("list")}
            />
          </span>
        )}
      </div>

      {files.length === 0 ? (
        <div
          data-slot="file-changes-empty"
          className="flex h-24 flex-col items-center justify-center gap-1.5 text-kura-fg-subtle"
        >
          {empty ?? (
            <>
              <FileDiff aria-hidden className="size-4" strokeWidth={1.75} />
              <span>No changes yet</span>
            </>
          )}
        </div>
      ) : (
        // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is tree or listbox, both take a label
        <div
          data-slot="file-changes-rows"
          role={isTree ? "tree" : "listbox"}
          aria-label={typeof title === "string" ? title : "Changed files"}
          className={cn("pb-1.5", maxHeight != null && "overflow-y-auto [scrollbar-width:thin]")}
          style={maxHeight != null ? { maxHeight } : undefined}
        >
          {rows.map((row, index) => {
            const { node } = row;
            const key = rowKey(row);
            const focusable = tabStop && rowKey(tabStop) === key;
            const indent = 8 + row.depth * 14;
            const guides = isTree
              ? Array.from({ length: row.depth }, (_, k) => (
                  <span
                    key={k}
                    aria-hidden
                    data-slot="file-changes-guide"
                    className="kura-leader pointer-events-none absolute inset-y-0 w-[5px]"
                    style={{ left: 8 + k * 14 + 4.5 }}
                  />
                ))
              : null;
            const ref = (el: HTMLDivElement | null) => {
              if (el) rowEls.current.set(key, el);
              else rowEls.current.delete(key);
            };
            const rowClass =
              "relative mx-1.5 flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-[9px] pr-2.5 outline-hidden transition-colors duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)] motion-reduce:transition-none";

            if (node.kind === "folder") {
              const open = !collapsed.has(node.path);
              const stats = folderStats(node);
              return (
                <div
                  key={key}
                  ref={ref}
                  tabIndex={focusable ? 0 : -1}
                  onFocus={() => setFocusKey(key)}
                  onKeyDown={(e) => onKeyDown(e, row, index)}
                  style={{ paddingLeft: indent }}
                  role="treeitem"
                  aria-level={row.depth + 1}
                  aria-posinset={row.posinset}
                  aria-setsize={row.setsize}
                  aria-expanded={open}
                  data-slot="file-changes-folder"
                  data-state={open ? "open" : "closed"}
                  onClick={() => {
                    setFocusKey(key);
                    toggleFolder(node.path);
                  }}
                  className={cn(rowClass, "text-kura-fg-muted")}
                >
                  {guides}
                  <ChevronRight
                    aria-hidden
                    strokeWidth={1.75}
                    className={cn(
                      "size-3.5 shrink-0 text-kura-fg-subtle transition-transform duration-(--kura-duration-base) ease-kura-out motion-reduce:transition-none",
                      open && "rotate-90",
                    )}
                  />
                  <span className="min-w-0 truncate font-kura-mono text-[12.5px]">{node.name}</span>
                  {!open && (
                    <span className="ml-auto flex shrink-0 items-center gap-2 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
                      {stats.live && (
                        <StatusGlyph
                          status="running"
                          size="sm"
                          label="contains a file being edited"
                        />
                      )}
                      {stats.files}
                    </span>
                  )}
                </div>
              );
            }

            const { file } = node;
            const isSelected = selected === file.path;
            const dir = file.path.slice(0, file.path.length - node.name.length);
            const live = file.state === "editing";
            return (
              // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is treeitem (tree view) or option (list view); aria-level is only set for treeitem
              // biome-ignore lint/a11y/noStaticElementInteractions: role is treeitem or option (an expression biome cannot resolve)
              <div
                key={key}
                ref={ref}
                tabIndex={focusable ? 0 : -1}
                onFocus={() => setFocusKey(key)}
                onKeyDown={(e) => onKeyDown(e, row, index)}
                style={{ paddingLeft: indent }}
                role={isTree ? "treeitem" : "option"}
                aria-level={isTree ? row.depth + 1 : undefined}
                aria-posinset={row.posinset}
                aria-setsize={row.setsize}
                aria-selected={isSelected}
                data-slot="file-changes-file"
                data-status={file.status}
                data-state={file.state}
                data-selected={isSelected || undefined}
                onClick={() => {
                  setFocusKey(key);
                  select(file.path);
                }}
                className={cn(
                  rowClass,
                  "animate-kura-fade-in",
                  isSelected && "bg-kura-active hover:bg-kura-active",
                )}
                title={file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}
              >
                {guides}
                {isTree && <span aria-hidden className="w-3.5 shrink-0" />}
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span
                    data-slot="file-changes-name"
                    className={cn(
                      "min-w-0 shrink truncate font-kura-mono text-[12.5px]",
                      file.status === "D"
                        ? "text-kura-fg-subtle line-through decoration-kura-fg-subtle/60"
                        : "text-kura-fg",
                    )}
                  >
                    {node.name}
                  </span>
                  {!isTree && dir && (
                    <span className="min-w-0 flex-1 truncate text-left font-kura-mono text-[12px] text-kura-fg-subtle [direction:rtl]">
                      <span className="[direction:ltr] [unicode-bidi:isolate]">
                        {dir.slice(0, -1)}
                      </span>
                    </span>
                  )}
                </span>
                <span
                  data-slot="file-changes-counts"
                  className="flex shrink-0 items-center gap-1.5 pl-2 font-kura-mono text-[12px] tabular-nums"
                >
                  <Counts file={file} />
                </span>
                <span
                  data-slot="file-changes-status"
                  className={cn(
                    "w-3 shrink-0 text-right font-kura-mono font-medium text-[12px]",
                    STATUS_CLASS[file.status],
                  )}
                >
                  <span aria-hidden>{file.status}</span>
                  <span className="sr-only">
                    , {STATUS_WORD[file.status]}
                    {live ? ", being edited" : file.state === "reading" ? ", being read" : ""}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
