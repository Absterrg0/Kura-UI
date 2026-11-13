"use client";

import { ArrowUp, Pencil, RefreshCw } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { CodeBlock } from "../code-block";
import { ShimmerText } from "../shimmer-text";
import { StreamingText } from "../streaming-text";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageBranch,
  MessageCopyButton,
  MessageFeedback,
} from "./message";
import { MessageList } from "./message-list";

const VERSIONS = [
  "Use `useOptimistic` for the like button: render the optimistic count immediately, then reconcile when the server action resolves.",
  "Wrap the mutation in a transition and render from `useOptimistic`. If the action throws, React drops the optimistic value and the real count comes back on its own.",
  "Keep it simple: update local state on click, call the server action, and roll back in a `catch`. `useOptimistic` saves you that rollback.",
];

export function MessageMinimal() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <Message from="user">How do I make a like button feel instant?</Message>
      <Message from="assistant">
        Render the new count optimistically and reconcile when the request finishes.
      </Message>
    </div>
  );
}

export function MessageFull() {
  const [version, setVersion] = React.useState(2);
  const [rating, setRating] = React.useState<"up" | "down" | null>("up");
  const [failed, setFailed] = React.useState(false);
  const text = VERSIONS[version - 1]!;
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <Message
        from="user"
        actions={
          <MessageActions>
            <MessageAction label="Edit" icon={<Pencil />} />
            <MessageCopyButton text="Why does my like button lag?" />
          </MessageActions>
        }
      >
        Why does my like button lag?
      </Message>
      <Message
        from="assistant"
        name="Kura"
        timestamp="10:42"
        avatar={<MessageAvatar name="Kura" />}
        status={failed ? "error" : "idle"}
        error="The model stopped responding. Partial answer shown."
        onRetry={() => setFailed(false)}
        actions={
          <MessageActions visibility="always">
            <MessageCopyButton text={text} />
            <MessageAction
              label="Regenerate"
              icon={<RefreshCw />}
              onClick={() => setFailed(true)}
            />
            <MessageFeedback value={rating} onValueChange={setRating} />
            <MessageBranch current={version} total={VERSIONS.length} onCurrentChange={setVersion} />
          </MessageActions>
        }
      >
        <p key={version} className="animate-kura-fade-in">
          {text.split("`").map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}
        </p>
      </Message>
    </div>
  );
}

export function MessageStates() {
  const [stream] = React.useState(() =>
    tokens(
      "Reading the trace now. The slow part is the waterfall: the like request waits on the session refresh, so the button cannot update until both finish.",
    ),
  );
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <Message
        from="assistant"
        name="Kura"
        avatar={<MessageAvatar name="Kura" />}
        status="streaming"
        actions={
          <MessageActions>
            <MessageCopyButton text="" />
          </MessageActions>
        }
      >
        <StreamingText stream={stream} />
      </Message>
      <Message
        from="assistant"
        name="Kura"
        avatar={<MessageAvatar name="Kura" />}
        status="error"
        error="Rate limited — try again in a few seconds."
        onRetry={() => {}}
      >
        I started profiling the
      </Message>
    </div>
  );
}

/** Fake model: yields 1–3 words at a time with bursty delays. */
async function* tokens(text: string): AsyncGenerator<string> {
  const words = text.split(/(?<=\s)/);
  for (let i = 0; i < words.length; ) {
    const n = 1 + Math.floor(Math.random() * 3);
    yield words.slice(i, i + n).join("");
    i += n;
    await new Promise((r) => setTimeout(r, 30 + Math.random() * 110));
  }
}

const LONG_ANSWER =
  "Three things will make the thread feel calm.\n\nFirst, stick to the bottom only while the reader is there. The moment they scroll up, stop following — nothing is worse than being yanked back mid-sentence.\n\nSecond, reserve space for things that appear later, like the action bar, so the end of a stream never shifts the layout.\n\nThird, announce the finished message, not every token: the log is `aria-busy` while the answer streams.";

interface Turn {
  id: number;
  from: "user" | "assistant";
  text: string;
  stream?: AsyncIterable<string>;
}

export function MessageThread() {
  const [turns, setTurns] = React.useState<Turn[]>([
    { id: 1, from: "user", text: "Can you review the chat layout?" },
    {
      id: 2,
      from: "assistant",
      text: "Sure. The structure is solid; two details stand out. The composer jumps when the keyboard opens on iOS, and new messages push the reader down even when they are reading older ones.",
    },
    { id: 3, from: "user", text: "Show me the fix for the composer." },
    { id: 4, from: "assistant", text: "Pin it with dynamic viewport units:" },
  ]);
  const [streaming, setStreaming] = React.useState<number | null>(null);
  const [waiting, setWaiting] = React.useState(false);

  const ask = () => {
    const id = Date.now();
    setTurns((t) => [...t, { id, from: "user", text: "How should the thread scroll?" }]);
    setWaiting(true);
    setTimeout(() => {
      setWaiting(false);
      setStreaming(id + 1);
      setTurns((t) => [
        ...t,
        { id: id + 1, from: "assistant", text: "", stream: tokens(LONG_ANSWER) },
      ]);
    }, 900);
  };

  return (
    <div className="flex h-[440px] w-full max-w-xl flex-col overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-surface">
      <MessageList className="flex-1" contentClassName="px-5">
        {turns.map((turn) => (
          <Message
            key={turn.id}
            from={turn.from}
            status={streaming === turn.id ? "streaming" : "idle"}
            avatar={turn.from === "assistant" ? <MessageAvatar name="Kura" /> : undefined}
            actions={
              turn.from === "assistant" ? (
                <MessageActions>
                  <MessageCopyButton text={turn.text} />
                  <MessageAction label="Regenerate" icon={<RefreshCw />} />
                  <MessageFeedback />
                </MessageActions>
              ) : undefined
            }
          >
            {turn.stream ? (
              <StreamingText stream={turn.stream} onComplete={() => setStreaming(null)} />
            ) : (
              turn.text
            )}
            {turn.id === 4 && (
              <CodeBlock
                language="css"
                filename="composer.css"
                code={".composer {\n  position: sticky;\n  bottom: 0;\n  max-height: 40dvh;\n}"}
              />
            )}
          </Message>
        ))}
        {waiting && (
          <Message from="assistant" avatar={<MessageAvatar name="Kura" />} status="streaming">
            <ShimmerText>Thinking…</ShimmerText>
          </Message>
        )}
      </MessageList>
      <div className="flex items-center justify-end px-2 py-2 shadow-[inset_0_1px_0_var(--kura-border-subtle)]">
        <Button size="sm" onClick={ask} disabled={waiting || streaming !== null}>
          Ask a follow-up <ArrowUp />
        </Button>
      </div>
    </div>
  );
}
