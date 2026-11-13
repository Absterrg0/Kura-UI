"use client";

import { createParts } from "@ui-sdk/react/primitive";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  SendHorizontal,
  X,
} from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { agentSurface } from "../../lib/agent-surface";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { Button } from "../button";
import { IconButton } from "../icon-button";

export interface QueuedPromptAttachment {
  /** File name, e.g. "session-flow.png". */
  name: string;
  /** Picks the icon. Default "file". */
  type?: "image" | "file";
}

export interface QueuedPrompt {
  /** Stable id. */
  id: string;
  /** The prompt text. */
  text: string;
  attachments?: QueuedPromptAttachment[];
}

export interface PromptQueueProps
  extends Omit<React.ComponentProps<"div">, "title" | "children" | "defaultValue"> {
  /** Queued prompts in send order (controlled). */
  items?: QueuedPrompt[];
  /** Initial prompts when uncontrolled. */
  defaultItems?: QueuedPrompt[];
  /** Called with the new list after a reorder, edit or remove. */
  onItemsChange?: (items: QueuedPrompt[]) => void;
  /** Steer: interrupt the agent and send this prompt now. The prompt leaves the queue first. */
  onSendNow?: (item: QueuedPrompt) => void;
  /** Header title. Default "Queued". */
  title?: React.ReactNode;
  /** Secondary text after the title. Default "Sends when the agent finishes this turn". */
  hint?: React.ReactNode;
  /** `panel` = a standalone card; `tray` = rounded on top only, to sit flush on a composer. Default "panel". */
  variant?: "panel" | "tray";
}

const { Root: QueueRoot } = createParts(
  agentSurface("prompt-queue", ["sendNow", "remove", "moveUp", "moveDown"]),
  { root: "div" },
);

/**
 * Follow-up prompts queued while an agent works, as a compact stack above the composer. Each
 * prompt can be reordered (buttons, Alt+↑/↓, Space-to-grab or drag), edited inline, removed, or
 * sent right away to steer the agent. Renders nothing when the queue is empty.
 */
