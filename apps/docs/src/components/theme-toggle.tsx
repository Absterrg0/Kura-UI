"use client";

import { useReducedMotion } from "@kura-ui/react/hooks";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/cn";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * Switches light and dark. Where the browser has view transitions, the new theme spreads out from
 * the button: a solid disc with a band of halftone dots on its edge (see `[data-theme-vt]` in
 * globals.css). Under reduced motion, or without view transitions, it simply switches.
 */
export function ThemeToggle({
  size = "sm",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLButtonElement>(null);

  const toggle = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const apply = () => {
      // Set the class here too, so the snapshot of the new state already has it.
      root.classList.toggle("dark", next === "dark");
      root.classList.toggle("light", next === "light");
      root.style.colorScheme = next;
      flushSync(() => setTheme(next));
    };
    const doc = document as ViewTransitionDocument;
    if (!doc.startViewTransition || reduced) {
      setTheme(next);
      return;
    }
    const rect = ref.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const y = rect ? rect.top + rect.height / 2 : 40;
    const far = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-max", `${Math.ceil(far)}px`);
    root.dataset.themeVt = "";
    doc.startViewTransition(apply).finished.finally(() => {
      delete root.dataset.themeVt;
    });
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-label="Toggle theme"
      data-testid="theme-toggle"
      onClick={toggle}
      className={cn(
        "group/theme relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg text-kura-fg-muted outline-hidden transition-colors duration-150 hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-kura-focus",
        size === "md" ? "size-11" : "size-8",
        className,
      )}
    >
      <Sun
        aria-hidden
        className="absolute size-4 rotate-90 scale-0 opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none dark:rotate-0 dark:scale-100 dark:opacity-100"
      />
      <Moon
        aria-hidden
        className="absolute size-4 rotate-0 scale-100 opacity-100 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none dark:-rotate-90 dark:scale-0 dark:opacity-0"
      />
    </button>
  );
}
