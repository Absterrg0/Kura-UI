"use client";

import { Check, Gauge, Globe, Link, Lock, Settings2, Share } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { DotRail } from "../dot-rail";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "./popover";

export function PopoverMinimal() {
  return (
    // Open at first, with room below for it; press the key or Esc to see it come and go.
    <div className="pb-32">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <Gauge /> Usage
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-labelledby="usage-title" className="w-64">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <h3 id="usage-title" className="font-medium text-sm">
                Weekly usage
              </h3>
              <span className="font-kura-mono text-kura-fg-muted text-xs tabular-nums">
                38 / 50
              </span>
            </div>
            <DotRail value={0.76} label="Weekly usage" />
            <p className="text-kura-fg-muted text-xs leading-relaxed">
              Opus messages reset on Monday at 09:00. Haiku is unlimited.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

const efforts = ["Low", "Medium", "High"] as const;

export function PopoverFull() {
  const [open, setOpen] = React.useState(false);
  const [effort, setEffort] = React.useState<(typeof efforts)[number]>("Medium");
  const [temperature, setTemperature] = React.useState(0.7);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Settings2 /> Generation settings
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        aria-labelledby="gen-settings-title"
        className="w-72 p-0"
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-0.5">
            <h3 id="gen-settings-title" className="font-medium text-sm">
              Generation
            </h3>
            <p className="text-kura-fg-muted text-xs">Applies to new replies in this chat.</p>
          </div>
          <fieldset className="flex flex-col">
            <legend className="mb-2 font-medium text-kura-fg-muted text-xs">
              Reasoning effort
            </legend>
            <div className="grid grid-cols-3 gap-0.5 rounded-kura-md bg-kura-surface-sunken p-0.5 shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]">
              {efforts.map((option) => (
                <label
                  key={option}
                  className="flex h-7 cursor-pointer items-center justify-center rounded-kura-sm font-medium text-kura-fg-muted text-xs transition-[background-color,color,box-shadow] duration-(--kura-duration-fast) ease-kura-out hover:text-kura-fg has-checked:bg-kura-surface-raised has-checked:text-kura-fg has-checked:shadow-kura-sm has-focus-visible:shadow-kura-focus"
                >
                  <input
                    type="radio"
                    name="reasoning-effort"
                    value={option}
                    checked={effort === option}
                    onChange={() => setEffort(option)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-2">
            <span className="flex items-center justify-between font-medium text-kura-fg-muted text-xs">
              Temperature
              <span className="font-kura-mono text-kura-fg tabular-nums">
                {temperature.toFixed(1)}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="h-4 w-full cursor-pointer accent-kura-ink"
            />
            <span className="flex justify-between text-[11px] text-kura-fg-subtle">
              <span>Precise</span>
              <span>Creative</span>
            </span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-kura-border-subtle border-t px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEffort("Medium");
              setTemperature(0.7);
            }}
          >
            Reset
          </Button>
          <PopoverClose asChild>
            <Button size="sm">Done</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const visibilityOptions = [
  {
    id: "private",
    label: "Only you",
    description: "Nobody else can open this chat.",
    icon: <Lock />,
  },
  {
    id: "link",
    label: "Anyone with the link",
    description: "Can read the chat, not continue it.",
    icon: <Globe />,
  },
] as const;

type Visibility = (typeof visibilityOptions)[number]["id"];

export function PopoverShareChat() {
  const [visibility, setVisibility] = React.useState<Visibility>("private");
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const shared = visibility === "link";

  return (
    <div className="flex w-full max-w-xl items-center justify-between gap-4 rounded-kura-xl bg-kura-surface py-2.5 pr-2.5 pl-4 shadow-kura-sm">
      <div className="flex min-w-0 flex-col">
        <h3 className="truncate font-medium text-kura-fg text-sm">Q3 churn analysis</h3>
        <p className="truncate text-kura-fg-subtle text-xs">
          14 messages · {shared ? "Shared with link" : "Private"}
        </p>
      </div>
      <Popover onOpenChange={(open) => !open && setCopied(false)}>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm">
            {shared ? <Globe /> : <Share />}
            Share
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" aria-labelledby="share-chat-title" className="w-80 p-0">
          <div className="flex flex-col gap-3 p-3">
            <div className="flex flex-col gap-0.5 px-1 pt-0.5">
              <h4 id="share-chat-title" className="font-medium text-sm">
                Share this chat
              </h4>
              <p className="text-kura-fg-muted text-xs">
                Messages you send after sharing stay private.
              </p>
            </div>
            <fieldset className="flex flex-col gap-0.5">
              <legend className="sr-only">Who can view</legend>
              {visibilityOptions.map((option) => (
                <label
                  key={option.id}
                  className="group flex cursor-pointer items-center gap-3 rounded-kura-md p-2 transition-colors duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover has-checked:bg-kura-active has-focus-visible:shadow-kura-focus"
                >
                  <input
                    type="radio"
                    name="share-visibility"
                    value={option.id}
                    checked={visibility === option.id}
                    onChange={() => setVisibility(option.id)}
                    className="sr-only"
                  />
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-kura-sm bg-kura-surface text-kura-fg-muted shadow-kura-xs group-has-checked:text-kura-fg [&_svg]:size-4">
                    {option.icon}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium text-[13px] text-kura-fg">{option.label}</span>
                    <span className="text-kura-fg-muted text-xs">{option.description}</span>
                  </span>
                  <Check
                    aria-hidden
                    className="size-4 shrink-0 text-kura-fg opacity-0 transition-opacity duration-(--kura-duration-fast) group-has-checked:opacity-100"
                  />
                </label>
              ))}
            </fieldset>
          </div>
          <div className="flex items-center gap-2 border-kura-border-subtle border-t p-3">
            <input
              readOnly
              aria-label="Share link"
              value={shared ? "kura.chat/s/q3-churn-7f2a" : "Link sharing is off"}
              disabled={!shared}
              onFocus={(e) => e.currentTarget.select()}
              className="h-7 min-w-0 flex-1 rounded-kura-sm bg-kura-surface-sunken px-2 font-kura-mono text-kura-fg-muted text-xs shadow-kura-xs outline-hidden focus-visible:shadow-kura-focus disabled:font-kura-sans disabled:text-kura-fg-subtle"
            />
            <Button
              size="sm"
              disabled={!shared}
              onClick={() => {
                setCopied(true);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setCopied(false), 1600);
              }}
              className="w-26"
            >
              {copied ? <Check /> : <Link />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
