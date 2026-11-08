"use client";

import { Check, ChevronRight, ShieldCheck, Terminal, X } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useHotkey } from "../../hooks/use-hotkey";
import { cn } from "../../lib/cn";
import { Button } from "../button";
import { Kbd } from "../kbd";

export type ApprovalDecision = "pending" | "approved" | "denied" | "always";

export interface ApprovalPromptProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** What the agent wants, e.g. "Kura wants to run a command". */
  title: React.ReactNode;
  /** The exact command or action, shown verbatim in mono, e.g. "rm -rf build". */
  command?: string;
  /** One or two sentences of context: why, what it touches. */
  description?: React.ReactNode;
  /** Risk level, shown as a badge; `high` makes the approve button red. Default "medium". */
  risk?: "low" | "medium" | "high";
  /** Extra detail behind a “Details” expander (a diff, the full arguments, affected files…). */
  details?: React.ReactNode;
  /** Decision (controlled). */
  decision?: ApprovalDecision;
  /** Initial decision when uncontrolled. Default "pending". */
  defaultDecision?: ApprovalDecision;
  /** Called with every decision the user makes. */
  onDecisionChange?: (decision: ApprovalDecision) => void;
  onApprove?: () => void;
  onDeny?: () => void;
  /** Shows an “Always allow” action when provided. */
  onAlwaysAllow?: () => void;
  /** Bind ⌘/Ctrl+Enter to approve and Esc to deny while pending. Default true. Only one prompt on screen should bind them. */
  shortcuts?: boolean;
  /** Approve button label. Default “Approve” (“Run anyway” when risk is high). */
  approveLabel?: string;
  /** Deny button label. Default “Deny”. */
  denyLabel?: string;
  /** Always-allow button label. Default “Always allow”. */
  alwaysAllowLabel?: string;
  /** Icon in the header tile. Default a terminal. */
  icon?: React.ReactNode;
}

const riskLabel = { low: "Low risk", medium: "Medium risk", high: "High risk" } as const;

const resolvedCopy: Record<Exclude<ApprovalDecision, "pending">, string> = {
  approved: "Approved",
  denied: "Denied",
  always: "Always allowed",
};

/**
 * Human-in-the-loop permission card: “Kura wants to run `rm -rf build`”, with a risk badge, a
 * details expander, Approve / Deny / Always allow, ⌘↵ and Esc shortcuts, and calm resolved states
 * that keep the card's height.
 */
