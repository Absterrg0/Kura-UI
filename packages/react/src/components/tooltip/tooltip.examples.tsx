"use client";

import { Bold, Cloud, Code, Italic, Link, PenLine, Redo2, Undo2 } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from "./tooltip";

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

const formatTools = [
  { id: "bold", label: "Bold", icon: <Bold />, shortcut: ["mod", "b"] },
  { id: "italic", label: "Italic", icon: <Italic />, shortcut: ["mod", "i"] },
  { id: "code", label: "Inline code", icon: <Code />, shortcut: ["mod", "e"] },
  { id: "link", label: "Link", icon: <Link />, shortcut: ["mod", "k"] },
] as const;

// <Tooltip> carries its own provider; the parts share the toolbar's, so the delay is skipped
// when moving from one button to the next.
function ToolbarTip({
  label,
  shortcut,
  side = "top",
  children,
}: {
  label: string;
  shortcut?: readonly string[];
  side?: "top" | "bottom";
  children: React.ReactElement<Record<string, unknown>>;
}) {
  return (
    <TooltipRoot>
      <TooltipTrigger render={children} />
      <TooltipContent side={side} shortcut={shortcut}>
        {label}
      </TooltipContent>
    </TooltipRoot>
  );
}

const square = "size-7 px-0";

export function TooltipEditorToolbar() {
  const [active, setActive] = React.useState<string[]>(["bold"]);
  const toggle = (id: string) =>
    setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-sm">
        <div
          role="toolbar"
          aria-label="Formatting"
          className="flex items-center gap-0.5 border-kura-border-subtle border-b px-2 py-1.5"
        >
          <ToolbarTip label="Undo" shortcut={["mod", "z"]}>
            <Button variant="ghost" size="sm" aria-label="Undo" className={square}>
              <Undo2 />
            </Button>
          </ToolbarTip>
          <ToolbarTip label="Redo" shortcut={["mod", "shift", "z"]}>
            <Button variant="ghost" size="sm" aria-label="Redo" className={square}>
              <Redo2 />
            </Button>
          </ToolbarTip>
          <span aria-hidden className="mx-1 h-4 w-px bg-kura-border" />
          {formatTools.map((tool) => (
            <ToolbarTip key={tool.id} label={tool.label} shortcut={tool.shortcut}>
              <Button
                variant="ghost"
                size="sm"
                aria-label={tool.label}
                aria-pressed={active.includes(tool.id)}
                onClick={() => toggle(tool.id)}
                className={`${square} aria-pressed:bg-kura-active aria-pressed:text-kura-fg`}
              >
                {tool.icon}
              </Button>
            </ToolbarTip>
          ))}
          <span aria-hidden className="mx-1 h-4 w-px bg-kura-border" />
          <ToolbarTip label="Rewrite the selection" shortcut={["mod", "j"]}>
            <Button variant="ghost" size="sm">
              <PenLine />
              Rewrite
            </Button>
          </ToolbarTip>
          <div className="ml-auto flex items-center">
            <ToolbarTip label="Saved 12:04 · version 18" side="bottom">
              <button
                type="button"
                className="inline-flex h-7 cursor-default items-center gap-1.5 rounded-kura-sm px-2 text-kura-fg-subtle text-xs outline-none focus-visible:shadow-kura-focus"
              >
                <Cloud className="size-3.5" aria-hidden />
                Saved
              </button>
            </ToolbarTip>
          </div>
        </div>
        <p className="px-4 py-3.5 text-[15px] text-kura-fg leading-relaxed">
          <strong className="font-semibold">Launch note:</strong> the new composer ships behind the{" "}
          <code className="rounded-kura-xs bg-kura-surface-sunken px-1 py-0.5 font-kura-mono text-[13px]">
            composer_v2
          </code>{" "}
          flag on Thursday, starting with 10% of workspaces.
        </p>
      </div>
    </TooltipProvider>
  );
}
