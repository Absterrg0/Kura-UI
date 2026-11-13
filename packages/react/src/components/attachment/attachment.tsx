"use client";

import {
  FileArchive,
  FileAudio,
  FileCode,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { useFocusFallback } from "../../hooks/use-focus-fallback";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";
import { springs } from "../../lib/motion";
import { StatusGlyph } from "../status-glyph";
import {
  type AttachmentItem,
  type AttachmentKind,
  type AttachmentStatus,
  acceptsFile,
  attachmentExtension,
  attachmentKind,
  dragHasFiles,
  filesFromDataTransfer,
  formatBytes,
} from "./attachment-utils";

const KIND_ICON: Record<AttachmentKind, React.ComponentType<{ className?: string }>> = {
  image: FileImage,
  pdf: FileText,
  code: FileCode,
  text: FileText,
  sheet: FileSpreadsheet,
  audio: FileAudio,
  video: FileVideo,
  archive: FileArchive,
  file: FileIcon,
};

// ---------------------------------------------------------------------------------------------
// Progress ring
// ---------------------------------------------------------------------------------------------

export interface AttachmentProgressRingProps extends Omit<React.ComponentProps<"svg">, "children"> {
  /** 0..1. Omit for an indeterminate chasing ring. */
  progress?: number;
}

// The ring of a 5×5 dot matrix, clockwise from twelve o'clock.
// biome-ignore format: a 5×5 ring reads better as two rows of pairs
const RING: readonly (readonly [number, number])[] = [
  [2, 0], [3, 0], [4, 1], [4, 2], [4, 3], [3, 4],
  [2, 4], [1, 4], [0, 3], [0, 2], [0, 1], [1, 0],
];

/**
 * Upload progress as a dial of twelve dots that light clockwise; with no `progress` a light chases
 * round the ring. Inherits `currentColor`; unlit dots are the same colour at 25%.
 */
export function AttachmentProgressRing({
  progress,
  className,
  ...props
}: AttachmentProgressRingProps) {
  const determinate = typeof progress === "number" && Number.isFinite(progress);
  const value = determinate ? Math.min(1, Math.max(0, progress)) : 0;
  const lit = value === 0 ? 0 : Math.max(1, Math.round(value * RING.length));
  return (
    <svg
      data-slot="attachment-progress"
      data-indeterminate={!determinate || undefined}
      viewBox="0 0 15 15"
      aria-hidden
      className={cn("size-6 shrink-0", className)}
      {...props}
    >
      {RING.map(([x, y], i) => (
        <circle
          key={`${x}-${y}`}
          cx={1.5 + x * 3}
          cy={1.5 + y * 3}
          r={1.1}
          style={determinate ? undefined : { animationDelay: `${i * 100}ms` }}
          className={cn(
            "fill-current",
            determinate
              ? "transition-opacity duration-(--kura-duration-base) ease-kura-snap motion-reduce:transition-none"
              : "animate-kura-chase opacity-20 motion-reduce:animate-none",
            determinate && (i < lit ? "opacity-100" : "opacity-25"),
            !determinate && i < 3 && "motion-reduce:opacity-100",
          )}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// Attachment chip / tile
// ---------------------------------------------------------------------------------------------

export interface AttachmentProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** File name, e.g. "q3-report.pdf". Truncated in the middle of long names via CSS ellipsis. */
  name: string;
  /** Size in bytes; shown as "2.4 MB". */
  size?: number;
  /** MIME type. Picks the file-type icon and decides whether `previewUrl` renders as a thumbnail. */
  type?: string;
  /** Image preview URL. With an image type (or `variant="tile"`) the chip renders as a thumbnail. */
  previewUrl?: string;
  /** Upload state. Default "ready". */
  status?: AttachmentStatus;
  /** Upload progress 0..1 while uploading. Omit for an indeterminate ring. */
  progress?: number;
  /** Error message for `status="error"`. Shown in the tooltip and to screen readers. */
  error?: string;
  /** `auto` = thumbnail tile for images with a preview, chip otherwise. Default "auto". */
  variant?: "auto" | "chip" | "tile";
  /** Show a remove (×) button and call this when pressed. */
  onRemove?: () => void;
  /** Show a "Retry" action while `status="error"`. */
  onRetry?: () => void;
}

/**
 * One attached file: a chip with a file-type icon, name and size, or a square thumbnail for
 * images. Shows upload progress as a ring, errors with a retry action, and a remove button.
 */
export function Attachment({
  name,
  size,
  type,
  previewUrl,
  status = "ready",
  progress,
  error,
  variant = "auto",
  onRemove,
  onRetry,
  className,
  title,
  ...props
}: AttachmentProps) {
  const kind = attachmentKind(name, type);
  const tile = variant === "tile" || (variant === "auto" && kind === "image" && !!previewUrl);
  const Icon = KIND_ICON[kind];
  const ext = attachmentExtension(name);
  const sizeLabel = typeof size === "number" ? formatBytes(size) : "";
  const pct =
    typeof progress === "number" ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : null;

  // Type and size are one technical line, in Geist Mono; a status is words, with its figure in mono.
  const mono = "font-kura-mono text-[11.5px]";
  let meta: React.ReactNode;
  if (status === "uploading")
    meta =
      pct === null ? (
        "Uploading…"
      ) : (
        <>
          Uploading · <span className={mono}>{pct}%</span>
        </>
      );
  else if (status === "error") meta = error ? "Failed" : "Upload failed";
  else
    meta = <span className={mono}>{[ext, sizeLabel].filter(Boolean).join(" · ") || "File"}</span>;

  const description = `${name}${status === "uploading" ? `, uploading${pct !== null ? ` ${pct}%` : ""}` : ""}${
    status === "error" ? `, upload failed${error ? `: ${error}` : ""}` : ""
  }`;

  const removeButton = onRemove && (
    <button
      type="button"
      data-slot="attachment-remove"
      aria-label={`Remove ${name}`}
      onClick={onRemove}
      className={cn(
        "-top-1.5 -right-1.5 absolute z-10 flex size-5 cursor-pointer items-center justify-center rounded-[6px] bg-kura-raised text-kura-fg-muted shadow-kura-raised outline-hidden",
        "after:-inset-1 after:absolute",
        "opacity-0 transition-[opacity,color,background-color] duration-(--kura-duration-fast) ease-kura-snap",
        "group-hover/attachment:opacity-100 group-focus-within/attachment:opacity-100",
        "pointer-coarse:opacity-100 hover:bg-kura-raised-hover hover:text-kura-fg focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring focus-visible:outline-offset-1 active:translate-y-px",
      )}
    >
      <X className="size-3" strokeWidth={2.25} aria-hidden />
    </button>
  );

  if (tile) {
    return (
      <div
        data-slot="attachment"
        data-variant="tile"
        data-kind={kind}
        data-status={status}
        title={title ?? (status === "error" && error ? error : name)}
        className={cn(
          "group/attachment relative isolate inline-flex size-11 shrink-0 rounded-kura-lg bg-kura-surface-sunken shadow-kura-raised",
          className,
        )}
        {...props}
      >
        <span className="relative size-full overflow-hidden rounded-[inherit]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={name}
              draggable={false}
              className={cn(
                "size-full object-cover transition-[filter,opacity] duration-(--kura-duration-base) ease-kura-out",
                status !== "ready" && "opacity-70 saturate-50",
              )}
            />
          ) : (
            <span className="flex size-full items-center justify-center text-kura-fg-subtle">
              <Icon className="size-4" aria-hidden />
              <span className="sr-only">{name}</span>
            </span>
          )}
          {status === "uploading" && (
            <span
              data-slot="attachment-overlay"
              className="absolute inset-0 flex animate-kura-fade-in items-center justify-center bg-kura-surface/80 text-kura-fg"
            >
              <AttachmentProgressRing progress={progress} className="size-5" />
            </span>
          )}
          {status === "error" && (
            <span
              data-slot="attachment-overlay"
              className="absolute inset-0 flex animate-kura-fade-in items-center justify-center bg-kura-surface/85 text-kura-danger-text"
            >
              {onRetry ? (
                <button
                  type="button"
                  data-slot="attachment-retry"
                  onClick={onRetry}
                  aria-label={`Retry uploading ${name}`}
                  className="flex size-full cursor-pointer items-center justify-center outline-hidden focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]"
                >
                  <StatusGlyph status="failed" label={null} />
                </button>
              ) : (
                <StatusGlyph status="failed" label={null} />
              )}
            </span>
          )}
        </span>
        <span className="sr-only" role={status === "error" ? "alert" : undefined}>
          {status !== "ready" ? description : ""}
        </span>
        {removeButton}
      </div>
    );
  }

  return (
    <div
      data-slot="attachment"
      data-variant="chip"
      data-kind={kind}
      data-status={status}
      title={title ?? (status === "error" && error ? error : name)}
      className={cn(
        "group/attachment relative inline-flex h-11 min-w-0 max-w-64 shrink-0 items-center gap-1.5 rounded-kura-lg bg-kura-raised py-1 pr-3 pl-1 font-kura-sans shadow-kura-raised",
        className,
      )}
      {...props}
    >
      <span
        data-slot="attachment-icon"
        className={cn(
          "relative flex size-8 shrink-0 items-center justify-center text-kura-fg-muted",
        )}
      >
        {status === "uploading" ? (
          <AttachmentProgressRing progress={progress} className="size-[15px] text-kura-fg" />
        ) : status === "error" ? (
          <StatusGlyph status="failed" label={null} />
        ) : (
          <Icon className="size-4" aria-hidden />
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span
          data-slot="attachment-name"
          className="truncate font-medium text-[13px] text-kura-fg leading-[18px]"
        >
          {name}
        </span>
        <span
          data-slot="attachment-meta"
          className={cn(
            "flex items-center gap-1 text-[12px] leading-4 tabular-nums",
            status === "error" ? "text-kura-danger-text" : "text-kura-fg-subtle",
          )}
        >
          <span aria-hidden>{meta}</span>
          <span className="sr-only" role={status === "error" ? "alert" : undefined}>
            {status === "error" ? `Upload failed${error ? `: ${error}` : ""}` : ""}
          </span>
          {status === "error" && onRetry && (
            <>
              <span aria-hidden>·</span>
              <button
                type="button"
                data-slot="attachment-retry"
                onClick={onRetry}
                aria-label={`Retry uploading ${name}`}
                className="relative cursor-pointer rounded-kura-xs font-medium text-kura-fg underline decoration-kura-border-strong underline-offset-2 outline-hidden after:absolute after:-inset-x-1.5 after:-inset-y-2 hover:decoration-current focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring"
              >
                Retry
              </button>
            </>
          )}
        </span>
      </span>
      {removeButton}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// List with "+N" overflow stack
// ---------------------------------------------------------------------------------------------

export interface AttachmentListProps extends Omit<React.ComponentProps<"ul">, "children"> {
  /** The attachments to render, in order. */
  items: readonly AttachmentItem[];
  /** Show a remove button on each item. */
  onRemove?: (id: string) => void;
  /** Show "Retry" on items whose status is "error". */
  onRetry?: (id: string) => void;
  /** Show at most this many, then a "+N" stack. Clicking the stack reveals the rest. */
  max?: number;
  /** Forwarded to every Attachment. Default "auto". */
  variant?: "auto" | "chip" | "tile";
  /** Accessible name of the list. Default "Attachments". */
  label?: string;
}

/**
 * A wrapping row of attachments. Items pop in, and the row closes the gap smoothly when one is
 * removed. Overflow beyond `max` collapses into a "+N" stack.
 */
export function AttachmentList({
  items,
  onRemove,
  onRetry,
  max,
  variant = "auto",
  label = "Attachments",
  className,
  ref,
  ...props
}: AttachmentListProps) {
  const reduced = useReducedMotion();
  // A removed file takes its Remove key with it, and "+3" leaves once it has been pressed:
  // focus goes to what took their place (the next file, the first one just revealed).
  const listRef = React.useRef<HTMLUListElement>(null);
  useFocusFallback(listRef, (gap) => {
    const control = (el: Element | null | undefined) =>
      el?.querySelector<HTMLElement>("button") ?? null;
    return control(gap.previous?.nextElementSibling) ?? control(gap.next) ?? control(gap.previous);
  });
  const [expanded, setExpanded] = React.useState(false);
  const limit = !expanded && typeof max === "number" && items.length > max ? max : items.length;
  const visible = items.slice(0, limit);
  const hidden = items.length - limit;

  const motionProps = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: { duration: 0.09 } },
        transition: { duration: 0.15 },
      }
    : {
        layout: "position" as const,
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.96, transition: { duration: 0.12 } },
        transition: springs.snappy,
      };

  return (
    <ul
      data-slot="attachment-list"
      aria-label={label}
      tabIndex={-1}
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2 rounded-kura-lg outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring",
        className,
      )}
      {...props}
      ref={mergeRefs(listRef, ref)}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((item) => (
          <motion.li key={item.id} className="flex" {...motionProps}>
            <Attachment
              name={item.name}
              size={item.size}
              type={item.type}
              previewUrl={item.url}
              status={item.status}
              progress={item.progress}
              error={item.error}
              variant={variant}
              onRemove={onRemove ? () => onRemove(item.id) : undefined}
              onRetry={onRetry ? () => onRetry(item.id) : undefined}
            />
          </motion.li>
        ))}
        {hidden > 0 && (
          <motion.li key="__overflow" className="flex" {...motionProps}>
            <button
              type="button"
              data-slot="attachment-overflow"
              onClick={() => setExpanded(true)}
              aria-label={`Show ${hidden} more ${hidden === 1 ? "attachment" : "attachments"}`}
              title={items
                .slice(limit)
                .map((i) => i.name)
                .join("\n")}
              className={cn(
                "flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-kura-lg bg-kura-raised px-2.5 font-kura-mono font-medium text-[12.5px] text-kura-fg-muted tabular-nums shadow-kura-raised outline-hidden",
                "transition-[color,background-color,transform] duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-raised-hover hover:text-kura-fg focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring focus-visible:outline-offset-2 active:translate-y-px motion-reduce:active:translate-y-0",
              )}
            >
              +{hidden}
            </button>
          </motion.li>
        )}
      </AnimatePresence>
    </ul>
  );
}

// ---------------------------------------------------------------------------------------------
// Dropzone
// ---------------------------------------------------------------------------------------------

export interface AttachmentDropzoneProps
  extends Omit<React.ComponentProps<"div">, "title" | "onDrop"> {
  /** Called with accepted files, and the files rejected by `accept` / `maxSize`. */
  onFiles: (files: File[], rejected: File[]) => void;
  /** Same syntax as `<input accept>`, e.g. "image/*,.pdf". */
  accept?: string;
  /** Allow several files. Default true. */
  multiple?: boolean;
  /** Reject files larger than this many bytes. */
  maxSize?: number;
  disabled?: boolean;
  /** Headline. Default "Drop files or browse" (with "browse" underlined). */
  title?: React.ReactNode;
  /** Hint under the headline, e.g. "PNG, PDF or CSV up to 10 MB". */
  description?: React.ReactNode;
}

/**
 * A drop target and file picker in one: click or press Enter to browse, or drop files onto it.
 * Highlights only when a drag actually carries files.
 */
export function AttachmentDropzone({
  onFiles,
  accept,
  multiple = true,
  maxSize,
  disabled = false,
  title,
  description,
  className,
  ...props
}: AttachmentDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const depth = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);
  const descId = React.useId();

  const deliver = (list: File[]) => {
    const files = multiple ? list : list.slice(0, 1);
    const ok: File[] = [];
    const bad: File[] = [];
    for (const f of files) {
      if (acceptsFile(f, accept) && (maxSize === undefined || f.size <= maxSize)) ok.push(f);
      else bad.push(f);
    }
    if (ok.length || bad.length) onFiles(ok, bad);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag events only; the inner <button> is the keyboard/pointer control.
    <div
      data-slot="attachment-dropzone"
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      onDragEnter={(e) => {
        if (disabled || !dragHasFiles(e.dataTransfer)) return;
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        if (disabled || !dragHasFiles(e.dataTransfer)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        deliver(filesFromDataTransfer(e.dataTransfer));
      }}
      className={cn(
        "group/dropzone relative isolate flex min-h-32 w-full rounded-kura-xl font-kura-sans",
        "bg-kura-surface-sunken transition-[background-color] duration-(--kura-duration-base) ease-kura-out",
        "data-dragging:bg-kura-hover",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      {/* a dotted outline drawn in SVG so the dots, radius and colour are precise */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full overflow-visible text-kura-faint transition-colors duration-(--kura-duration-base) group-data-dragging/dropzone:text-kura-fg"
      >
        <rect
          x="0.5"
          y="0.5"
          rx="13.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="0.1 5"
          style={{ width: "calc(100% - 1px)", height: "calc(100% - 1px)" }}
        />
      </svg>
      <button
        type="button"
        disabled={disabled}
        aria-describedby={description ? descId : undefined}
        onClick={() => inputRef.current?.click()}
        className="group/browse flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[inherit] p-6 text-center outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring disabled:cursor-not-allowed"
      >
        <span className="font-medium text-[13px] text-kura-fg">
          {dragging
            ? "Release to attach"
            : (title ?? (
                <>
                  Drop files or{" "}
                  <span className="underline decoration-kura-border-strong underline-offset-[3px] transition-[text-decoration-color] duration-(--kura-duration-fast) group-hover/browse:decoration-current">
                    browse
                  </span>
                </>
              ))}
        </span>
        {description && (
          <span id={descId} className="text-[12.5px] text-kura-fg-subtle">
            {description}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        tabIndex={-1}
        aria-hidden
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          deliver(Array.from(e.currentTarget.files ?? []));
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
