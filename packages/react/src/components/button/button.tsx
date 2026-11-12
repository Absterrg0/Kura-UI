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
  /** `primary` = ink (default call to action); `accent` = the AI signal colour, use at most once per view. */
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
  "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap font-kura-sans font-medium tracking-[-0.006em] outline-none " +
  "transition-[background-color,color,box-shadow,transform,opacity] duration-(--kura-duration-fast) ease-kura-out " +
  "focus-visible:shadow-kura-focus active:not-disabled:not-aria-disabled:scale-[0.98] motion-reduce:active:not-disabled:scale-100 " +
  "disabled:cursor-not-allowed disabled:not-aria-busy:opacity-50 aria-disabled:not-aria-busy:cursor-not-allowed aria-disabled:not-aria-busy:opacity-50 aria-busy:cursor-progress " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-kura-ink text-kura-fg-inverted hover:not-disabled:bg-kura-ink-hover",
  secondary:
    "bg-kura-gray-4 text-kura-fg hover:not-disabled:bg-kura-gray-5 active:not-disabled:bg-kura-gray-6",
  outline:
    "bg-kura-surface text-kura-fg shadow-kura-xs hover:not-disabled:bg-kura-gray-3 active:not-disabled:bg-kura-gray-4",
  ghost:
    "bg-transparent text-kura-fg-muted hover:not-disabled:bg-kura-hover hover:not-disabled:text-kura-fg active:not-disabled:bg-kura-active",
  accent: "bg-kura-accent text-kura-accent-fg hover:not-disabled:bg-kura-accent-hover",
  danger: "bg-kura-danger text-white hover:not-disabled:opacity-90",
};

// Heights 24 / 28 / 32 / 40. A leading or trailing icon trims the padding on that side so the
// icon sits optically centred against the label.
const sizes: Record<ButtonSize, string> = {
  xs: "h-6 rounded-kura-sm px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 rounded-kura-md px-2.5 text-[13px] has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
  md: "h-8 rounded-kura-md px-3 text-sm has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-4",
  lg: "h-10 rounded-kura-lg px-4 text-[15px] has-[>svg]:px-3.5 [&_svg:not([class*='size-'])]:size-4",
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
          <span className="invisible inline-flex items-center gap-1.5">{children}</span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
}
