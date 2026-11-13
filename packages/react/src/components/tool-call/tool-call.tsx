"use client";

import { ChevronRight } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { formatClock, formatDuration } from "../../lib/format";
import { CodeBlock } from "../code-block";
import { type AgentStatus, StatusGlyph } from "../status-glyph";

export type ToolCallStatus = "pending" | "running" | "success" | "error" | "awaiting-approval";

export interface ToolCallProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** The tool's identifier, e.g. "search_web". Rendered in mono. */
  name: string;
  /** Human label, e.g. "Searching the web". Shown instead of `name` when given. */
  title?: React.ReactNode;
  /** Icon for the tool, e.g. `<Globe />`. Default a wrench. */
  icon?: React.ReactNode;
  /** Lifecycle state. Default "running". */
  status?: ToolCallStatus;
  /** Arguments the model passed. Objects are pretty-printed as JSON; strings are shown as-is. */
  args?: unknown;
  /** The tool's output. Objects are pretty-printed as JSON; strings are shown as-is. */
  result?: unknown;
  /** Error message for status="error". */
  error?: React.ReactNode;
  /** One-line summary next to the title. Default: the first primitive value in `args`. Pass null to hide. */
  summary?: React.ReactNode;
  /** When the call started (for the live timer). Default: when status became "running". */
  startedAt?: Date | number;
  /** Final duration in ms. Default: measured from running → done. */
  duration?: number;
  /** `card` = a bordered card (default); `inline` = a compact row inside message text. */
  variant?: "card" | "inline";
  /** Details (args/result) expanded (controlled). */
  open?: boolean;
  /** Initial expanded state when uncontrolled. Default: true for "error" and "awaiting-approval". */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Always-visible footer, e.g. Approve / Deny buttons while awaiting approval. */
  actions?: React.ReactNode;
}

export { formatDuration };

const statusText: Record<ToolCallStatus, string> = {
  pending: "Queued",
  running: "Running",
  success: "Completed",
  error: "Failed",
  "awaiting-approval": "Waiting for approval",
};

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function deriveSummary(args: unknown): string | null {
  if (args == null) return null;
  if (typeof args !== "object") return String(args);
  for (const v of Object.values(args as Record<string, unknown>)) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  }
  return null;
}

const GLYPH: Record<ToolCallStatus, AgentStatus> = {
  pending: "queued",
  running: "running",
  success: "done",
  error: "failed",
  "awaiting-approval": "waiting",
};

function StatusMark({ status, small }: { status: ToolCallStatus; small?: boolean }) {
  return (
    <span aria-hidden data-slot="tool-call-status" className="grid shrink-0 place-items-center">
      <StatusGlyph status={GLYPH[status]} size={small ? "sm" : "md"} label={null} />
    </span>
  );
}

function useElapsed(status: ToolCallStatus, startedAt?: Date | number, duration?: number) {
  const start = React.useRef<number | null>(startedAt != null ? +new Date(startedAt) : null);
  const [now, setNow] = React.useState<number | null>(null);
  const [final, setFinal] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (status === "running") {
      start.current = startedAt != null ? +new Date(startedAt) : Date.now();
      setFinal(null);
      setNow(Date.now());
      const id = setInterval(() => setNow(Date.now()), 100);
      return () => clearInterval(id);
    }
    const began = start.current;
    if ((status === "success" || status === "error") && began != null) {
      setFinal((f) => f ?? Date.now() - began);
    }
  }, [status, startedAt]);
  if (duration != null) return duration;
  if (status === "running" && start.current != null && now != null) return now - start.current;
  return final;
}

/**
 * One tool invocation: name and icon, a status glyph (queued, running, done, failed, awaiting
 * approval), a live elapsed timer, and collapsible pretty-printed arguments and result.
 */
