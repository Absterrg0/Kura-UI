import { cn } from "@/lib/cn";
import { KANJI, type Kanji } from "@/lib/kanji";

/** A vermilion seal (hanko) stamped with one brush kanji. Decorative. */
export function Seal({
  glyph,
  className,
  tilt = -4,
}: {
  glyph: Kanji;
  className?: string;
  /** Degrees; seals are never stamped perfectly straight. */
  tilt?: number;
}) {
  const k = KANJI[glyph];
  return (
    <span
      aria-hidden
      className={cn(
        "seal-mask inline-grid aspect-square shrink-0 place-items-center bg-kura-shu",
        className,
      )}
      style={{ rotate: `${tilt}deg` }}
    >
      <svg viewBox={`0 0 ${k.size} ${k.size}`} className="size-[64%]" aria-hidden>
        <path d={k.d} fill="var(--seal-glyph)" />
      </svg>
    </span>
  );
}
