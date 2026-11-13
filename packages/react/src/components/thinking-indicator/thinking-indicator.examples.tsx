"use client";

import * as React from "react";
import { cn } from "../../lib/cn";
import { Message, MessageAvatar } from "../message";
import { ThinkingIndicator } from "./thinking-indicator";

export function ThinkingIndicatorMinimal() {
  return (
    <Message
      from="assistant"
      name="Kura"
      avatar={<MessageAvatar name="Kura" />}
      status="streaming"
      className="max-w-md"
    >
      <ThinkingIndicator className="h-6" />
    </Message>
  );
}

export function ThinkingIndicatorFull() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <Message from="user">
        Migrate the users table to the new schema and backfill the audit columns.
      </Message>
      <Message
        from="assistant"
        name="Kura"
        avatar={<MessageAvatar name="Kura" />}
        status="streaming"
      >
        <ThinkingIndicator
          variant="text"
          size="md"
          label="Kura is working"
          messages={["Reading schema.prisma…", "Planning 3 migrations…", "Drafting the backfill…"]}
          interval={2200}
        />
      </Message>
    </div>
  );
}

const THREADS = [
  { id: "migrate", title: "Migrate users to the new schema", busy: "dots" },
  { id: "flaky", title: "Fix the flaky login test", busy: "dots" },
  { id: "churn", title: "Q3 churn by cohort" },
  { id: "notes", title: "Release notes for v2.4" },
] as const;

export function ThinkingIndicatorInThreadList() {
  const [current, setCurrent] = React.useState<string>("migrate");
  return (
    <nav
      aria-label="Chats"
      className="w-full max-w-xs rounded-kura-xl bg-kura-surface p-1.5 font-kura-sans shadow-kura-surface"
    >
      <ul className="flex flex-col">
        {THREADS.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              aria-current={current === t.id ? "page" : undefined}
              onClick={() => setCurrent(t.id)}
              className={cn(
                "flex h-9 w-full cursor-pointer items-center gap-3 rounded-[9px] px-2.5 text-left text-[13px] text-kura-fg-muted outline-hidden",
                "transition-colors duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-hover hover:text-kura-fg focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-kura-ring",
                "aria-[current=page]:bg-kura-hover aria-[current=page]:text-kura-fg",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              {"busy" in t && (
                // A thread the agent is still answering carries a small live mark.
                <ThinkingIndicator variant={t.busy} size="sm" label="Kura is replying" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
