"use client";

import {
  CircleAlert,
  CloudUpload,
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
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
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
  /** 0..1. Omit for an indeterminate spinning arc. */
  progress?: number;
  /** Stroke width in px. Default 2. */
  thickness?: number;
}

/** Circular upload progress. Inherits `currentColor`; the track is the same color at 20%. */
export function AttachmentProgressRing({
  progress,
  thickness = 2,
  className,
  ...props
}: AttachmentProgressRingProps) {
  const determinate = typeof progress === "number" && Number.isFinite(progress);
  const value = determinate ? Math.min(1, Math.max(0, progress)) : 0.28;
  const r = 12 - thickness / 2;
  return (
    <svg
      data-slot="attachment-progress"
      data-indeterminate={!determinate || undefined}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn(
        "-rotate-90 size-6 shrink-0",
        !determinate &&
          "animate-kura-spin [animation-duration:1.1s] motion-reduce:animate-kura-pulse",
        className,
      )}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r={r}
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeWidth={thickness}
      />
      <circle
        cx="12"
        cy="12"
        r={r}
        stroke="currentColor"
        strokeWidth={thickness}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset={100 - value * 100}
        className="transition-[stroke-dashoffset] duration-(--kura-duration-slow) ease-kura-out motion-reduce:transition-none"
      />
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

  let meta: React.ReactNode;
  if (status === "uploading") meta = pct === null ? "Uploading…" : `Uploading · ${pct}%`;
  else if (status === "error") meta = error ? "Failed" : "Upload failed";
  else meta = [ext, sizeLabel].filter(Boolean).join(" · ") || "File";

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
        "-top-1.5 -right-1.5 absolute z-10 flex size-5 cursor-pointer items-center justify-center rounded-full bg-kura-surface-raised text-kura-fg-muted shadow-kura-sm outline-none",
        "after:-inset-1 after:absolute after:rounded-full",
        "scale-90 opacity-0 transition-[opacity,transform,color] duration-(--kura-duration-fast) ease-kura-out",
        "group-hover/attachment:scale-100 group-hover/attachment:opacity-100 group-focus-within/attachment:scale-100 group-focus-within/attachment:opacity-100",
        "pointer-coarse:scale-100 pointer-coarse:opacity-100 hover:text-kura-fg focus-visible:shadow-kura-focus active:scale-90 motion-reduce:scale-100",
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
          "group/attachment relative isolate inline-flex size-11 shrink-0 rounded-kura-lg bg-kura-surface-sunken shadow-kura-xs",
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
          {/* inner hairline so light images keep an edge */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]"
          />
          {status === "uploading" && (
            <span
              data-slot="attachment-overlay"
              className="absolute inset-0 flex animate-kura-fade-in items-center justify-center bg-kura-ink/35 text-kura-fg-inverted"
            >
              <AttachmentProgressRing progress={progress} className="size-5" />
            </span>
          )}
          {status === "error" && (
            <span
              data-slot="attachment-overlay"
              className="absolute inset-0 flex animate-kura-fade-in items-center justify-center bg-kura-danger-subtle/85 text-kura-danger-text"
            >
              {onRetry ? (
                <button
                  type="button"
                  data-slot="attachment-retry"
                  onClick={onRetry}
                  aria-label={`Retry uploading ${name}`}
                  className="flex size-full cursor-pointer items-center justify-center outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]"
                >
                  <CircleAlert className="size-4" aria-hidden />
                </button>
              ) : (
                <CircleAlert className="size-4" aria-hidden />
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
        "group/attachment relative inline-flex h-11 min-w-0 max-w-64 shrink-0 items-center gap-2.5 rounded-kura-lg bg-kura-surface-raised py-1 pr-3 pl-1 font-kura-sans shadow-kura-xs",
        "transition-[background-color,box-shadow] duration-(--kura-duration-fast) ease-kura-out",
        status === "error" &&
          "shadow-[0_0_0_1px_color-mix(in_oklch,var(--kura-danger)_35%,transparent)]",
        className,
      )}
      {...props}
    >
      <span
        data-slot="attachment-icon"
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center rounded-kura-sm transition-colors duration-(--kura-duration-base)",
          status === "error"
            ? "bg-kura-danger-subtle text-kura-danger-text"
            : "bg-kura-hover text-kura-fg-muted shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]",
        )}
      >
        {status === "uploading" ? (
          <>
            <Icon className="size-3.5 opacity-60" aria-hidden />
            <AttachmentProgressRing
              progress={progress}
              className="absolute inset-1 size-7 text-kura-fg"
              thickness={1.75}
            />
          </>
        ) : status === "error" ? (
          <CircleAlert className="size-4" aria-hidden />
        ) : (
          <Icon className="size-4" aria-hidden />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 leading-none">
        <span data-slot="attachment-name" className="truncate font-medium text-[13px] text-kura-fg">
          {name}
        </span>
        <span
          data-slot="attachment-meta"
          className={cn(
            "flex items-center gap-1 text-[11px] tabular-nums",
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
                className="cursor-pointer rounded-kura-xs font-medium text-kura-fg underline decoration-kura-border-strong underline-offset-2 outline-none hover:decoration-current focus-visible:shadow-kura-focus"
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
  ...props
}: AttachmentListProps) {
  const reduced = useReducedMotion();
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
        initial: { opacity: 0, scale: 0.92, filter: "blur(2px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.92, filter: "blur(2px)", transition: { duration: 0.12 } },
        transition: springs.snappy,
      };

  return (
    <ul
      data-slot="attachment-list"
      aria-label={label}
      className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}
      {...props}
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
                "group/overflow relative isolate mr-2.5 flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-kura-lg px-2.5 font-kura-sans font-medium text-[13px] text-kura-fg-muted tabular-nums outline-none",
                "transition-[color,transform] duration-(--kura-duration-fast) ease-kura-out hover:text-kura-fg focus-visible:shadow-kura-focus active:scale-[0.97] motion-reduce:active:scale-100",
              )}
            >
              {/* the "deck": two cards peeking out behind the counter's face */}
              <span
                aria-hidden
                className="-z-20 absolute inset-0 translate-x-[10px] scale-[0.78] rounded-[inherit] bg-kura-surface-raised shadow-kura-xs transition-transform duration-(--kura-duration-base) ease-kura-out group-hover/overflow:translate-x-[13px] motion-reduce:transition-none"
              />
              <span
                aria-hidden
                className="-z-10 absolute inset-0 translate-x-[5px] scale-[0.89] rounded-[inherit] bg-kura-surface-raised shadow-kura-xs transition-transform duration-(--kura-duration-base) ease-kura-out group-hover/overflow:translate-x-[7px] motion-reduce:transition-none"
              />
              <span
                aria-hidden
                className="absolute inset-0 rounded-[inherit] bg-kura-surface-raised shadow-kura-xs"
              />
              <span className="relative">+{hidden}</span>
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
  /** Headline. Default "Drop files or browse". */
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
  title = "Drop files or browse",
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
        "group/dropzone relative isolate flex min-h-36 w-full rounded-kura-xl font-kura-sans",
        "bg-kura-surface-sunken transition-[background-color] duration-(--kura-duration-base) ease-kura-out",
        "data-dragging:bg-kura-hover",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      {/* dashed hairline drawn in SVG so the dash, radius and color are precise */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full overflow-visible text-kura-border-strong transition-colors duration-(--kura-duration-base) group-data-dragging/dropzone:text-kura-fg-subtle"
      >
        <rect
          x="0.5"
          y="0.5"
          rx="13.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="5 4"
          style={{ width: "calc(100% - 1px)", height: "calc(100% - 1px)" }}
        />
      </svg>
      <button
        type="button"
        disabled={disabled}
        aria-describedby={description ? descId : undefined}
        onClick={() => inputRef.current?.click()}
        className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[inherit] p-6 text-center outline-none focus-visible:shadow-kura-focus disabled:cursor-not-allowed"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-10 items-center justify-center rounded-kura-lg bg-kura-surface text-kura-fg-muted shadow-kura-sm",
            "transition-transform duration-(--kura-duration-base) ease-kura-out group-hover/dropzone:-translate-y-0.5 group-data-dragging/dropzone:-translate-y-1 group-data-dragging/dropzone:text-kura-fg motion-reduce:translate-y-0",
          )}
        >
          <CloudUpload className="size-[18px]" strokeWidth={1.75} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-medium text-kura-fg text-sm">
            {dragging ? "Release to attach" : title}
          </span>
          {description && (
            <span id={descId} className="text-kura-fg-subtle text-xs">
              {description}
            </span>
          )}
        </span>
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
