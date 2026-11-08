"use client";

import { RotateCcw, Square } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { ShimmerText } from "../shimmer-text";
import { StreamingText } from "./streaming-text";
import { useStreamingText } from "./use-streaming-text";

const ANSWER =
  "Streaming feels calm when the reveal keeps an even rhythm. Tokens arrive in bursts — three at once, then a pause — so Kura buffers them and releases whole words at a steady cadence, fading each group in while the caret holds the live edge.";

/** Fake model: yields 1–4 word tokens with irregular, bursty delays. */
async function* fakeTokens(text: string, signal?: AbortSignal): AsyncGenerator<string> {
  const words = text.split(/(?<=\s)/);
  for (let i = 0; i < words.length; ) {
    if (signal?.aborted) return;
    const n = 1 + Math.floor(Math.random() * 4);
    yield words.slice(i, i + n).join("");
    i += n;
    await new Promise((r) => setTimeout(r, Math.random() < 0.15 ? 380 : 40 + Math.random() * 90));
  }
}

export function StreamingTextMinimal() {
  const [stream] = React.useState(() => fakeTokens(ANSWER));
  return <StreamingText stream={stream} className="max-w-md" />;
}

export function StreamingTextFull() {
  const [run, setRun] = React.useState(0);
  const [text, setText] = React.useState("");
  const [streaming, setStreaming] = React.useState(true);
  const [done, setDone] = React.useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` restarts the fake stream
  React.useEffect(() => {
    const controller = new AbortController();
    setText("");
    setStreaming(true);
    (async () => {
      let acc = "";
      for await (const token of fakeTokens(ANSWER, controller.signal)) {
        acc += token;
        setText(acc);
      }
      if (!controller.signal.aborted) setStreaming(false);
    })();
    return () => controller.abort();
  }, [run]);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <StreamingText
        text={text}
        streaming={streaming}
        speed={120}
        animation="blur"
        caret
        onComplete={() => setDone((d) => d + 1)}
        className="min-h-32"
      />
      <div className="flex items-center justify-between">
        <span className="font-kura-mono text-kura-fg-subtle text-xs tabular-nums">
          {text.length} chars · completed {done}×
        </span>
        <Button variant="secondary" size="sm" onClick={() => setRun((r) => r + 1)}>
          <RotateCcw /> Replay
        </Button>
      </div>
    </div>
  );
}

export function StreamingTextComposition() {
  const [stream, setStream] = React.useState<AsyncIterable<string> | null>(null);
  const [stopped, setStopped] = React.useState(false);
  const controller = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const id = setTimeout(() => {
      controller.current = new AbortController();
      setStream(fakeTokens(ANSWER, controller.current.signal));
    }, 1200);
    return () => {
      clearTimeout(id);
      controller.current?.abort();
    };
  }, []);

  const { settled, chunks, isStreaming } = useStreamingText({ stream });
  const waiting = !stream;

  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-kura-xl bg-kura-surface p-4 shadow-kura-sm">
      <div className="flex h-6 items-center justify-between">
        <span className="font-medium text-kura-fg text-sm">Assistant</span>
        {(waiting || isStreaming) && !stopped && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              controller.current?.abort();
              setStopped(true);
            }}
          >
            <Square className="fill-current" /> Stop
          </Button>
        )}
      </div>
      {waiting ? (
        <p role="status" className="text-[15px] leading-relaxed">
          <ShimmerText>Thinking…</ShimmerText>
        </p>
      ) : (
        <p
          aria-busy={isStreaming || undefined}
          className="whitespace-pre-wrap text-[15px] text-kura-fg leading-relaxed"
        >
          {settled}
          {chunks.map((c) => (
            <span
              key={c.id}
              className="transition-opacity duration-(--kura-duration-slow) starting:opacity-0"
            >
              {c.text}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
