"use client";

import { Bot } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import {
  ThinkingIndicator,
  type ThinkingIndicatorSize,
  type ThinkingIndicatorVariant,
} from "./thinking-indicator";

export function ThinkingIndicatorMinimal() {
  return <ThinkingIndicator />;
}

const variants: ThinkingIndicatorVariant[] = ["dots", "pulse", "orbit", "wave"];
const sizes: ThinkingIndicatorSize[] = ["sm", "md", "lg"];

export function ThinkingIndicatorFull() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <div className="grid grid-cols-[auto_repeat(3,1fr)] items-center gap-x-6 gap-y-4 text-kura-fg-subtle text-xs">
        <span />
        {sizes.map((s) => (
          <span key={s} className="font-kura-mono">
            {s}
          </span>
        ))}
        {variants.map((v) => (
          <React.Fragment key={v}>
            <span className="font-kura-mono">{v}</span>
            {sizes.map((s) => (
              <span key={s} className="flex h-6 items-center">
                <ThinkingIndicator variant={v} size={s} label={`Thinking (${v}, ${s})`} />
              </span>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-kura-border-subtle border-t pt-5">
        <ThinkingIndicator
          variant="text"
          label="Researching"
          messages={["Searching the web…", "Reading 4 files…", "Comparing 12 sources…"]}
          interval={2200}
        />
        <ThinkingIndicator variant="dots" size="sm" className="text-kura-fg-subtle" />
      </div>
    </div>
  );
}

export function ThinkingIndicatorInMessage() {
  const [stopped, setStopped] = React.useState(false);
  return (
    <div className="flex w-full max-w-md items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-kura-surface-sunken text-kura-fg-muted shadow-kura-xs">
        <Bot className="size-3.5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-kura-xl bg-kura-surface px-4 py-3 shadow-kura-sm">
        {stopped ? (
          <p className="text-kura-fg-muted text-sm">Stopped. Ask again whenever you're ready.</p>
        ) : (
          <ThinkingIndicator
            variant="text"
            label="Assistant is working"
            messages={["Planning the migration…", "Reading schema.prisma…", "Drafting SQL…"]}
          />
        )}
        <div className="flex justify-end">
          <Button size="xs" variant="ghost" onClick={() => setStopped((s) => !s)}>
            {stopped ? "Retry" : "Stop"}
          </Button>
        </div>
      </div>
    </div>
  );
}
