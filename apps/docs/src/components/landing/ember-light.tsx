import type * as React from "react";
import { cn } from "@/lib/cn";

// Three rings of dots that shrink as they get further from the source: a halftone.
const RINGS = [
  { r: 2.3, stops: "#000 0%, #000 14%, transparent 34%" },
  { r: 1.6, stops: "transparent 22%, #000 34%, transparent 54%" },
  { r: 0.95, stops: "transparent 44%, #000 56%, transparent 76%" },
] as const;

/**
 * The site's one brand light: an ember halftone rising from behind whatever sits below it (the
 * hero stage, the closing mark). The same dots as the library's Halftone, at page scale. Static.
 */
export function EmberLight({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      data-slot="ember-light"
      className={cn(
        "pointer-events-none absolute inset-x-0 mx-auto h-[200px] w-full max-w-[1180px] select-none",
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(46% 78% at 50% 100%, color-mix(in oklch, var(--kura-ember) 22%, transparent), transparent 72%)",
        }}
      />
      {RINGS.map((ring) => {
        const mask = `radial-gradient(52% 100% at 50% 100%, ${ring.stops})`;
        return (
          <div
            key={ring.r}
            className="kura-dots absolute inset-0"
            style={
              {
                "--kura-dots-color": "var(--kura-ember)",
                "--kura-dots-r": `${ring.r}px`,
                "--kura-dots-pitch": "9px",
                maskImage: mask,
                WebkitMaskImage: mask,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
