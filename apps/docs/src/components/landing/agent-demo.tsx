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
-  const res = await fetch("/v1/session", { method: "POST" });
+  const res = await auth.refresh(token);
   if (!res.ok) throw new SessionError(res.status);
@@ -31,3 +31,3 @@ export function expiresIn(s: Session) {
-  return s.expiresAt - Date.now();
+  return s.expiresAt - Date.now() + 60_000;
 }
`;

const BRIDGE = [
  ["Sees every component", "agent.snapshot()"],
  ["Acts through the same API", "agent.act()"],
  ["Stops for a person", "data-agent-confirm"],
] as const;

const DIFF = "Agent patch";
const PROMPT = "Deploy the reviewed patch to a preview";

const ESC = "\u001b[";
const c = (code: string, s: string) => `${ESC}${code}m${s}${ESC}0m`;
const dim = (s: string) => c("2", s);

export function AgentDemo({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const [review, setReview] = React.useState<DiffReview>({});
  const [decision, setDecision] = React.useState<ApprovalDecision>("pending");
  const [lines, setLines] = React.useState<string[]>([]);
  const [state, setState] = React.useState<"idle" | "running" | "waiting" | "done">("idle");
  // While the agent's press on "Deploy" waits for a person, this settles it.
  const settle = React.useRef<(() => void) | null>(null);
  const decided = React.useRef<ApprovalDecision>("pending");
  const askRef = React.useRef<(text: string) => Promise<boolean>>(() => Promise.resolve(false));
  const agentRef = React.useRef<ReturnType<typeof createAgent> | null>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const run = React.useRef(0);
  // The agent's pointer: where it is, whether it is pressing, and what it says it is doing.
  const [cursor, setCursor] = React.useState<{
    x: number;
    y: number;
    on: boolean;
    press: number;
    note?: string;
    flip?: boolean;
  }>({ x: 0, y: 0, on: false, press: 0 });
  // The component the agent is reading or acting on, ringed while it does.
  const [focus, setFocus] = React.useState<"diff" | "prompt" | "both" | null>(null);

  // The agent may not approve: its press stops here until the person uses the prompt themselves.
  askRef.current = () =>
    new Promise<boolean>((resolve) => {
      setState("waiting");
      setLines((l) => [...l, `  ${dim("waiting for a person on the prompt")}`]);
      settle.current = () => {
        settle.current = null;
        resolve(false);
      };
    });

  const decide = (next: ApprovalDecision) => {
    decided.current = next;
    setDecision(next);
    settle.current?.();
  };

  const play = React.useCallback(async () => {
    const id = ++run.current;
    agentRef.current ??= createAgent({
      allow: (step) => (step.confirm ? askRef.current(step.confirm) : true),
    });
    const agent = agentRef.current;
    const live = () => id === run.current;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
    const print = (...next: string[]) => live() && setLines((l) => [...l, ...next]);
    // Glide the pointer to an element inside the demo, then press it.
    const point = async (el: Element | null | undefined, note?: string) => {
      const box = root.current?.getBoundingClientRect();
      if (!el || !box || reduced) return;
      const r = el.getBoundingClientRect();
      setCursor((c) => ({
        ...c,
        on: true,
        note,
        x: r.left - box.left + r.width / 2,
        y: r.top - box.top + r.height / 2,
        // Near the right edge the name tag hangs to the left of the pointer instead.
        flip: r.left - box.left + r.width / 2 > box.width - 190,
      }));
      await wait(720);
    };
    const press = async () => {
      if (reduced) return;
      setCursor((c) => ({ ...c, press: c.press + 1 }));
      await wait(240);
    };
    const hunk = (i: number, label: string) =>
      root.current
        ?.querySelectorAll("[data-slot=diff-view-hunk]")
        [i]?.querySelector(`button[aria-label="${label}"]`);

    setReview({});
    decided.current = "pending";
    setDecision("pending");
    settle.current?.();
    setLines([]);
    setState("running");
    setFocus(null);
    setCursor((cur) => ({ ...cur, on: false, note: undefined }));
    await wait(500);

    print(`${c("36", "›")} agent.snapshot()`);
    if (live()) setFocus("both");
    await wait(650);
    const seen = agent.snapshot().filter((e) => e.label === DIFF || e.label?.startsWith(PROMPT));
    // Each entry on two short lines (what it is and its value, then what can be done to it),
    // so the transcript reads whole on a phone.
    for (const e of seen) {
      print(
        `  ${c("1", e.component.padEnd(18))}${String(e.value ?? "")}`,
        `    ${dim(e.actions.length > 3 ? `${e.actions.slice(0, 3).join(" ")} …` : e.actions.join(" "))}`,
      );
    }
    await wait(900);
    if (live()) setFocus(null);

    for (const [i, [action, change]] of (
      [
        ["accept", "src/auth/session.ts change 1"],
        ["reject", "src/auth/session.ts change 2"],
      ] as const
    ).entries()) {
      if (!live()) return;
      print("", `${c("36", "›")} ${action} ${dim(`"${change.replace("src/auth/", "")}"`)}`);
      setFocus("diff");
      await point(hunk(i, action === "accept" ? "Accept change" : "Reject change"), action);
      if (!live()) return;
      await press();
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
    setFocus("prompt");
    const deploy = [
      ...(root.current?.querySelectorAll("[data-slot=approval-prompt-actions] button") ?? []),
    ].find((b) => b.textContent?.trim().startsWith("Deploy"));
    await point(deploy, "press");
    if (!live()) return;
    await press();
    // The press stops at the confirm step: the pointer steps back and waits with the person.
    setCursor((cur) => ({ ...cur, note: "waiting for you", x: cur.x - 40, y: cur.y + 38 }));
    // "Deploy" alone also matches the prompt's title, so take the button's ref from the snapshot.
    const button = agent.snapshot().find((e) => e.component === "button" && e.label === "Deploy");
    await agent.act({ steps: [{ ref: button?.ref ?? "Deploy", action: "press" }] });
    if (!live()) return;
    setFocus(null);
    setCursor((cur) => ({ ...cur, on: false }));
    const outcome = decided.current as ApprovalDecision;
    print(
      outcome === "approved" || outcome === "always"
        ? `  ${c("32", "✓")} approved by you`
        : `  ${c("1", "■")} denied by you, nothing ran`,
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
        {/* The terminal takes the height the right column leaves it, so the two columns end level. */}
        <Terminal
          className="min-h-[416px] w-full flex-1 lg:min-h-[220px]"
          title="in-app assistant"
          command={"createAgent({ allow: askPerson })"}
          maxHeight={364}
          lines={lines}
          status={
            state === "running" || state === "waiting"
              ? "running"
              : state === "idle"
                ? "idle"
                : "done"
          }
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
        {/* What the bridge gives an agent, as a property list. */}
        <dl className="flex shrink-0 flex-col gap-2.5 px-1 pt-5 pb-1 text-[13.5px]">
          {BRIDGE.map(([term, code]) => (
            <div key={term} className="flex items-baseline gap-2.5">
              <dt className="shrink-0 text-kura-fg-muted">{term}</dt>
              <span aria-hidden className="kura-leader h-[5px] min-w-4 flex-1" />
              <dd className="shrink-0 font-kura-mono text-[12.5px]">{code}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div
          data-agent-focus={focus === "diff" || focus === "both" || undefined}
          className="agent-focus rounded-kura-xl"
        >
          <DiffView
            title={DIFF}
            diff={PATCH}
            review={review}
            onReviewChange={setReview}
            collapseReviewed={false}
            autoAdvance={false}
          />
        </div>
        <div
          data-agent-focus={focus === "prompt" || focus === "both" || undefined}
          className="agent-focus rounded-kura-xl"
        >
          <ApprovalPrompt
            title={PROMPT}
            agent={{ name: "Kura" }}
            command="vercel deploy --prebuilt"
            description="Ships the reviewed patch to a preview URL."
            agentConfirm="Deploys the reviewed patch to a preview URL"
            decision={decision}
            onDecisionChange={decide}
            approveLabel="Deploy"
            shortcuts={false}
          />
        </div>
      </div>
      <AgentCursor {...cursor} />
    </div>
  );
}

/**
 * The agent's pointer: an ink arrow with its name on a tag, gliding between the controls it uses.
 * Each press sends a ring of dots out from the tip.
 */
function AgentCursor({
  x,
  y,
  on,
  press,
  note,
  flip,
}: {
  x: number;
  y: number;
  on: boolean;
  press: number;
  note?: string;
  flip?: boolean;
}) {
  return (
    <div
      aria-hidden
      data-slot="agent-cursor"
      className="pointer-events-none absolute top-0 left-0 z-20 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.65,0,0.25,1)] motion-reduce:hidden"
      style={{ transform: `translate(${x}px, ${y}px)`, opacity: on ? 1 : 0 }}
    >
      {press > 0 && <span key={press} className="agent-cursor-ripple" />}
      <svg
        viewBox="0 0 16 20"
        className="-mt-px -ml-px h-5 w-4 drop-shadow-[0_2px_3px_rgb(0_0_0/0.35)]"
      >
        <path
          d="M1 1 L1 15.5 L4.9 11.9 L7.6 18 L10.2 16.9 L7.6 10.9 L13 10.9 Z"
          fill="var(--kura-fg)"
          stroke="var(--kura-canvas)"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
      <span className={cn("absolute top-4 inline-flex", flip ? "right-1.5" : "left-3.5")}>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-kura-ink py-[3px] pr-2 pl-1.5 font-kura-mono text-[11px] text-kura-fg-inverted shadow-kura-popover">
          <span className="size-1.5 rounded-full bg-kura-fg-inverted/80" />
          Kura{note ? <span className="opacity-60">· {note}</span> : null}
        </span>
      </span>
    </div>
  );
}
