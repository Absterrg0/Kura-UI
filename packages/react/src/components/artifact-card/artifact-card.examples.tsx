"use client";

import { Copy, Download, Pencil, X } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { CodeBlock } from "../code-block";
import { IconButton } from "../icon-button";
import { Message } from "../message";
import { ArtifactCard } from "./artifact-card";

export function ArtifactCardMinimal() {
  const [open, setOpen] = React.useState(false);
  return (
    <ArtifactCard
      title="Q3 launch plan"
      kind="document"
      meta="Markdown · 1,240 words"
      selected={open}
      onOpen={() => setOpen((o) => !o)}
      className="w-80"
    />
  );
}

const PLAN = [
  "Pricing page rewrite",
  "Lead with the outcome, not the plan names. Most visitors arrive from a comparison search and decide in the first screen.",
  "Collapse the four tiers into three. Team and Business overlap on every feature that matters to a buyer under fifty seats.",
  "Move the FAQ above the fold on mobile and answer the two questions sales hears most: data residency and seat changes.",
];
const STEPS = ["Outlining…", "Writing the summary…", "Writing section 2 of 3…", "Polishing…"];

export function ArtifactCardFull() {
  const [run, setRun] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [version, setVersion] = React.useState(1);
  const [open, setOpen] = React.useState(false);
  const busy = progress < 1;

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` restarts the simulation
  React.useEffect(() => {
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(1, p + 0.035 + Math.random() * 0.03);
        if (next >= 1) clearInterval(id);
        return next;
      });
    }, 140);
    return () => clearInterval(id);
  }, [run]);

  const visible = busy ? Math.max(1, Math.ceil(progress * PLAN.length)) : PLAN.length;
  const versions = run + 1;

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ArtifactCard
        variant="preview"
        kind="document"
        title="Pricing page rewrite"
        status={busy ? (run === 0 ? "generating" : "updating") : "ready"}
        statusText={STEPS[Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))]}
        progress={progress}
        meta={`Markdown · ${version === versions ? "412" : "386"} words · edited just now`}
        versions={busy ? Math.max(1, versions - 1) : versions}
        version={busy ? Math.max(1, versions - 1) : version}
        onVersionChange={setVersion}
        selected={open}
        onOpen={() => setOpen((o) => !o)}
        actions={
          <>
            <IconButton size="sm" label="Copy" icon={<Copy />} disabled={busy} />
            <IconButton size="sm" label="Download" icon={<Download />} disabled={busy} />
          </>
        }
        preview={
          // The well is 144px tall and clips: a title and two clamped paragraphs end on a whole line.
          <div className="flex flex-col gap-2 p-5 text-[11px] text-kura-fg-muted leading-[18px]">
            {PLAN.slice(0, Math.min(visible, 3)).map((line, i) =>
              i === 0 ? (
                <p
                  key={line}
                  className="truncate font-semibold text-[13px] text-kura-fg leading-5 tracking-tight"
                >
                  {line}
                </p>
              ) : (
                <p key={line} className="line-clamp-2 animate-kura-fade-in">
                  {line}
                </p>
              ),
            )}
          </div>
        }
      />
      <Button
        size="xs"
        variant="ghost"
        className="self-end"
        disabled={busy}
        onClick={() => {
          setRun((r) => r + 1);
          setVersion(run + 2);
        }}
      >
        <Pencil />
        Ask for an edit
      </Button>
    </div>
  );
}

export function ArtifactCardStates() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5">
      <ArtifactCard
        title="Onboarding email sequence"
        status="generating"
        statusText="Drafting email 2 of 4…"
        onOpen={() => {}}
        className="w-full"
      />
      <ArtifactCard
        kind="code"
        title="use-session.ts"
        status="updating"
        progress={0.64}
        statusText="Applying 3 edits…"
        versions={2}
        onOpen={() => {}}
        className="w-full"
      />
      <ArtifactCard
        kind="data"
        title="Churn by cohort"
        meta="CSV · 12 columns · 4,218 rows"
        onOpen={() => {}}
        className="w-full"
      />
      <ArtifactCard
        kind="web"
        title="Waitlist landing page"
        status="error"
        error="Stopped: the response hit the output limit"
        onRetry={() => {}}
        onOpen={() => {}}
        className="w-full"
      />
    </div>
  );
}

const KINDS = [
  { kind: "document", title: "Board update — October", meta: "Markdown · 860 words" },
  { kind: "code", title: "rate-limiter.ts", meta: "TypeScript · 94 lines" },
  { kind: "web", title: "Pricing page", meta: "React · interactive" },
  { kind: "image", title: "Hero illustration", meta: "PNG · 1600 × 900" },
  { kind: "data", title: "Q3 pipeline", meta: "CSV · 1,204 rows" },
  { kind: "diagram", title: "Auth flow", meta: "Mermaid · 9 nodes" },
] as const;

export function ArtifactCardKinds() {
  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
      {KINDS.map((a) => (
        <ArtifactCard key={a.kind} {...a} onOpen={() => {}} className="w-full" />
      ))}
    </div>
  );
}

const CODE = `import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

// 20 requests per 10 seconds, per user, sliding window.
export const limiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  prefix: "chat",
});

export async function guard(userId: string) {
  const { success, reset } = await limiter.limit(userId);
  if (!success) {
    const retry = Math.ceil((reset - Date.now()) / 1000);
    throw new Response("Slow down", {
      status: 429,
      headers: { "Retry-After": String(retry) },
    });
  }
}`;

export function ArtifactCardComposition() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="flex w-full max-w-3xl items-start gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Message from="user">Rate limit the chat route to 20 requests per 10 seconds.</Message>
        <Message from="assistant" name="Kura">
          <p>
            Here's a sliding-window limiter keyed by user. Call <code>guard()</code> at the top of
            the route; it throws a 429 with <code>Retry-After</code> when someone is over.
          </p>
          <ArtifactCard
            variant="preview"
            kind="code"
            title="rate-limiter.ts"
            meta="TypeScript · 21 lines"
            selected={open}
            onOpen={() => setOpen((o) => !o)}
            className="max-w-xs"
            preview={
              <CodeBlock
                code={CODE}
                language="ts"
                header={false}
                lineNumbers={false}
                copyable={false}
                className="rounded-none bg-transparent text-[11px] shadow-none"
              />
            }
          />
        </Message>
      </div>
      {open && (
        <section
          aria-label="rate-limiter.ts"
          className="hidden w-[22rem] shrink-0 animate-kura-fade-in flex-col overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-md md:flex"
        >
          <header className="flex h-11 items-center gap-2 pr-1.5 pl-3.5 shadow-[inset_0_-1px_0_var(--kura-border-subtle)]">
            <span className="min-w-0 flex-1 truncate font-medium text-sm">rate-limiter.ts</span>
            <IconButton size="sm" label="Close panel" icon={<X />} onClick={() => setOpen(false)} />
          </header>
          <CodeBlock
            code={CODE}
            language="ts"
            header={false}
            maxHeight={320}
            className="rounded-none text-xs shadow-none"
          />
        </section>
      )}
    </div>
  );
}
