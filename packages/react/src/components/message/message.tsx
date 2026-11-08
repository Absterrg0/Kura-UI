"use client";

import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { Button } from "../button";
import { IconButton, type IconButtonProps } from "../icon-button";

// ------------------------------------------------------------------------------------------------
// Message
// ------------------------------------------------------------------------------------------------

export interface MessageProps extends React.ComponentProps<"div"> {
  /** Who wrote it. User messages render as a right-aligned bubble; assistant messages as open text. */
  from: "user" | "assistant";
  /** Display name shown in the header, e.g. "Kura" or "You". */
  name?: React.ReactNode;
  /** Avatar element, usually `<MessageAvatar />`. */
  avatar?: React.ReactNode;
  /** When it was sent. Dates/numbers render as a localized time (“10:42 AM”) with the full date as a tooltip. */
  timestamp?: Date | number | string;
  /** `streaming` sets aria-busy and keeps actions invisible (but laid out); `error` shows `error` and a Retry button. Default "idle". */
  status?: "idle" | "streaming" | "error";
  /** Error text shown when `status="error"`. Default “Something went wrong.” */
  error?: React.ReactNode;
  /** Shows a Retry button in the error row. */
  onRetry?: () => void;
  /** Action bar under the content, usually `<MessageActions>`. */
  actions?: React.ReactNode;
}

/**
 * One chat turn. Content goes in `children` — plain text, StreamingText, rendered markdown or
 * CodeBlocks; block children are spaced with a gap, not margins. Hover actions, error and
 * streaming states are built in.
 */