export function PromptQueue({
  items: itemsProp,
  defaultItems,
  onItemsChange,
  onSendNow,
  title = "Queued",
  hint = "Sends when the agent finishes this turn",
  variant = "panel",
  className,
  ...props
}: PromptQueueProps) {
  const [items, setItems] = useControllableState<QueuedPrompt[]>({
    value: itemsProp,
    defaultValue: defaultItems ?? [],
    onChange: onItemsChange,
  });
  const reduced = useReducedMotion();
  const id = React.useId();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const rows = React.useRef(new Map<string, HTMLElement>());

  const focusRow = (rowId: string | undefined) => {
    if (!rowId) return;
    requestAnimationFrame(() => rows.current.get(rowId)?.focus());
  };

  const move = (index: number, by: -1 | 1) => {
    const to = index + by;
    if (to < 0 || to >= items.length) return;
    const next = items.slice();
    const [it] = next.splice(index, 1);
    if (!it) return;
    next.splice(to, 0, it);
    setItems(next);
    setMessage(`Moved to position ${to + 1} of ${items.length}`);
  };

  const remove = (index: number, refocus: boolean) => {
    const it = items[index];
    if (!it) return;
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    setMessage(`Removed “${truncate(it.text)}”. ${next.length} queued.`);
    if (refocus) focusRow((next[index] ?? next[index - 1])?.id);
  };

  const sendNow = (index: number, refocus = false) => {
    const it = items[index];
    if (!it) return;
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    setMessage(`Sending “${truncate(it.text)}” now`);
    onSendNow?.(it);
    // The row leaves with its keys: focus moves to the prompt that took its place.
    if (refocus) focusRow((next[index] ?? next[index - 1])?.id);
  };

  const save = (index: number, text: string) => {
    const it = items[index];
    const t = text.trim();
    setEditingId(null);
    if (!it) return;
    if (!t) return remove(index, true);
    if (t !== it.text) setItems(items.map((x, i) => (i === index ? { ...x, text: t } : x)));
    focusRow(it.id);
  };

  if (items.length === 0) {
    return (
      <span role="status" className="sr-only">
        {message}
      </span>
    );
  }

  // An agent names a prompt by its text (or id) and calls one of the queue's actions.
  const onAgentAction = (action: string, [ref]: unknown[]) => {
    const index = items.findIndex((it) => it.id === ref || it.text === ref);
    if (index < 0) throw new Error(`No queued prompt "${String(ref)}".`);
    if (action === "sendNow") {
      if (!onSendNow) throw new Error("This queue doesn't send prompts early.");
      sendNow(index);
    } else if (action === "remove") remove(index, false);
    else if (action === "moveUp") move(index, -1);
    else if (action === "moveDown") move(index, 1);
  };

  return (
    <QueueRoot
      value={`${items.length} queued`}
      items={items.map((it) => ({ value: it.id, label: it.text }))}
      onAction={onAgentAction}
      aria-labelledby={`${id}-title`}
      data-variant={variant}
      className={cn(
        "@container flex min-w-0 flex-col overflow-hidden font-kura-sans text-kura-fg",
        variant === "panel"
          ? "rounded-kura-xl bg-kura-surface shadow-kura-surface"
          : "rounded-t-kura-xl bg-kura-surface-sunken shadow-kura-sunk",
        className,
      )}
      {...props}
    >
      <div
        data-slot="prompt-queue-header"
        className="flex min-h-11 shrink-0 flex-col justify-center px-4 py-2 @sm:flex-row @sm:items-center @sm:justify-start @sm:gap-2 @sm:py-0"
      >
        <h3 className="flex shrink-0 items-baseline gap-1.5 font-medium text-[13px]">
          <span id={`${id}-title`}>{title}</span>
          <span className="font-kura-mono font-normal text-[12px] text-kura-fg-subtle tabular-nums">
            {items.length}
          </span>
        </h3>
        {hint != null && (
          <span
            data-slot="prompt-queue-hint"
            className="min-w-0 truncate text-[12px] text-kura-fg-subtle"
          >
            {hint}
          </span>
        )}
      </div>
      <Reorder.Group
        as="ol"
        axis="y"
        values={items.map((it) => it.id)}
        onReorder={(ids: string[]) => {
          const byId = new Map(items.map((it) => [it.id, it]));
          setItems(ids.map((i) => byId.get(i)).filter((x): x is QueuedPrompt => x != null));
        }}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-help`}
        className="flex flex-col py-1"
      >
        {items.map((item, index) => (
          <QueueRow
            key={item.id}
            item={item}
            index={index}
            count={items.length}
            reduced={reduced}
            editing={editingId === item.id}
            canSend={onSendNow != null}
            rowRef={(el) => {
              if (el) rows.current.set(item.id, el);
              else rows.current.delete(item.id);
            }}
            onMove={(by) => move(index, by)}
            onEdit={() => setEditingId(item.id)}
            onCancelEdit={() => {
              setEditingId(null);
              focusRow(item.id);
            }}
            onSave={(text) => save(index, text)}
            onRemove={(refocus) => remove(index, refocus)}
            onSendNow={() => sendNow(index, true)}
          />
        ))}
      </Reorder.Group>
      <p id={`${id}-help`} className="sr-only">
        Alt plus arrow keys or Space then arrows to reorder. Enter to edit, Delete to remove
        {onSendNow ? ", Control or Command plus Enter to send now" : ""}.
      </p>
      <span role="status" className="sr-only">
        {message}
      </span>
    </QueueRoot>
  );
}

function truncate(text: string, n = 48) {
  return text.length > n ? `${text.slice(0, n - 1)}…` : text;
}

interface QueueRowProps {
  item: QueuedPrompt;
  index: number;
  count: number;
  reduced: boolean;
  editing: boolean;
  canSend: boolean;
  rowRef: (el: HTMLElement | null) => void;
  onMove: (by: -1 | 1) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (text: string) => void;
  onRemove: (refocus: boolean) => void;
  onSendNow: () => void;
}

function QueueRow({
  item,
  index,
  count,
  reduced,
  editing,
  canSend,
  rowRef,
  onMove,
  onEdit,
  onCancelEdit,
  onSave,
  onRemove,
  onSendNow,
}: QueueRowProps) {
  const controls = useDragControls();
  const [dragging, setDragging] = React.useState(false);
  const attachments = item.attachments ?? [];
  const firstAttachment = attachments[0];

  const onKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget || editing) return;
    const mod = e.metaKey || e.ctrlKey;
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      onMove(e.key === "ArrowUp" ? -1 : 1);
    } else if (mod && e.key === "Enter" && canSend) {
      onSendNow();
    } else if (!mod && !e.altKey && (e.key === "Enter" || e.key === "F2")) {
      onEdit();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      onRemove(true);
    } else return;
    e.preventDefault();
  };

  return (
    <Reorder.Item
      as="li"
      value={item.id}
      ref={rowRef}
      dragListener={false}
      dragControls={controls}
      layout="position"
      transition={reduced ? { duration: 0 } : springs.smooth}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      onKeyDown={onKeyDown}
      aria-label={`${index + 1} of ${count}: ${item.text}`}
      aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Enter Delete"
      data-slot="prompt-queue-item"
      data-state={editing ? "editing" : dragging ? "dragging" : undefined}
      className={cn(
        "group/item relative mx-1.5 flex min-w-0 rounded-[9px] bg-transparent outline-hidden",
        "focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]",
        !editing && "min-h-8 items-center gap-1 pr-1 pl-1 hover:bg-kura-hover",
        editing && "bg-kura-hover p-1.5",
        dragging && "bg-kura-raised shadow-kura-popover",
      )}
    >
      {editing ? (
        <EditBox
          initial={item.text}
          onCancel={onCancelEdit}
          onSave={onSave}
          label={`Edit queued prompt ${index + 1}`}
        />
      ) : (
        <>
          <span className="relative grid size-6 shrink-0 place-items-center">
            <span
              aria-hidden
              className="font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums transition-opacity duration-(--kura-duration-instant) group-hover/item:opacity-0"
            >
              {index + 1}
            </span>
            <span
              aria-hidden
              data-slot="prompt-queue-handle"
              onPointerDown={(e) => {
                e.preventDefault();
                controls.start(e);
              }}
              className="absolute inset-0 grid cursor-grab touch-none place-items-center rounded-kura-sm text-kura-fg-subtle opacity-0 transition-opacity duration-(--kura-duration-instant) hover:text-kura-fg active:cursor-grabbing group-hover/item:opacity-100"
            >
              <GripVertical className="size-3.5" strokeWidth={1.75} />
            </span>
          </span>
          <span
            data-slot="prompt-queue-text"
            title={item.text}
            className="min-w-0 flex-1 truncate py-1.5 text-[13px] leading-5"
          >
            {item.text}
          </span>
          {firstAttachment && (
            <span
              data-slot="prompt-queue-attachments"
              className="inline-flex h-5 min-w-0 max-w-[40%] shrink items-center gap-1 rounded-kura-sm bg-kura-hover px-1.5 font-kura-mono text-[11px] text-kura-fg-muted"
            >
              {firstAttachment.type === "image" ? (
                <ImageIcon aria-hidden className="size-3 shrink-0" strokeWidth={1.75} />
              ) : (
                <FileText aria-hidden className="size-3 shrink-0" strokeWidth={1.75} />
              )}
              <span className="sr-only @md:not-sr-only @md:truncate">{firstAttachment.name}</span>
              {attachments.length > 1 && (
                <span className="shrink-0 text-kura-fg-subtle">+{attachments.length - 1}</span>
              )}
            </span>
          )}
          <span
            data-slot="prompt-queue-actions"
            className="hidden shrink-0 items-center gap-0.5 group-focus-within/item:flex group-hover/item:flex [@media(hover:none)]:flex"
          >
            <IconButton
              size="xs"
              label="Move up"
              icon={<ArrowUp />}
              disabled={index === 0}
              onClick={() => onMove(-1)}
            />
            <IconButton
              size="xs"
              label="Move down"
              icon={<ArrowDown />}
              disabled={index === count - 1}
              onClick={() => onMove(1)}
            />
            <IconButton size="xs" label="Edit" icon={<Pencil />} onClick={onEdit} />
            <IconButton size="xs" label="Remove" icon={<X />} onClick={() => onRemove(true)} />
            {canSend && (
              <Button
                data-slot="prompt-queue-send"
                variant="secondary"
                size="xs"
                className="ml-1"
                onClick={onSendNow}
                aria-keyshortcuts="Meta+Enter Control+Enter"
              >
                <SendHorizontal />
                Send now
              </Button>
            )}
          </span>
        </>
      )}
    </Reorder.Item>
  );
}

function EditBox({
  initial,
  label,
  onSave,
  onCancel,
}: {
  initial: string;
  label: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = React.useState(initial);
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  });
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <textarea
        ref={ref}
        aria-label={label}
        data-slot="prompt-queue-editor"
        value={text}
        rows={1}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          } else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSave(text);
          }
        }}
        className="w-full resize-none rounded-[7px] bg-kura-surface-sunken px-2 py-1.5 text-[13px] text-kura-fg leading-5 shadow-kura-sunk outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring"
      />
      <div className="flex items-center justify-end gap-1">
        <span className="mr-auto truncate pl-1 text-[12px] text-kura-fg-subtle">
          Enter to save · Esc to cancel
        </span>
        <Button variant="ghost" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="xs" onClick={() => onSave(text)}>
          Save
        </Button>
      </div>
    </div>
  );
}
