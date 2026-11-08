import { cn } from "@/lib/cn";

/** The Kura mark: a K drawn from a stem and an angle bracket, the shape of a prompt. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-6", className)}>
      <rect width="32" height="32" rx="8" className="fill-kura-ink" />
      <rect x="9" y="8" width="3.4" height="16" rx="1.2" className="fill-kura-canvas" />
      <path
        d="M23 8.6 15.4 16 23 23.4"
        fill="none"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-kura-canvas"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-semibold text-[15px] tracking-[-0.02em]">Kura</span>
    </span>
  );
}