export function Message({
  from,
  name,
  avatar,
  timestamp,
  status = "idle",
  error,
  onRetry,
  actions,
  className,
  children,
  ...props
}: MessageProps) {
  const user = from === "user";
  return (
    <div
      data-slot="message"
      data-from={from}
      data-status={status}
      aria-busy={status === "streaming" || undefined}
      className={cn(
        "group/message flex w-full gap-3 font-kura-sans",
        user && "flex-row-reverse",
        className,
      )}
      {...props}
    >
      {avatar && <div className="shrink-0">{avatar}</div>}
      <div
        className={cn("flex min-w-0 flex-1 flex-col gap-1.5", user ? "items-end" : "items-start")}
      >
        {(name != null || timestamp != null) && (
          <div
            data-slot="message-header"
            className={cn(
              "flex h-7 items-center gap-2 text-[13px] leading-none",
              user && "flex-row-reverse",
            )}
          >
            {name != null && <span className="font-medium text-kura-fg">{name}</span>}
            {timestamp != null && <MessageTime value={timestamp} />}
          </div>
        )}
        <div
          data-slot="message-body"
          className={cn(
            "flex min-w-0 max-w-full flex-col gap-3 text-[15px] text-kura-fg leading-relaxed",
            // Markdown-friendly defaults for rendered HTML. Links and lists skip anything that is (or
            // sits inside) a nested Kura component, so e.g. a Sources strip keeps its own styling.
            "[&_a:not([data-slot],[data-slot=message-body]_[data-slot]_*)]:underline [&_a:not([data-slot],[data-slot=message-body]_[data-slot]_*)]:decoration-kura-border-strong [&_a:not([data-slot],[data-slot=message-body]_[data-slot]_*)]:underline-offset-[3px] [&_a:not([data-slot],[data-slot=message-body]_[data-slot]_*):hover]:decoration-current",
            "[&_strong]:font-semibold [&_ol:not([data-slot],[data-slot=message-body]_[data-slot]_*)]:list-decimal [&_ol:not([data-slot],[data-slot=message-body]_[data-slot]_*)]:pl-5 [&_ul:not([data-slot],[data-slot=message-body]_[data-slot]_*)]:list-disc [&_ul:not([data-slot],[data-slot=message-body]_[data-slot]_*)]:pl-5 [&_li:not([data-slot],[data-slot=message-body]_[data-slot]_*)+li]:mt-1 [&_li:not([data-slot],[data-slot=message-body]_[data-slot]_*)]:pl-0.5 [&_li::marker]:text-kura-fg-subtle",
            "[&_:not(pre)>code:not([data-slot])]:rounded-kura-xs [&_:not(pre)>code:not([data-slot])]:bg-kura-active [&_:not(pre)>code:not([data-slot])]:px-[0.3em] [&_:not(pre)>code:not([data-slot])]:py-[0.1em] [&_:not(pre)>code:not([data-slot])]:font-kura-mono [&_:not(pre)>code:not([data-slot])]:text-[0.86em]",
            "[&_blockquote]:border-kura-border-strong [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-kura-fg-muted",
            "[&_h1]:font-semibold [&_h1]:text-xl [&_h2]:font-semibold [&_h2]:text-lg [&_h3]:font-semibold [&_h3]:text-base",
            user
              ? "w-fit max-w-[min(80%,36rem)] whitespace-pre-wrap break-words rounded-kura-2xl rounded-br-kura-sm bg-kura-gray-3 px-4 py-2.5"
              : "w-full",
            status === "error" && "text-kura-fg-muted",
          )}
        >
          {children}
        </div>
        {status === "error" && (
          <div
            data-slot="message-error"
            role="alert"
            className="flex animate-kura-fade-in items-center gap-2 text-[13px] text-kura-danger-text"
          >
            <AlertCircle aria-hidden className="size-3.5 shrink-0" />
            <span>{error ?? "Something went wrong."}</span>
            {onRetry && (
              <Button variant="ghost" size="xs" onClick={onRetry} className="text-kura-fg-muted">
                <RotateCcw /> Retry
              </Button>
            )}
          </div>
        )}
        {actions != null && (
          <div
            className={cn("flex", user ? "justify-end" : "-ml-1.5 justify-start")}
            // Keep the row laid out while streaming so actions appearing never shift the thread.
            data-slot="message-actions-row"
            inert={status === "streaming" || undefined}
          >
            <div className={cn(status === "streaming" && "invisible")}>{actions}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageTime({ value }: { value: Date | number | string }) {
  if (typeof value === "string") {
    return <span className="text-kura-fg-subtle text-xs tabular-nums">{value}</span>;
  }
  const date = new Date(value);
  return (
    <time
      dateTime={date.toISOString()}
      title={date.toLocaleString()}
      suppressHydrationWarning
      className="text-kura-fg-subtle text-xs tabular-nums"
    >
      {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
    </time>
  );
}

// ------------------------------------------------------------------------------------------------
// Avatar
// ------------------------------------------------------------------------------------------------

export interface MessageAvatarProps extends React.ComponentProps<"span"> {
  /** Image URL. Falls back to `fallback` (or initials of `name`) if missing or broken. */
  src?: string;
  /** Used for the image alt text and the initials fallback. */
  name: string;
  /** Custom fallback, e.g. a logo or lucide icon. */
  fallback?: React.ReactNode;
}

/** 28px round avatar with an image, an icon fallback or initials. */
export function MessageAvatar({ src, name, fallback, className, ...props }: MessageAvatarProps) {
  const [broken, setBroken] = React.useState(false);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      data-slot="message-avatar"
      className={cn(
        "relative flex size-7 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-kura-surface-raised font-medium text-[11px] text-kura-fg-muted shadow-kura-xs [&_svg]:size-3.5",
        className,
      )}
      {...props}
    >
      {src && !broken ? (
        <img
          src={src}
          alt={name}
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        (fallback ?? (
          <>
            <span aria-hidden>{initials}</span>
            <span className="sr-only">{name}</span>
          </>
        ))
      )}
    </span>
  );
}

// ------------------------------------------------------------------------------------------------
// Actions
// ------------------------------------------------------------------------------------------------

export interface MessageActionsProps extends React.ComponentProps<"div"> {
  /** `hover` reveals the bar on hover/focus (always on touch screens); `always` keeps it visible. Default "hover". */
  visibility?: "hover" | "always";
}

/** The action bar. Fades in on hover or keyboard focus; it is always laid out, so it never shifts the thread. */
export function MessageActions({ visibility = "hover", className, ...props }: MessageActionsProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would add form semantics to a toolbar
    <div
      role="group"
      aria-label="Message actions"
      data-slot="message-actions"
      data-visibility={visibility}
      className={cn(
        "flex items-center gap-0.5 text-kura-fg-subtle",
        visibility === "hover" &&
          "opacity-0 transition-opacity duration-(--kura-duration-fast) ease-kura-out focus-within:opacity-100 group-hover/message:opacity-100 pointer-coarse:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

export interface MessageActionProps extends Omit<IconButtonProps, "size"> {}

/** A small labelled icon button for the action bar (regenerate, edit, share…). */
export function MessageAction({ className, ...props }: MessageActionProps) {
  return (
    <IconButton
      data-slot="message-action"
      size="sm"
      className={cn("text-kura-fg-subtle", className)}
      {...props}
    />
  );
}

export interface MessageCopyButtonProps extends Omit<MessageActionProps, "label" | "icon"> {
  /** The text to copy (usually the message's raw markdown). */
  text: string;
  /** Called after a successful copy. */
  onCopied?: () => void;
}

/** Copy action that swaps to a check (cross-fade + 2px blur) for 1.6s after copying. */
export function MessageCopyButton({ text, onCopied, onClick, ...props }: MessageCopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const swap =
    "col-start-1 row-start-1 size-3.5 transition-[opacity,scale,filter] duration-(--kura-duration-fast) ease-kura-out motion-reduce:transition-opacity";
  const hidden = "scale-75 opacity-0 blur-[2px] motion-reduce:scale-100 motion-reduce:blur-none";
  return (
    <>
      <MessageAction
        label={copied ? "Copied" : "Copy"}
        data-copied={copied}
        onClick={async (event) => {
          onClick?.(event);
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            onCopied?.();
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 1600);
          } catch {
            // Clipboard unavailable (insecure context): do nothing.
          }
        }}
        icon={
          <span className="grid place-items-center">
            <Copy className={cn(swap, copied && hidden)} />
            <Check className={cn(swap, "text-kura-success-text", !copied && hidden)} />
          </span>
        }
        {...props}
      />
      <span className="sr-only" role="status">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}

export interface MessageFeedbackProps
  extends Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> {
  /** Current rating (controlled). `null` = no rating. */
  value?: "up" | "down" | null;
  /** Initial rating when uncontrolled. Default null. */
  defaultValue?: "up" | "down" | null;
  /** Called with the new rating; pressing the active thumb again clears it to null. */
  onValueChange?: (value: "up" | "down" | null) => void;
}

/** Thumbs up / down toggle pair (aria-pressed). Pressing the active one again clears it. */
export function MessageFeedback({
  value,
  defaultValue = null,
  onValueChange,
  className,
  ...props
}: MessageFeedbackProps) {
  const [rating, setRating] = useControllableState<"up" | "down" | null>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const thumb = (kind: "up" | "down") => {
    const active = rating === kind;
    const Icon = kind === "up" ? ThumbsUp : ThumbsDown;
    return (
      <MessageAction
        label={kind === "up" ? "Good response" : "Bad response"}
        aria-pressed={active}
        data-active={active || undefined}
        className={cn(active && "text-kura-fg")}
        onClick={() => setRating(active ? null : kind)}
        icon={
          <Icon
            className={cn(
              "transition-[fill,scale] duration-(--kura-duration-fast) ease-kura-spring",
              active && "scale-110 fill-current motion-reduce:scale-100",
            )}
          />
        }
      />
    );
  };
  return (
    <div
      data-slot="message-feedback"
      data-value={rating ?? "none"}
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    >
      {thumb("up")}
      {thumb("down")}
    </div>
  );
}

export interface MessageBranchProps extends React.ComponentProps<"div"> {
  /** 1-based index of the visible version. */
  current: number;
  /** Number of versions (regenerations or edits). Renders nothing when ≤ 1. */
  total: number;
  /** Called with the new 1-based index. */
  onCurrentChange?: (current: number) => void;
}

/** Version switcher “‹ 2/3 ›” for regenerated or edited messages. */
export function MessageBranch({
  current,
  total,
  onCurrentChange,
  className,
  ...props
}: MessageBranchProps) {
  if (total <= 1) return null;
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would add form semantics to a toolbar
    <div
      role="group"
      aria-label="Message versions"
      data-slot="message-branch"
      className={cn("flex items-center text-kura-fg-subtle", className)}
      {...props}
    >
      <MessageAction
        label="Previous version"
        icon={<ChevronLeft />}
        disabled={current <= 1}
        onClick={() => onCurrentChange?.(current - 1)}
      />
      <span
        aria-live="polite"
        className="min-w-[3ch] select-none text-center font-kura-sans text-xs tabular-nums"
      >
        <span className="sr-only">Version </span>
        {current}
        <span aria-hidden>/</span>
        <span className="sr-only"> of </span>
        {total}
      </span>
      <MessageAction
        label="Next version"
        icon={<ChevronRight />}
        disabled={current >= total}
        onClick={() => onCurrentChange?.(current + 1)}
      />
    </div>
  );
}
