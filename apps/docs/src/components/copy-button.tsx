"use client";

import { IconButton } from "@kura-ui/react/icon-button";
import { Check, Copy } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

export function CopyButton({
  value,
  label = "Copy",
  className,
  fetchUrl,
}: {
  value?: string;
  label?: string;
  className?: string;
  /** Copy the text of a URL instead (e.g. the .md page). */
  fetchUrl?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <IconButton
      label={copied ? "Copied" : label}
      size="xs"
      className={cn("text-kura-fg-subtle", className)}
      onClick={async () => {
        const text = fetchUrl ? await (await fetch(fetchUrl)).text() : (value ?? "");
        await navigator.clipboard.writeText(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1400);
      }}
      icon={
        <span className="relative size-3.5">
          <Copy
            className={cn(
              "absolute inset-0 size-3.5 transition-all duration-(--kura-duration-fast)",
              copied && "scale-50 opacity-0 blur-[2px]",
            )}
          />
          <Check
            className={cn(
              "absolute inset-0 size-3.5 text-kura-accent-text transition-all duration-(--kura-duration-fast)",
              !copied && "scale-50 opacity-0 blur-[2px]",
            )}
          />
        </span>
      }
    />
  );
}
