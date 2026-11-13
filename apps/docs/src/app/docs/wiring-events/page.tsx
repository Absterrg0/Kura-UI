import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { C, DocsShell, PageHeader, Section } from "@/components/docs-shell";

export const metadata: Metadata = {
  title: "Wiring agent events",
  description:
    "Turn your agent loop's events into Kura UI props: one reducer for the run, then RunHeader, TaskList, Terminal and ApprovalPrompt render it.",
};

const EVENTS = `// The events your agent loop already emits, in whatever SDK you use.
// Map them to this small union at the edge.
type Risk = "low" | "medium" | "high";

type RunEvent =
  | { type: "run.started"; title: string; model: string; at: number }
  | { type: "plan.updated"; steps: { id: string; title: string }[] }
  | { type: "step.started"; id: string; at: number }
  | { type: "step.finished"; id: string; ok: boolean; at: number; error?: string }
  | { type: "tool.output"; chunk: string }
  | { type: "approval.requested"; id: string; command: string; risk: Risk }
  | { type: "usage"; input: number; output: number; cost: number };`;

const REDUCER = `import type { TaskListItem } from "@kura-ui/react/task-list";

interface RunState {
  title: string;
  model: string;
  startedAt?: number;
  status: "running" | "waiting" | "done" | "failed";
  tasks: TaskListItem[];
  output: string[];
  approval: { id: string; command: string; risk: "low" | "medium" | "high" } | null;
  tokens: { input: number; output: number };
  cost: number;
}

function reduce(state: RunState, e: RunEvent): RunState {
  switch (e.type) {
    case "run.started":
      return { ...state, title: e.title, model: e.model, startedAt: e.at, status: "running" };
    case "plan.updated":
      return {
        ...state,
        tasks: e.steps.map((s) => state.tasks.find((t) => t.id === s.id) ?? { ...s, status: "queued" }),
      };
    case "step.started":
      return { ...state, tasks: patch(state.tasks, e.id, { status: "running", startedAt: e.at }) };
    case "step.finished": {
      const started = state.tasks.find((t) => t.id === e.id)?.startedAt;
      return {
        ...state,
        tasks: patch(state.tasks, e.id, {
          status: e.ok ? "done" : "failed",
          detail: e.error,
          durationMs: started ? e.at - +started : undefined,
        }),
      };
    }
    case "tool.output":
      return { ...state, output: [...state.output, ...e.chunk.split("\\n")] };
    case "approval.requested":
      return { ...state, status: "waiting", approval: e };
    case "usage":
      return { ...state, tokens: { input: e.input, output: e.output }, cost: e.cost };
  }
}

const patch = (tasks: TaskListItem[], id: string, next: Partial<TaskListItem>) =>
  tasks.map((t) => (t.id === id ? { ...t, ...next } : t));`;

const VIEW = `"use client";

import { ApprovalPrompt } from "@kura-ui/react/approval-prompt";
import { RunHeader } from "@kura-ui/react/run-header";
import { TaskList } from "@kura-ui/react/task-list";
import { Terminal } from "@kura-ui/react/terminal";

export function RunView({ run, send }: { run: RunState; send: (msg: ClientMessage) => void }) {
  return (
    <div className="grid gap-3">
      <RunHeader
        variant="bar"
        title={run.title}
        model={run.model}
        status={run.status}
        startedAt={run.startedAt}
        tokens={run.tokens}
        cost={run.cost}
        progress={{
          done: run.tasks.filter((t) => t.status === "done").length,
          total: run.tasks.length,
        }}
        onStop={() => send({ type: "stop" })}
      />
      <div className="grid gap-3 md:grid-cols-[18rem_1fr]">
        <TaskList items={run.tasks} />
        <div className="grid gap-3">
          {run.approval && (
            <ApprovalPrompt
              key={run.approval.id}
              title="The agent wants to run a command"
              command={run.approval.command}
              risk={run.approval.risk}
              onDecisionChange={(decision) =>
                send({ type: "approval", id: run.approval!.id, decision })
              }
            />
          )}
          <Terminal lines={run.output} status={run.status === "running" ? "running" : "done"} />
        </div>
      </div>
    </div>
  );
}`;

