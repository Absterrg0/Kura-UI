import { cn } from "@/lib/cn";

/** Kura mark: a storehouse doorway with a live signal dot. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-medium tracking-tight", className)}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <rect x="2.5" y="2.5" width="19" height="19" rx="6" className="fill-kura-ink" />
        <path
          d="M8 17V10.5a4 4 0 0 1 8 0V17"
          className="stroke-kura-fg-inverted"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="12" cy="13.6" r="1.6" className="fill-kura-accent" />
      </svg>
      <span>Kura UI</span>
    </span>
  );
}
