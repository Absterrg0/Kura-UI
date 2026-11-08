"use client";

import { Plus, RotateCcw } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button";

export interface Checkpoint {
  /** Stable id passed to `onRestore`. */
  id: string;
  /** What the run had just done, e.g. "Patched src/middleware.ts". */
  label: string;
  /** When the checkpoint was taken. */
  at: Date | number;
  /** Files changed since the previous checkpoint. */
  filesChanged?: number;
  /** `auto` = taken by the harness before edits; `manual` = saved by a person. */
  kind: "auto" | "manual";
  /** The workspace is at this checkpoint. Checkpoints newer than it are shown as undone. */
  current?: boolean;
}

export interface CheckpointsProps extends Omit<React.ComponentProps<"div">, "title" | "children"> {
  /** Restore points, newest first. */
  checkpoints: Checkpoint[];
  /** Panel title. Default "Checkpoints". */
  title?: React.ReactNode;
  /** Called after the inline confirm. Return a promise to show a pending state until it settles. */
  onRestore?: (id: string) => void | Promise<void>;
  /** Shows a "Save" button in the header that creates a manual checkpoint. */
  onCreate?: () => void;
  /** Ask "Restore to …?" inline before calling `onRestore`. Default true. */
  confirm?: boolean;
  /** Shown when `checkpoints` is empty. */
  empty?: React.ReactNode;
}

