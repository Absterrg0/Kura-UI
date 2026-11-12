import { cn } from "@/lib/cn";
import { CopyButton } from "../copy-button";

/** A one-line install command with a copy button. */
export function InstallChip({ command, className }: { command: string; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex h-9 max-w-full items-center gap-2 rounded-[10px] bg-kura-hover pr-1 pl-3.5 font-kura-mono text-[12.5px] text-kura-fg-muted shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]",
        className,
      )}
    >
      <span aria-hidden className="select-none text-kura-fg-subtle">
        $
      </span>
      <span className="min-w-0 truncate">{command}</span>
      <CopyButton value={command} label="Copy install command" className="shrink-0" />
    </div>
  );
}
