"use client";

import { ArrowUp, Paperclip } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";
import { springs } from "../../lib/motion";
import { AttachmentList, AttachmentProgressRing } from "../attachment";
import {
  type AttachmentItem,
  acceptsFile,
  createAttachment,
  dragHasFiles,
  filesFromDataTransfer,
} from "../attachment/attachment-utils";
import { IconButton } from "../icon-button";
import { Tooltip } from "../tooltip";

export type ComposerStatus = "idle" | "submitted" | "streaming" | "error";

export interface ComposerMessage {
  /** The trimmed text. */
  text: string;
  attachments: AttachmentItem[];
}

interface ComposerContextValue {
  value: string;
  setValue: (next: string) => void;
  attachments: AttachmentItem[];
  addFiles: (files: File[]) => void;
  removeAttachment: (id: string) => void;
  openFilePicker: () => void;
  submit: () => void;
  stop: () => void;
  status: ComposerStatus;
  disabled: boolean;
  busy: boolean;
  canSubmit: boolean;
  maxLength: number | undefined;
  submitKey: "enter" | "mod+enter";
  acceptsFiles: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  inputId: string;
  hintId: string;
}

const ComposerContext = React.createContext<ComposerContextValue | null>(null);

/** Read composer state from a custom part. Must be used inside <Composer>. */
export function useComposer(): ComposerContextValue {
  const ctx = React.useContext(ComposerContext);
  if (!ctx) throw new Error("useComposer must be used inside <Composer>.");
  return ctx;
}

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

// ---------------------------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------------------------

export interface ComposerProps
  extends Omit<React.ComponentProps<"div">, "onSubmit" | "defaultValue" | "onChange"> {
  /** Controlled text. */
  value?: string;
  /** Initial text when uncontrolled. Default "". */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Controlled attachments. */
  attachments?: AttachmentItem[];
  /** Initial attachments when uncontrolled. */
  defaultAttachments?: AttachmentItem[];
  onAttachmentsChange?: (attachments: AttachmentItem[]) => void;
  /** Called with files added by paste, drop or the picker (after filtering), e.g. to start uploads. */
  onFilesAdded?: (items: AttachmentItem[]) => void;
  /** Called with files rejected by `accept`, `maxFileSize` or `maxFiles`. */
  onFilesRejected?: (files: File[]) => void;
  /** Send handler. Receives the trimmed text and the attachments. */
  onSubmit?: (message: ComposerMessage) => void;
  /** Called by the stop button (and Escape) while status is "submitted" or "streaming". */
  onStop?: () => void;
  /**
   * Request lifecycle. `submitted` = waiting for the first token, `streaming` = the model is
   * writing. Both turn the send button into a stop button. Default "idle".
   */
  status?: ComposerStatus;
  /** Disable typing, attaching and sending. */
  disabled?: boolean;
  /** Character limit. The hint turns amber at 90% and sending is blocked above it. */
  maxLength?: number;
  /** `enter` = Enter sends, Shift+Enter is a newline. `mod+enter` = ⌘/Ctrl+Enter sends. Default "enter". */
  submitKey?: "enter" | "mod+enter";
  /** Allowed files (same syntax as `<input accept>`). Pass `false` to disable attachments. Default "" (any). */
  accept?: string | false;
  /** Maximum number of attachments. */
  maxFiles?: number;
  /** Maximum size of one file in bytes. */
  maxFileSize?: number;
  /** Clear text and attachments after a successful submit. Default true. */
  clearOnSubmit?: boolean;
  /** Placeholder for the default layout (used when Composer has no children). */
  placeholder?: string;
}

/**
 * The prompt input. Compound: `<Composer>` owns the text, attachments and request status;
 * `ComposerInput`, `ComposerAttachments`, `ComposerToolbar`, `ComposerSubmit` and friends read
 * them from context. Render `<Composer />` with no children for the complete default layout.
 */
