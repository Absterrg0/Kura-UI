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
        hidden: { opacity: 0, y: 4 },
        shown: (i: number) => ({
          opacity: 1,
          y: 0,
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
              className="flex"
            >
              <button
                type="button"
                data-slot="prompt-suggestions-item"
                disabled={disabled}
                onClick={() => onSelect?.(promptOf(s), s)}
                className={cn(
                  "group/suggestion relative flex w-full min-w-0 cursor-pointer items-center text-left outline-none",
                  "transition-[background-color,color,transform] duration-(--kura-duration-fast) ease-kura-snap",
                  "focus-visible:outline-2 focus-visible:outline-kura-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none",
                  // Chips are keycaps; cards are sheets; the list is bare rows.
                  variant === "chips" &&
                    "h-8 gap-1.5 rounded-[9px] bg-kura-raised px-[11px] font-medium text-[13px] text-kura-fg shadow-kura-raised hover:not-disabled:bg-kura-raised-hover active:not-disabled:translate-y-px [&_[data-slot=prompt-suggestions-icon]_svg]:size-3.5",
                  variant === "cards" &&
                    "flex-col items-start gap-2.5 rounded-kura-xl bg-kura-surface p-3.5 shadow-kura-surface hover:not-disabled:bg-kura-raised active:not-disabled:translate-y-px",
                  variant === "list" &&
                    "gap-3 rounded-[9px] px-2 py-2.5 text-[13px] text-kura-fg-muted hover:not-disabled:bg-kura-hover hover:not-disabled:text-kura-fg",
                )}
              >
                {s.icon && (
                  <span
                    data-slot="prompt-suggestions-icon"
                    aria-hidden
                    className={cn(
                      "flex shrink-0 items-center justify-center text-kura-fg-subtle transition-colors duration-(--kura-duration-fast) group-hover/suggestion:text-kura-fg-muted",
                      variant === "cards" &&
                        "size-[30px] rounded-[9px] bg-kura-raised shadow-kura-raised [&_svg]:size-3.5",
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
                        variant === "cards" ? "text-[13px] text-kura-fg" : "text-inherit",
                      )}
                    >
                      {s.title}
                    </span>
                    {s.description && (
                      <span
                        className={cn(
                          "text-kura-fg-subtle",
                          variant === "cards"
                            ? "line-clamp-2 text-xs leading-4"
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
                    className={cn(
                      "size-3.5 shrink-0 text-kura-fg-subtle opacity-0 transition-[opacity,transform] duration-(--kura-duration-base) ease-kura-out",
                      "-translate-x-0.5 translate-y-0.5 group-hover/suggestion:translate-x-0 group-hover/suggestion:translate-y-0 group-hover/suggestion:opacity-100 group-focus-visible/suggestion:opacity-100",
                      "motion-reduce:translate-x-0 motion-reduce:translate-y-0",
                      variant === "cards" && "absolute top-3.5 right-3.5",
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
