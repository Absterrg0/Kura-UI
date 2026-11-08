"use client";

import { GitPullRequestArrow } from "lucide-react";
import * as React from "react";
import { AgentFleet, type FleetAgent } from "../agent-fleet";
import { Button } from "../button";
import type { AgentStatus } from "../status-glyph";
import { RunHeader } from "./run-header";

const minutesAgo = (m: number) => Date.now() - m * 60_000;

export function RunHeaderMinimal() {
  const [startedAt] = React.useState(() => minutesAgo(3.2));
  return (
    <RunHeader
      className="w-full max-w-2xl"
      title="Migrate session API to @acme/auth"
      agent="Kura"
      model="claude-opus-5-5"
      status="running"
      startedAt={startedAt}
      shortcuts={false}
    />
  );
}

/** One beat of the run: what changes, and how long until the next beat. */
const SCRIPT: { status: AgentStatus; done: number; input: number; output: number; ms: number }[] = [
  { status: "running", done: 4, input: 268_400, output: 21_900, ms: 1800 },
  { status: "running", done: 4, input: 297_100, output: 24_300, ms: 1600 },
  { status: "waiting", done: 4, input: 301_800, output: 25_000, ms: 2600 },
  { status: "running", done: 5, input: 338_200, output: 29_400, ms: 1800 },
  { status: "running", done: 6, input: 376_900, output: 33_800, ms: 2000 },
  { status: "running", done: 7, input: 412_300, output: 38_100, ms: 1400 },
  { status: "done", done: 7, input: 412_300, output: 38_100, ms: 0 },
];

/** Blended price with prompt caching: ~$2.50 / M input, $20 / M output. */
const priceOf = (input: number, output: number) => (input * 2.5 + output * 20) / 1_000_000 + 0.03;

export function RunHeaderFull() {
  const [startedAt] = React.useState(() => minutesAgo(11.4));
  const [beat, setBeat] = React.useState(0);
  const [override, setOverride] = React.useState<AgentStatus | null>(null);
  const [endedAt, setEndedAt] = React.useState<number | undefined>();
  const step = SCRIPT[Math.min(beat, SCRIPT.length - 1)] as (typeof SCRIPT)[number];
  const status = override ?? step.status;

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-arm the timer on every beat
  React.useEffect(() => {
    if (override != null || step.ms === 0) return;
    const t = setTimeout(() => setBeat((b) => Math.min(b + 1, SCRIPT.length - 1)), step.ms);
    return () => clearTimeout(t);
  }, [beat, override, step.ms]);

  React.useEffect(() => {
    if ((status === "done" || status === "skipped") && endedAt == null) setEndedAt(Date.now());
  }, [status, endedAt]);

  return (
    <RunHeader
      className="w-full max-w-3xl"
      title="Migrate session API to @acme/auth"
      agent="Kura"
      model="claude-opus-5-5"
      branch="kura/auth-client"
      status={status}
      startedAt={startedAt}
      endedAt={endedAt}
      progress={{ done: step.done, total: 7 }}
      tokens={{ input: step.input, output: step.output }}
      cost={priceOf(step.input, step.output)}
      budget={5}
      onPause={() => setOverride("paused")}
      onResume={() => setOverride(null)}
      onStop={() => setOverride("skipped")}
      actions={
        status === "done" ? (
          <Button size="sm" variant="primary" className="animate-kura-fade-in">
            <GitPullRequestArrow />
            Open PR
          </Button>
        ) : null
      }
    />
  );
}

export function RunHeaderBar() {
  const [t] = React.useState(() => Date.now());
  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      <RunHeader
        variant="bar"
        title="Migrate session API to @acme/auth"
        status="running"
        branch="kura/auth-client"
        startedAt={t - 8 * 60_000 - 42_000}
        progress={{ done: 4, total: 7 }}
        tokens={{ input: 268_400, output: 21_900 }}
        cost={1.12}
        budget={5}
        onPause={() => {}}
        onStop={() => {}}
        shortcuts={false}
      />
      <RunHeader
        variant="bar"
        title="Patch src/middleware.ts"
        status="waiting"
        branch="kura/auth-client"
        startedAt={t - 9 * 60_000 - 5_000}
        progress={{ done: 4, total: 7 }}
        tokens={{ input: 301_800, output: 25_000 }}
        cost={1.31}
        budget={5}
        onStop={() => {}}
        shortcuts={false}
      />
      <RunHeader
        variant="bar"
        title="Fix login.test.ts › refreshes an expired session"
        status="failed"
        branch="kura/auth-client"
        startedAt={t - 14 * 60_000}
        endedAt={t - 2 * 60_000 - 51_000}
        progress={{ done: 5, total: 7 }}
        tokens={{ input: 356_000, output: 31_200 }}
        cost={1.58}
        budget={5}
      />
      <RunHeader
        variant="bar"
        title="Bump @acme/auth to 2.4.0"
        status="done"
        branch="kura/auth-client"
        startedAt={t - 31 * 60_000}
        endedAt={t - 19 * 60_000 - 6_000}
        progress={{ done: 7, total: 7 }}
        tokens={{ input: 412_300, output: 38_100 }}
        cost={1.82}
        budget={5}
      />
    </div>
  );
}

const FLEET: FleetAgent[] = [
  {
    id: "explorer",
    name: "explorer",
    role: "Maps call sites",
    status: "done",
    activity: "Found 23 calls to fetchUser() in 9 files",
    startedAt: minutesAgo(9),
    endedAt: minutesAgo(7.4),
    tokens: 84_200,
    cost: 0.21,
  },
  {
    id: "test-writer",
    name: "test-writer",
    role: "Updates tests",
    status: "running",
    activity: "Rewriting mocks in src/auth/__tests__/login.test.ts",
    progress: 0.62,
    startedAt: minutesAgo(3.1),
    tokens: 51_600,
    cost: 0.14,
  },
  {
    id: "reviewer",
    name: "reviewer",
    role: "Reviews the diff",
    status: "queued",
    activity: "Starts after test-writer",
  },
];

export function RunHeaderComposition() {
  const [startedAt] = React.useState(() => minutesAgo(9.6));
  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      <RunHeader
        variant="bar"
        title="Migrate session API to @acme/auth"
        status="running"
        branch="kura/auth-client"
        startedAt={startedAt}
        progress={{ done: 5, total: 7 }}
        tokens={{ input: 338_200, output: 29_400 }}
        cost={1.46}
        budget={5}
        onPause={() => {}}
        onStop={() => {}}
        shortcuts={false}
      />
      <AgentFleet
        agents={FLEET}
        density="compact"
        defaultSelectedId="test-writer"
        onSelect={() => {}}
      />
    </div>
  );
}
