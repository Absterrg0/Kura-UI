"use client";

import { Check, GitBranch, GitPullRequest, RotateCcw } from "lucide-react";
import * as React from "react";
import { IconButton } from "../icon-button";
import { TaskList } from "../task-list";
import { BrowserSession, type BrowserStep } from "./browser-session";

/* A mock code-host page rendered as real markup at 800×500 design px. */
const W = 800;
const H = 500;
const at = (x: number, y: number) => ({ x: (x / W) * 100, y: (y / H) * 100 });
const box = (x: number, y: number, w: number, h: number, label?: string) => ({
  x: (x / W) * 100,
  y: (y / H) * 100,
  width: (w / W) * 100,
  height: (h / H) * 100,
  label,
});

const PR_TITLE = "Migrate session API to @acme/auth client";
const PR_BODY =
  "Replaces fetchUser() and the legacy /api/session REST calls with createAuthClient(). Refreshes expired sessions with the rotated token.";

function SiteBar() {
  return (
    <div className="flex h-12 items-center gap-3 border-kura-border-subtle border-b px-8 text-[14px]">
      <span className="size-5 rounded-[5px] bg-kura-fg" />
      <span className="text-kura-fg-muted">acme</span>
      <span className="text-kura-fg-subtle">/</span>
      <span className="font-semibold">web</span>
      <span className="ml-auto flex items-center gap-5 text-[13px] text-kura-fg-muted">
        <span>Code</span>
        <span className="font-medium text-kura-fg">Pull requests</span>
        <span>Actions</span>
        <span className="size-6 rounded-full bg-kura-gray-5" />
      </span>
    </div>
  );
}

function Field({ value, focused, tall }: { value: string; focused: boolean; tall?: boolean }) {
  return (
    <div
      data-target={tall ? "body" : "title"}
      className={
        tall
          ? "h-24 rounded-[7px] bg-kura-surface px-3 py-2 text-[13px] leading-5"
          : "flex h-9 items-center rounded-[7px] bg-kura-surface px-3 text-[13.5px]"
      }
      style={{
        boxShadow: focused
          ? "0 0 0 1px var(--kura-fg), 0 0 0 3px var(--kura-ring)"
          : "0 0 0 1px var(--kura-border-strong)",
      }}
    >
      <span>{value}</span>
      {focused && (
        <span className="ml-px inline-block h-4 w-px translate-y-[3px] animate-kura-pulse bg-kura-fg motion-reduce:animate-none" />
      )}
      {!value && !focused && (
        <span className="text-kura-fg-subtle">{tall ? "Add a description" : "Title"}</span>
      )}
    </div>
  );
}

function ComparePage({
  title,
  body,
  focus,
}: {
  title: string;
  body: string;
  focus: "title" | "body" | null;
}) {
  return (
    <div className="h-[500px] bg-kura-surface font-kura-sans text-kura-fg">
      <SiteBar />
      <div className="px-8 pt-6">
        <p className="font-semibold text-[20px] leading-7 tracking-[-0.015em]">
          Open a pull request
        </p>
        <p className="mt-1 text-[13px] text-kura-fg-muted leading-5">
          Create a new pull request by comparing changes across two branches.
        </p>
        <div className="mt-4 flex h-10 items-center gap-2 rounded-[8px] bg-kura-surface-sunken px-3 text-[12.5px]">
          <GitBranch className="size-3.5 text-kura-fg-subtle" strokeWidth={1.75} />
          <span className="rounded-[5px] bg-kura-surface px-1.5 py-0.5 font-kura-mono shadow-kura-xs">
            base: main
          </span>
          <span className="text-kura-fg-subtle">←</span>
          <span className="rounded-[5px] bg-kura-surface px-1.5 py-0.5 font-kura-mono shadow-kura-xs">
            compare: kura/auth-client
          </span>
          <span className="ml-auto flex items-center gap-1 font-medium text-kura-success-text">
            <Check className="size-3.5" strokeWidth={2.25} /> Able to merge
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-1.5 rounded-[10px] p-4 shadow-kura-xs">
          <span className="font-medium text-[12.5px] leading-[18px]">Title</span>
          <Field value={title} focused={focus === "title"} />
          <span className="mt-1.5 font-medium text-[12.5px] leading-[18px]">Description</span>
          <Field value={body} focused={focus === "body"} tall />
          <div className="mt-1.5 flex h-8 items-center justify-between">
            <span className="text-[12px] text-kura-fg-subtle">Markdown is supported</span>
            <span
              data-target="submit"
              className="flex h-8 w-[160px] items-center justify-center rounded-[7px] bg-kura-ink font-medium text-[13px] text-kura-fg-inverted"
            >
              Create pull request
            </span>
          </div>
        </div>
        <p className="mt-3 font-kura-mono text-[12px] text-kura-fg-subtle">
          4 commits · 6 files changed · +142 −38
        </p>
      </div>
    </div>
  );
}

