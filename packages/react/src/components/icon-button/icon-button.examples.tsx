"use client";

import { ArrowUp, Copy, Mic, Paperclip, RotateCcw } from "lucide-react";
import { IconButton } from "./icon-button";

export function IconButtonMinimal() {
  return <IconButton label="Copy" icon={<Copy />} />;
}

export function IconButtonFull() {
  return (
    <div className="flex items-center gap-1 rounded-kura-xl bg-kura-surface p-1.5 shadow-kura-sm">
      <IconButton label="Attach file" icon={<Paperclip />} size="sm" />
      <IconButton label="Dictate" icon={<Mic />} size="sm" shortcut={["mod", "d"]} />
      <IconButton label="Retry" icon={<RotateCcw />} size="sm" tooltipSide="bottom" />
      <span className="mx-1 h-4 w-px bg-kura-border" />
      <IconButton
        label="Send"
        icon={<ArrowUp />}
        size="sm"
        variant="primary"
        shortcut={["mod", "enter"]}
        className="rounded-full"
      />
      <IconButton
        label="Sending disabled"
        icon={<ArrowUp />}
        size="sm"
        variant="secondary"
        disabled
        tooltip={false}
      />
    </div>
  );
}