export function Composer({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  attachments: attachmentsProp,
  defaultAttachments,
  onAttachmentsChange,
  onFilesAdded,
  onFilesRejected,
  onSubmit,
  onStop,
  status = "idle",
  disabled = false,
  maxLength,
  submitKey = "enter",
  accept = "",
  maxFiles,
  maxFileSize,
  clearOnSubmit = true,
  placeholder,
  className,
  children,
  onFocus,
  onBlur,
  onMouseDown,
  ...props
}: ComposerProps) {
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [attachments, setAttachments] = useControllableState<AttachmentItem[]>({
    value: attachmentsProp,
    defaultValue: defaultAttachments ?? [],
    onChange: onAttachmentsChange,
  });
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const dragDepth = React.useRef(0);
  const inputId = React.useId();
  const hintId = React.useId();

  const acceptsFiles = accept !== false && !disabled;
  const busy = status === "submitted" || status === "streaming";
  const overLimit = maxLength !== undefined && value.length > maxLength;
  const uploading = attachments.some((a) => a.status === "uploading");
  const hasContent = value.trim().length > 0 || attachments.length > 0;
  const canSubmit = !disabled && !busy && hasContent && !overLimit && !uploading;

  const addFiles = React.useCallback(
    (files: File[]) => {
      if (accept === false || disabled || files.length === 0) return;
      const ok: AttachmentItem[] = [];
      const rejected: File[] = [];
      let room = maxFiles === undefined ? Number.POSITIVE_INFINITY : maxFiles - attachments.length;
      for (const file of files) {
        const fits = maxFileSize === undefined || file.size <= maxFileSize;
        if (room > 0 && fits && acceptsFile(file, accept || undefined)) {
          ok.push(createAttachment(file));
          room--;
        } else rejected.push(file);
      }
      if (ok.length) {
        setAttachments((list) => [...list, ...ok]);
        onFilesAdded?.(ok);
      }
      if (rejected.length) onFilesRejected?.(rejected);
    },
    [
      accept,
      disabled,
      maxFiles,
      maxFileSize,
      attachments.length,
      setAttachments,
      onFilesAdded,
      onFilesRejected,
    ],
  );

  const removeAttachment = React.useCallback(
    (id: string) => {
      setAttachments((list) => {
        const gone = list.find((a) => a.id === id);
        if (gone?.file && gone.url?.startsWith("blob:")) URL.revokeObjectURL(gone.url);
        return list.filter((a) => a.id !== id);
      });
      textareaRef.current?.focus();
    },
    [setAttachments],
  );

  const submit = React.useCallback(() => {
    if (!canSubmit) return;
    onSubmit?.({ text: value.trim(), attachments });
    if (clearOnSubmit) {
      setValue("");
      setAttachments([]);
    }
    textareaRef.current?.focus();
  }, [canSubmit, onSubmit, value, attachments, clearOnSubmit, setValue, setAttachments]);

  const stop = React.useCallback(() => {
    if (busy) onStop?.();
  }, [busy, onStop]);

  const ctx: ComposerContextValue = {
    value,
    setValue,
    attachments,
    addFiles,
    removeAttachment,
    openFilePicker: () => fileRef.current?.click(),
    submit,
    stop,
    status,
    disabled,
    busy,
    canSubmit,
    maxLength,
    submitKey,
    acceptsFiles,
    textareaRef,
    inputId,
    hintId,
  };

  return (
    <ComposerContext.Provider value={ctx}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: focus tracking, click-to-focus and file drop; all controls inside are native. */}
      <div
        data-slot="composer"
        data-status={status}
        data-focused={focused}
        data-dragging={dragging || undefined}
        data-disabled={disabled || undefined}
        aria-busy={busy || undefined}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
          onBlur?.(e);
        }}
        onMouseDown={(e) => {
          onMouseDown?.(e);
          // Clicking the padding or toolbar background focuses the textarea, like a native field.
          const t = e.target as HTMLElement;
          if (
            !e.defaultPrevented &&
            textareaRef.current &&
            t !== textareaRef.current &&
            (t === e.currentTarget || t.dataset.slot === "composer-toolbar")
          ) {
            e.preventDefault();
            textareaRef.current.focus();
          }
        }}
        onDragEnter={(e) => {
          if (!acceptsFiles || !dragHasFiles(e.dataTransfer)) return;
          e.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => {
          if (!acceptsFiles || !dragHasFiles(e.dataTransfer)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(e) => {
          if (!acceptsFiles || !dragHasFiles(e.dataTransfer)) return;
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          addFiles(filesFromDataTransfer(e.dataTransfer));
        }}
        className={cn(
          "group/composer relative isolate flex w-full cursor-text flex-col rounded-kura-2xl bg-kura-surface-raised font-kura-sans text-kura-fg shadow-kura-md",
          "transition-[box-shadow,opacity] duration-(--kura-duration-base) ease-kura-out",
          // Rest: hairline + soft lift. Hover firms the hairline. Focus: firm hairline plus a quiet
          // neutral halo — blue stays reserved for the model's own state.
          "hover:shadow-[0_0_0_1px_var(--kura-border-strong),var(--kura-shadow-md)]",
          "data-[focused=true]:shadow-[0_0_0_1px_var(--kura-border-strong),0_0_0_4px_color-mix(in_oklch,var(--kura-gray-12)_6%,transparent),var(--kura-shadow-md)]",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
        {...props}
      >
        {children ?? (
          <>
            <ComposerAttachments />
            <ComposerInput placeholder={placeholder} />
            <ComposerToolbar>
              <ComposerTools>{acceptsFiles && <ComposerAttachButton />}</ComposerTools>
              <ComposerActions>
                <ComposerHint />
                <ComposerSubmit />
              </ComposerActions>
            </ComposerToolbar>
          </>
        )}
        {accept !== false && (
          <input
            ref={fileRef}
            type="file"
            multiple
            tabIndex={-1}
            aria-hidden
            className="hidden"
            accept={accept || undefined}
            disabled={disabled}
            onChange={(e) => {
              addFiles(Array.from(e.currentTarget.files ?? []));
              e.currentTarget.value = "";
              textareaRef.current?.focus();
            }}
          />
        )}
        <ComposerDropOverlay visible={dragging} />
      </div>
    </ComposerContext.Provider>
  );
}

// ---------------------------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------------------------

export interface ComposerInputProps
  extends Omit<React.ComponentProps<"textarea">, "value" | "defaultValue" | "rows"> {
  /** Rows shown when empty. Default 1. */
  minRows?: number;
  /** Rows before the textarea scrolls instead of growing. Default 8. */
  maxRows?: number;
}

/**
 * Auto-growing textarea. Enter sends (Shift+Enter inserts a newline), IME composition is never
 * interrupted, pasted files become attachments, and Escape stops a streaming response.
 */
export function ComposerInput({
  minRows = 1,
  maxRows = 8,
  className,
  onKeyDown,
  onPaste,
  onChange,
  placeholder = "Ask anything…",
  ref,
  id,
  disabled: disabledProp,
  ...props
}: ComposerInputProps) {
  const ctx = useComposer();
  const { textareaRef, value } = ctx;
  const disabled = disabledProp ?? ctx.disabled;
  const overLimit = ctx.maxLength !== undefined && value.length > ctx.maxLength;

  const resize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el || typeof window === "undefined") return;
    const style = window.getComputedStyle(el);
    const line = Number.parseFloat(style.lineHeight) || 24;
    const pad = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom) || 0;
    const min = line * minRows + pad;
    const max = line * maxRows + pad;
    el.style.height = "auto";
    const next = Math.min(max, Math.max(min, el.scrollHeight));
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max + 1 ? "auto" : "hidden";
  }, [textareaRef, minRows, maxRows]);

  // Re-measure whenever the text changes.
  useIsoLayoutEffect(() => {
    if (value !== undefined) resize();
  }, [resize, value]);

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        resize();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [textareaRef, resize]);

  return (
    <textarea
      data-slot="composer-input"
      ref={mergeRefs(textareaRef, ref)}
      id={id ?? ctx.inputId}
      rows={minRows}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      aria-invalid={overLimit || undefined}
      aria-describedby={ctx.maxLength !== undefined ? ctx.hintId : undefined}
      aria-label={props["aria-label"] ?? (props["aria-labelledby"] ? undefined : "Message")}
      enterKeyHint="send"
      onChange={(e) => {
        onChange?.(e);
        if (!e.defaultPrevented) ctx.setValue(e.currentTarget.value);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "Escape" && ctx.busy) {
          e.preventDefault();
          ctx.stop();
          return;
        }
        if (e.key !== "Enter") return;
        // Never submit while an IME is composing (Japanese, Chinese, Korean input).
        if (e.nativeEvent.isComposing || e.keyCode === 229) return;
        const mod = e.metaKey || e.ctrlKey;
        if (ctx.submitKey === "enter" ? !e.shiftKey && !e.altKey : mod) {
          e.preventDefault();
          ctx.submit();
        }
      }}
      onPaste={(e) => {
        onPaste?.(e);
        if (e.defaultPrevented || !ctx.acceptsFiles) return;
        const files = filesFromDataTransfer(e.clipboardData);
        if (files.length > 0) {
          e.preventDefault();
          ctx.addFiles(files);
        }
      }}
      className={cn(
        "block w-full resize-none bg-transparent px-4 pt-3.5 pb-1.5 text-[15px] text-kura-fg leading-6 outline-none",
        "placeholder:text-kura-fg-subtle disabled:cursor-not-allowed [scrollbar-gutter:stable] [scrollbar-width:thin]",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------------------------

export interface ComposerAttachmentsProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Collapse into a "+N" stack after this many. */
  max?: number;
}

/** The composer's attachment row. Renders nothing while there are no attachments. */
export function ComposerAttachments({ max, className, ...props }: ComposerAttachmentsProps) {
  const ctx = useComposer();
  if (ctx.attachments.length === 0) return null;
  return (
    <div
      data-slot="composer-attachments"
      className={cn("cursor-default px-3 pt-3", className)}
      {...props}
    >
      <AttachmentList
        items={ctx.attachments}
        max={max}
        onRemove={ctx.disabled ? undefined : ctx.removeAttachment}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------------------------

export interface ComposerToolbarProps extends React.ComponentProps<"div"> {}

/** Bottom row. Put `ComposerTools` (left) and `ComposerActions` (right) inside. */
export function ComposerToolbar({ className, ...props }: ComposerToolbarProps) {
  return (
    <div
      data-slot="composer-toolbar"
      className={cn("flex min-h-12 items-center justify-between gap-2 p-2 pt-1", className)}
      {...props}
    />
  );
}

export interface ComposerToolsProps extends React.ComponentProps<"div"> {}

/** Left toolbar group for the attach button, model picker, tool toggles. */
export function ComposerTools({ className, ...props }: ComposerToolsProps) {
  return (
    <div
      data-slot="composer-tools"
      className={cn("flex min-w-0 flex-1 items-center gap-1", className)}
      {...props}
    />
  );
}

export interface ComposerActionsProps extends React.ComponentProps<"div"> {}

/** Right toolbar group for the hint, voice input and the submit button. */
export function ComposerActions({ className, ...props }: ComposerActionsProps) {
  return (
    <div
      data-slot="composer-actions"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

export interface ComposerAttachButtonProps
  extends Omit<React.ComponentProps<typeof IconButton>, "label" | "icon"> {
  /** Accessible label and tooltip. Default "Attach files". */
  label?: string;
  icon?: React.ReactNode;
}

/** Opens the file picker. Hidden automatically when the composer has `accept={false}`. */
export function ComposerAttachButton({
  label = "Attach files",
  icon,
  onClick,
  className,
  ...props
}: ComposerAttachButtonProps) {
  const ctx = useComposer();
  if (!ctx.acceptsFiles && !ctx.disabled) return null;
  return (
    <IconButton
      data-slot="composer-attach"
      label={label}
      icon={icon ?? <Paperclip />}
      disabled={ctx.disabled}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) ctx.openFilePicker();
      }}
      className={cn("rounded-kura-lg text-kura-fg-muted", className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------------------------
// Hint (characters / tokens)
// ---------------------------------------------------------------------------------------------

export interface ComposerHintProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** `characters` counts characters (default with `maxLength`); `tokens` shows a ~4 chars/token estimate. */
  mode?: "characters" | "tokens";
  /** Only show once the text reaches this fraction of `maxLength`. Default 0 (always, when not empty). */
  showAt?: number;
  /** Custom token counter for `mode="tokens"`. */
  countTokens?: (text: string) => number;
}

const nf = new Intl.NumberFormat("en-US");

/**
 * Character or token count with a tiny gauge. Quiet until it matters: amber at 90% of
 * `maxLength`, red when over (sending is then blocked).
 */
export function ComposerHint({
  mode,
  showAt = 0,
  countTokens,
  className,
  ...props
}: ComposerHintProps) {
  const { value, maxLength, hintId } = useComposer();
  const resolved = mode ?? (maxLength !== undefined ? "characters" : "tokens");
  const length = value.length;
  const tokens = countTokens ? countTokens(value) : Math.ceil(value.trim().length / 4);
  const ratio = maxLength ? length / maxLength : 0;
  const level = ratio > 1 ? "over" : ratio >= 0.9 ? "near" : "ok";
  const visible = length > 0 && (!maxLength || ratio >= showAt);

  const label =
    resolved === "tokens"
      ? `~${nf.format(tokens)} ${tokens === 1 ? "token" : "tokens"}`
      : maxLength
        ? `${nf.format(length)} / ${nf.format(maxLength)}`
        : nf.format(length);

  return (
    <span
      data-slot="composer-hint"
      data-level={level}
      id={hintId}
      aria-hidden={!visible || undefined}
      className={cn(
        "inline-flex select-none items-center gap-1.5 text-xs text-kura-fg-subtle tabular-nums",
        "transition-[opacity,color] duration-(--kura-duration-base) ease-kura-out",
        !visible && "pointer-events-none opacity-0",
        level === "near" && "text-kura-warning-text",
        level === "over" && "text-kura-danger-text",
        className,
      )}
      {...props}
    >
      {maxLength !== undefined && resolved === "characters" && (
        <AttachmentProgressRing progress={Math.min(1, ratio)} thickness={3} className="size-3.5" />
      )}
      <span aria-hidden>{label}</span>
      {maxLength !== undefined && (
        <span className="sr-only">
          {level === "over"
            ? `Message exceeds the ${nf.format(maxLength)} character limit`
            : `${nf.format(maxLength)} character limit`}
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// Submit / stop
// ---------------------------------------------------------------------------------------------

export interface ComposerSubmitProps
  extends Omit<React.ComponentProps<"button">, "children" | "type"> {
  /** Accessible label while idle. Default "Send message". */
  sendLabel?: string;
  /** Accessible label while busy. Default "Stop generating". */
  stopLabel?: string;
  /** Show a tooltip with the shortcut. Default true. */
  tooltip?: boolean;
}

/**
 * Send button that becomes a stop button while the composer is `submitted` or `streaming`.
 * The icons cross-fade with a 2px blur; a thin arc turns inside the button while waiting for
 * the first token.
 */
export function ComposerSubmit({
  sendLabel = "Send message",
  stopLabel = "Stop generating",
  tooltip = true,
  className,
  onClick,
  disabled: disabledProp,
  ...props
}: ComposerSubmitProps) {
  const ctx = useComposer();
  const reduced = useReducedMotion();
  const mode = ctx.busy ? "stop" : "send";
  const disabled = disabledProp ?? (ctx.busy ? false : !ctx.canSubmit);
  const ready = mode === "stop" || ctx.canSubmit;

  const swap = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, scale: 0.5, filter: "blur(2px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.5, filter: "blur(2px)" },
        transition: springs.snappy,
      };

  const button = (
    <button
      type="button"
      data-slot="composer-submit"
      data-mode={mode}
      data-ready={ready}
      aria-label={mode === "stop" ? stopLabel : sendLabel}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (mode === "stop") ctx.stop();
        else ctx.submit();
      }}
      className={cn(
        "relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none",
        "transition-[background-color,color,box-shadow,transform] duration-(--kura-duration-fast) ease-kura-out",
        "focus-visible:shadow-kura-focus active:not-disabled:scale-[0.94] motion-reduce:active:not-disabled:scale-100",
        "disabled:cursor-not-allowed",
        ready
          ? "bg-kura-ink text-kura-fg-inverted hover:bg-kura-ink-hover"
          : "bg-kura-gray-4 text-kura-fg-subtle",
        className,
      )}
      {...props}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={mode} className="flex items-center justify-center" {...swap}>
          {mode === "stop" ? (
            <span aria-hidden className="size-2.5 rounded-[2px] bg-current" />
          ) : (
            <ArrowUp aria-hidden className="size-4" strokeWidth={2.25} />
          )}
        </motion.span>
      </AnimatePresence>
      {ctx.status === "submitted" && (
        <svg
          aria-hidden
          data-slot="composer-submit-pending"
          viewBox="0 0 32 32"
          fill="none"
          className="pointer-events-none absolute inset-0 size-full animate-kura-spin motion-reduce:animate-kura-pulse"
        >
          {/* a quarter arc turning just inside the button's edge while waiting for the first token */}
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="20 62"
          />
        </svg>
      )}
    </button>
  );

  if (!tooltip) return button;
  return (
    <Tooltip
      content={mode === "stop" ? "Stop" : "Send"}
      shortcut={
        mode === "stop" ? ["esc"] : ctx.submitKey === "enter" ? ["enter"] : ["mod", "enter"]
      }
    >
      {button}
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------------------------
// Drop overlay
// ---------------------------------------------------------------------------------------------

function ComposerDropOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden
      data-slot="composer-drop-overlay"
      data-state={visible ? "visible" : "hidden"}
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-kura-surface-raised/95",
        "transition-opacity duration-(--kura-duration-fast) ease-kura-out",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <svg
        aria-hidden
        className="absolute inset-0 size-full overflow-visible text-kura-border-strong"
      >
        <rect
          x="4.5"
          y="4.5"
          rx="13.5"
          fill="none"
          stroke="currentColor"
          strokeDasharray="5 4"
          style={{ width: "calc(100% - 9px)", height: "calc(100% - 9px)" }}
        />
      </svg>
      <span
        className={cn(
          "flex items-center gap-2 font-medium text-kura-fg text-sm transition-transform duration-(--kura-duration-base) ease-kura-out motion-reduce:transition-none",
          visible ? "translate-y-0" : "translate-y-1",
        )}
      >
        <Paperclip className="size-4 text-kura-fg-muted" aria-hidden />
        Drop to attach
      </span>
    </div>
  );
}
