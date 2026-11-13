"use client";

import { AgentOrb, type AgentOrbState } from "@kura-ui/react/agent-orb";
import { AudioWaveform } from "@kura-ui/react/audio-waveform";
import { type Checkpoint, Checkpoints } from "@kura-ui/react/checkpoints";
import { Citation } from "@kura-ui/react/citation";
import { Composer } from "@kura-ui/react/composer";
import { type FileChange, FileChanges } from "@kura-ui/react/file-changes";
import { useAudioAnalyser } from "@kura-ui/react/hooks";
import {
  Message,
  MessageActions,
  MessageAvatar,
  MessageCopyButton,
  MessageFeedback,
  MessageList,
} from "@kura-ui/react/message";
import { PromptQueue, type QueuedPrompt } from "@kura-ui/react/prompt-queue";
import { Reasoning } from "@kura-ui/react/reasoning";
import { StreamingText } from "@kura-ui/react/streaming-text";
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
      className="h-full"
      items={items}
      onItemsChange={setItems}
      onSendNow={(item) => setItems((list) => list.filter((i) => i.id !== item.id))}
      hint="Sends after this step"
    />
  );
}

export function CheckpointsDemo() {
  const initial = React.useMemo<Checkpoint[]>(() => {
    const ago = (sec: number) => Date.now() - sec * 1000;
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
  }, []);
  const [checkpoints, setCheckpoints] = React.useState(initial);
  // Restoring takes a moment (the workspace is rewritten), then that point is the current one and
  // the later ones are gone. A demo: after a while the agent's work comes back.
  const restore = async (id: string) => {
    await new Promise((r) => setTimeout(r, 900));
    setCheckpoints((list) => {
      const i = list.findIndex((c) => c.id === id);
      return list.slice(i).map((c) => ({ ...c, current: c.id === id }));
    });
  };
  React.useEffect(() => {
    if (checkpoints.length === initial.length) return;
    const t = setTimeout(() => setCheckpoints(initial), 9_000);
    return () => clearTimeout(t);
  }, [checkpoints, initial]);
  return <Checkpoints checkpoints={checkpoints} onRestore={restore} className="h-full" />;
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
  return <FileChanges files={FILES} defaultSelectedPath="src/auth/client.ts" className="h-full" />;
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
        args={{ query: "fetchUser" }}
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
    <div className="flex [&>[data-slot=browser-session]]:max-w-none [&>[data-slot=browser-session]]:flex-1">
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
    <div className="sheet flex h-full items-center gap-6 rounded-kura-xl p-5">
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

const ANSWER =
  "The session fixture still returns the old token shape, so refresh() rejects it. Updating the fixture fixes the test; nothing else reads that field.";

// Canned replies for the demo: picked by what was asked, else in turn.
const REPLIES: { match: RegExp; thought: string; text: string }[] = [
  {
    match: /fix|update|change|patch/i,
    thought: "The fixture is the only place that builds a session by hand.",
    text: "Done in two lines: the fixture now returns { token, refreshToken, expiresAt }, the shape the auth client expects. The login test passes again, 30 of 30.",
  },
  {
    match: /other|else|anywhere|break/i,
    thought: "Searched for every read of session.token across src and tests.",
    text: "Nothing else breaks. Three files read the session, and all three go through the auth client, which already returns the new shape.",
  },
  {
    match: /.*/,
    thought: "Rechecked the diff of the refactor against the test's setup.",
    text: "Good question. The refactor changed what refresh() accepts, not what it returns, so the only casualty is code that builds a session by hand. Today that is just this fixture.",
  },
];

interface Turn {
  id: number;
  from: "user" | "assistant";
  text: string;
  thought?: string;
  status: "thinking" | "streaming" | "done";
}

/** A turn of conversation, and a composer that works: send a follow-up and the agent answers. */
export function ConversationDemo() {
  const [rating, setRating] = React.useState<"up" | "down" | null>(null);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const nextId = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const live = turns.find((t) => t.status !== "done");
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const send = ({ text }: { text: string }) => {
    const q = text.trim();
    if (!q) return;
    const reply = REPLIES.find((r) => r.match.test(q)) ?? REPLIES[REPLIES.length - 1]!;
    const id = ++nextId.current;
    setTurns((t) => [
      ...t,
      { id: id * 2, from: "user", text: q, status: "done" },
      {
        id: id * 2 + 1,
        from: "assistant",
        text: reply.text,
        thought: reply.thought,
        status: "thinking",
      },
    ]);
    timer.current = setTimeout(() => {
      setTurns((t) => t.map((x) => (x.id === id * 2 + 1 ? { ...x, status: "streaming" } : x)));
    }, 1_400);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setTurns((t) => t.map((x) => (x.status === "done" ? x : { ...x, status: "done" })));
  };
  const finish = (id: number) =>
    setTurns((t) => t.map((x) => (x.id === id ? { ...x, status: "done" } : x)));

  return (
    <div className="sheet flex h-[440px] max-h-[440px] min-h-0 flex-col overflow-hidden rounded-kura-xl">
      <MessageList className="min-h-0 flex-1" contentClassName="flex flex-col gap-5 px-4 pt-4 pb-2">
        <Message from="user">Why did the login test start failing after the refactor?</Message>
        <Message
          from="assistant"
          avatar={<MessageAvatar name="Kura" />}
          actions={
            <MessageActions visibility="always">
              <MessageCopyButton text={ANSWER} />
              <MessageFeedback value={rating} onValueChange={setRating} />
            </MessageActions>
          }
        >
          <Reasoning duration={9}>
            The refactor moved refresh() onto the auth client. The test builds its session by hand,
            so it never got the new token field.
          </Reasoning>
          <p>
            The session fixture still returns the old token shape, so <code>refresh()</code> rejects
            it
            <Citation
              index={1}
              source={{
                url: "https://github.com/acme/web/blob/main/src/auth/__tests__/login.test.ts",
                title: "src/auth/__tests__/login.test.ts",
                siteName: "acme/web",
                snippet: "const session = { token: 'tok_expired', expiresAt: 0 }",
              }}
            />
            . Updating the fixture fixes the test; nothing else reads that field.
          </p>
        </Message>
        {turns.map((t) =>
          t.from === "user" ? (
            <Message key={t.id} from="user">
              {t.text}
            </Message>
          ) : (
            <Message
              key={t.id}
              from="assistant"
              avatar={<MessageAvatar name="Kura" />}
              status={t.status === "done" ? "idle" : "streaming"}
            >
              <Reasoning
                active={t.status === "thinking"}
                duration={t.status === "thinking" ? undefined : 1}
              >
                {t.thought}
              </Reasoning>
              {t.status !== "thinking" && (
                <StreamingText
                  text={t.text}
                  streaming={t.status === "streaming"}
                  onComplete={() => finish(t.id)}
                  className="text-[14px]"
                />
              )}
            </Message>
          ),
        )}
      </MessageList>
      <div className="p-2 pt-1">
        <Composer
          placeholder="Ask a follow-up…"
          onSubmit={send}
          onStop={stop}
          status={live ? (live.status === "thinking" ? "submitted" : "streaming") : "idle"}
          accept={false}
        />
      </div>
    </div>
  );
}
