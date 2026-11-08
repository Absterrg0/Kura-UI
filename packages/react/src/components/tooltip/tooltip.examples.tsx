"use client";

import { Button } from "../button";
import { Tooltip, TooltipProvider } from "./tooltip";

export function TooltipMinimal() {
  return (
    <Tooltip content="Copy to clipboard">
      <Button variant="secondary">Hover me</Button>
    </Tooltip>
  );
}

export function TooltipFull() {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip content="Send message" shortcut={["mod", "enter"]} side="top">
          <Button variant="secondary" size="sm">
            Top
          </Button>
        </Tooltip>
        <Tooltip
          content="New chat"
          shortcut={["mod", "shift", "o"]}
          side="bottom"
          delayDuration={200}
        >
          <Button variant="secondary" size="sm">
            Bottom
          </Button>
        </Tooltip>
        <Tooltip content="Disabled tooltip" disabled>
          <Button variant="ghost" size="sm">
            No tooltip
          </Button>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
