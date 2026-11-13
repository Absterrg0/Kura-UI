import * as React from "react";
import { cn } from "@/lib/cn";
import { CopyButton } from "../copy-button";

/**
 * An install command with a copy key: one line where it fits, and on a narrow screen it wraps
 * whole (at its spaces and after the slashes of its URL) instead of ending in an ellipsis. The
 * same command reads the same way in the page head, the hero and the Installation section.
 */
export function InstallChip({ command, className }: { command: string; className?: string }) {
  return (
    <div
      className={cn(
        "well inline-flex min-h-9 max-w-full items-start gap-2 rounded-kura-lg py-2 pr-1 pl-3.5 text-left font-kura-mono text-[12.5px] text-kura-fg-muted leading-5",
        className,
      )}
    >
      <span aria-hidden className="select-none text-kura-fg-subtle">
        $
      </span>
      <span className="min-w-0">
        {command.split(" ").map((word, i) => (
          <React.Fragment key={i}>
            {i > 0 && " "}
            {(word.match(/[^/]*:\/\/[^/]*\/?|[^/]*\/|[^/]+$/g) ?? [word]).map((piece, j) => (
              <React.Fragment key={j}>
                {j > 0 && <wbr />}
                <span className="whitespace-nowrap">{piece}</span>
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </span>
      <CopyButton value={command} label="Copy install command" className="-my-1 shrink-0" />
    </div>
  );
}
