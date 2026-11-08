"use client";

import { CornerDownRight } from "lucide-react";
import * as React from "react";
import { Composer } from "../composer";
import { RunHeader } from "../run-header";
import { PromptQueue, type QueuedPrompt } from "./prompt-queue";

export function PromptQueueMinimal() {
  return (
    <PromptQueue
      className="w-full max-w-xl"
      defaultItems={[
        { id: "readme", text: "When tests pass, update the auth section of the README" },
        { id: "legacy", text: "Don't touch src/legacy/ — it's deleted next sprint" },
      ]}
      onSendNow={() => {}}
    />
  );
}

const QUEUE: QueuedPrompt[] = [
  {
    id: "helper",
    text: "Use the refreshSession() helper instead of calling fetch('/api/session') directly",
    attachments: [{ name: "session-flow.png", type: "image" }],
  },
  {
    id: "legacy",
    text: "Don't touch src/legacy/ — it's being deleted next sprint",
  },
  {
    id: "readme",
    text: "When tests pass, update the auth section of the README and link the migration guide",
    attachments: [
      { name: "MIGRATION.md", type: "file" },
      { name: "auth-diagram.png", type: "image" },
    ],
  },
];

export function PromptQueueFull() {
  const [items, setItems] = React.useState<QueuedPrompt[]>(QUEUE);
  const [steered, setSteered] = React.useState<string | null>(null);

  // A teammate queues one more follow-up a moment after mount.
  React.useEffect(() => {
    const t = setTimeout(
      () =>
        setItems((list) =>
          list.some((i) => i.id === "pr")
            ? list
            : [...list, { id: "pr", text: "Open the PR as a draft and request review from @maya" }],
        ),
      1600,
    );
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <PromptQueue
        items={items}
        onItemsChange={setItems}
        onSendNow={(item) => setSteered(item.text)}
        hint="Sends when Kura finishes running pnpm test"
      />
      <p
        className="flex min-h-5 items-center gap-1.5 px-1 text-[12px] text-kura-fg-subtle"
        aria-live="polite"
      >
        {steered ? (
          <>
            <CornerDownRight aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span className="truncate">
              Interrupted Kura and sent: <span className="text-kura-fg-muted">{steered}</span>
            </span>
          </>
        ) : (
          "Hover a prompt, or focus it and use Alt+↑/↓, Enter, Delete and ⌘↵."
        )}
      </p>
    </div>
  );
}

export function PromptQueueTray() {
  return (
    <div className="flex w-full max-w-xl flex-col">
      <PromptQueue
        variant="tray"
        className="mx-3"
        defaultItems={QUEUE.slice(0, 2)}
        onSendNow={() => {}}
      />
      <div className="h-16 rounded-kura-xl bg-kura-surface shadow-kura-sm" />
    </div>
  );
}

export function PromptQueueComposition() {
  const [items, setItems] = React.useState<QueuedPrompt[]>(QUEUE.slice(0, 2));
  const [log, setLog] = React.useState<string[]>([]);
  const [startedAt] = React.useState(() => Date.now() - 611_000);
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <RunHeader
        variant="bar"
        title="Run pnpm test --filter web"
        status="running"
        startedAt={startedAt}
        progress={{ done: 5, total: 7 }}
        cost={1.52}
        onStop={() => {}}
        shortcuts={false}
      />
      {log.length > 0 && (
        <ul className="flex flex-col gap-1 px-1 text-[12px] text-kura-fg-subtle">
          {log.map((l, i) => (
            <li key={i} className="flex items-center gap-1.5 truncate">
              <CornerDownRight aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
              Steered: <span className="truncate text-kura-fg-muted">{l}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col">
        <PromptQueue
          variant="tray"
          className="mx-3"
          items={items}
          onItemsChange={setItems}
          onSendNow={(item) => setLog((l) => [...l, item.text])}
          hint="Sends after this turn"
        />
        <Composer
          className="relative"
          placeholder="Queue a follow-up for Kura…"
          onSubmit={(m) => setItems((list) => [...list, { id: `q-${Date.now()}`, text: m.text }])}
        />
      </div>
    </div>
  );
}
