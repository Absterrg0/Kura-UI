"use client";

import { type ApprovalDecision, ApprovalPrompt } from "@kura-ui/react/approval-prompt";
import { Button } from "@kura-ui/react/button";
import { type DiffReview, DiffView } from "@kura-ui/react/diff-view";
import { useReducedMotion } from "@kura-ui/react/hooks";
import { Terminal } from "@kura-ui/react/terminal";
import { createAgent } from "@ui-sdk/react/agent";
import { RotateCcw } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * A live demo of Kura's agent-readiness. A real ui-sdk agent bridge on this page reads the two
 * components on the right and acts on them through the same API a person's clicks use. The
 * approve step is marked data-agent-confirm, so it stops and waits for the visitor.
 */

const PATCH = `diff --git a/src/auth/session.ts b/src/auth/session.ts
--- a/src/auth/session.ts
+++ b/src/auth/session.ts
@@ -12,4 +12,4 @@ export async function refresh(token: string) {
-  const res = await fetch("/api/v1/session", { method: "POST" });
+  const res = await auth.refresh(token);
   if (!res.ok) throw new SessionError(res.status);
@@ -31,3 +31,3 @@ export function expiresIn(s: Session) {
-  return s.expiresAt - Date.now();
+  return s.expiresAt - Date.now() + 60_000;
 }
`;

const DIFF = "Agent patch";
const PROMPT = "Deploy the reviewed patch to a preview";

const ESC = "\u001b[";
const c = (code: string, s: string) => `${ESC}${code}m${s}${ESC}0m`;
const dim = (s: string) => c("2", s);

type Ask = { text: string; answer: (yes: boolean) => void };

export function AgentDemo({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const [review, setReview] = React.useState<DiffReview>({});
  const [decision, setDecision] = React.useState<ApprovalDecision>("pending");
  const [lines, setLines] = React.useState<string[]>([]);
  const [ask, setAsk] = React.useState<Ask | null>(null);
  const [state, setState] = React.useState<"idle" | "running" | "waiting" | "done">("idle");
  const askRef = React.useRef<(text: string) => Promise<boolean>>(() => Promise.resolve(false));
  const agentRef = React.useRef<ReturnType<typeof createAgent> | null>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const run = React.useRef(0);

  askRef.current = (text) =>
    new Promise<boolean>((resolve) => {
      setState("waiting");
      setAsk({
        text,
        answer: (yes) => {
          setAsk(null);
          resolve(yes);
        },
      });
    });

  const play = React.useCallback(async () => {
    const id = ++run.current;
    agentRef.current ??= createAgent({
      allow: (step) => (step.confirm ? askRef.current(step.confirm) : true),
    });
    const agent = agentRef.current;
    const live = () => id === run.current;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
    const print = (...next: string[]) => live() && setLines((l) => [...l, ...next]);

    setReview({});
    setDecision("pending");
    setAsk(null);
    setLines([]);
    setState("running");
    await wait(500);

    print(`${c("36", "›")} agent.snapshot()`);
    await wait(450);
    const seen = agent.snapshot().filter((e) => e.label === DIFF || e.label?.startsWith(PROMPT));
    for (const e of seen) {
      print(
        `  ${c("1", e.component.padEnd(16))}${String(e.value ?? "").padEnd(16)}${dim(e.actions.length > 3 ? `${e.actions.slice(0, 3).join(" ")} …` : e.actions.join(" "))}`,
      );
    }
    await wait(900);

    for (const [action, change] of [
      ["accept", "src/auth/session.ts change 1"],
      ["reject", "src/auth/session.ts change 2"],
    ] as const) {
      if (!live()) return;
      print("", `${c("36", "›")} ${action} ${dim(`"${change}"`)}`);
      await wait(350);
      const r = await agent.act({ steps: [{ ref: DIFF, action, args: [change] }] });
      print(
        r.ok
          ? `  ${c("32", "✓")} ${action === "accept" ? "accepted" : "rejected"}`
          : `  ${c("31", "×")} ${r.error?.message}`,
      );
      await wait(700);
    }

    if (!live()) return;
    print("", `${c("36", "›")} press ${dim('"Deploy"')}`);
    // "Deploy" alone also matches the prompt's title, so take the button's ref from the snapshot.
    const button = agent.snapshot().find((e) => e.component === "button" && e.label === "Deploy");
    const r = await agent.act({ steps: [{ ref: button?.ref ?? "Deploy", action: "press" }] });
    if (!live()) return;
    print(
      r.ok
        ? `  ${c("32", "✓")} the person allowed it`
        : `  ${c("33", "■")} the person said no, nothing ran`,
    );
    setState("done");
  }, [reduced]);

  // Play once when the demo scrolls into view.
  React.useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void play();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play]);

  React.useEffect(
    () => () => {
      run.current++;
    },
    [],
  );

  return (
    <div
      ref={root}
      data-slot="agent-demo"
      className={cn(
        "relative grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]",
        className,
      )}
    >
      <div className="flex min-h-0 flex-col">
        <Terminal
          className="h-full min-h-[300px]"
          title="in-app assistant"
          command={"createAgent({ allow: askThePerson })"}
          lines={lines}
          status={
            state === "running" || state === "waiting"
              ? "running"
              : state === "idle"
                ? "idle"
                : "done"
          }
          wrap={false}
          maxHeight={360}
          actions={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => void play()}
              disabled={state === "running"}
              aria-label="Replay the agent"
            >
              <RotateCcw />
              Replay
            </Button>
          }
        />
        <div
          aria-live="polite"
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-(--kura-duration-base) ease-kura-out motion-reduce:transition-none",
            ask ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            {ask && (
              <div className="sheet mt-3 flex flex-col gap-3 rounded-kura-xl p-3.5 sm:flex-row sm:items-center">
                <p className="min-w-0 flex-1 text-[13.5px] leading-snug">
                  <span className="text-kura-fg-muted">The agent wants to: </span>
                  {ask.text}
                </p>
                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" size="sm" onClick={() => ask.answer(false)}>
                    Don't allow
                  </Button>
                  <Button size="sm" onClick={() => ask.answer(true)}>
                    Allow
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <DiffView
          title={DIFF}
          diff={PATCH}
          review={review}
          onReviewChange={setReview}
          collapseReviewed={false}
          autoAdvance={false}
        />
        <ApprovalPrompt
          title={PROMPT}
          agent={{ name: "Kura" }}
          command="vercel deploy --prebuilt"
          description="Ships the reviewed patch to a preview URL."
          agentConfirm="Deploys the reviewed patch to a preview URL"
          decision={decision}
          onDecisionChange={setDecision}
          approveLabel="Deploy"
          shortcuts={false}
        />
      </div>
    </div>
  );
}
