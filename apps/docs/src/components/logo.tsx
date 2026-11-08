import { cn } from "@/lib/cn";
import { Seal } from "./seal";

/** Kura: the 蔵 (storehouse) seal and the Redaction wordmark. */
export function Logo({ className, seal = true }: { className?: string; seal?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {seal && <Seal glyph="蔵" className="size-7" tilt={-5} />}
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="font-kura-display text-[23px] text-kura-fg tracking-[-0.01em]">Kura</span>
        <span className="font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
          ui
        </span>
      </span>
    </span>
  );
}
