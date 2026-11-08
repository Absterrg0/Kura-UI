"use client";

import {
  ArrowUp,
  Check,
  Copy,
  Mic,
  Paperclip,
  RotateCcw,
  Share,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import * as React from "react";
import { IconButton } from "./icon-button";

export function IconButtonMinimal() {
  return <IconButton label="Copy" icon={<Copy />} />;
}

export function IconButtonFull() {
  return (
    <div className="flex items-center gap-0.5 rounded-kura-md bg-kura-surface-raised p-1 shadow-kura-sm">
      <IconButton label="Attach file" icon={<Paperclip />} size="sm" />
      <IconButton label="Dictate" icon={<Mic />} size="sm" shortcut={["mod", "d"]} />
      <IconButton label="Retry" icon={<RotateCcw />} size="sm" tooltipSide="bottom" />
      <span aria-hidden className="mx-1 h-4 w-px bg-kura-border" />
      <IconButton
        label="Send"
        icon={<ArrowUp />}
        size="sm"
        variant="primary"
        shortcut={["mod", "enter"]}
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

export function IconButtonMessageActions() {
  const [copied, setCopied] = React.useState(false);
  const [rating, setRating] = React.useState<"up" | "down" | null>(null);
  const [regenerating, setRegenerating] = React.useState(false);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const copy = () => {
    setCopied(true);
    timers.current.push(setTimeout(() => setCopied(false), 1600));
  };
  const regenerate = () => {
    setRegenerating(true);
    timers.current.push(setTimeout(() => setRegenerating(false), 1400));
  };

  return (
    <article
      aria-label="Assistant reply"
      className="flex w-full max-w-lg flex-col gap-3 rounded-kura-md bg-kura-surface p-5 pb-3 shadow-kura-sm"
    >
      <p className="text-[15px] text-kura-fg leading-relaxed">
        The dip lines up with the 2.4 release: onboarding completion fell from 71% to 58% the day
        the new permissions step shipped. Moving that step after the first project is created should
        recover most of it.
      </p>
      <div className="flex items-center justify-between gap-3">
        <div
          role="toolbar"
          aria-label="Message actions"
          className="-ml-1.5 flex items-center gap-0.5"
        >
          <IconButton
            label={copied ? "Copied" : "Copy"}
            icon={copied ? <Check className="text-kura-success-text" /> : <Copy />}
            size="sm"
            shortcut={["mod", "shift", "c"]}
            onClick={copy}
          />
          <IconButton
            label="Good response"
            icon={<ThumbsUp />}
            size="sm"
            aria-pressed={rating === "up"}
            className="aria-pressed:bg-kura-active aria-pressed:text-kura-fg"
            onClick={() => setRating((r) => (r === "up" ? null : "up"))}
          />
          <IconButton
            label="Bad response"
            icon={<ThumbsDown />}
            size="sm"
            aria-pressed={rating === "down"}
            className="aria-pressed:bg-kura-active aria-pressed:text-kura-fg"
            onClick={() => setRating((r) => (r === "down" ? null : "down"))}
          />
          <IconButton label="Read aloud" icon={<Volume2 />} size="sm" />
          <span aria-hidden className="mx-1 h-4 w-px bg-kura-border" />
          <IconButton
            label="Regenerate"
            icon={<RotateCcw />}
            size="sm"
            shortcut={["mod", "r"]}
            loading={regenerating}
            onClick={regenerate}
          />
          <IconButton label="Share" icon={<Share />} size="sm" />
        </div>
        <p className="shrink-0 font-kura-mono text-[11px] text-kura-fg-subtle tabular-nums">
          Sonnet 5.5 · 2.1s
        </p>
      </div>
    </article>
  );
}