/** Wall clock, ticking every 30s; null until mounted so SSR markup is stable. */
function useNow(interval = 30_000) {
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

function formatAgo(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Restore points across an agent run, newest first: what the agent had just done, how many
 * files changed, when, and whether it was automatic or saved by hand. "Restore" opens an inline
 * confirm (no modal) that says what will be undone. The current position is marked; checkpoints
 * after it read as undone and can be restored again.
 */
export function Checkpoints({
  checkpoints,
  title = "Checkpoints",
  onRestore,
  onCreate,
  confirm = true,
  empty,
  className,
  ...props
}: CheckpointsProps) {
  const id = React.useId();
  const now = useNow();
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const triggers = React.useRef(new Map<string, HTMLButtonElement>());

  const current = checkpoints.find((c) => c.current);
  const currentAt = current ? +new Date(current.at) : null;

  const restore = async (c: Checkpoint) => {
    setPendingId(c.id);
    try {
      await onRestore?.(c.id);
      setMessage(`Restored to “${c.label}”`);
    } finally {
      setPendingId(null);
      setConfirmId(null);
      triggers.current.get(c.id)?.focus();
    }
  };

  const cancel = (c: Checkpoint) => {
    setConfirmId(null);
    requestAnimationFrame(() => triggers.current.get(c.id)?.focus());
  };

  return (
    <div
      data-slot="checkpoints"
      className={cn(
        "@container flex min-w-0 flex-col overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans text-kura-fg shadow-kura-sm",
        className,
      )}
      {...props}
    >
      <div
        data-slot="checkpoints-header"
        className="flex h-10 shrink-0 items-center gap-2 border-kura-border-subtle border-b pr-2 pl-3.5"
      >
        <h3 id={`${id}-title`} className="flex items-baseline gap-2 font-medium text-[13px]">
          {title}
          <span className="font-kura-mono font-normal text-[12px] text-kura-fg-subtle tabular-nums">
            {checkpoints.length}
          </span>
        </h3>
        {onCreate && (
          <Button
            data-slot="checkpoints-create"
            variant="ghost"
            size="xs"
            className="ml-auto"
            onClick={onCreate}
          >
            <Plus />
            Save checkpoint
          </Button>
        )}
      </div>

      {checkpoints.length === 0 ? (
        <div
          data-slot="checkpoints-empty"
          className="flex min-h-24 flex-col items-center justify-center gap-1 px-6 py-6 text-center"
        >
          {empty ?? (
            <>
              <p className="font-medium text-[13px] text-kura-fg-muted">No checkpoints yet</p>
              <p className="text-[12px] text-kura-fg-subtle">
                One is saved automatically before the agent edits files.
              </p>
            </>
          )}
        </div>
      ) : (
        <ol aria-labelledby={`${id}-title`} className="flex flex-col py-1">
          {checkpoints.map((c, i) => {
            const at = +new Date(c.at);
            const ahead = currentAt != null && at > currentAt;
            const open = confirmId === c.id;
            // Checkpoints between this one and where the workspace is now.
            const between = checkpoints.filter((o) => {
              const t = +new Date(o.at);
              if (ahead) return currentAt != null && t > currentAt && t <= at;
              return t > at && (currentAt == null || t <= currentAt);
            }).length;
            const first = i === 0;
            const last = i === checkpoints.length - 1;
            return (
              <li
                key={c.id}
                data-slot="checkpoints-item"
                data-kind={c.kind}
                data-current={c.current || undefined}
                data-ahead={ahead || undefined}
                data-state={open ? "confirming" : undefined}
                className="group/cp relative animate-[kura-rise-in_var(--kura-duration-base)_var(--ease-kura-out)_both] [--kura-rise-blur:0px] [--kura-rise-y:2px] motion-reduce:[--kura-rise-y:0px]"
              >
                {checkpoints.length > 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[21.5px] w-px bg-kura-border",
                      first ? "top-[18px] bottom-0" : last ? "top-0 h-[18px]" : "inset-y-0",
                      ahead && "bg-kura-border-subtle",
                    )}
                  />
                )}
                <div
                  className={cn(
                    "relative flex h-9 items-center gap-2.5 pr-2 pl-3.5 transition-colors duration-(--kura-duration-instant) ease-kura-out",
                    !c.current && "hover:bg-kura-hover",
                    open && "bg-kura-hover",
                  )}
                >
                  <span aria-hidden className="grid w-4 shrink-0 place-items-center">
                    <Node checkpoint={c} ahead={ahead} />
                  </span>
                  <span
                    data-slot="checkpoints-label"
                    className={cn(
                      "min-w-0 truncate text-[13px]",
                      c.current && "font-medium",
                      ahead && "text-kura-fg-subtle",
                    )}
                  >
                    {c.label}
                  </span>
                  {c.kind === "manual" && (
                    <span className="shrink-0 text-[12px] text-kura-fg-subtle">Saved</span>
                  )}
                  {c.current && (
                    <span
                      data-slot="checkpoints-current"
                      className="inline-flex h-[18px] shrink-0 items-center rounded-full bg-kura-hover px-1.5 font-medium text-[11px] text-kura-fg-muted"
                    >
                      Current
                    </span>
                  )}
                  {ahead && <span className="sr-only">(undone)</span>}
                  <span className="ml-auto flex shrink-0 items-center gap-3 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
                    {c.filesChanged != null && (
                      <span data-slot="checkpoints-files" className="hidden @sm:inline">
                        {c.filesChanged} {c.filesChanged === 1 ? "file" : "files"}
                      </span>
                    )}
                    <span className="grid w-16 justify-items-end [grid-template-areas:'cell'] @sm:w-[5.5rem]">
                      <time
                        dateTime={now != null ? new Date(at).toISOString() : undefined}
                        title={now != null ? new Date(at).toLocaleString() : undefined}
                        className={cn(
                          "min-w-[7ch] text-right [grid-area:cell]",
                          !c.current &&
                            onRestore &&
                            !open &&
                            "group-hover/cp:opacity-0 group-focus-within/cp:opacity-0 [@media(hover:none)]:opacity-0",
                        )}
                      >
                        {now != null ? formatAgo(now - at) : ""}
                      </time>
                      {!c.current && onRestore && (
                        <Button
                          ref={(el) => {
                            if (el) triggers.current.set(c.id, el);
                            else triggers.current.delete(c.id);
                          }}
                          data-slot="checkpoints-restore"
                          aria-label={`Restore to ${c.label}`}
                          variant="ghost"
                          size="xs"
                          aria-expanded={confirm ? open : undefined}
                          aria-controls={confirm ? `${id}-confirm-${c.id}` : undefined}
                          disabled={pendingId != null}
                          onClick={() => (confirm ? setConfirmId(open ? null : c.id) : restore(c))}
                          className={cn(
                            "-my-1 font-kura-sans opacity-0 [grid-area:cell] focus-visible:opacity-100",
                            !open && "group-hover/cp:opacity-100 [@media(hover:none)]:opacity-100",
                          )}
                        >
                          <RotateCcw />
                          <span className="hidden @sm:inline">Restore</span>
                        </Button>
                      )}
                    </span>
                  </span>
                </div>
                {confirm && !c.current && onRestore && (
                  <div
                    id={`${id}-confirm-${c.id}`}
                    data-slot="checkpoints-confirm"
                    inert={!open || undefined}
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-(--kura-duration-base) ease-kura-out motion-reduce:transition-opacity",
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      {open && (
                        <ConfirmBody
                          checkpoint={c}
                          between={between}
                          forward={ahead}
                          pending={pendingId === c.id}
                          onCancel={() => cancel(c)}
                          onConfirm={() => restore(c)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <span role="status" className="sr-only">
        {message}
      </span>
    </div>
  );
}

function Node({ checkpoint, ahead }: { checkpoint: Checkpoint; ahead: boolean }) {
  if (checkpoint.current) {
    return (
      <span className="size-2.5 rounded-full bg-kura-fg shadow-[0_0_0_3px_var(--kura-surface)]" />
    );
  }
  if (checkpoint.kind === "manual") {
    return (
      <span
        className={cn(
          "size-2 rotate-45 rounded-[2px]",
          ahead ? "bg-kura-border-strong" : "bg-kura-fg-muted",
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "size-2 rounded-full bg-kura-surface",
        ahead ? "ring-1 ring-kura-border-strong" : "ring-[1.5px] ring-kura-fg-subtle",
      )}
    />
  );
}

function ConfirmBody({
  checkpoint,
  between,
  forward,
  pending,
  onCancel,
  onConfirm,
}: {
  checkpoint: Checkpoint;
  between: number;
  forward: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    confirmRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <fieldset
      aria-label={`Restore to ${checkpoint.label}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel();
        }
      }}
      className="m-0 flex min-w-0 flex-col gap-2.5 border-0 pt-1 pr-3.5 pb-3 pl-10"
    >
      <p className="text-[12.5px] text-kura-fg-muted leading-[18px]">
        {forward ? (
          <>
            Restore files forward to this point? Re-applies edits from {between}{" "}
            {between === 1 ? "checkpoint" : "checkpoints"}.
          </>
        ) : (
          <>
            Restore files to this point? Edits from{" "}
            {between > 0
              ? `${between} later ${between === 1 ? "checkpoint" : "checkpoints"}`
              : "later steps"}{" "}
            are undone. The conversation is kept, and you can restore forward again.
          </>
        )}
      </p>
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost" size="xs" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button ref={confirmRef} variant="primary" size="xs" loading={pending} onClick={onConfirm}>
          <RotateCcw />
          Restore
        </Button>
      </div>
    </fieldset>
  );
}
