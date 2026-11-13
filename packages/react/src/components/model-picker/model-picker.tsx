// ARIA listbox pattern: options are highlighted via aria-activedescendant from the focused
// combobox/listbox, so they are intentionally not focusable and have no own key handlers.
// biome-ignore-all lint/a11y/useSemanticElements: rich rows cannot be native <option>/<fieldset>.
// biome-ignore-all lint/a11y/useFocusableInteractive: focus stays on the combobox (activedescendant).
// biome-ignore-all lint/a11y/useKeyWithClickEvents: keyboard selection is handled by the combobox.
"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { AgentSigil } from "../agent-sigil";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

export type ModelCapability = "vision" | "tools" | "reasoning" | "web" | "audio" | "files";

export interface ModelPickerModel {
  /** Stable id passed to `onValueChange`, e.g. "claude-opus-5-5". */
  id: string;
  /** Display name, e.g. "Claude Opus 5.5". */
  name: string;
  /** Group heading, e.g. "Anthropic". Models keep their order within a provider. */
  provider?: string;
  /** One sentence shown in the detail footer while the model is highlighted. */
  description?: string;
  capabilities?: readonly ModelCapability[];
  /** Context window in tokens, e.g. 200000 (shown as "200K"). */
  contextWindow?: number;
  /** 1 = slow/thorough, 2 = balanced, 3 = fast. */
  speed?: 1 | 2 | 3;
  /** 1 = cheap, 3 = expensive. */
  cost?: 1 | 2 | 3;
  /** Short tag next to the name, e.g. "New" or "Beta". */
  badge?: string;
  disabled?: boolean;
  /** Provider or model mark (16px). Falls back to a monogram of the provider. */
  icon?: React.ReactNode;
}

const CAPABILITIES: Record<ModelCapability, { label: string }> = {
  vision: { label: "Vision" },
  tools: { label: "Tool use" },
  reasoning: { label: "Reasoning" },
  web: { label: "Web search" },
  audio: { label: "Audio" },
  files: { label: "Files" },
};

const SPEED = ["", "Thorough", "Balanced", "Fast"] as const;
const COST = ["", "Low cost", "Medium cost", "High cost"] as const;

