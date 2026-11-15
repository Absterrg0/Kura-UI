import { type ApprovalDecision, ApprovalPrompt } from "@kura/components/approval-prompt";
import { type DiffReview, DiffView } from "@kura/components/diff-view";
import { Terminal } from "@kura/components/terminal";
import * as React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { settle, tween } from "../lib/anim";
import { Camera, type Shot } from "../lib/camera";
import { Pointer, Ripple } from "../lib/pointer";
import { Headline } from "../lib/type";
import { X0 } from "./tokens";

/**
 * 0:32–0:42. An in-app agent reads the page by name, accepts one change and rejects another
 * through the same API a click uses, then reaches the deploy key, which is marked
 * data-agent-confirm: it stops, and waits for a person.
 */

export const AGENT_FRAMES = 600;

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

const ESC = "\u001b[";
const c = (code: string, s: string) => `${ESC}${code}m${s}${ESC}0m`;
const dim = (s: string) => c("2", s);

/** The transcript, line by line, with the frame each line lands on. */
const LOG: [number, string][] = [
  [84, `${c("36", "›")} agent.snapshot()`],
  [112, `  ${c("1", "diff-view".padEnd(18))}0 of 2 reviewed`],
  [124, `    ${dim("accept reject undo …")}`],
  [136, `  ${c("1", "approval-prompt".padEnd(18))}pending`],
  [148, `    ${dim("approve deny")}`],
  [196, ""],
  [196, `${c("36", "›")} accept ${dim('"session.ts change 1"')}`],
  [256, `  ${c("32", "✓")} accepted`],
  [282, ""],
  [282, `${c("36", "›")} reject ${dim('"session.ts change 2"')}`],
  [338, `  ${c("32", "✓")} rejected`],
  [364, ""],
  [364, `${c("36", "›")} press ${dim('"Deploy"')}`],
  [420, `  ${dim("waiting for a person on the prompt")}`],
];

const SCALE = 1.36;
/** Where a hunk's Accept and Reject keys sit in its box (measured on the stills). */
const ACCEPT = { x: 0.955, y: 0.09 };
const REJECT = { x: 0.865, y: 0.09 };
const WIDE: Omit<Shot, "at" | "dur"> = {
  target: "grid",
  anchor: { x: 0, y: 0 },
  scale: SCALE,
  screen: { x: X0, y: 236 },
};
/** Wide while it reads the page, in close on each component it acts on, wide for the stop. */
const SHOTS: Shot[] = [
  { at: 0, dur: 0, ...WIDE },
  { at: 186, dur: 48, target: "diff", scale: 1.95, screen: { x: 1030, y: 610 } },
  { at: 352, dur: 46, target: "prompt", scale: 1.95, screen: { x: 1030, y: 640 } },
  { at: 456, dur: 56, ...WIDE },
];

