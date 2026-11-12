import { useId } from "react";
import { cn } from "@/lib/cn";

/** The Kura mark: an ember tile with a K drawn from a stem and an angle bracket, the shape of a prompt. */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-6", className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ember-hot)" />
          <stop offset="1" stopColor="var(--ember-deep)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8.5"
        fill="none"
        stroke="white"
        strokeOpacity="0.18"
      />
      <rect x="9.5" y="8" width="3.4" height="16" rx="1.2" fill="white" />
      <path
        d="M22.6 8.6 15.6 16l7 7.4"
        fill="none"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-semibold text-[16px] tracking-[-0.025em]">Kura</span>
    </span>
  );
}
