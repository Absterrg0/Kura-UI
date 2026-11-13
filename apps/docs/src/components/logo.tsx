import { cn } from "@/lib/cn";

// A 5×5 dot "K", row by row.
const K = ["10010", "10100", "11000", "10100", "10010"];

/** The Kura mark: an ember tile with a white K set in dots, the library's language in one glyph. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("block size-6 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="var(--kura-ember)" />
      {K.flatMap((row, y) =>
        [...row].map((on, x) =>
          on === "1" ? (
            <circle key={`${x}-${y}`} cx={8.4 + x * 4.4} cy={7.2 + y * 4.4} r={1.75} fill="#fff" />
          ) : null,
        ),
      )}
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-semibold text-[16px] leading-none tracking-[-0.025em]">Kura</span>
    </span>
  );
}
