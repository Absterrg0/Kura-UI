"use client";

import {
  AppWindow,
  ChevronLeft,
  ChevronRight,
  File,
  FileCode2,
  FileText,
  Image,
  RotateCw,
  Table2,
  Workflow,
} from "lucide-react";
import type * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { DotRail } from "../dot-rail";
import { IconButton } from "../icon-button";
import { StatusGlyph } from "../status-glyph";

export type ArtifactKind = "document" | "code" | "web" | "image" | "data" | "diagram" | "file";
export type ArtifactStatus = "generating" | "updating" | "ready" | "error";

export interface ArtifactCardProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** The artifact's name, e.g. "Q3 launch plan" or "pricing-table.tsx". */
  title: string;
  /** What the agent made. Picks the icon, the spoken label and the preview placeholder. Default "document". */
  kind?: ArtifactKind;
  /** Lifecycle. generating = first write; updating = an edit to an existing artifact. Default "ready". */
  status?: ArtifactStatus;
  /** Secondary line when ready, e.g. "Markdown · 1,240 words". Default: the kind's label. */
  meta?: React.ReactNode;
  /** Live line while generating/updating, e.g. "Writing section 3 of 5…". Default "Generating…" / "Updating…". */
  statusText?: React.ReactNode;
  /** Message shown when status="error". Default "Couldn't finish". */
  error?: React.ReactNode;
  /** Completion 0–1 while busy. Omit for an indeterminate sweep. */
  progress?: number;
  /** Replaces the kind icon. */
  icon?: React.ReactNode;
  /** `compact` = a one-row chip for message text (default); `preview` = a card with a thumbnail area. */
  variant?: "compact" | "preview";
  /** Thumbnail content for variant="preview" (a text excerpt, an image, a CodeBlock…). Decorative: it is hidden from screen readers. */
  preview?: React.ReactNode;
  /** Number of versions. Shows a ‹ v2/3 › switcher when greater than 1. */
  versions?: number;
  /** Shown version, 1-based (controlled). */
  version?: number;
  /** Initial version when uncontrolled. Default: the latest (`versions`). */
  defaultVersion?: number;
  /** Called with the new 1-based version from the switcher. */
  onVersionChange?: (version: number) => void;
  /** Open the artifact (e.g. in a side panel). Makes the whole card a button. */
  onOpen?: () => void;
  /** Open the artifact by navigating instead. Makes the whole card a link. */
  href?: string;
  /** The artifact is the one currently open, e.g. in the side panel. */
  selected?: boolean;
  /** Shows a Retry button when status="error". */
  onRetry?: () => void;
  /** Extra buttons at the end of the row, e.g. Copy / Download IconButtons (size "sm"). */
  actions?: React.ReactNode;
}

const KINDS: Record<ArtifactKind, { label: string; icon: React.ReactNode }> = {
  document: { label: "Document", icon: <FileText /> },
  code: { label: "Code", icon: <FileCode2 /> },
  web: { label: "Web page", icon: <AppWindow /> },
  image: { label: "Image", icon: <Image /> },
  data: { label: "Spreadsheet", icon: <Table2 /> },
  diagram: { label: "Diagram", icon: <Workflow /> },
  file: { label: "File", icon: <File /> },
};

