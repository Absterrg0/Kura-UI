import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "../spinner";
import { BRUSH_SWASH_MASK } from "./brush";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "accent"
  | "danger"
  | "brush";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends React.ComponentProps<"button"> {
  /**
   * `primary` = ink (default call to action); `accent` = the AI signal colour, use at most once per
   * view; `brush` = the same ink laid down as a single brush swash, for the one hero action.
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets `aria-busy` and disables interaction while keeping the width stable. */
  loading?: boolean;
  /** Render the child element instead of a <button> (e.g. a Next.js <Link>). */
  asChild?: boolean;
}

const base =
  "relative isolate inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap font-kura-sans font-medium outline-none " +
  "transition-[background-color,color,box-shadow,translate,rotate,opacity] duration-(--kura-duration-fast) ease-kura-out " +
  "focus-visible:shadow-kura-focus active:not-disabled:translate-y-px motion-reduce:active:not-disabled:translate-y-0 " +
  "disabled:cursor-not-allowed disabled:not-aria-busy:opacity-50 aria-busy:cursor-progress aria-busy:opacity-85 " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg[stroke-width='2']]:stroke-[1.75]";

// Filled buttons are a block of ink on paper: a faint lit edge on top, a slightly denser edge at
// the bottom, and a short contact shadow that disappears as the key goes down.
const pressed =
  "shadow-[inset_0_1px_0_0_color-mix(in_oklab,white_14%,transparent),inset_0_-1px_0_0_color-mix(in_oklab,black_18%,transparent),0_1px_2px_-1px_color-mix(in_oklab,black_40%,transparent),0_2px_6px_-3px_color-mix(in_oklab,black_22%,transparent)] " +
  "active:not-disabled:shadow-[inset_0_1px_0_0_color-mix(in_oklab,white_8%,transparent),inset_0_1px_2px_0_color-mix(in_oklab,black_18%,transparent)]";

const variants: Record<ButtonVariant, string> = {
  primary: `bg-kura-ink text-kura-fg-inverted ${pressed} hover:not-disabled:bg-kura-ink-hover`,
  // A sheet of bright stock with a hairline edge.
  secondary:
    "bg-kura-surface-raised text-kura-fg shadow-[0_0_0_1px_var(--kura-border),0_1px_0_0_var(--kura-border),inset_0_1px_0_0_color-mix(in_oklab,white_6%,transparent),0_2px_5px_-3px_color-mix(in_oklab,black_14%,transparent)] hover:not-disabled:bg-[color-mix(in_oklab,var(--kura-surface-raised),var(--kura-fg)_4%)] " +
    "active:not-disabled:bg-[color-mix(in_oklab,var(--kura-surface-raised),var(--kura-fg)_7%)] active:not-disabled:shadow-[0_0_0_1px_var(--kura-border)] data-[state=open]:bg-[color-mix(in_oklab,var(--kura-surface-raised),var(--kura-fg)_5%)]",
  outline:
    "bg-transparent text-kura-fg shadow-[inset_0_0_0_1px_var(--kura-border-strong)] hover:not-disabled:bg-kura-hover hover:not-disabled:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--kura-fg)_40%,transparent)] " +
    "active:not-disabled:bg-kura-active data-[state=open]:bg-kura-hover",
  ghost:
    "bg-transparent text-kura-fg-muted hover:not-disabled:bg-kura-hover hover:not-disabled:text-kura-fg active:not-disabled:bg-kura-active data-[state=open]:bg-kura-hover data-[state=open]:text-kura-fg",
  // Vermilion carries text here, so it is pushed a little toward the ink (deeper in light,
  // brighter in dark) to keep the label above 4.5:1 in both themes.
  accent: `bg-[color-mix(in_oklab,var(--kura-accent),var(--kura-ink)_9%)] text-kura-accent-fg ${pressed} hover:not-disabled:bg-[color-mix(in_oklab,var(--kura-accent),var(--kura-ink)_18%)]`,
  // Beni: deep red with paper-coloured text in light, bright red with ink text in dark.
  danger: `bg-kura-danger text-kura-fg-inverted ${pressed} hover:not-disabled:bg-[color-mix(in_oklab,var(--kura-danger),var(--kura-fg)_12%)]`,
  // The stroke is a masked layer behind the label (see <BrushStroke>); the box itself is clear.
  brush:
    "bg-transparent text-kura-fg-inverted active:not-disabled:-rotate-[0.6deg] motion-reduce:active:not-disabled:rotate-0 " +
    "[&>[data-slot=button-brush]]:bg-(--kura-brush,var(--kura-ink)) hover:not-disabled:[&>[data-slot=button-brush]]:bg-(--kura-brush-hover,var(--kura-ink-hover))",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-6 rounded-kura-xs px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 rounded-kura-sm px-2.5 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
  md: "h-8 rounded-kura-sm px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
  lg: "h-10 rounded-kura-md px-4 text-[15px] [&_svg:not([class*='size-'])]:size-4",
};

// A brush stroke tapers at both ends, so the label needs more room than a box would.
const brushPadding: Record<ButtonSize, string> = {
  xs: "px-3.5",
  sm: "px-4",
  md: "px-5",
  lg: "px-7",
};

/**
 * Class string for a button look, for elements that cannot use <Button> directly. `brush` needs
 * the stroke element that <Button> renders: use `<Button variant="brush" asChild>` instead.
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(
    base,
    variants[variant],
    sizes[size],
    variant === "brush" && brushPadding[size],
    className,
  );
}

const brushStyle: React.CSSProperties = {
  maskImage: BRUSH_SWASH_MASK,
  WebkitMaskImage: BRUSH_SWASH_MASK,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
};

/** The swash of ink behind a `brush` button's label. Decorative. */
function BrushStroke() {
  return (
    <span
      aria-hidden
      data-slot="button-brush"
      className="pointer-events-none absolute inset-0 -z-10 transition-[background-color] duration-(--kura-duration-base) ease-kura-out"
      style={brushStyle}
    />
  );
}

/**
 * The Kura button. Filled variants are ink on paper with a lit top edge; press feedback is a 1px
 * travel (dropped under reduced motion); focus is a 2px signal ring outside a 1px canvas gap.
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
  const brush = variant === "brush" ? <BrushStroke /> : null;
  const shared = {
    "data-slot": "button",
    "data-variant": variant,
    "data-size": size,
    disabled: disabled || loading,
    "aria-busy": loading || undefined,
    className: buttonVariants({ variant, size, className }),
  };

  if (asChild) {
    // Slottable lets the stroke join the child's own children (e.g. inside an <a>).
    // The child decides what `type`/`disabled` mean (an <a> ignores them, a <button> keeps them).
    const slotProps = { ...shared, type, ...props } as React.ComponentProps<typeof Slot.Root>;
    return (
      <Slot.Root {...slotProps}>
        {brush}
        <Slot.Slottable>{children}</Slot.Slottable>
      </Slot.Root>
    );
  }

  return (
    <button {...shared} type={type ?? "button"} {...props}>
      {brush}
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
    </button>
  );
}
