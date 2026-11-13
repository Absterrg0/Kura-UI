"use client";

import { createParts } from "@ui-sdk/react/primitive";
import { Check, ChevronRight, Copy } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useElapsed } from "../../hooks/use-elapsed";
import { useHotkey } from "../../hooks/use-hotkey";
import { cn } from "../../lib/cn";
import { formatClock } from "../../lib/format";
import { mergeRefs } from "../../lib/merge-refs";
import { AgentSigil } from "../agent-sigil";
import { Button } from "../button";
import { Halftone } from "../halftone";
import { Kbd } from "../kbd";
import { type AgentStatus, StatusGlyph } from "../status-glyph";
import { type ApprovalDecision, approvalPrompt } from "./approval-prompt-primitive";

export type { ApprovalDecision };

/** Who made a decision: a person (mouse, keyboard, touch…) or an agent through `createAgent`. */
export interface ApprovalDecisionDetails {
  source: string;
}

/** The agent asking, shown as the sender of the prompt with its sigil. */
export interface ApprovalAgent {
  name: string;
  /** What it is asking for, after "asks", e.g. "for step 4 of the plan". */
  detail?: string;
}

/** One line of impact: what the action touches, in a property list. */
export interface ApprovalFact {
  label: string;
  value: React.ReactNode;
}

const { Root: ApprovalPromptRoot } = createParts(approvalPrompt, { root: "section" });

export interface ApprovalPromptProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** What is being asked, e.g. "Run the sessions migration on production". */
  title: React.ReactNode;
  /** The exact command or action, shown verbatim in mono, e.g. "rm -rf build". */
  command?: string;
  /** One or two sentences of context: why, what it touches. */
  description?: React.ReactNode;
  /** Risk level, shown as one to three dots with a label; high is red. Default "medium". */
  risk?: "low" | "medium" | "high";
  /** The impact as a short property list with dotted leaders, e.g. target, rows affected, rollback. */
  facts?: readonly ApprovalFact[];
  /** The agent asking. Shown with its sigil: "migrator asks, for step 4 of the plan". */
  agent?: ApprovalAgent;
  /** When the agent asked. Shows a live clock next to "Needs you" while pending. */
  requestedAt?: Date | number;
  /** Extra detail behind a “Details” expander (a diff, the full arguments, affected files…). */
  details?: React.ReactNode;
  /** Decision (controlled). */
  decision?: ApprovalDecision;
  /** Initial decision when uncontrolled. Default "pending". */
  defaultDecision?: ApprovalDecision;
  /**
   * Called with every decision. `details.source` is `"agent"` when an agent connected through
   * `createAgent` decided (it can deny; approving needs a person).
   */
  onDecisionChange?: (decision: ApprovalDecision, details: ApprovalDecisionDetails) => void;
  onApprove?: () => void;
  onDeny?: () => void;
  /** Shows an “Always allow” action when provided. */
  onAlwaysAllow?: () => void;
  /** Bind ⌘/Ctrl+Enter to approve and Esc to deny while pending. Default true. Only one prompt on screen should bind them. */
  shortcuts?: boolean;
  /** Approve button label. Default “Approve”. */
  approveLabel?: string;
  /** Deny button label. Default “Deny”. */
  denyLabel?: string;
  /** Always-allow button label. Default “Always allow”. */
  alwaysAllowLabel?: string;
  /**
   * What a person is asked when an agent tries to approve, e.g. "Runs a production migration".
   * Default: "Runs `<command>`", or "Approves this request" without a command.
   */
  agentConfirm?: string;
}

const riskLabel = { low: "Low risk", medium: "Medium risk", high: "High risk" } as const;
const riskDots = { low: 1, medium: 2, high: 3 } as const;

const stateLabel: Record<ApprovalDecision, string> = {
  pending: "Needs you",
  approved: "Approved",
  denied: "Denied",
  always: "Always allowed",
};
const glyph: Record<ApprovalDecision, AgentStatus> = {
  pending: "waiting",
  approved: "done",
  // A person's "no" is not a failure: it is the dash (skipped), as the plan and the fleet draw it.
  denied: "skipped",
  always: "done",
};

