import { cn } from "@/lib/cn";

// The token gate: two stepped storehouse walls (蔵, kura), each the other turned half a circle,
// with one token held in the opening between them. Generated with Codex's image generation tool,
// traced, then made exactly symmetric. Sources and the generation prompts: design/logo/.
const WALLS =
  "M0,0 L511,0 L511,122.5 L363,122.5 L363,225.5 L225.5,225.5 L225.5,363 L122.5,363 L122.5,511 L0,511 Z " +
  "M748,748 L237,748 L237,625.5 L385,625.5 L385,522.5 L522.5,522.5 L522.5,385 L625.5,385 L625.5,237 L748,237 Z";

/** The Kura mark, in the current text colour. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 748 748" aria-hidden className={cn("block size-5 shrink-0", className)}>
      <path d={WALLS} fill="currentColor" />
      <circle cx={374} cy={374} r={110} fill="currentColor" />
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
