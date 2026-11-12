"use client";

import { type Checkpoint, Checkpoints } from "@kura-ui/react/checkpoints";
import { PromptQueue, type QueuedPrompt } from "@kura-ui/react/prompt-queue";
import { Terminal } from "@kura-ui/react/terminal";
import * as React from "react";

/**
 * Small, composed demos for the short bento cards: each is sized to fill its card exactly, so the
 * row reads as three equal panels with no dead space and nothing cropped.
 */

const ESC = "\u001b[";
const c = (code: string, s: string) => `${ESC}${code}m${s}${ESC}0m`;

export function TerminalDemo() {
  return (
    <Terminal
      cwd="~/acme-web"
      command="pnpm vitest run src/auth"
      status="failed"
      exitCode={1}
      duration={1_420}
      wrap={false}
      lines={[
        ` ${c("32", "✓")} session.test.ts ${c("2", "(6)")} ${c("2", "41ms")}`,
        ` ${c("32", "✓")} middleware.test.ts ${c("2", "(4)")} ${c("2", "18ms")}`,
        ` ${c("31", "×")} login.test.ts ${c("2", "(5 |")} ${c("31", "1 failed")}${c("2", ")")}`,
        `   ${c("31", "→ expected 'tok_expired' to be 'tok_next'")}`,
        "",
        ` ${c("2", "Tests")}  ${c("1;31", "1 failed")} ${c("2", "|")} ${c("1;32", "14 passed")}`,
      ]}
    />
  );
}

export function QueueDemo() {
  const [items, setItems] = React.useState<QueuedPrompt[]>([
    { id: "a", text: "Keep the old /api/v1/session route for one release" },
    { id: "b", text: "Then update the auth section of the README" },
    { id: "c", text: "Open the PR as a draft when tests pass" },
  ]);
  return (
    <PromptQueue
      items={items}
      onItemsChange={setItems}
      onSendNow={(item) => setItems((list) => list.filter((i) => i.id !== item.id))}
      hint="Sends after this step"
    />
  );
}

export function CheckpointsDemo() {
  const [checkpoints] = React.useState<Checkpoint[]>(() => {
    const ago = (s: number) => Date.now() - s * 1000;
    return [
      {
        id: "c3",
        label: "Patched src/middleware.ts",
        at: ago(70),
        filesChanged: 1,
        kind: "auto",
        current: true,
      },
      {
        id: "c2",
        label: "Replaced fetchUser() in 9 files",
        at: ago(260),
        filesChanged: 9,
        kind: "auto",
      },
      { id: "c1", label: "Before the auth refactor", at: ago(690), kind: "manual" },
    ];
  });
  return <Checkpoints checkpoints={checkpoints} onRestore={() => {}} />;
}