/** 200000 → "200K", 1000000 → "1M". */
export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K`;
  return String(tokens);
}

function matches(model: ModelPickerModel, query: string): boolean {
  const hay = [
    model.name,
    model.id,
    model.provider,
    model.description,
    model.badge,
    ...(model.capabilities ?? []).map((c) => CAPABILITIES[c].label),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

function ProviderMark({ model, className }: { model: ModelPickerModel; className?: string }) {
  if (model.icon) {
    return (
      <span
        aria-hidden
        className={cn("flex size-4 shrink-0 items-center justify-center [&_svg]:size-4", className)}
      >
        {model.icon}
      </span>
    );
  }
  // No logo given: the model gets a face, the same dot sigil every time.
  return <AgentSigil name={model.name} bare size="sm" className={cn("size-4", className)} />;
}

function Meter({ value, label, kind }: { value: number; label: string; kind: "speed" | "cost" }) {
  return (
    <span className="inline-flex items-center" title={label}>
      {kind === "speed" ? (
        <span aria-hidden className="inline-flex items-center gap-[3px]">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "size-[3px] rounded-full",
                i <= value ? "bg-kura-fg-muted" : "bg-kura-dot-off",
              )}
            />
          ))}
        </span>
      ) : (
        <span aria-hidden className="inline-flex">
          {[1, 2, 3].map((i) => (
            <span key={i} className={i <= value ? "text-kura-fg-muted" : "text-kura-faint"}>
              $
            </span>
          ))}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface ModelPickerProps
  extends Omit<React.ComponentProps<"button">, "value" | "defaultValue" | "children"> {
  /** Every selectable model. Grouped by `provider` in first-seen order. */
  models: readonly ModelPickerModel[];
  /** Controlled selected model id. */
  value?: string;
  /** Initial model id when uncontrolled. Default: the first enabled model. */
  defaultValue?: string;
  onValueChange?: (id: string, model: ModelPickerModel) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Show the search field. Default: true when there are more than 6 models. */
  searchable?: boolean;
  /** Trigger text when nothing is selected. Default "Select model". */
  placeholder?: string;
  /** Default "Search models…". */
  searchPlaceholder?: string;
  /** Default "No models match". */
  emptyMessage?: string;
  /** Show the description footer for the highlighted model. Default true. */
  showDetails?: boolean;
  /** Popover side. Use "top" inside a composer at the bottom of the screen. Default "bottom". */
  side?: "top" | "bottom";
  /** Default "start". */
  align?: "start" | "center" | "end";
  /** Trigger size. Default "sm" (28px), for toolbars. */
  size?: "sm" | "md";
  /**
   * Render the list in place, always shown, with no trigger: for a settings page or onboarding.
   * Choosing a model selects it and the list stays. `open`, `side`, `align` and `size` do not apply.
   */
  inline?: boolean;
}

/**
 * Model selector: a quiet trigger that opens a searchable, grouped list with capability icons,
 * context size, speed and cost hints. Full keyboard support (arrows, Home/End, Enter, Escape)
 * with focus kept in the search field.
 */
export function ModelPicker({
  models,
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  searchable,
  placeholder = "Select model",
  searchPlaceholder = "Search models…",
  emptyMessage = "No models match",
  showDetails = true,
  side = "bottom",
  align = "start",
  size = "sm",
  inline = false,
  disabled,
  className,
  ...props
}: ModelPickerProps) {
  const firstEnabled = models.find((m) => !m.disabled)?.id ?? "";
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue: defaultValue ?? firstEnabled,
    onChange: (id: string) => {
      const model = models.find((m) => m.id === id);
      if (model) onValueChange?.(id, model);
    },
  });
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const baseId = React.useId();
  const listId = `${baseId}-list`;
  const optionId = React.useCallback(
    (id: string) => `${baseId}-opt-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    [baseId],
  );
  const showSearch = searchable ?? models.length > 6;

  const selected = models.find((m) => m.id === value);
  const filtered = React.useMemo(
    () => (query.trim() ? models.filter((m) => matches(m, query)) : models),
    [models, query],
  );
  const groups = React.useMemo(() => {
    const map = new Map<string, ModelPickerModel[]>();
    for (const m of filtered) {
      const key = m.provider ?? "";
      const list = map.get(key);
      if (list) list.push(m);
      else map.set(key, [m]);
    }
    return [...map.entries()];
  }, [filtered]);
  const flat = React.useMemo(() => groups.flatMap(([, list]) => list), [groups]);
  const enabled = flat.filter((m) => !m.disabled);
  const activeModel = flat.find((m) => m.id === active) ?? null;
  const shown = inline || open;

  // Reset the highlight to the selection when opening; keep it valid while filtering.
  React.useEffect(() => {
    if (!shown) return;
    setActive((current) => {
      if (current && enabled.some((m) => m.id === current)) return current;
      if (!query && enabled.some((m) => m.id === value)) return value;
      return enabled[0]?.id ?? null;
    });
  }, [shown, enabled, query, value]);

  React.useEffect(() => {
    // In place, the page is not scrolled to bring the list's highlight into view.
    if (!open || inline || !active) return;
    const el = typeof document === "undefined" ? null : document.getElementById(optionId(active));
    el?.scrollIntoView?.({ block: "nearest" });
  }, [active, open, inline, optionId]);

  const choose = (model: ModelPickerModel) => {
    if (model.disabled) return;
    setValue(model.id);
    if (!inline) setOpen(false);
  };

  const move = (delta: number | "first" | "last") => {
    if (enabled.length === 0) return;
    const index = enabled.findIndex((m) => m.id === active);
    let next: number;
    if (delta === "first") next = 0;
    else if (delta === "last") next = enabled.length - 1;
    else next = index === -1 ? 0 : (index + delta + enabled.length) % enabled.length;
    setActive(enabled[next]?.id ?? null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        if (showSearch && query) return;
        e.preventDefault();
        move("first");
        break;
      case "End":
        if (showSearch && query) return;
        e.preventDefault();
        move("last");
        break;
      case "Enter": {
        e.preventDefault();
        if (activeModel) choose(activeModel);
        break;
      }
    }
  };

  const panel = (
    <>
      {showSearch && (
        <div
          data-slot="model-picker-search"
          className="flex h-11 shrink-0 items-center gap-2.5 px-3.5 shadow-[inset_0_-1px_0_var(--kura-border-subtle)]"
        >
          <Search aria-hidden className="size-4 shrink-0 text-kura-fg-subtle" />
          {/* focus: the caret is the indicator (the one text field of the list) */}
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active ? optionId(active) : undefined}
            aria-label="Search models"
            value={query}
            placeholder={searchPlaceholder}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={onKeyDown}
            className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-kura-fg outline-hidden placeholder:text-kura-fg-subtle"
          />
        </div>
      )}
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Models"
        tabIndex={showSearch ? -1 : 0}
        aria-activedescendant={!showSearch && active ? optionId(active) : undefined}
        className={cn(
          "min-h-0 shrink scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5 outline-hidden [scrollbar-width:thin]",
          !inline && "max-h-80",
          // The list holds focus when there is no search field: its ring is drawn inset.
          !showSearch &&
            "rounded-[inherit] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring focus-visible:-outline-offset-2",
        )}
      >
        {flat.length === 0 && (
          <div className="px-3 py-6 text-center text-[13px] text-kura-fg-subtle">
            {emptyMessage}
          </div>
        )}
        {groups.map(([provider, list]) => {
          const headingId = `${baseId}-group-${provider.replace(/\W/g, "_") || "default"}`;
          return (
            <div
              key={provider || "__default"}
              role="group"
              aria-labelledby={provider ? headingId : undefined}
              data-slot="model-picker-group"
              className="not-first:mt-1"
            >
              {provider && (
                <div
                  id={headingId}
                  className="select-none px-2.5 pt-2 pb-1 font-medium text-[12px] text-kura-fg-subtle"
                >
                  {provider}
                </div>
              )}
              {list.map((model) => {
                const isSelected = model.id === value;
                const isActive = model.id === active;
                return (
                  <div
                    key={model.id}
                    id={optionId(model.id)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={model.disabled || undefined}
                    data-slot="model-picker-item"
                    data-active={isActive || undefined}
                    data-selected={isSelected || undefined}
                    data-disabled={model.disabled || undefined}
                    onPointerMove={() =>
                      !model.disabled && active !== model.id && setActive(model.id)
                    }
                    onClick={() => choose(model)}
                    className="flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[9px] px-2.5 data-active:bg-kura-hover data-disabled:cursor-not-allowed data-disabled:opacity-45"
                  >
                    <ProviderMark model={model} />
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="truncate font-medium text-[13px] text-kura-fg">
                        {model.name}
                      </span>
                      {model.badge && (
                        <span className="shrink-0 text-[12px] text-kura-fg-subtle">
                          {model.badge}
                        </span>
                      )}
                    </span>
                    <ModelMeta model={model} />
                    <Check
                      aria-hidden
                      className={cn(
                        "size-3.5 shrink-0 text-kura-fg transition-opacity duration-(--kura-duration-fast) motion-reduce:transition-none",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {showDetails && flat.length > 0 && (
        <div
          data-slot="model-picker-details"
          aria-live="polite"
          className="flex h-[76px] shrink-0 items-center px-3.5 shadow-[inset_0_1px_0_var(--kura-border-subtle)]"
        >
          {/* What the model is, on up to two lines, then what it can do. The strip keeps one
              height for every model, so moving through the list never shifts it; a capability
              that does not fit wraps out of sight whole. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="line-clamp-2 text-pretty text-[12.5px] text-kura-fg-muted leading-[18px]">
              {activeModel?.description ?? (activeModel ? activeModel.name : "")}
            </p>
            {activeModel?.capabilities?.length ? (
              <p
                data-slot="model-picker-capabilities"
                className="flex h-[18px] flex-wrap overflow-hidden text-[12px] text-kura-fg-subtle leading-[18px]"
              >
                {activeModel.capabilities.map((c, i) => (
                  <span key={c} className="whitespace-nowrap">
                    {i > 0 && (
                      <span aria-hidden className="whitespace-pre">
                        {" · "}
                      </span>
                    )}
                    {CAPABILITIES[c].label}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </>
  );

  if (inline) {
    return (
      <div
        aria-label="Choose a model"
        role="group"
        // Button props that make sense on any element (data-*, aria-*, style, ref…) still apply.
        {...(props as React.ComponentProps<"div">)}
        data-slot="model-picker"
        data-inline=""
        aria-disabled={disabled || undefined}
        onKeyDown={showSearch ? undefined : onKeyDown}
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-kura-xl bg-kura-raised font-kura-sans text-kura-fg shadow-kura-popover",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
      >
        {panel}
      </div>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="model-picker"
          data-state={open ? "open" : "closed"}
          disabled={disabled}
          aria-label={selected ? `Model: ${selected.name}` : placeholder}
          className={cn(
            // Squeezed, the name gives way first; the sigil and the chevron always remain.
            "group/model-picker inline-flex min-w-14 shrink cursor-pointer select-none items-center gap-1.5 rounded-[9px] font-kura-sans font-medium text-kura-fg-muted outline-hidden",
            "transition-[background-color,color,transform] duration-(--kura-duration-fast) ease-kura-snap",
            "hover:not-disabled:bg-kura-hover hover:not-disabled:text-kura-fg data-[state=open]:bg-kura-hover data-[state=open]:text-kura-fg",
            "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring focus-visible:outline-offset-2 active:not-disabled:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:active:not-disabled:translate-y-0",
            size === "sm" ? "h-7 px-2 text-[13px]" : "h-8 px-2.5 text-[13px]",
            className,
          )}
          {...props}
        >
          {selected && <ProviderMark model={selected} />}
          {/* Squeezed, the name loses its start, not its end: "…Sonnet 5.5" still says which. */}
          <span className="truncate text-left [direction:rtl]">
            <span className="[direction:ltr] [unicode-bidi:isolate]">
              {selected?.name ?? placeholder}
            </span>
          </span>
          <ChevronDown
            aria-hidden
            className="size-3.5 shrink-0 text-kura-fg-subtle transition-transform duration-(--kura-duration-base) ease-kura-out group-data-[state=open]/model-picker:rotate-180 motion-reduce:transition-none"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={6}
        data-slot="model-picker-content"
        aria-label="Choose a model"
        // Never taller than the room around the trigger: the list shrinks and scrolls, the search
        // row and the details strip stay on screen.
        className="flex max-h-(--available-height) w-[360px] flex-col overflow-hidden p-0"
        initialFocus={() => (showSearch ? inputRef.current : listRef.current)}
        onKeyDown={showSearch ? undefined : onKeyDown}
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

function ModelMeta({ model }: { model: ModelPickerModel }) {
  const caps = model.capabilities ?? [];
  if (!model.contextWindow && !model.speed && !model.cost && caps.length === 0) return null;
  // Fixed columns, so context, speed and cost line up from row to row.
  return (
    <span
      data-slot="model-picker-meta"
      className="flex shrink-0 items-center gap-3 font-kura-mono text-[11.5px] text-kura-fg-subtle tabular-nums leading-none"
    >
      <span className="w-[4ch] text-right">
        {model.contextWindow ? (
          <span title={`${model.contextWindow.toLocaleString("en-US")} token context window`}>
            <span aria-hidden>{formatContextWindow(model.contextWindow)}</span>
            <span className="sr-only">{`${formatContextWindow(model.contextWindow)} context`}</span>
          </span>
        ) : null}
      </span>
      <span className="flex w-[15px] justify-center">
        {model.speed ? <Meter kind="speed" value={model.speed} label={SPEED[model.speed]} /> : null}
      </span>
      <span className="w-[3ch]">
        {model.cost ? <Meter kind="cost" value={model.cost} label={COST[model.cost]} /> : null}
      </span>
      {/* Capabilities are read out here, and spelled out in the details strip for the active row. */}
      {caps.length > 0 && (
        <span className="sr-only">{caps.map((c) => CAPABILITIES[c].label).join(", ")}</span>
      )}
    </span>
  );
}
