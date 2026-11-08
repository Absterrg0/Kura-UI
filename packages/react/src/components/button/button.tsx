import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "../spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "accent" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends React.ComponentProps<"button"> {
  /** `primary` = ink (default call to action); `accent` = the AI signal colour, use at most once per view. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets `aria-busy` and disables interaction while keeping the width stable. */
  loading?: boolean;
  /** Render the child element instead of a <button> (e.g. a Next.js <Link>). */
  asChild?: boolean;
}

const base =
  "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap font-medium font-kura-sans outline-none " +
  "transition-[background-color,color,box-shadow,transform,opacity] duration-(--kura-duration-fast) ease-kura-out " +
  "focus-visible:shadow-kura-focus active:not-disabled:scale-[0.97] motion-reduce:active:not-disabled:scale-100 " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-kura-ink text-kura-fg-inverted shadow-kura-xs hover:not-disabled:bg-kura-ink-hover",
  secondary:
    "bg-kura-surface text-kura-fg shadow-kura-sm hover:not-disabled:bg-kura-surface-sunken",
  outline:
    "bg-transparent text-kura-fg shadow-[inset_0_0_0_1px_var(--kura-border-strong)] hover:not-disabled:bg-kura-hover",
  ghost:
    "bg-transparent text-kura-fg-muted hover:not-disabled:bg-kura-hover hover:not-disabled:text-kura-fg",
  accent:
    "bg-kura-accent text-kura-accent-fg shadow-kura-xs hover:not-disabled:bg-kura-accent-hover",
  danger: "bg-kura-danger text-white shadow-kura-xs hover:not-disabled:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-6 rounded-kura-sm px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 rounded-kura-sm px-2.5 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
  md: "h-8 rounded-kura-md px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
  lg: "h-10 rounded-kura-lg px-4 text-[15px] [&_svg:not([class*='size-'])]:size-4",
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
 * The Kura button. Press feedback is a 0.97 scale on :active (disabled under reduced motion),
 * focus is a 2px signal ring outside a 1px canvas gap.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  asChild = false,
  disabled,
  className,
  children,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={asChild ? type : (type ?? "button")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner size={size === "lg" ? "md" : "sm"} label={null} />
            </span>
          )}
          {loading ? (
            <span className="invisible inline-flex items-center gap-1.5">{children}</span>
          ) : (
            children
          )}
        </>
      )}
    </Comp>
  );
}
