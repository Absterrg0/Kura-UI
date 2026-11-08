"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { Message, MessageAvatar } from "../message";
import { StreamingText } from "../streaming-text";
import { Reasoning } from "./reasoning";

const TRACE =
  "The user wants the like button to feel instant. The lag comes from waiting on the server round-trip before re-rendering.\n\nOptions: optimistic local state with manual rollback, or useOptimistic inside a transition. useOptimistic handles the rollback automatically if the action throws, and keeps the UI consistent with concurrent updates.\n\nI should recommend useOptimistic and show the minimal pattern, then mention the error case.";

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
      avatar={<MessageAvatar name="Kura" />}
      className="max-w-xl"
    >
      <Reasoning
        duration={83}
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
