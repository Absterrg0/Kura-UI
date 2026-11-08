"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { Message, MessageAvatar } from "../message";
import { StreamingText } from "../streaming-text";
import { Reasoning } from "./reasoning";

const TRACE =
  "They want the like button to feel instant. Right now it waits for the server round-trip before the count changes, so every tap lags by ~300ms.\n\nTwo options: optimistic local state with a manual rollback in catch, or useOptimistic inside a transition. The hook drops the optimistic value by itself when the action throws, and it stays correct when two taps overlap.\n\nRecommend useOptimistic, show the smallest working pattern, then say what happens on error.";

export function ReasoningMinimal() {
  return (
    <Reasoning duration={14} className="w-full max-w-lg">
      {TRACE}
    </Reasoning>
  );
}

export function ReasoningFull() {
  const [run, setRun] = React.useState(0);
  const [active, setActive] = React.useState(true);
  const [open, setOpen] = React.useState(true);
  const [stream, setStream] = React.useState(() => thoughts(TRACE));

  const replay = () => {
    setRun((r) => r + 1);
    setStream(thoughts(TRACE));
    setActive(true);
    setOpen(true);
  };

  return (
    <div className="flex w-full max-w-lg flex-col items-start gap-4">
      <Reasoning
        key={run}
        active={active}
        open={open}
        onOpenChange={setOpen}
        autoCollapse
        className="w-full"
      >
        <StreamingText stream={stream} caret={false} onComplete={() => setActive(false)} />
      </Reasoning>
      <Button variant="secondary" size="sm" onClick={replay}>
        <RotateCcw /> Think again
      </Button>
    </div>
  );
}

/** Fake reasoning stream: slow, steady tokens. */
async function* thoughts(text: string): AsyncGenerator<string> {
  const words = text.split(/(?<=\s)/);
  for (let i = 0; i < words.length; i += 2) {
    yield words.slice(i, i + 2).join("");
    await new Promise((r) => setTimeout(r, 70 + Math.random() * 60));
  }
}

export function ReasoningInMessage() {
  return (
    <Message
      from="assistant"
      name="Kura"
      avatar={
        <MessageAvatar
          name="Kura"
          className="rounded-kura-sm bg-kura-ink pt-px font-kura-display font-normal text-[15px] text-kura-fg-inverted shadow-none"
        />
      }
      className="max-w-xl"
    >
      <Reasoning
        duration={83}
        defaultOpen
        formatLabel={({ active, seconds }) =>
          active ? "Planning…" : `Planned for ${Math.round(seconds / 60)} min`
        }
      >
        {TRACE}
      </Reasoning>
      <p>
        Use <code>useOptimistic</code>: render the new count immediately, then let React reconcile
        when the server action resolves. If it throws, the optimistic value is dropped for you.
      </p>
    </Message>
  );
}
