import { cn } from "@/lib/cn";

/**
 * The site's call-to-action look. `light` is the primary (a lit pill: white on the dark canvas,
 * ink on the light one) and picks up an ember glow on hover and focus; `dark` is the secondary.
 */
export function siteButton({
  variant = "light",
  size = "lg",
  className,
}: {
  variant?: "light" | "dark";
  size?: "sm" | "lg";
  className?: string;
} = {}) {
  return cn(
    "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap font-medium outline-none",
    "transition-[background-color,box-shadow,color,transform] duration-200 ease-kura-out active:scale-[0.98] motion-reduce:active:scale-100",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    size === "lg" ? "h-11 rounded-xl px-5 text-[15px]" : "h-8 rounded-[10px] px-3.5 text-[13.5px]",
    variant === "light"
      ? [
          "bg-kura-ink text-kura-fg-inverted",
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(0_0_0/0.2),0_0_0_1px_var(--kura-ink)]",
          "hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_0_0_1px_var(--kura-ink),0_0_0_4px_color-mix(in_oklch,var(--ember)_28%,transparent),0_8px_28px_-6px_color-mix(in_oklch,var(--ember)_60%,transparent)]",
          "focus-visible:shadow-[0_0_0_2px_var(--kura-canvas),0_0_0_4px_var(--ember),0_8px_28px_-6px_color-mix(in_oklch,var(--ember)_60%,transparent)]",
        ]
      : [
          "bg-kura-surface-raised text-kura-fg",
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_var(--kura-border),0_1px_2px_rgb(0_0_0/0.15)]",
          "hover:bg-kura-gray-5",
          "focus-visible:shadow-[0_0_0_2px_var(--kura-canvas),0_0_0_4px_var(--kura-ring)]",
        ],
    className,
  );
}