export function ApprovalPrompt({
  title,
  command,
  description,
  risk = "medium",
  details,
  decision: decisionProp,
  defaultDecision = "pending",
  onDecisionChange,
  onApprove,
  onDeny,
  onAlwaysAllow,
  shortcuts = true,
  approveLabel,
  denyLabel = "Deny",
  alwaysAllowLabel = "Always allow",
  icon,
  className,
  ...props
}: ApprovalPromptProps) {
  const [decision, setDecision] = useControllableState<ApprovalDecision>({
    value: decisionProp,
    defaultValue: defaultDecision,
    onChange: onDecisionChange,
  });
  const pending = decision === "pending";
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  const approve = () => {
    if (!pending) return;
    setDecision("approved");
    onApprove?.();
  };
  const deny = () => {
    if (!pending) return;
    setDecision("denied");
    onDeny?.();
  };
  const always = () => {
    if (!pending) return;
    setDecision("always");
    onAlwaysAllow?.();
  };

  useHotkey(["mod", "enter"], approve, { enabled: shortcuts && pending });
  useHotkey(["escape"], deny, { enabled: shortcuts && pending, allowInInputs: false });

  return (
    <section
      aria-labelledby={command != null ? `${id}-title ${id}-code` : `${id}-title`}
      aria-describedby={description != null ? `${id}-desc` : undefined}
      data-slot="approval-prompt"
      data-decision={decision}
      data-risk={risk}
      className={cn(
        "flex flex-col overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans shadow-kura-md transition-shadow duration-(--kura-duration-slow) ease-kura-out",
        !pending && "shadow-kura-sm",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-kura-md bg-kura-surface-sunken text-kura-fg-muted shadow-[inset_0_0_0_1px_var(--kura-border-subtle)] [&_svg]:size-4",
            )}
          >
            {icon ?? <Terminal />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1 pt-px">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3
                id={`${id}-title`}
                data-slot="approval-prompt-title"
                className={cn(
                  "font-medium text-[15px] text-kura-fg leading-snug transition-colors duration-(--kura-duration-base)",
                  !pending && "text-kura-fg-muted",
                )}
              >
                {title}
              </h3>
              <span
                data-slot="approval-prompt-risk"
                data-risk={risk}
                className={cn(
                  "inline-flex h-5 items-center gap-1.5 rounded-full px-2 font-medium text-[11px]",
                  risk === "low" && "bg-kura-hover text-kura-fg-muted",
                  risk === "medium" && "bg-kura-hover text-kura-warning-text",
                  risk === "high" && "bg-kura-danger-subtle text-kura-danger-text",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    risk === "low" && "bg-kura-success",
                    risk === "medium" && "bg-kura-warning",
                    risk === "high" && "bg-kura-danger",
                  )}
                />
                {riskLabel[risk]}
              </span>
            </div>
            {description != null && (
              <p id={`${id}-desc`} className="text-[13px] text-kura-fg-muted leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {command != null && (
          <div
            data-slot="approval-prompt-command"
            className="flex min-w-0 gap-2 rounded-kura-md bg-kura-surface-sunken px-3 py-2.5 font-kura-mono text-[13px] shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]"
          >
            <span aria-hidden className="select-none text-kura-fg-subtle">
              $
            </span>
            <code
              id={`${id}-code`}
              data-slot="approval-prompt-code"
              className="min-w-0 flex-1 whitespace-pre-wrap break-all text-kura-fg"
            >
              {command}
            </code>
          </div>
        )}

        {details != null && (
          <div className="flex flex-col">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`${id}-details`}
              onClick={() => setOpen((o) => !o)}
              className="-mx-1.5 inline-flex h-6 w-fit cursor-pointer items-center gap-1 rounded-kura-sm px-1.5 text-kura-fg-muted text-xs outline-none transition-colors duration-(--kura-duration-fast) ease-kura-out hover:text-kura-fg focus-visible:shadow-kura-focus"
            >
              <ChevronRight
                aria-hidden
                className={cn(
                  "size-3 transition-transform duration-(--kura-duration-base) ease-kura-out motion-reduce:transition-none",
                  open && "rotate-90",
                )}
              />
              {open ? "Hide details" : "Details"}
            </button>
            <div
              id={`${id}-details`}
              data-slot="approval-prompt-details"
              inert={!open || undefined}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-(--kura-duration-slow) ease-kura-out motion-reduce:transition-opacity",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="pt-2 text-[13px] text-kura-fg-muted">{details}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        data-slot="approval-prompt-footer"
        className="relative flex h-14 items-center bg-kura-surface-sunken/60 px-4 shadow-[inset_0_1px_0_var(--kura-border-subtle)]"
      >
        <div
          data-slot="approval-prompt-actions"
          inert={!pending || undefined}
          aria-hidden={!pending || undefined}
          className={cn(
            "flex w-full items-center gap-2 transition-[opacity,filter] duration-(--kura-duration-fast) ease-kura-out",
            !pending && "pointer-events-none opacity-0 blur-[2px] motion-reduce:blur-none",
          )}
        >
          <span
            className="mr-auto inline-flex items-center gap-1.5 rounded-full bg-kura-accent-subtle px-2 py-0.5 font-medium text-kura-accent-text text-xs"
            data-slot="approval-prompt-waiting"
          >
            <span
              aria-hidden
              className="size-1.5 animate-kura-pulse rounded-full bg-current motion-reduce:animate-none"
            />
            Needs approval
          </span>
          {onAlwaysAllow && (
            <Button variant="ghost" size="sm" onClick={always}>
              {alwaysAllowLabel}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={deny}
            aria-keyshortcuts={shortcuts ? "Escape" : undefined}
          >
            {denyLabel}
            {shortcuts && <Kbd keys={["esc"]} variant="ghost" size="sm" className="-mr-1" />}
          </Button>
          <Button
            variant={risk === "high" ? "danger" : "primary"}
            size="sm"
            onClick={approve}
            aria-keyshortcuts={shortcuts ? "Meta+Enter Control+Enter" : undefined}
          >
            {approveLabel ?? (risk === "high" ? "Run anyway" : "Approve")}
            {shortcuts && (
              <Kbd
                keys={["mod", "enter"]}
                variant="ghost"
                size="sm"
                className="-mr-1 [&_[data-slot=kbd-key]]:bg-current/15 [&_[data-slot=kbd-key]]:text-current"
              />
            )}
          </Button>
        </div>

        <div
          data-slot="approval-prompt-resolution"
          role="status"
          className={cn(
            "absolute inset-0 flex items-center gap-2 px-4 text-[13px] transition-[opacity,filter] duration-(--kura-duration-base) ease-kura-out",
            pending
              ? "pointer-events-none opacity-0 blur-[2px] motion-reduce:blur-none"
              : "opacity-100",
            decision === "denied" ? "text-kura-fg-muted" : "text-kura-fg",
          )}
        >
          {!pending && (
            <>
              <span
                aria-hidden
                className={cn(
                  "grid size-5 animate-kura-pop-in place-items-center rounded-full [&_svg]:size-3",
                  decision === "denied"
                    ? "bg-kura-hover text-kura-fg-muted"
                    : "bg-kura-hover text-kura-success-text",
                )}
              >
                {decision === "denied" ? (
                  <X strokeWidth={2.5} />
                ) : decision === "always" ? (
                  <ShieldCheck />
                ) : (
                  <Check strokeWidth={2.5} />
                )}
              </span>
              <span className="font-medium">{resolvedCopy[decision]}</span>
              {decision === "always" && (
                <span className="text-kura-fg-subtle">· won't ask again this session</span>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
