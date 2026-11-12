import { buttonVariants } from "@kura-ui/react/button";

/**
 * The site's call to action is the library's own Button: a keycap. `light` is the primary (the ink
 * fill), `dark` the secondary (a raised key).
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
  return buttonVariants({
    variant: variant === "light" ? "primary" : "secondary",
    size: size === "lg" ? "lg" : "md",
    className,
  });
}