const HOOK = `"use client";

import * as React from "react";

export function useRun(url: string) {
  const [run, dispatch] = React.useReducer(reduce, initialRun);
  const socket = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = (m) => dispatch(JSON.parse(m.data) as RunEvent);
    socket.current = ws;
    return () => ws.close();
  }, [url]);

  const send = React.useCallback((msg: ClientMessage) => {
    socket.current?.send(JSON.stringify(msg));
  }, []);

  return { run, send };
}`;

export default function WiringEventsPage() {
  return (
    <DocsShell>
      <div className="max-w-[46rem]">
        <PageHeader
          title="Wiring agent events"
          description="Kura components take plain props and report decisions through callbacks. Keep your run in one reducer, feed it your agent's events, and render the state."
        />

        <Section id="events" title="1. Name your events">
          <p className="pb-4 text-[15.5px] text-kura-fg-muted leading-relaxed">
            Every agent SDK streams something like this: a plan, steps starting and finishing, tool
            output, a request for permission, token usage. Translate your SDK&apos;s events into a
            small union once, at the edge, and the rest of the UI never depends on the SDK.
          </p>
          <CodeBlock lang="ts" code={EVENTS} />
        </Section>

        <Section id="reducer" title="2. Reduce them into run state">
          <p className="pb-4 text-[15.5px] text-kura-fg-muted leading-relaxed">
            The state is shaped like the components&apos; props: <C>TaskListItem[]</C> for the plan,
            string lines for the terminal, the pending approval. Keep ids stable so rows update in
            place instead of remounting.
          </p>
          <CodeBlock lang="ts" code={REDUCER} />
        </Section>

        <Section id="render" title="3. Render it">
          <p className="pb-4 text-[15.5px] text-kura-fg-muted leading-relaxed">
            <Link
              href="/components/run-header"
              className="text-kura-fg underline underline-offset-4"
            >
              RunHeader
            </Link>{" "}
            keeps its own clock from <C>startedAt</C>,{" "}
            <Link
              href="/components/task-list"
              className="text-kura-fg underline underline-offset-4"
            >
              TaskList
            </Link>{" "}
            times running steps, and{" "}
            <Link href="/components/terminal" className="text-kura-fg underline underline-offset-4">
              Terminal
            </Link>{" "}
            parses ANSI as lines arrive. Decisions flow back through <C>onDecisionChange</C> on{" "}
            <Link
              href="/components/approval-prompt"
              className="text-kura-fg underline underline-offset-4"
            >
              ApprovalPrompt
            </Link>
            .
          </p>
          <CodeBlock code={VIEW} />
        </Section>

        <Section id="transport" title="4. Connect the transport">
          <p className="pb-4 text-[15.5px] text-kura-fg-muted leading-relaxed">
            Any transport works: a WebSocket, server-sent events, or an async iterator in the same
            process. Events go into the reducer; decisions and stop requests go back out.
          </p>
          <CodeBlock code={HOOK} />
        </Section>

        <Section id="tips" title="Good to know">
          <ul className="flex list-disc flex-col gap-2.5 pl-5 text-[15.5px] text-kura-fg-muted leading-relaxed marker:text-kura-fg-subtle">
            <li>
              Only one ApprovalPrompt and one RunHeader on screen should bind keyboard shortcuts.
              Pass <C>shortcuts={"{false}"}</C> to the others.
            </li>
            <li>
              Give each approval a <C>key</C> so a new request starts pending instead of inheriting
              the last decision.
            </li>
            <li>
              For long output, pass <C>stream</C> (an async iterable of chunks) to Terminal instead
              of growing an array of lines.
            </li>
            <li>
              Every component&apos;s page lists its props and keyboard map; the same data is in{" "}
              <a href="/llms.txt" className="text-kura-fg underline underline-offset-4">
                llms.txt
              </a>{" "}
              for your coding agent.
            </li>
          </ul>
        </Section>
      </div>
    </DocsShell>
  );
}
