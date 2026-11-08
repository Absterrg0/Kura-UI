"use client";

import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import type * as React from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";

export interface PromptSuggestion {
  /** Stable id; defaults to the title. Changing ids re-runs the enter animation for that item. */
  id?: string;
  /** Short label, e.g. "Plan a trip". */
  title: string;
  /** Secondary line (cards and list only), e.g. "to Kyoto in April". */
  description?: string;
  /** 16px icon. */
  icon?: React.ReactNode;
  /** Text passed to `onSelect`. Defaults to title + " " + description. */
  prompt?: string;
}

export interface PromptSuggestionsProps
  extends Omit<React.ComponentProps<"ul">, "children" | "onSelect"> {
  suggestions: readonly PromptSuggestion[];
  /** Called with the prompt text when a suggestion is clicked. */
  onSelect?: (prompt: string, suggestion: PromptSuggestion) => void;
  /** `chips` = pills in a wrapping row, `cards` = two-column tiles, `list` = rows. Default "cards". */
  variant?: "chips" | "cards" | "list";
  /** Seconds between items entering. Default 0.04. Capped after 8 items. */
  stagger?: number;
  /** Accessible name. Default "Suggestions". */
  label?: string;
  disabled?: boolean;
}

const promptOf = (s: PromptSuggestion) =>
  s.prompt ?? [s.title, s.description].filter(Boolean).join(" ");

/**
 * Starter prompts for an empty chat: chips, cards or a list that rise in with a short stagger
 * and hand their prompt to `onSelect` (e.g. to fill a composer).
 */
export function PromptSuggestions({
  suggestions,
  onSelect,
  variant = "cards",
  stagger = 0.04,
  label = "Suggestions",
  disabled = false,
  className,
  ...props
}: PromptSuggestionsProps) {
  const reduced = useReducedMotion();

  const item: Variants = reduced
    ? { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: 6, filter: "blur(2px)" },
        shown: (i: number) => ({
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { ...springs.smooth, delay: Math.min(i, 8) * stagger },
        }),
      };

  return (
    <ul
      data-slot="prompt-suggestions"
      data-variant={variant}
      aria-label={label}
      className={cn(
        "font-kura-sans",
        variant === "chips" && "flex flex-wrap justify-center gap-2",
        variant === "cards" && "grid grid-cols-1 gap-2 sm:grid-cols-2",
        variant === "list" && "flex flex-col",
        className,
      )}
      {...props}
    >
      <AnimatePresence initial mode="popLayout">
        {suggestions.map((s, i) => {
          const key = s.id ?? s.title;
          return (
            <motion.li
              key={key}
              custom={i}
              variants={item}
              initial="hidden"
              animate="shown"
              exit={{ opacity: 0, transition: { duration: 0.09 } }}
              className={cn(
                "flex",
                variant === "list" && "not-last:border-kura-border not-last:border-b",
              )}
            >
              <button
                type="button"
                data-slot="prompt-suggestions-item"
                disabled={disabled}
                onClick={() => onSelect?.(promptOf(s), s)}
                className={cn(
                  "group/suggestion relative flex w-full min-w-0 cursor-pointer items-center text-left outline-none",
                  "transition-[background-color,color,box-shadow,transform] duration-(--kura-duration-fast) ease-kura-out",
                  "focus-visible:shadow-kura-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none",
                  // Chips: slips of the page's paper with a hairline edge; hover lifts one onto
                  // bright stock.
                  variant === "chips" &&
                    "h-8 gap-1.5 rounded-kura-md bg-kura-surface px-3 text-[13px] text-kura-fg-muted shadow-[inset_0_0_0_1px_var(--kura-border)] hover:not-disabled:bg-kura-surface-raised hover:not-disabled:text-kura-fg hover:not-disabled:shadow-kura-sm active:not-disabled:translate-y-px [&_[data-slot=prompt-suggestions-icon]_svg]:size-3.5",
                  // Cards: bright prints laid on the page.
                  variant === "cards" &&
                    "flex-col items-start gap-3 rounded-kura-md bg-kura-surface-raised p-4 shadow-kura-sm hover:not-disabled:shadow-kura-md active:not-disabled:translate-y-px",
                  // List: ruled rows (the rules live on the <li>).
                  variant === "list" &&
                    "gap-3 rounded-kura-sm px-2 py-2.5 text-kura-fg-muted text-sm hover:not-disabled:bg-kura-hover hover:not-disabled:text-kura-fg",
                )}
              >
                {s.icon && (
                  <span
                    data-slot="prompt-suggestions-icon"
                    aria-hidden
                    className={cn(
                      "flex shrink-0 items-center justify-center text-kura-fg-subtle transition-colors duration-(--kura-duration-fast) group-hover/suggestion:text-kura-fg [&_svg]:stroke-[1.75]",
                      variant === "cards" &&
                        "size-7 rounded-kura-xs bg-kura-surface shadow-[inset_0_0_0_1px_var(--kura-border-subtle)] [&_svg]:size-3.5",
                      variant === "list" && "[&_svg]:size-4",
                    )}
                  >
                    {s.icon}
                  </span>
                )}
                {variant === "chips" ? (
                  <span className="truncate">{s.title}</span>
                ) : (
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={cn(
                        "truncate font-medium",
                        variant === "cards" ? "text-kura-fg text-sm" : "text-inherit",
                      )}
                    >
                      {s.title}
                    </span>
                    {s.description && (
                      <span
                        className={cn(
                          "text-kura-fg-subtle",
                          variant === "cards"
                            ? "line-clamp-2 text-[13px] leading-[18px]"
                            : "truncate text-xs",
                        )}
                      >
                        {s.description}
                      </span>
                    )}
                  </span>
                )}
                {variant !== "chips" && (
                  <ArrowUpRight
                    aria-hidden
                    strokeWidth={1.75}
                    className={cn(
                      "size-3.5 shrink-0 text-kura-fg-subtle opacity-0 transition-[opacity,transform] duration-(--kura-duration-base) ease-kura-out",
                      "-translate-x-0.5 translate-y-0.5 group-hover/suggestion:translate-x-0 group-hover/suggestion:translate-y-0 group-hover/suggestion:opacity-100 group-focus-visible/suggestion:opacity-100",
                      "motion-reduce:translate-x-0 motion-reduce:translate-y-0",
                      variant === "cards" && "absolute top-4 right-4",
                    )}
                  />
                )}
              </button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