export function ToolCall({
  name,
  title,
  icon,
  status = "running",
  args,
  result,
  error,
  summary,
  startedAt,
  duration,
  variant = "card",
  open: openProp,
  defaultOpen,
  onOpenChange,
  actions,
  className,
  ...props
}: ToolCallProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? (status === "error" || status === "awaiting-approval"),
    onChange: onOpenChange,
  });
  const elapsed = useElapsed(status, startedAt, duration);
  const id = React.useId();
  const hasDetails = args !== undefined || result !== undefined || error != null;
  const line = summary === undefined ? deriveSummary(args) : summary;
  const inline = variant === "inline";

  const label = title ?? <span className="font-kura-mono text-[0.93em]">{name}</span>;

  const headerContent = (
    <>
      <StatusMark status={status} small={inline} />
      {icon != null && (
        <span
          aria-hidden
          className="shrink-0 text-kura-fg-subtle [&_svg]:size-3.5"
          data-slot="tool-call-icon"
        >
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <span data-slot="tool-call-title" className="shrink-0 font-medium text-kura-fg">
          {label}
        </span>
        {line != null && line !== "" && (
          <span data-slot="tool-call-summary" className="truncate text-kura-fg-subtle">
            {line}
          </span>
        )}
      </span>
      <span className="sr-only">, {statusText[status]}</span>
      {elapsed != null && (
        <span
          data-slot="tool-call-elapsed"
          className="shrink-0 font-kura-mono text-kura-fg-subtle text-xs tabular-nums"
        >
          {status === "running" ? formatClock(elapsed) : formatDuration(elapsed)}
        </span>
      )}
      {hasDetails && (
        <ChevronRight
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 text-kura-fg-subtle transition-transform duration-(--kura-duration-base) ease-kura-out motion-reduce:transition-none",
            open && "rotate-90",
          )}
        />
      )}
    </>
  );

  const headerClass = cn(
    "flex w-full min-w-0 items-center gap-2 text-left outline-hidden",
    inline ? "h-7 rounded-[8px] px-1.5 text-[13px]" : "h-11 px-4 text-[13px]",
  );

  return (
    <div
      data-slot="tool-call"
      data-status={status}
      data-variant={variant}
      data-state={hasDetails ? (open ? "open" : "closed") : undefined}
      className={cn(
        "flex min-w-0 flex-col font-kura-sans",
        inline
          ? "-mx-1.5 w-fit max-w-full"
          : "overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-surface",
        className,
      )}
      {...props}
    >
      {hasDetails ? (
        <button
          type="button"
          data-slot="tool-call-trigger"
          aria-expanded={open}
          aria-controls={`${id}-details`}
          onClick={() => setOpen(!open)}
          className={cn(
            headerClass,
            "cursor-pointer transition-[background-color,box-shadow] duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover",
            inline
              ? "focus-visible:shadow-kura-focus"
              : "focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]",
          )}
        >
          {headerContent}
        </button>
      ) : (
        <div data-slot="tool-call-trigger" className={headerClass}>
          {headerContent}
        </div>
      )}
      <span className="sr-only" role="status">
        {name} {statusText[status]}
      </span>

      {hasDetails && (
        <div
          id={`${id}-details`}
          data-slot="tool-call-details"
          inert={!open || undefined}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-(--kura-duration-slow) ease-kura-out motion-reduce:transition-opacity",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={cn(
                "relative flex flex-col gap-3",
                inline ? "mt-1 mb-2 ml-[10px] pl-4" : "px-1.5 pb-1.5",
              )}
            >
              {inline && (
                <span aria-hidden className="kura-leader absolute inset-y-0 left-0 w-[5px]" />
              )}
              {args !== undefined && <Section label="Arguments" value={args} />}
              {error != null && (
                <div
                  data-slot="tool-call-error"
                  className="rounded-kura-lg bg-kura-surface-sunken px-3 py-2 font-kura-mono text-kura-danger-text text-xs leading-relaxed shadow-kura-sunk"
                >
                  {error}
                </div>
              )}
              {result !== undefined && <Section label="Result" value={result} />}
            </div>
          </div>
        </div>
      )}

      {actions != null && (
        <div
          data-slot="tool-call-actions"
          className={cn(
            "flex items-center justify-end gap-2",
            inline ? "py-1.5" : "px-3 pt-1 pb-2.5",
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

function Section({ label, value }: { label: string; value: unknown }) {
  const text = toText(value);
  const json = typeof value !== "string";
  return (
    <div data-slot="tool-call-section" className="flex flex-col gap-1.5">
      <span className="px-2.5 text-kura-fg-subtle text-xs">{label}</span>
      <CodeBlock
        code={text}
        filename={label}
        language={json ? "json" : "text"}
        header={false}
        wrap
        maxHeight={220}
        className="text-xs [&_[data-slot=code-block-line]]:px-3 [&_section]:py-2"
      />
    </div>
  );
}
