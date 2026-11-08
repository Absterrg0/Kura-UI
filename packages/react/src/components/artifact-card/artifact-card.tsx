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
import { IconButton } from "../icon-button";
import { ShimmerText } from "../shimmer-text";

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

  const titleClass = cn(
    "min-w-0 truncate text-left text-kura-fg outline-none",
    compact
      ? "font-medium text-sm leading-5"
      : // A file name is set as what it is (mono); anything with a human title speaks in the serif.
        kind === "code" || kind === "file"
        ? "font-kura-mono text-[13px] leading-6"
        : "pb-0.5 font-kura-display text-[17px] leading-6 tracking-[-0.005em]",
  );
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

  const progressBar = busy && (
    <div
      data-slot="artifact-card-progress"
      role="progressbar"
      aria-label={`${status === "generating" ? "Generating" : "Updating"} ${title}`}
      aria-valuemin={pct == null ? undefined : 0}
      aria-valuemax={pct == null ? undefined : 100}
      aria-valuenow={pct ?? undefined}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-0.5 overflow-hidden bg-kura-accent-subtle"
    >
      {pct == null ? (
        <div
          className="h-full animate-kura-shimmer [background-size:250%_100%] motion-reduce:animate-none motion-reduce:bg-none"
          style={
            {
              "--kura-shimmer-duration": "1.4s",
              backgroundImage:
                "linear-gradient(90deg, transparent 30%, var(--kura-accent) 50%, transparent 70%)",
            } as React.CSSProperties
          }
        />
      ) : (
        <div
          className="h-full origin-left bg-kura-accent transition-transform duration-(--kura-duration-slow) ease-kura-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      )}
    </div>
  );

  return (
    <div
      data-slot="artifact-card"
      data-kind={kind}
      data-status={status}
      data-variant={variant}
      data-selected={selected || undefined}
      aria-busy={busy || undefined}
      className={cn(
        "group/artifact relative isolate flex min-w-0 flex-col overflow-hidden rounded-kura-md bg-kura-surface font-kura-sans shadow-kura-sm",
        "transition-[box-shadow,transform] duration-(--kura-duration-fast) ease-kura-out motion-reduce:transition-none",
        compact ? "w-fit max-w-full" : "w-full",
        openable &&
          "hover:shadow-kura-md has-[[data-slot=artifact-card-open]:active]:scale-[0.99] motion-reduce:has-[[data-slot=artifact-card-open]:active]:scale-100",
        selected &&
          "shadow-[0_0_0_1px_var(--kura-fg-subtle),0_0_0_4px_var(--kura-hover)] hover:shadow-[0_0_0_1px_var(--kura-fg-subtle),0_0_0_4px_var(--kura-hover)]",
        "has-[[data-slot=artifact-card-open]:focus-visible]:shadow-kura-focus",
        className,
      )}
      {...props}
    >
      {!compact && (
        <div className="relative">
          {/* A pressed well with the artifact laid in it as a sheet of brighter print stock. */}
          <div
            data-slot="artifact-card-preview"
            aria-hidden
            inert
            className="relative h-36 overflow-hidden bg-kura-surface-sunken shadow-[inset_0_-1px_0_var(--kura-border-subtle)]"
          >
            <div
              data-slot="artifact-card-sheet"
              className={cn(
                "absolute inset-x-5 top-4 -bottom-2 overflow-hidden rounded-t-kura-xs bg-kura-surface-raised shadow-kura-sm",
                "transition-[transform,opacity] duration-(--kura-duration-slow) ease-kura-out motion-reduce:transition-opacity",
                openable &&
                  "group-hover/artifact:-translate-y-1 motion-reduce:group-hover/artifact:translate-y-0",
                status === "updating" && "opacity-60",
              )}
            >
              <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
                {preview ?? <PreviewPlaceholder kind={kind} busy={busy} />}
              </div>
            </div>
          </div>
          {progressBar}
        </div>
      )}

      <div
        data-slot="artifact-card-header"
        className={cn("flex min-w-0 items-center gap-3", compact ? "p-2 pr-2.5" : "px-3.5 py-3")}
      >
        <span
          aria-hidden
          data-slot="artifact-card-icon"
          className={cn(
            "relative grid size-9 shrink-0 place-items-center rounded-kura-sm bg-kura-surface-sunken text-kura-fg-muted shadow-[inset_0_0_0_1px_var(--kura-border-subtle)] [&_svg]:size-4 [&_svg]:stroke-[1.75]",
            "transition-colors duration-(--kura-duration-base) ease-kura-out",
            busy && "bg-kura-accent-subtle text-kura-accent-text",
            status === "error" && "bg-kura-danger-subtle text-kura-danger-text",
          )}
        >
          {icon ?? k.icon}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          {titleNode}
          <span
            data-slot="artifact-card-meta"
            className="flex min-w-0 items-center gap-1.5 font-kura-mono text-[11px] text-kura-fg-subtle leading-5 tracking-[0.01em]"
          >
            {busy ? (
              <>
                <ShimmerText className="truncate font-kura-sans text-kura-fg-muted text-xs">
                  {statusText ?? (status === "generating" ? "Generating…" : "Updating…")}
                </ShimmerText>
                {pct != null && (
                  <span className="shrink-0 text-kura-accent-text tabular-nums">{pct}%</span>
                )}
              </>
            ) : status === "error" ? (
              <span className="truncate font-kura-sans text-kura-danger-text text-xs">
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

      {compact && progressBar}

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

/** Drawn when no `preview` is given: a quiet sketch of the kind (and a shimmer while it is written). */
function PreviewPlaceholder({ kind, busy }: { kind: ArtifactKind; busy: boolean }) {
  const bar = cn(
    "h-1.5 rounded-full bg-kura-gray-5",
    busy &&
      "animate-kura-shimmer [background-size:250%_100%] motion-reduce:animate-none motion-reduce:bg-none",
  );
  const shimmer: React.CSSProperties | undefined = busy
    ? {
        backgroundImage:
          "linear-gradient(90deg, var(--kura-gray-5) 35%, var(--kura-gray-7) 50%, var(--kura-gray-5) 65%)",
      }
    : undefined;

  if (kind === "web") {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 rounded-full bg-kura-gray-6" />
          ))}
          <span className="ml-2 h-1.5 w-24 rounded-full bg-kura-gray-5" />
        </div>
        <div className={cn(bar, "h-3 w-1/2")} style={shimmer} />
        <div className="grid flex-1 grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-kura-sm bg-kura-gray-4" />
          ))}
        </div>
      </div>
    );
  }
  if (kind === "data") {
    return (
      <div className="grid grid-cols-4 gap-px p-4 opacity-80">
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className={cn("h-4 bg-kura-gray-4", i < 4 && "bg-kura-gray-6")} />
        ))}
      </div>
    );
  }
  if (kind === "image" || kind === "diagram") {
    return (
      <div className="grid h-full place-items-center text-kura-fg-subtle/60 [&_svg]:size-10 [&_svg]:stroke-[1.25]">
        {KINDS[kind].icon}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 p-5">
      {LINES[kind].map((w, i) =>
        w === 0 ? (
          <span key={i} className="h-1" />
        ) : (
          <span
            key={i}
            className={cn(bar, i === 0 && kind === "document" && "h-2.5 bg-kura-gray-6")}
            style={{
              ...shimmer,
              width: `${w}%`,
              marginLeft: kind === "code" && i % 3 === 1 ? "1rem" : undefined,
            }}
          />
        ),
      )}
    </div>
  );
}