export function Agent() {
  const frame = useCurrentFrame();
  const root = React.useRef<HTMLDivElement>(null);
  const diff = React.useRef<HTMLDivElement>(null);
  const prompt = React.useRef<HTMLDivElement>(null);

  const review: DiffReview = {
    ...(frame >= 252 ? { "src/auth/session.ts#0": "accepted" as const } : {}),
    ...(frame >= 334 ? { "src/auth/session.ts#1": "rejected" as const } : {}),
  };
  const decision: ApprovalDecision = "pending";
  const lines = LOG.filter(([at]) => frame >= at).map(([, l]) => l);

  const either = (a: () => HTMLElement | null, b: () => HTMLElement | null) => () => a() ?? b();
  const hunk = (i: number) => () =>
    diff.current?.querySelectorAll<HTMLElement>("[data-slot=diff-view-hunk]")[i] ?? null;
  const hunkButton = (i: number, label: string) => () =>
    diff.current
      ?.querySelectorAll("[data-slot=diff-view-hunk]")
      [i]?.querySelector<HTMLElement>(`button[aria-label="${label}"]`) ?? null;
  const deploy = () =>
    [
      ...(prompt.current?.querySelectorAll<HTMLElement>(
        "[data-slot=approval-prompt-actions] button",
      ) ?? []),
    ].find((b) => b.textContent?.trim().startsWith("Deploy")) ?? null;

  // Which component the agent is reading or acting on: a ring of dots around it.
  const focusDiff =
    tween(frame, 90, 104) * (1 - tween(frame, 170, 184)) +
    tween(frame, 200, 214) * (1 - tween(frame, 350, 364));
  const focusPrompt = tween(frame, 90, 104) * (1 - tween(frame, 170, 184)) + tween(frame, 366, 380);

  const rise = (i: number) => {
    const s = settle(frame, 34 + i * 6, 140);
    return {
      opacity: tween(frame, 34 + i * 6, 46 + i * 6),
      transform: `translateY(${(1 - s) * 18}px)`,
    };
  };

  const pressed = (at: number) => frame >= at && frame < at + 8;

  return (
    <AbsoluteFill>
      <Headline
        text="Your agent can use it, too."
        at={8}
        out={334}
        size={80}
        style={{ position: "absolute", left: X0 - 4, top: 92 }}
      />
      <Headline
        text="Approvals still wait for a person."
        at={446}
        size={80}
        style={{ position: "absolute", left: X0 - 4, top: 92 }}
      />
      <Camera
        frame={frame}
        shots={SHOTS}
        targets={{
          grid: () => root.current,
          diff: () => diff.current,
          prompt: () => prompt.current,
        }}
      >
        <div
          ref={root}
          className="relative grid gap-3"
          style={{ width: 1600 / SCALE, gridTemplateColumns: "minmax(0,0.84fr) minmax(0,1.16fr)" }}
        >
          <div style={rise(0)} className="flex min-h-0 flex-col">
            <Terminal
              className="min-h-[520px] w-full flex-1"
              title="in-app assistant"
              command={"createAgent({ allow: askPerson })"}
              maxHeight={480}
              lines={lines}
              status={frame < 84 ? "idle" : "running"}
              copyable={false}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div ref={diff} style={rise(1)} className="relative">
              <DiffView
                title="Agent patch"
                diff={PATCH}
                review={review}
                collapseReviewed={false}
                autoAdvance={false}
              />
              <FocusRing amount={Math.min(1, focusDiff)} />
            </div>
            <div
              ref={prompt}
              style={rise(2)}
              className="relative"
              data-pressed={pressed(408) || undefined}
            >
              <div className="[&[data-pressed]_button[data-agent-confirm]]:translate-y-px">
                <ApprovalPrompt
                  title="Deploy the reviewed patch to a preview"
                  agent={{ name: "Kura" }}
                  command="vercel deploy --prebuilt"
                  description="Ships the reviewed patch to a preview URL."
                  agentConfirm="Deploys the reviewed patch to a preview URL"
                  decision={decision}
                  approveLabel="Deploy"
                  shortcuts={false}
                />
              </div>
              <FocusRing amount={Math.min(1, focusPrompt)} />
            </div>
          </div>
          <Pointer
            frame={frame}
            tag="Kura"
            note={
              frame >= 412
                ? "waiting for you"
                : frame >= 364
                  ? "press"
                  : frame >= 282
                    ? "reject"
                    : "accept"
            }
            from={{ x: 120, y: 160 }}
            enter={200}
            leave={AGENT_FRAMES}
            legs={[
              // The key while it is there; once pressed it is replaced, so then the place it was.
              {
                target: either(hunkButton(0, "Accept change"), hunk(0)),
                anchor: ACCEPT,
                at: 204,
                dur: 40,
              },
              {
                target: either(hunkButton(1, "Reject change"), hunk(1)),
                anchor: REJECT,
                at: 288,
                dur: 38,
              },
              { target: deploy, at: 368, dur: 36 },
              { target: deploy, at: 414, dur: 26, dx: -40, dy: 38 },
            ]}
          />
          <Ripple frame={frame} at={248} target={hunkButton(0, "Accept change")} />
          <Ripple frame={frame} at={330} target={hunkButton(1, "Reject change")} />
          <Ripple frame={frame} at={408} target={deploy} />
        </div>
      </Camera>
    </AbsoluteFill>
  );
}

/** The site's agent-focus ring: a frame of fine dots, 6px outside the sheet. */
function FocusRing({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        inset: -6,
        borderRadius: 20,
        padding: 1.5,
        opacity: amount,
        backgroundImage:
          "radial-gradient(circle at center, var(--kura-fg-subtle) 0.9px, transparent 1.3px)",
        backgroundSize: "6px 6px",
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );
}