function PullRequestPage() {
  return (
    <div className="h-[500px] bg-kura-surface font-kura-sans text-kura-fg">
      <SiteBar />
      <div className="px-8 pt-6">
        <p data-target="pr-h1" className="font-semibold text-[20px] leading-7 tracking-[-0.015em]">
          {PR_TITLE} <span className="font-normal text-kura-fg-subtle">#482</span>
        </p>
        <div className="mt-2 flex items-center gap-2 text-[13px] text-kura-fg-muted">
          <span className="flex items-center gap-1 font-medium text-kura-fg">
            <GitPullRequest className="size-3.5" strokeWidth={2} /> Open
          </span>
          <span>
            <span className="font-medium text-kura-fg">kura</span> wants to merge 4 commits into{" "}
            <span className="font-kura-mono text-[12px]">main</span> from{" "}
            <span className="font-kura-mono text-[12px]">kura/auth-client</span>
          </span>
        </div>
        <div className="mt-4 flex gap-5 border-kura-border-subtle border-b text-[13px] text-kura-fg-muted">
          <span className="-mb-px border-kura-fg border-b-2 pb-2 font-medium text-kura-fg">
            Conversation
          </span>
          <span>Commits 4</span>
          <span>Checks 3</span>
          <span>Files changed 6</span>
        </div>
        <div className="mt-4 rounded-[10px] p-4 text-[13px] text-kura-fg-muted leading-5 shadow-kura-xs">
          {PR_BODY}
        </div>
        <div className="mt-3 flex flex-col rounded-[10px] text-[13px] shadow-kura-xs">
          <div className="flex h-10 items-center gap-2 border-kura-border-subtle border-b px-4 font-medium">
            <Check className="size-4 text-kura-success" strokeWidth={2.25} /> All checks have passed
          </div>
          {[
            ["test", "142 passed · 41s"],
            ["typecheck", "0 errors · 18s"],
            ["lint", "clean · 6s"],
          ].map(([name, meta]) => (
            <div key={name} className="flex h-9 items-center gap-2 px-4">
              <Check className="size-3.5 text-kura-success" strokeWidth={2.25} />
              <span className="font-kura-mono text-[12.5px]">{name}</span>
              <span className="ml-auto font-kura-mono text-[12px] text-kura-fg-subtle">{meta}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrowserSessionMinimal() {
  return (
    <BrowserSession
      className="w-full max-w-xl"
      url="https://github.com/acme/web/pull/482"
      title="Migrate session API · acme/web"
      viewport={{ width: W, height: H }}
      cursor={at(468, 94)}
      highlight={box(24, 66, 478, 40, "h1")}
    >
      <PullRequestPage />
    </BrowserSession>
  );
}

const COMPARE_URL = "https://github.com/acme/web/compare/main...kura/auth-client";
const PR_URL = "https://github.com/acme/web/pull/482";

const STEPS: Omit<BrowserStep, "status">[] = [
  { id: "open", kind: "navigate", label: "Open the compare view", detail: COMPARE_URL.slice(8) },
  { id: "focus", kind: "click", label: "Focus the title field", detail: "input#pr-title" },
  { id: "title", kind: "type", label: "Type the PR title", detail: `“${PR_TITLE}”` },
  {
    id: "body",
    kind: "type",
    label: "Write the description",
    detail: `“${PR_BODY.slice(0, 48)}…”`,
  },
  {
    id: "submit",
    kind: "click",
    label: "Click “Create pull request”",
    detail: "button[type=submit]",
  },
  { id: "read", kind: "extract", label: "Read the PR number", detail: "#482 · Open" },
];

/** Where each step points, in design px. */
const TARGETS = {
  open: { cursor: at(400, 300), highlight: null },
  focus: { cursor: at(140, 256), highlight: box(48, 236, 704, 36, "input#pr-title") },
  title: { cursor: at(140, 256), highlight: box(48, 236, 704, 36, "input#pr-title") },
  body: { cursor: at(160, 330), highlight: box(48, 308, 704, 96, "textarea#pr-body") },
  submit: {
    cursor: at(690, 434),
    highlight: box(592, 416, 160, 32, 'button "Create pull request"'),
  },
  read: { cursor: at(468, 94), highlight: box(24, 66, 478, 40, "h1 · #482") },
} as const;

export function BrowserSessionFull() {
  const [step, setStep] = React.useState(0);
  const [typed, setTyped] = React.useState({ title: 0, body: 0 });
  const [clicks, setClicks] = React.useState(0);
  const [run, setRun] = React.useState(0);
  const [startedAt, setStartedAt] = React.useState<number>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` replays the session
  React.useEffect(() => {
    setStep(0);
    setTyped({ title: 0, body: 0 });
    setStartedAt(Date.now() - 6 * 60_000 - 12_000);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const type = (from: number, ms: number, key: "title" | "body", total: number) => {
      const n = 24;
      for (let i = 1; i <= n; i++)
        later(from + (ms / n) * i, () =>
          setTyped((t) => ({ ...t, [key]: Math.round((total * i) / n) })),
        );
    };
    later(1300, () => setStep(1));
    later(2300, () => setStep(2));
    type(2400, 1500, "title", PR_TITLE.length);
    later(4100, () => {
      setStep(3);
      setClicks((c) => c + 1);
    });
    type(4600, 1600, "body", PR_BODY.length);
    later(6500, () => setStep(4));
    later(7700, () => setStep(5));
    later(9200, () => setStep(6));
    return () => timers.forEach(clearTimeout);
  }, [run]);

  const created = step >= 5;
  const current = STEPS[step];
  const target = current ? TARGETS[current.id as keyof typeof TARGETS] : TARGETS.read;
  const steps: BrowserStep[] = STEPS.map((s, i) => ({
    ...s,
    status: i < step ? "done" : i === step ? "running" : "queued",
  }));

  return (
    <BrowserSession
      className="w-full max-w-4xl"
      url={created ? PR_URL : COMPARE_URL}
      title={created ? "Migrate session API · acme/web" : "Open a pull request · acme/web"}
      viewport={{ width: W, height: H }}
      status={step >= STEPS.length ? "done" : "browsing"}
      startedAt={startedAt}
      steps={steps}
      cursor={target.cursor}
      cursorLabel="Kura"
      clickKey={`${run}-${clicks}-${current?.kind === "click" ? current.id : ""}`}
      highlight={step >= STEPS.length ? null : target.highlight}
      onTakeOver={() => {}}
      statusText={step >= STEPS.length ? "acme/web#482 opened" : undefined}
      actions={
        step >= STEPS.length && (
          <IconButton
            label="Replay"
            icon={<RotateCcw />}
            variant="ghost"
            size="xs"
            className="animate-kura-fade-in"
            onClick={() => setRun((r) => r + 1)}
          />
        )
      }
    >
      <div className={step === 0 ? "opacity-40 transition-opacity" : "transition-opacity"}>
        {created ? (
          <PullRequestPage />
        ) : (
          <ComparePage
            title={PR_TITLE.slice(0, typed.title)}
            body={PR_BODY.slice(0, typed.body)}
            focus={step === 1 || step === 2 ? "title" : step === 3 ? "body" : null}
          />
        )}
      </div>
    </BrowserSession>
  );
}

function TwoFactorPage() {
  return (
    <div className="flex h-[500px] flex-col items-center bg-kura-surface-sunken pt-16 font-kura-sans text-kura-fg">
      <div className="flex w-[360px] flex-col items-center gap-1 rounded-[14px] bg-kura-surface px-8 py-7 shadow-kura-sm">
        <span className="mb-3 size-8 rounded-[8px] bg-kura-fg" />
        <p className="font-semibold text-[17px] tracking-[-0.01em]">Two-factor authentication</p>
        <p className="text-center text-[13px] text-kura-fg-muted leading-5">
          Enter the 6-digit code from your authenticator app to continue to Acme Cloud.
        </p>
        <div data-target="otp" className="mt-5 flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="h-11 w-9 rounded-[8px] bg-kura-surface"
              style={{
                boxShadow:
                  i === 0
                    ? "0 0 0 1px var(--kura-accent), 0 0 0 3px var(--kura-ring)"
                    : "0 0 0 1px var(--kura-border-strong)",
              }}
            />
          ))}
        </div>
        <span className="mt-5 flex h-9 w-full items-center justify-center rounded-[8px] bg-kura-ink font-medium text-[13px] text-kura-fg-inverted">
          Verify
        </span>
        <span className="mt-3 text-[12px] text-kura-fg-subtle">Use a recovery code instead</span>
      </div>
    </div>
  );
}

export function BrowserSessionPaused() {
  const [paused, setPaused] = React.useState(true);
  const [startedAt] = React.useState(() => Date.now() - 9 * 60_000 - 41_000);
  return (
    <BrowserSession
      className="w-full max-w-4xl"
      url="https://cloud.acme.dev/login/two-factor?next=%2Fweb%2Fdeployments"
      title="Sign in · Acme Cloud"
      viewport={{ width: W, height: H }}
      status={paused ? "paused" : "browsing"}
      statusText={paused ? "Enter the 2FA code, then hand back" : undefined}
      startedAt={startedAt}
      cursor={at(300, 262)}
      cursorLabel="Kura"
      highlight={box(264, 226, 272, 58, "input[name=otp]")}
      onResume={() => setPaused(false)}
      onTakeOver={() => setPaused(true)}
      steps={[
        {
          id: "1",
          kind: "navigate",
          label: "Open the preview",
          status: "done",
          detail: "cloud.acme.dev/web/deployments",
        },
        {
          id: "2",
          kind: "click",
          label: "Continue with GitHub",
          status: "done",
          detail: 'button[data-provider="github"]',
        },
        {
          id: "3",
          kind: "type",
          label: "Enter the 2FA code",
          status: paused ? "waiting" : "running",
          detail: "Needs a code only you have",
        },
        {
          id: "4",
          kind: "extract",
          label: "Check the login page",
          status: "queued",
          detail: "/login",
        },
      ]}
    >
      <TwoFactorPage />
    </BrowserSession>
  );
}

export function BrowserSessionComposition() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <TaskList
        title="Plan"
        collapseCompleted={false}
        items={[
          { id: "t", title: "Run pnpm test", status: "done", durationMs: 36_800 },
          { id: "p", title: "Open pull request", status: "running", detail: "via the browser" },
          { id: "s", title: "Summarize the run", status: "queued" },
        ]}
      />
      <BrowserSession
        layout="stacked"
        url={PR_URL}
        title="Migrate session API · acme/web"
        viewport={{ width: W, height: H }}
        cursor={at(468, 94)}
        cursorLabel="Kura"
        highlight={box(24, 66, 478, 40, "h1 · #482")}
        steps={[
          { id: "a", kind: "click", label: "Click “Create pull request”", status: "done" },
          {
            id: "b",
            kind: "extract",
            label: "Read the PR number",
            status: "running",
            detail: "h1",
          },
        ]}
      >
        <PullRequestPage />
      </BrowserSession>
    </div>
  );
}
