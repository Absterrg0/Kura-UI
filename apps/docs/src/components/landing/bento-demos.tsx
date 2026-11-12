"use client";

import { AgentOrb, type AgentOrbState } from "@kura-ui/react/agent-orb";
import { AudioWaveform } from "@kura-ui/react/audio-waveform";
import { type Checkpoint, Checkpoints } from "@kura-ui/react/checkpoints";
import { type FileChange, FileChanges } from "@kura-ui/react/file-changes";
import { useAudioAnalyser } from "@kura-ui/react/hooks";
import { PromptQueue, type QueuedPrompt } from "@kura-ui/react/prompt-queue";
import { ToolCall } from "@kura-ui/react/tool-call";
import * as React from "react";
import { examples } from "@/generated/examples";

/**
 * Small, composed demos for the "Every part of the run" grid: each shows one component whole, at
 * a height that sits level with its neighbour, so nothing is cropped or faded.
 */

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

const FILES: FileChange[] = [
  { path: "src/auth/client.ts", status: "M", additions: 13, deletions: 16 },
  { path: "src/auth/types.ts", status: "A", additions: 6 },
  {
    path: "src/auth/__tests__/login.test.ts",
    status: "M",
    additions: 2,
    deletions: 3,
    state: "editing",
  },
  { path: "src/middleware.ts", status: "M", additions: 2, deletions: 2 },
  { path: "src/lib/legacy-session.ts", status: "D", deletions: 10 },
  { path: "package.json", status: "M", additions: 1, deletions: 1 },
];

export function FilesDemo() {
  return <FileChanges files={FILES} defaultSelectedPath="src/auth/client.ts" />;
}

export function ToolsDemo() {
  const [t0] = React.useState(() => Date.now() - 2_400);
  return (
    <div className="flex flex-col gap-2">
      <ToolCall
        name="read_file"
        status="success"
        args={{ path: "src/auth/client.ts" }}
        duration={180}
        defaultOpen
      />
      <ToolCall
        name="search_code"
        status="success"
        args={{ query: "fetchUser(" }}
        result={{ matches: 23, files: 9 }}
        duration={1_700}
      />
      <ToolCall
        name="edit_file"
        status="success"
        args={{ path: "src/middleware.ts", hunks: 2 }}
        duration={640}
        defaultOpen
      />
      <ToolCall
        name="bash"
        status="running"
        args={{ command: "pnpm test src/auth" }}
        startedAt={t0}
      />
      <ToolCall name="open_pull_request" status="pending" args={{ base: "main" }} />
    </div>
  );
}

/** The library's own browser example, at the full width of its column so the page stays legible. */
export function BrowserDemo() {
  const Example = examples["browser-session"]?.BrowserSessionMinimal;
  return Example ? (
    <div className="[&>[data-slot=browser-session]]:max-w-none">
      <Example />
    </div>
  ) : null;
}

const VOICE: { state: AgentOrbState; ms: number; caption: string }[] = [
  { state: "listening", ms: 3200, caption: "Listening" },
  { state: "thinking", ms: 2200, caption: "Thinking" },
  { state: "speaking", ms: 3800, caption: "Speaking" },
];

export function VoiceDemo() {
  const [step, setStep] = React.useState(0);
  const analyser = useAudioAnalyser({ simulate: "speech" });
  const current = VOICE[step % VOICE.length]!;
  React.useEffect(() => {
    const id = setTimeout(() => setStep((s) => s + 1), current.ms);
    return () => clearTimeout(id);
  }, [current]);
  return (
    <div className="flex items-center gap-6 px-1">
      <AgentOrb
        state={current.state}
        analyser={analyser}
        dots={15}
        className="size-[132px] shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="font-medium text-[13px] text-kura-fg">{current.caption}</p>
        <AudioWaveform
          analyser={analyser}
          active={current.state !== "thinking"}
          tone="muted"
          label="Voice level"
          className="h-10"
        />
      </div>
    </div>
  );
}
