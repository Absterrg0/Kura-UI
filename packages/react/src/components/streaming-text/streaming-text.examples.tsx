"use client";

import * as React from "react";
import { cn } from "../../lib/cn";
import { AgentSigil } from "../agent-sigil";
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
  const [text, setText] = React.useState("");
  const [streaming, setStreaming] = React.useState(true);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    (async () => {
      let acc = "";
      for await (const token of fakeTokens(ANSWER, controller.signal)) {
        acc += token;
        setText(acc);
      }
      if (!controller.signal.aborted) setStreaming(false);
    })();
    return () => controller.abort();
  }, []);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <StreamingText
        text={text}
        streaming={streaming}
        speed={120}
        animation="fade"
        caret
        onComplete={() => setDone(true)}
        className="min-h-[104px]"
      />
      {/* The row is always laid out, so finishing never moves the text above. */}
      <p className="h-5 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
        {done && <span className="animate-kura-fade-in">{text.split(/\s+/).length} words</span>}
      </p>
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
  const live = (waiting || isStreaming) && !stopped;

  return (
    <div className="flex w-full max-w-md gap-3">
      <AgentSigil name="Kura" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex h-[30px] items-center justify-between gap-3">
          <span className="font-medium text-[13px] text-kura-fg">Kura</span>
          {/* Laid out even when hidden, so the header never shifts. */}
          <Button
            variant="ghost"
            size="xs"
            className={cn(!live && "invisible")}
            aria-hidden={!live || undefined}
            tabIndex={live ? undefined : -1}
            onClick={() => {
              controller.current?.abort();
              setStopped(true);
            }}
          >
            Stop
          </Button>
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
    </div>
  );
}
