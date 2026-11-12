import type * as React from "react";
import { cn } from "../../lib/cn";

export interface HalftoneProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Which corner the light comes from. Default "top-right". */
  corner?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  /** Fade it out, e.g. once the person has decided. Default true. */
  visible?: boolean;
  /** How far the dots reach across the box, 0–1. Default 0.62. */
  reach?: number;
  /** "ember" means this needs a person; "ink" is a neutral texture. Default "ember". */
  tone?: "ember" | "ink";
}

const AT = {
  "top-right": "100% 0%",
  "top-left": "0% 0%",
  "bottom-right": "100% 100%",
  "bottom-left": "0% 100%",
} as const;

// Three rings of dots that shrink as they get further from the corner: a halftone.
const RINGS = [
  { r: 1.7, stops: "transparent 0%, #000 0%, transparent 30%" },
  { r: 1.2, stops: "transparent 22%, #000 32%, transparent 48%" },
  { r: 0.7, stops: "transparent 40%, #000 50%, transparent 66%" },
] as const;

/**
 * Kura's one light: a halftone of dots that shrink as they fade from a corner. In ember it marks
 * the thing that needs a person, and it fades out once they decide. Put it first inside a
 * `relative isolate` box; it sits behind the content.
 */
export function Halftone({
  corner = "top-right",
  visible = true,
  reach = 0.62,
  tone = "ember",
  className,
  ...props
}: HalftoneProps) {
  const at = AT[corner];
  const size = `${Math.round(reach * 100)}% ${Math.round(reach * 142)}%`;
  const color = tone === "ember" ? "var(--kura-ember)" : "var(--kura-fg-subtle)";
  return (
    <span
      aria-hidden
      data-slot="halftone"
      data-tone={tone}
      data-state={visible ? "visible" : "hidden"}
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit] transition-opacity duration-(--kura-duration-slower) ease-kura-snap motion-reduce:transition-none",
        !visible && "opacity-0",
        className,
      )}
      {...props}
    >
      <span
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${Math.round(reach * 74)}% ${Math.round(reach * 113)}% at ${at}, color-mix(in oklch, ${color} 20%, transparent), transparent 72%)`,
        }}
      />
      {RINGS.map((ring) => {
        const mask = `radial-gradient(${size} at ${at}, ${ring.stops})`;
        return (
          <span
            key={ring.r}
            className="kura-dots absolute inset-0"
            style={
              {
                "--kura-dots-color": color,
                "--kura-dots-r": `${ring.r}px`,
                "--kura-dots-pitch": "7px",
                maskImage: mask,
                WebkitMaskImage: mask,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
