import { Button as ButtonPrimitive } from "@ui-sdk/react/button";
import * as React from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "../spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "accent" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends Omit<React.ComponentProps<"button">, "onClick"> {
  /**
   * Runs on press. `details.source` says how: `"mouse"`, `"keyboard"`, `"touch"`… or `"agent"`
   * when an agent connected through `createAgent` pressed it. Return a Promise to keep the button
   * busy until it settles.
   */
  onClick?: (event: React.MouseEvent<HTMLElement>, details?: { source: string }) => unknown;
  /** `primary` = the ink fill (default call to action). `accent` draws the same: Kura has no accent colour. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Shows a spinner, sets `aria-busy` and ignores presses while keeping focus and the width stable.
   * An `onClick` that returns a Promise does the same on its own until it settles.
   */
  loading?: boolean;
  /** Render the child element instead of a <button> (e.g. a Next.js <Link>). */
  asChild?: boolean;
  /**
   * Keep a disabled button in the tab order with `aria-disabled`, so it can hold focus and show a
   * tooltip that says why. Presses still do nothing.
   */
  focusableWhenDisabled?: boolean;
}

const base =
  "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap font-kura-sans font-medium tracking-[-0.005em] outline-hidden " +
  "transition-[background-color,background-image,color,box-shadow,transform,opacity] duration-(--kura-duration-fast) ease-kura-snap " +
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring active:not-disabled:not-aria-disabled:translate-y-px active:not-disabled:not-aria-disabled:scale-[0.985] motion-reduce:active:not-disabled:translate-y-0 motion-reduce:active:not-disabled:scale-100 " +
  "disabled:cursor-not-allowed disabled:not-aria-busy:opacity-50 aria-disabled:not-aria-busy:cursor-not-allowed aria-disabled:not-aria-busy:opacity-50 aria-busy:cursor-progress " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-kura-ink-fill text-kura-fg-inverted shadow-kura-ink hover:not-disabled:not-aria-disabled:bg-kura-ink-fill-hover",
  secondary:
    "bg-kura-raised text-kura-fg shadow-kura-raised hover:not-disabled:not-aria-disabled:bg-kura-raised-hover",
  outline:
    "bg-kura-raised text-kura-fg shadow-kura-raised hover:not-disabled:not-aria-disabled:bg-kura-raised-hover",
  ghost:
    "bg-transparent text-kura-fg-muted hover:not-disabled:not-aria-disabled:bg-kura-hover hover:not-disabled:not-aria-disabled:text-kura-fg active:not-disabled:bg-kura-active",
  // Kura has no accent colour: `accent` is kept for compatibility and draws as primary.
  accent:
    "bg-kura-ink-fill text-kura-fg-inverted shadow-kura-ink hover:not-disabled:not-aria-disabled:bg-kura-ink-fill-hover",
  // Destructive: the same raised key, with its label in red. Nothing in Kura is a red fill.
  danger:
    "bg-kura-raised text-kura-danger-text shadow-kura-raised hover:not-disabled:not-aria-disabled:bg-kura-raised-hover",
};

// Heights 24 / 28 / 32 / 40. A leading or trailing icon trims the padding on that side so the
// icon sits optically centred against the label.
const sizes: Record<ButtonSize, string> = {
  xs: "h-6 rounded-[7px] px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 rounded-[8px] px-2.5 text-[12.5px] has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
  md: "h-8 rounded-[9px] px-[11px] text-[13px] has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-3.5",
  lg: "h-10 rounded-[11px] px-4 text-[14px] has-[>svg]:px-3.5 [&_svg:not([class*='size-'])]:size-4",
};

/** Class string for a button look, for elements that cannot use <Button> directly. */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

/**
 * The Kura button, built on the ui-sdk Button: an agent connected through `createAgent` can find it
 * by its text and press it (mark it `data-agent-confirm` when a person must decide). Press feedback
 * is a 0.98 scale on :active (disabled under reduced motion), focus is a 2px signal ring outside a
 * 1px canvas gap.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  asChild = false,
  focusableWhenDisabled,
  disabled,
  className,
  children,
  type,
  onClick,
  ...props
}: ButtonProps) {
  const classes = buttonVariants({ variant, size, className });
  // ui-sdk owns `data-slot` on its parts; a wrapper like IconButton names itself through `render`.
  const slot = (props as { "data-slot"?: string })["data-slot"];
  if (asChild && React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return (
      <ButtonPrimitive
        data-variant={variant}
        data-size={size}
        disabled={disabled}
        className={classes}
        render={React.cloneElement(children, { children: undefined })}
        onClick={onClick}
        {...props}
      >
        {children.props.children}
      </ButtonPrimitive>
    );
  }
  return (
    <ButtonPrimitive
      data-variant={variant}
      data-size={size}
      type={type ?? "button"}
      disabled={disabled}
      focusableWhenDisabled={loading || focusableWhenDisabled || undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      className={classes}
      render={slot ? <button type={type ?? "button"} data-slot={slot} /> : undefined}
      {...props}
      onClick={loading ? undefined : onClick}
    >
      {loading ? (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size={size === "lg" ? "md" : "sm"} label={null} />
          </span>
          {/* Transparent, not hidden: the label keeps the button's width and its spoken name. */}
          <span className="inline-flex items-center gap-1.5 opacity-0">{children}</span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
}