/**
 * Human-in-the-loop permission card: what the agent wants to run, what that touches and how risky
 * it is. While it waits on a person it carries Kura's ember halftone; once they decide, the ember
 * leaves and the card keeps its height and states the outcome. An agent connected through
 * `createAgent` can read and deny it, but approving always waits for a person.
 */
export function ApprovalPrompt({
  title,
  command,
  description,
  risk = "medium",
  facts,
  agent,
  requestedAt,
  details,
  decision: decisionProp,
  defaultDecision = "pending",
  onDecisionChange,
  onApprove,
  onDeny,
  onAlwaysAllow,
  shortcuts = true,
  approveLabel = "Approve",
  denyLabel = "Deny",
  alwaysAllowLabel = "Always allow",
  agentConfirm,
  className,
  ref,
  ...props
}: ApprovalPromptProps) {
  const [decision, setDecisionState] = useControllableState<ApprovalDecision>({
    value: decisionProp,
    defaultValue: defaultDecision,
  });
  const pending = decision === "pending";
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [by, setBy] = React.useState<string | null>(null);
  const confirm = agentConfirm ?? (command != null ? `Runs ${command}` : "Approves this request");
  const waited = useElapsed(requestedAt, pending);
  const rootRef = React.useRef<HTMLElement>(null);
  const actionsRef = React.useRef<HTMLDivElement>(null);
  // The buttons leave with the decision. If one of them had focus, the card takes it, so the
  // keyboard stays where the person was instead of falling back to the top of the page.
  const keepFocus = React.useRef(false);
  React.useEffect(() => {
    if (pending) return;
    if (keepFocus.current || actionsRef.current?.contains(document.activeElement)) {
      rootRef.current?.focus({ preventScroll: true });
    }
    keepFocus.current = false;
  }, [pending]);

  const setDecision = (next: ApprovalDecision, source = "pointer") => {
    keepFocus.current = actionsRef.current?.contains(document.activeElement) ?? false;
    setBy(source);
    setDecisionState(next);
    onDecisionChange?.(next, { source });
  };
  const approve = (source?: string) => {
    if (!pending) return;
    setDecision("approved", source);
    onApprove?.();
  };
  const deny = (source?: string) => {
    if (!pending) return;
    setDecision("denied", source);
    onDeny?.();
  };
  const always = (source?: string) => {
    if (!pending) return;
    setDecision("always", source);
    onAlwaysAllow?.();
  };

  // A key press can only decide what the person can see: the keys rest while the card is
  // scrolled out of view (less than half of it on screen, unless it fills half the screen).
  const [inView, setInView] = React.useState(true);
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || !shortcuts || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const screen = entry.rootBounds?.height ?? 0;
        setInView(
          entry.isIntersecting &&
            (entry.intersectionRatio >= 0.5 ||
              (screen > 0 && entry.intersectionRect.height >= screen * 0.5)),
        );
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shortcuts]);

  // Page-level keys, so they stand down wherever a key already means something else: while
  // typing, inside an open menu or dialog, or when another widget has taken the press.
  const keys = {
    enabled: shortcuts && pending && inView,
    allowInInputs: false,
    allowInOverlays: false,
  };
  useHotkey(["mod", "enter"], () => approve("keyboard"), keys);
  useHotkey(["escape"], () => deny("keyboard"), keys);

  const who = by === "agent" ? "an agent" : "you";
  const outcome =
    decision === "denied"
      ? `Denied by ${who}. Nothing ran.`
      : decision === "always"
        ? "Always allowed. It won't ask again this session."
        : `Approved by ${who}.`;

  return (
    <ApprovalPromptRoot
      value={decision}
      onValueChange={(next, details) => {
        if (next === "denied") deny(details.source);
      }}
      aria-labelledby={command != null ? `${id}-title ${id}-code` : `${id}-title`}
      aria-describedby={description != null ? `${id}-desc` : undefined}
      data-slot="approval-prompt"
      data-risk={risk}
      tabIndex={-1}
      className={cn(
        "@container relative isolate flex flex-col overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans text-[13px] text-kura-fg leading-5 shadow-kura-surface outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring",
        className,
      )}
      {...props}
      ref={mergeRefs(rootRef, ref)}
    >
      {/* The light keeps to the corner: a smaller one in a narrow card, clear of the headline. */}
      <Halftone visible={pending} className="hidden @md:block" />
      <Halftone visible={pending} reach={0.46} className="bottom-auto h-28 @md:hidden" />

      <div className="flex flex-col px-[18px] pt-[18px] pb-4">
        <p
          data-slot="approval-prompt-waiting"
          className={cn(
            "flex items-center gap-2 font-medium text-[12.5px] transition-colors duration-(--kura-duration-base)",
            pending
              ? "text-kura-ember-text"
              : decision === "denied"
                ? "text-kura-fg-subtle"
                : "text-kura-fg-muted",
          )}
        >
          <StatusGlyph status={glyph[decision]} label={null} />
          {stateLabel[decision]}
          {pending && waited != null && (
            <span className="font-kura-mono font-normal text-[12px] text-kura-fg-subtle tabular-nums">
              {formatClock(waited)}
            </span>
          )}
        </p>

        <h3
          id={`${id}-title`}
          data-slot="approval-prompt-title"
          className={cn(
            "mt-3.5 max-w-[24ch] text-balance font-semibold text-[19px] leading-6 tracking-[-0.022em] transition-colors duration-(--kura-duration-base)",
            !pending && "text-kura-fg-muted",
          )}
        >
          {title}
        </h3>

        {agent && (
          <p
            data-slot="approval-prompt-agent"
            className="mt-2.5 flex items-center gap-2 text-kura-fg-muted"
          >
            <AgentSigil name={agent.name} size="sm" />
            <span className="min-w-0 truncate">
              <span className="font-medium text-kura-fg">{agent.name}</span> asks
              {agent.detail ? `, ${agent.detail}` : ""}
            </span>
          </p>
        )}

        {description != null && (
          <p id={`${id}-desc`} className="mt-2 text-pretty text-kura-fg-muted leading-relaxed">
            {description}
          </p>
        )}

        {command != null && (
          <div
            data-slot="approval-prompt-command"
            className="group/cmd relative mt-4 flex min-w-0 gap-[9px] rounded-kura-lg bg-kura-surface-sunken py-2.5 pr-10 pl-3 font-kura-mono text-[12.5px] leading-5 shadow-kura-sunk"
          >
            <span aria-hidden className="select-none text-kura-fg-subtle">
              $
            </span>
            <code
              id={`${id}-code`}
              data-slot="approval-prompt-code"
              className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]"
            >
              <Highlighted command={command} />
            </code>
            <CopyCommand command={command} />
          </div>
        )}

        {facts && facts.length > 0 && (
          <dl data-slot="approval-prompt-facts" className="mt-3.5 flex flex-col gap-[7px] px-0.5">
            {facts.map((f) => (
              <div key={f.label} className="flex items-baseline gap-2 text-[12.5px]">
                <dt className="shrink-0 text-kura-fg-subtle">{f.label}</dt>
                <span aria-hidden className="kura-leader h-[5px] min-w-4 flex-1" />
                <dd className="min-w-0 truncate text-right font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {details != null && (
          <div className="mt-2 flex flex-col">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`${id}-details`}
              onClick={() => setOpen((o) => !o)}
              className="-mx-1.5 inline-flex h-7 w-fit cursor-pointer items-center gap-1 rounded-[7px] px-1.5 font-medium text-[12.5px] text-kura-fg-muted outline-hidden transition-colors duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-hover hover:text-kura-fg focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring"
            >
              <ChevronRight
                aria-hidden
                strokeWidth={2}
                className={cn(
                  "size-3.5 transition-transform duration-(--kura-duration-base) ease-kura-snap motion-reduce:transition-none",
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
                "grid transition-[grid-template-rows,opacity] duration-(--kura-duration-base) ease-kura-snap motion-reduce:transition-opacity",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="pt-1.5 pb-0.5 text-[12.5px] text-kura-fg-muted leading-relaxed">
                  {details}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        data-slot="approval-prompt-footer"
        className="relative mt-auto flex min-h-14 items-center border-kura-border-subtle border-t px-[18px] py-2.5"
      >
        <div
          ref={actionsRef}
          data-slot="approval-prompt-actions"
          inert={!pending || undefined}
          aria-hidden={!pending || undefined}
          className={cn(
            "flex w-full flex-wrap items-center justify-end gap-2 transition-[opacity,translate] duration-(--kura-duration-fast) ease-kura-snap",
            !pending && "pointer-events-none translate-y-1 opacity-0 motion-reduce:translate-y-0",
          )}
        >
          <span
            data-slot="approval-prompt-risk"
            data-risk={risk}
            className={cn(
              "mr-auto inline-flex items-center gap-2 whitespace-nowrap font-medium text-[12.5px]",
              risk === "high" ? "text-kura-danger-text" : "text-kura-fg-muted",
            )}
          >
            <span aria-hidden className="inline-flex gap-[3px]">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={cn(
                    "size-1 rounded-full",
                    n <= riskDots[risk] ? "bg-current" : "bg-kura-dot-off",
                  )}
                />
              ))}
            </span>
            {riskLabel[risk]}
          </span>
          {onAlwaysAllow && (
            <Button
              variant="ghost"
              onClick={(_, d) => always(d?.source)}
              data-agent-confirm={`Always allows this without asking: ${confirm}`}
            >
              {alwaysAllowLabel}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={(_, d) => deny(d?.source)}
            aria-keyshortcuts={shortcuts ? "Escape" : undefined}
          >
            {denyLabel}
            {shortcuts && (
              <Kbd
                aria-hidden
                keys={["esc"]}
                size="sm"
                className="-mr-[3px] hidden pointer-fine:@sm:inline-flex"
              />
            )}
          </Button>
          <Button
            onClick={(_, d) => approve(d?.source)}
            data-agent-confirm={confirm}
            aria-keyshortcuts={shortcuts ? "Meta+Enter Control+Enter" : undefined}
          >
            {approveLabel}
            {shortcuts && (
              <Kbd
                aria-hidden
                keys={["mod", "enter"]}
                variant="ghost"
                size="sm"
                className="-mr-[3px] hidden pointer-fine:@sm:inline-flex"
              />
            )}
          </Button>
        </div>

        <p
          data-slot="approval-prompt-resolution"
          role="status"
          className={cn(
            "absolute inset-0 flex items-center px-[18px] text-kura-fg-muted transition-[opacity,translate] duration-(--kura-duration-base) ease-kura-snap",
            pending
              ? "pointer-events-none -translate-y-1 opacity-0 motion-reduce:translate-y-0"
              : "translate-y-0 opacity-100",
          )}
        >
          {!pending && outcome}
        </p>
      </div>
    </ApprovalPromptRoot>
  );
}

/** A shell command, coloured: the program, its flags, and quoted strings. */
function Highlighted({ command }: { command: string }) {
  const parts = command.split(/(\s+)/);
  let program = true;
  return (
    <>
      {parts.map((p, i) => {
        if (p === "" || /^\s+$/.test(p)) return p;
        let cls = "text-kura-fg";
        if (program) {
          cls = "font-semibold text-kura-fg";
          program = false;
        } else if (/^-{1,2}[\w-]/.test(p)) cls = "text-kura-fg-muted";
        else if (/^["'].*["']$/.test(p)) cls = "text-kura-success-text";
        else if (/^[|&;><]+$/.test(p)) {
          cls = "text-kura-fg-subtle";
          program = true;
        }
        return (
          <span key={`${i}-${p}`} className={cls}>
            {p}
          </span>
        );
      })}
    </>
  );
}

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy command"}
      onClick={() => {
        void navigator.clipboard?.writeText(command).then(() => setCopied(true));
      }}
      className="absolute top-1.5 right-1.5 grid size-7 cursor-pointer place-items-center rounded-[7px] text-kura-fg-subtle opacity-0 outline-hidden transition-[opacity,background-color,color,box-shadow] duration-(--kura-duration-fast) hover:bg-kura-raised hover:text-kura-fg hover:shadow-kura-raised focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring group-hover/cmd:opacity-100"
    >
      {copied ? (
        <Check strokeWidth={2.25} className="size-3.5" />
      ) : (
        <Copy strokeWidth={2} className="size-3.5" />
      )}
    </button>
  );
}
