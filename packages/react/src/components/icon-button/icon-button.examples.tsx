"use client";

import {
  ArrowUp,
  Check,
  Copy,
  Download,
  Mic,
  Paperclip,
  Pin,
  Plus,
  RotateCcw,
  Share,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
} from "lucide-react";
import * as React from "react";
import { IconButton } from "./icon-button";

export function IconButtonMinimal() {
  return <IconButton label="Copy" icon={<Copy />} />;
}

export function IconButtonFull() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-1 rounded-kura-xl bg-kura-surface p-1.5 shadow-kura-sm">
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
          className="rounded-full"
        />
      </div>
      <div className="flex items-center gap-2">
        <IconButton label="Copy" icon={<Copy />} />
        <IconButton label="Download" icon={<Download />} variant="secondary" />
        <IconButton label="Share" icon={<Share />} variant="outline" />
        <IconButton
          label="New chat"
          icon={<Plus />}
          variant="primary"
          shortcut={["mod", "shift", "o"]}
        />
        <IconButton label="Delete" icon={<Trash2 />} variant="outline" disabled />
        <IconButton label="Pin" icon={<Pin />} size="xs" tooltip={false} />
      </div>
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
      className="flex w-full max-w-lg flex-col gap-3 rounded-kura-xl bg-kura-surface p-4 shadow-kura-sm"
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
        <p className="shrink-0 font-kura-mono text-kura-fg-subtle text-xs tabular-nums">
          Sonnet 5.5 · 2.1s
        </p>
      </div>
    </article>
  );
}
