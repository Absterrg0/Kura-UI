"use client";

import { Play, RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { CodeBlock } from "./code-block";

const SNIPPET = `import { StreamingText } from "@kura-ui/react/streaming-text";

export function Answer({ stream }: { stream: AsyncIterable<string> }) {
  // Bursty tokens are evened out into a calm cadence.
  return <StreamingText stream={stream} speed={90} className="max-w-prose" />;
}`;

const ROUTE = `import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-opus-5-5"),
    system: "You are a calm, precise assistant.",
    messages,
    temperature: 0.4,
  });

  return result.toUIMessageStreamResponse();
}

// Tokens arrive in bursts; the client smooths them with <StreamingText />.
export const runtime = "edge";
const RETRIES = 3;
const TIMEOUT_MS = 12_000;`;

const DIFF = `@@ -4,7 +4,8 @@ export function Answer() {
   const [open, setOpen] = React.useState(false);
-  const items = data.filter((d) => d.visible);
+  const items = React.useMemo(() => data.filter((d) => d.visible), [data]);
+  const reduced = useReducedMotion();
   return (
-    <List items={items} animate />
+    <List items={items} animate={!reduced} />
   );`;

export function CodeBlockMinimal() {
  return <CodeBlock code={SNIPPET} language="tsx" className="w-full max-w-xl" />;
}

export function CodeBlockFull() {
  const [wrap, setWrap] = React.useState(false);
  return (
    <CodeBlock
      code={ROUTE}
      language="ts"
      filename="app/api/chat/route.ts"
      lineNumbers
      highlightLines={[9, 10, 11, 12, 13, 14]}
      wrap={wrap}
      onWrapChange={setWrap}
      maxHeight={300}
      defaultExpanded={false}
      copyable
      header
      className="w-full max-w-xl"
    />
  );
}

export function CodeBlockDiff() {
  return (
    <CodeBlock
      code={DIFF}
      language="tsx"
      diff
      filename="components/answer.tsx"
      lineNumbers
      className="w-full max-w-xl"
    />
  );
}

export function CodeBlockStreaming() {
  const [run, setRun] = React.useState(0);
  const [length, setLength] = React.useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` restarts the fake stream
  React.useEffect(() => {
    setLength(0);
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(SNIPPET.length, n + 2 + Math.floor(Math.random() * 7));
      setLength(n);
      if (n >= SNIPPET.length) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, [run]);
  const done = length >= SNIPPET.length;
  return (
    <div className="flex w-full max-w-xl flex-col items-end gap-2">
      <CodeBlock
        code={SNIPPET.slice(0, length)}
        language="tsx"
        filename="answer.tsx"
        streaming={!done}
        lineNumbers
        className="w-full"
      />
      <Button variant="secondary" size="sm" onClick={() => setRun((r) => r + 1)}>
        <RotateCcw /> Replay
      </Button>
    </div>
  );
}

export function CodeBlockComposition() {
  const [ran, setRan] = React.useState(false);
  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <CodeBlock
        code={"pnpm dlx @kura-ui/cli add code-block\npnpm --filter web dev --port 3000"}
        language="bash"
        actions={
          <Button variant="ghost" size="xs" onClick={() => setRan(true)}>
            <Play /> Run
          </Button>
        }
      />
      {ran && (
        <CodeBlock
          code={"✓ added code-block (4 files)\n▲ ready on http://localhost:3000"}
          header={false}
          copyable={false}
          className="animate-kura-rise-in"
        />
      )}
    </div>
  );
}