/** Spoken label for a kind, e.g. "Web page". */
export function artifactKindLabel(kind: ArtifactKind): string {
  return KINDS[kind].label;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * A card for something an agent made — a document, a file of code, a web page, an image, a sheet
 * or a diagram. Shows what it is, whether it is still being written, which version you are on, and
 * opens it (usually into a side panel) on click.
 */
export function ArtifactCard({
  title,
  kind = "document",
  status = "ready",
  meta,
  statusText,
  error,
  progress,
  icon,
  variant = "compact",
  preview,
  versions = 1,
  version: versionProp,
  defaultVersion,
  onVersionChange,
  onOpen,
  href,
  selected = false,
  onRetry,
  actions,
  className,
  ...props
}: ArtifactCardProps) {
  const [version, setVersion] = useControllableState({
    value: versionProp,
    defaultValue: defaultVersion ?? versions,
    onChange: onVersionChange,
  });
  const k = KINDS[kind];
  const busy = status === "generating" || status === "updating";
  const compact = variant === "compact";
  const openable = onOpen != null || href != null;
  const pct = progress == null ? null : Math.round(clamp01(progress) * 100);
  const shownVersion = Math.min(Math.max(1, version), Math.max(1, versions));

  const announcement =
    status === "generating"
      ? `Generating ${title}`
      : status === "updating"
        ? `Updating ${title}`
        : status === "error"
          ? `${title} failed`
          : `${title} ready`;

  const titleClass =
    "min-w-0 truncate text-left font-medium text-kura-fg text-sm leading-5 outline-hidden";
  // The open control stretches over the whole card (after: overlay), so the card is one target
  // while the version switcher and actions stay separately clickable above it.
  const stretch =
    "after:absolute after:inset-0 after:z-0 after:rounded-[inherit] after:content-['']";
  const spoken = (
    <span className="sr-only">
      , {k.label}
      {busy ? `, ${status === "generating" ? "generating" : "updating"}` : ""}
      {status === "error" ? ", failed" : ""}
    </span>
  );

  let titleNode: React.ReactNode;
  if (href != null) {
    titleNode = (
      <a
        href={href}
        data-slot="artifact-card-open"
        aria-current={selected ? "true" : undefined}
        className={cn(titleClass, stretch)}
      >
        {title}
        {spoken}
      </a>
    );
  } else if (onOpen != null) {
    titleNode = (
      <button
        type="button"
        data-slot="artifact-card-open"
        aria-current={selected ? "true" : undefined}
        onClick={onOpen}
        className={cn(titleClass, stretch, "cursor-pointer")}
      >
        {title}
        {spoken}
      </button>
    );
  } else {
    titleNode = (
      <span data-slot="artifact-card-title" className={titleClass}>
        {title}
        {spoken}
      </span>
    );
  }

  // Known progress is a rail of dots; unknown progress is the chasing glyph in the icon tile.
  const progressLabel = `${status === "generating" ? "Generating" : "Updating"} ${title}`;
  const progressBar =
    busy &&
    (pct == null ? (
      <span
        data-slot="artifact-card-progress"
        role="progressbar"
        aria-label={progressLabel}
        className="sr-only"
      />
    ) : (
      <DotRail
        data-slot="artifact-card-progress"
        label={progressLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        value={pct / 100}
        live
        className="pointer-events-none mx-3 mb-2.5 w-auto"
      />
    ));

  return (
    <div
      data-slot="artifact-card"
      data-kind={kind}
      data-status={status}
      data-variant={variant}
      data-selected={selected || undefined}
      aria-busy={busy || undefined}
      className={cn(
        "group/artifact relative isolate flex min-w-0 flex-col overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans shadow-kura-surface",
        "transition-[background-color,transform] duration-(--kura-duration-fast) ease-kura-snap motion-reduce:transition-none",
        compact ? "w-fit max-w-full" : "w-full",
        openable &&
          "hover:bg-kura-raised has-[[data-slot=artifact-card-open]:active]:translate-y-px motion-reduce:has-[[data-slot=artifact-card-open]:active]:translate-y-0",
        selected && "bg-kura-raised outline-2 outline-kura-border-strong -outline-offset-1",
        "has-[[data-slot=artifact-card-open]:focus-visible]:outline-2 has-[[data-slot=artifact-card-open]:focus-visible]:outline-solid has-[[data-slot=artifact-card-open]:focus-visible]:outline-kura-ring has-[[data-slot=artifact-card-open]:focus-visible]:outline-offset-2",
        className,
      )}
      {...props}
    >
      {!compact && (
        <div
          data-slot="artifact-card-preview"
          aria-hidden
          inert
          className="relative mx-1.5 mt-1.5 h-36 overflow-hidden rounded-kura-lg bg-kura-surface-sunken shadow-kura-sunk"
        >
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-(--kura-duration-slow) ease-kura-snap",
              status === "updating" && "opacity-60",
            )}
          >
            {preview ?? <PreviewPlaceholder kind={kind} busy={busy} />}
          </div>
        </div>
      )}

      <div
        data-slot="artifact-card-header"
        className={cn("flex min-w-0 items-center gap-3", compact ? "p-2 pr-2.5" : "px-3 py-2.5")}
      >
        <span
          aria-hidden
          data-slot="artifact-card-icon"
          className={cn(
            "relative grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-kura-raised text-kura-fg-muted shadow-kura-raised [&_svg]:size-4",
          )}
        >
          {busy ? (
            <StatusGlyph status="running" label={null} />
          ) : status === "error" ? (
            <StatusGlyph status="failed" label={null} />
          ) : (
            (icon ?? k.icon)
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          {titleNode}
          <span
            data-slot="artifact-card-meta"
            className="flex min-w-0 items-center gap-1.5 text-kura-fg-muted text-xs leading-5"
          >
            {busy ? (
              <>
                <span className="truncate">
                  {statusText ?? (status === "generating" ? "Generating…" : "Updating…")}
                </span>
                {pct != null && (
                  <span className="shrink-0 font-kura-mono text-[11px] text-kura-fg-subtle tabular-nums">
                    {pct}%
                  </span>
                )}
              </>
            ) : status === "error" ? (
              // A reason is a sentence: it gets two lines before it is cut.
              <span className="line-clamp-2 text-kura-danger-text">
                {error ?? "Couldn't finish"}
              </span>
            ) : (
              <span className="truncate">{meta ?? k.label}</span>
            )}
          </span>
        </div>

        {versions > 1 && (
          <div
            data-slot="artifact-card-versions"
            className="relative z-10 flex shrink-0 items-center text-kura-fg-subtle"
          >
            <IconButton
              size="xs"
              label="Previous version"
              icon={<ChevronLeft />}
              disabled={shownVersion <= 1 || busy}
              onClick={() => setVersion(shownVersion - 1)}
            />
            <span className="min-w-[4.5ch] text-center font-kura-mono text-[11px] tabular-nums">
              <span className="sr-only">Version </span>v{shownVersion}
              <span className="text-kura-fg-subtle/70">
                <span aria-hidden>/</span>
                <span className="sr-only"> of </span>
                {versions}
              </span>
            </span>
            <IconButton
              size="xs"
              label="Next version"
              icon={<ChevronRight />}
              disabled={shownVersion >= versions || busy}
              onClick={() => setVersion(shownVersion + 1)}
            />
          </div>
        )}

        {((status === "error" && onRetry) || actions != null) && (
          <div
            data-slot="artifact-card-actions"
            className="relative z-10 flex shrink-0 items-center gap-0.5"
          >
            {status === "error" && onRetry && (
              <IconButton size="sm" label="Retry" icon={<RotateCw />} onClick={onRetry} />
            )}
            {actions}
          </div>
        )}

        {openable && compact && actions == null && versions <= 1 && status !== "error" && (
          <ChevronRight
            aria-hidden
            className="size-4 shrink-0 text-kura-fg-subtle transition-transform duration-(--kura-duration-fast) ease-kura-out group-hover/artifact:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/artifact:translate-x-0"
          />
        )}
      </div>

      {progressBar}

      <span className="sr-only" role="status">
        {announcement}
      </span>
    </div>
  );
}

const LINES: Record<ArtifactKind, number[]> = {
  document: [46, 0, 94, 88, 91, 62, 0, 90, 84],
  code: [38, 62, 54, 0, 70, 48, 66, 40, 0, 30],
  web: [],
  image: [],
  data: [],
  diagram: [],
  file: [72, 88, 64, 80, 56],
};

/** Drawn when no `preview` is given: the kind sketched in rows of dots. They pulse while it is written. */
function PreviewPlaceholder({ kind, busy }: { kind: ArtifactKind; busy: boolean }) {
  const pulse = busy && "animate-kura-pulse motion-reduce:animate-none";
  const lit = { "--kura-dots-color": "var(--kura-faint)" } as React.CSSProperties;

  if (kind === "web") {
    return (
      <div className={cn("flex h-full flex-col gap-3 p-4", pulse)}>
        <div className="kura-dots h-1.5 w-[18px]" style={lit} />
        <div className="kura-dots h-3 w-1/2" style={lit} />
        <div className="grid flex-1 grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="kura-dots" />
          ))}
        </div>
      </div>
    );
  }
  if (kind === "data") {
    return (
      <div className={cn("flex h-full flex-col gap-1.5 p-4", pulse)}>
        <div className="kura-dots h-1.5 w-full" style={lit} />
        <div className="kura-dots w-full flex-1 [--kura-dots-pitch-y:12px]" />
      </div>
    );
  }
  if (kind === "image" || kind === "diagram") {
    return (
      <div
        className={cn(
          "grid h-full place-items-center text-kura-faint [&_svg]:size-10 [&_svg]:stroke-[1.25]",
          pulse,
        )}
      >
        {KINDS[kind].icon}
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col gap-1.5 p-5", pulse)}>
      {LINES[kind].map((w, i) =>
        w === 0 ? (
          <span key={i} className="h-1" />
        ) : (
          <span
            key={i}
            className="kura-dots h-1.5"
            style={{
              ...(i === 0 && kind === "document" ? lit : null),
              width: `${w}%`,
              marginLeft: kind === "code" && i % 3 === 1 ? "18px" : undefined,
            }}
          />
        ),
      )}
    </div>
  );
}
