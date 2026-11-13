"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { CodeBlock } from "../code-block";
import { IconButton } from "../icon-button";
import { type TraceSpan, TraceWaterfall } from "./trace-waterfall";

export function TraceWaterfallMinimal() {
  return (
    <TraceWaterfall
      className="w-full max-w-2xl"
      spans={[
        {
          id: "run",
          name: "Kura",
          kind: "agent",
          meta: "claude-opus-5-5",
          start: 0,
          end: 14_200,
          status: "done",
          children: [
            {
              id: "plan",
              name: "Plan the fix",
              kind: "llm",
              start: 0,
              end: 6_400,
              status: "done",
              tokens: { input: 12_400, output: 610 },
              cost: 0.06,
            },
            {
              id: "read",
              name: "read_file",
              kind: "tool",
              meta: "src/auth/client.ts",
              start: 6_500,
              end: 6_900,
              status: "done",
            },
            {
              id: "edit",
              name: "Write the patch",
              kind: "llm",
              start: 7_000,
              end: 14_200,
              status: "done",
              tokens: { input: 15_100, output: 1_240 },
              cost: 0.08,
            },
          ],
        },
      ]}
    />
  );
}

const S = 1000;
const M = 60_000;

/** The whole auth-client migration, as it finally ran. */
const RUN: TraceSpan = {
  id: "run",
  name: "Kura",
  kind: "agent",
  meta: "kura/auth-client",
  start: 0,
  end: 11 * M + 52 * S,
  status: "done",
  children: [
    {
      id: "plan",
      name: "Plan the migration",
      kind: "llm",
      model: "claude-opus-5-5",
      start: 0,
      end: 9.8 * S,
      status: "done",
      tokens: { input: 18_400, output: 1_120 },
      cost: 0.11,
      input:
        "Migrate acme/web from the legacy REST session API to @acme/auth. Read the routes first.",
      output:
        "1. Read routes in src/app\n2. Map call sites of fetchUser()\n3. Patch src/auth/client.ts and src/middleware.ts\n4. Update tests, run pnpm test\n5. Open a PR",
    },
    {
      id: "routes",
      name: "read_file",
      kind: "tool",
      meta: "src/app/api/session/route.ts",
      start: 9.9 * S,
      end: 10.3 * S,
      status: "done",
      input: '{ "path": "src/app/api/session/route.ts" }',
      output: "export async function GET(req: Request) {\n  const user = await fetchUser(req)\n  …",
    },
    {
      id: "search",
      name: "search_code",
      kind: "retrieval",
      meta: "fetchUser",
      start: 10.4 * S,
      end: 12.1 * S,
      status: "done",
      output: "14 matches in 9 files",
    },
    {
      id: "explorer",
      name: "explorer",
      kind: "agent",
      start: 12.5 * S,
      end: 62 * S,
      status: "done",
      children: [
        {
          id: "explorer-llm",
          name: "Find call sites",
          kind: "llm",
          model: "claude-haiku-4-5",
          start: 12.6 * S,
          end: 21 * S,
          status: "done",
          tokens: { input: 9_800, output: 420 },
          cost: 0.01,
        },
        {
          id: "explorer-grep",
          name: "bash",
          kind: "tool",
          meta: "rg -n 'fetchUser\\(' src",
          start: 21.1 * S,
          end: 21.9 * S,
          status: "done",
        },
        {
          id: "explorer-sum",
          name: "Summarize call sites",
          kind: "llm",
          model: "claude-haiku-4-5",
          start: 22.2 * S,
          end: 61.5 * S,
          status: "done",
          tokens: { input: 41_200, output: 2_300 },
          cost: 0.05,
        },
      ],
    },
    {
      id: "patch",
      name: "Draft the client patch",
      kind: "llm",
      model: "claude-opus-5-5",
      start: 63 * S,
      end: 1 * M + 40 * S,
      status: "done",
      tokens: { input: 52_300, output: 6_900 },
      cost: 0.31,
    },
    {
      id: "edit-client",
      name: "edit_file",
      kind: "tool",
      meta: "src/auth/client.ts",
      start: 1 * M + 40.2 * S,
      end: 1 * M + 40.9 * S,
      status: "done",
    },
    {
      id: "edit-mw",
      name: "edit_file",
      kind: "tool",
      meta: "src/middleware.ts",
      start: 2 * M + 8 * S,
      end: 2 * M + 8.6 * S,
      status: "done",
    },
    {
      id: "tests",
      name: "test-writer",
      kind: "agent",
      start: 2 * M + 12 * S,
      end: 5 * M + 28 * S,
      status: "done",
      children: [
        {
          id: "tests-llm",
          name: "Write session tests",
          kind: "llm",
          model: "claude-sonnet-4-5",
          start: 2 * M + 12 * S,
          end: 4 * M + 31 * S,
          status: "done",
          tokens: { input: 88_000, output: 9_400 },
          cost: 0.38,
        },
        {
          id: "tests-edit",
          name: "edit_file",
          kind: "tool",
          meta: "src/auth/login.test.ts",
          start: 4 * M + 32 * S,
          end: 4 * M + 33 * S,
          status: "done",
        },
      ],
    },
    {
      id: "test-1",
      name: "bash",
      kind: "tool",
      meta: "pnpm test",
      start: 5 * M + 31 * S,
      end: 6 * M + 9.4 * S,
      status: "failed",
      input: "pnpm test --filter @acme/web",
      error:
        "✕ login.test.ts › refreshes an expired session\n  Expected: 200\n  Received: 401\n\n  at src/auth/client.ts:88:11\n\nTests: 1 failed, 141 passed, 142 total",
    },
    {
      id: "diagnose",
      name: "Diagnose the failure",
      kind: "llm",
      model: "claude-opus-5-5",
      start: 6 * M + 10 * S,
      end: 7 * M + 1 * S,
      status: "done",
      tokens: { input: 71_500, output: 4_800 },
      cost: 0.29,
    },
    {
      id: "test-2",
      name: "bash",
      kind: "tool",
      meta: "pnpm test",
      start: 7 * M + 4 * S,
      end: 7 * M + 40.8 * S,
      status: "done",
      output: "Tests: 142 passed, 142 total",
    },
    {
      id: "review",
      name: "reviewer",
      kind: "agent",
      start: 7 * M + 42 * S,
      end: 10 * M + 48 * S,
      status: "done",
      children: [
        {
          id: "review-llm",
          name: "Review the diff",
          kind: "llm",
          model: "claude-opus-5-5",
          start: 7 * M + 42 * S,
          end: 10 * M + 48 * S,
          status: "done",
          tokens: { input: 104_000, output: 8_100 },
          cost: 0.42,
        },
      ],
    },
    {
      id: "pr",
      name: "bash",
      kind: "tool",
      meta: "gh pr create",
      start: 10 * M + 51 * S,
      end: 11 * M + 39 * S,
      status: "done",
      output: "https://github.com/acme/web/pull/482",
    },
    {
      id: "summary",
      name: "Summarize the run",
      kind: "llm",
      model: "claude-opus-5-5",
      start: 11 * M + 40 * S,
      end: 11 * M + 52 * S,
      status: "done",
      tokens: { input: 26_900, output: 4_960 },
      cost: 0.15,
    },
  ],
};

/** The trace as it looked at time `t`: unstarted spans hidden, unfinished spans running. */
function traceAt(span: TraceSpan, t: number): TraceSpan | null {
  if (span.start > t) return null;
  const finished = span.end != null && span.end <= t;
  return {
    ...span,
    end: finished ? span.end : undefined,
    status: finished ? span.status : "running",
    output: finished ? span.output : undefined,
    error: finished ? span.error : undefined,
    tokens: finished ? span.tokens : undefined,
    cost: finished ? span.cost : undefined,
    children: span.children?.map((c) => traceAt(c, t)).filter((c): c is TraceSpan => c != null),
  };
}

const FROM = 4 * M + 40 * S;
const SPEED = 75; // run-time ms per wall-clock ms

export function TraceWaterfallFull() {
  const [t, setT] = React.useState(FROM);
  const [run, setRun] = React.useState(0);
  const end = RUN.end ?? 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` replays the trace
  React.useEffect(() => {
    const began = Date.now();
    setT(FROM);
    const id = setInterval(() => {
      const next = Math.min(end, FROM + (Date.now() - began) * SPEED);
      setT(next);
      if (next >= end) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [run]);

  const root = traceAt(RUN, t);
  return (
    <TraceWaterfall
      className="w-full max-w-3xl"
      title="Trace"
      spans={root ? [root] : []}
      now={t}
      defaultSelectedId="test-1"
      defaultCollapsedIds={["explorer"]}
      actions={
        <IconButton
          label="Replay"
          icon={<RotateCcw />}
          variant="ghost"
          size="xs"
          className="-mr-1.5"
          onClick={() => setRun((r) => r + 1)}
        />
      }
    />
  );
}

export function TraceWaterfallLive() {
  const [startedAt] = React.useState(() => Date.now() - 38_000);
  return (
    <TraceWaterfall
      className="w-full max-w-2xl"
      title="test-writer"
      startedAt={startedAt}
      spans={[
        {
          id: "tw",
          name: "test-writer",
          kind: "agent",
          start: 0,
          status: "running",
          children: [
            {
              id: "tw-read",
              name: "read_file",
              kind: "tool",
              meta: "src/auth/login.test.ts",
              start: 400,
              end: 900,
              status: "done",
            },
            {
              id: "tw-ctx",
              name: "search_code",
              kind: "retrieval",
              meta: "refreshSession",
              start: 1_000,
              end: 2_600,
              status: "done",
            },
            {
              id: "tw-llm",
              name: "Write session tests",
              kind: "llm",
              start: 2_800,
              end: 24_100,
              status: "done",
              tokens: { input: 31_200, output: 2_870 },
              cost: 0.14,
            },
            {
              id: "tw-approve",
              name: "edit_file",
              kind: "tool",
              meta: "src/auth/session.test.ts",
              start: 24_300,
              end: 25_000,
              status: "done",
            },
            {
              id: "tw-run",
              name: "bash",
              kind: "tool",
              meta: "pnpm vitest session",
              start: 25_200,
              status: "running",
            },
          ],
        },
      ]}
    />
  );
}

export function TraceWaterfallCustomDetails() {
  return (
    <TraceWaterfall
      className="w-full max-w-2xl"
      title="Tool calls"
      defaultSelectedId="edit"
      spans={[
        {
          id: "turn",
          name: "Fix token refresh",
          kind: "agent",
          start: 0,
          end: 9_300,
          status: "done",
          children: [
            {
              id: "think",
              name: "Diagnose the failure",
              kind: "llm",
              start: 0,
              end: 7_900,
              status: "done",
              tokens: { input: 71_500, output: 4_800 },
              cost: 0.29,
            },
            {
              id: "edit",
              name: "edit_file",
              kind: "tool",
              meta: "src/auth/client.ts",
              start: 8_000,
              end: 8_400,
              status: "done",
            },
            {
              id: "test",
              name: "bash",
              kind: "tool",
              meta: "pnpm test login",
              start: 8_500,
              end: 9_300,
              status: "done",
            },
          ],
        },
      ]}
      renderDetails={(span) =>
        span.id === "edit" ? (
          <CodeBlock
            language="ts"
            filename="src/auth/client.ts"
            header={false}
            code={`if (res.status === 401 && session.refreshToken) {\n  session = await auth.refresh(session.refreshToken)\n  return retry(req, session)\n}`}
          />
        ) : null
      }
    />
  );
}
